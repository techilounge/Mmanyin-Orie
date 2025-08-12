
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { collectionGroup, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

const publicPaths = ['/auth/sign-in', '/auth/sign-up', '/'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = publicPaths.some(path => pathname.startsWith(path));
    const isAppPage = pathname.startsWith('/app');

    if (!user && !isPublicPage) {
      router.push('/auth/sign-in');
      return;
    }

    if (user) {
      if(isPublicPage && pathname !== '/') {
        router.push('/app'); // Redirect logged-in users from auth pages
        return;
      }
      
      // Multi-tenancy routing guard for /app/* pages
      if(isAppPage || pathname === '/dashboard') { // dashboard is legacy, redirect to /app
        (async () => {
          // TODO: Add site_owner check later
          
          const membershipsQuery = query(collectionGroup(db, 'members'), where('uid', '==', user.uid));
          const membershipsSnapshot = await getDocs(membershipsQuery);

          if (membershipsSnapshot.empty) {
            router.push('/subscribe');
          } else {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            const primaryCommunityId = userDoc.data()?.primaryCommunityId;
            
            const communityId = primaryCommunityId || membershipsSnapshot.docs[0].ref.parent.parent?.id;

            if (!communityId) {
                router.push('/subscribe'); // Should not happen
                return;
            }

            const communityDocRef = doc(db, 'communities', communityId);
            const communityDoc = await getDoc(communityDocRef);
            const status = communityDoc.data()?.subscription?.status;

            if (!['active', 'trialing'].includes(status)) {
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
    }
  }, [user, loading, router, pathname]);

  if (loading || (!user && !publicPaths.some(path => pathname.startsWith(path)))) {
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

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
