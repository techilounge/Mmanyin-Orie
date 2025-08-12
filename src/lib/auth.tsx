
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
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
    if (loading || !mounted) return;

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
          router.push('/subscribe');
          return;
        }

        const communityId = appUser.primaryCommunityId || memberships[0];

        if (!communityId) {
          router.push('/subscribe');
          return;
        }

        (async () => {
          try {
            const communityDocRef = doc(db, 'communities', communityId);
            const communityDoc = await getDoc(communityDocRef);

            if (!communityDoc.exists()) {
              router.push('/subscribe');
              return;
            }

            const status = communityDoc.data()?.subscription?.status;

            if (['active', 'trialing'].includes(status)) {
              if (pathname !== `/app/${communityId}`) {
                router.push(`/app/${communityId}`);
              }
            } else {
              router.push(`/billing/${communityId}`);
            }
          } catch (error) {
            console.error("Error checking community status:", error);
            router.push('/subscribe');
          }
        })();
      }
    } else if (user && !appUser && !isPublicPage) {
      // User exists in Firebase Auth, but not in Firestore 'users' collection yet.
    }
  }, [user, appUser, loading, router, pathname, mounted]);

  const isLoadingOrUnmounted = loading || !mounted;
  const isPublicPage = publicPaths.some(path => pathname.startsWith(path) || path === pathname);

  if (isLoadingOrUnmounted && !isPublicPage) {
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
