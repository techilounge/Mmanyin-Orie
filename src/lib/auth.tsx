
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

    if (user && isAuthPage) {
      router.push('/app');
      return;
    }
    
    if (user && appUser) {
      const isAppEntryPoint = pathname === '/app' || pathname === '/dashboard'; // dashboard is legacy
      if(isAppEntryPoint) {
        const memberships = appUser.memberships || [];

        if (memberships.length === 0) {
          // New user, no communities yet.
          router.push('/subscribe');
          return;
        }

        const communityId = appUser.primaryCommunityId || memberships[0];

        if (!communityId) {
          // Data inconsistency, should not happen.
          router.push('/subscribe');
          return;
        }

        // Check community status and redirect
        (async () => {
          try {
            const communityDocRef = doc(db, 'communities', communityId);
            const communityDoc = await getDoc(communityDocRef);

            if (!communityDoc.exists()) {
              // The community they were part of was deleted.
              router.push('/subscribe');
              return;
            }

            const status = communityDoc.data()?.subscription?.status;

            if (['active', 'trialing'].includes(status)) {
              // TODO: Check if community needs onboarding later
              if (pathname !== `/app/${communityId}`) {
                router.push(`/app/${communityId}`);
              }
            } else {
              router.push(`/billing/${communityId}`);
            }
          } catch (error) {
            console.error("Error checking community status:", error);
            // Fallback to a safe page if there's an error
            router.push('/subscribe');
          }
        })();
      }
    } else if (user && !appUser && !isPublicPage) {
        // User exists in Firebase Auth, but not in Firestore 'users' collection yet.
        // This can happen right after sign up, before the user doc is created.
        // For now, let the skeleton loader show while we wait for the onSnapshot listener.
    }
  }, [user, appUser, loading, router, pathname]);

  // Show a loading skeleton while auth state is resolving, unless it's a public page that can be shown immediately.
  const isPublicAndReady = publicPaths.some(path => pathname.startsWith(path) || path === pathname) && !loading;
  if (loading && !isPublicAndReady) {
     return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-8 space-y-4 w-full max-w-md">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
          </div>
          <Skeleton className="h-8 w-full rounded-md" />
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
