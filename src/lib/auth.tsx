
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true });

const publicPaths = ['/auth/sign-in', '/auth/sign-up', '/', '/subscribe'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Fetch the corresponding appUser document
        const userDocRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setAppUser({ uid: doc.id, ...doc.data() } as AppUser);
          } else {
            setAppUser(null);
          }
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = publicPaths.some(path => pathname.startsWith(path) || path === pathname);
    const isAuthPage = pathname.startsWith('/auth');

    if (!user && !isPublicPage) {
      router.push('/auth/sign-in');
      return;
    }

    if (user && appUser) {
      if (isAuthPage) {
        router.push('/app'); // Redirect logged-in users from auth pages to the app
        return;
      }
      
      const isAppEntryPoint = pathname === '/app' || pathname === '/dashboard'; // dashboard is legacy

      // Multi-tenancy routing guard for /app/* pages
      if(isAppEntryPoint) {
        (async () => {
          // TODO: Add site_owner check later
          
          const memberships = (appUser.memberships || []) as string[];

          if (memberships.length === 0) {
            router.push('/subscribe');
          } else {
            const primaryCommunityId = appUser.primaryCommunityId;
            const communityId = primaryCommunityId || memberships[0];

            if (!communityId) {
                router.push('/subscribe'); // Should not happen
                return;
            }

            const communityDocRef = doc(db, 'communities', communityId);
            const communityDoc = await getDoc(communityDocRef);
            const status = communityDoc.data()?.subscription?.status;

            if (!status || !['active', 'trialing'].includes(status)) {
                router.push(`/billing/${communityId}`);
            } else {
                // TODO: Check if community needs onboarding
                if (pathname !== `/app/${communityId}`) {
                   router.push(`/app/${communityId}`);
                }
            }
          }
        })();
      }
    } else if (user && !appUser && !isPublicPage) {
        // User exists in Firebase Auth, but not in Firestore 'users' collection yet.
        // This can happen right after sign up, before the user doc is created.
        // We can either wait, or redirect to a page that handles this state.
        // For now, let's assume the creation is fast and the listener will pick it up.
        // If they navigate away or something fails, they might get stuck.
        // A /create-profile page could be a good failsafe.
    }
  }, [user, appUser, loading, router, pathname]);

  if (loading || (!user && !publicPaths.some(path => pathname.startsWith(path) || path === pathname))) {
     return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-8 space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, appUser, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
