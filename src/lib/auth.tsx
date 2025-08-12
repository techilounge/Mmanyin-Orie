
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, onSnapshot } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true });

const publicPaths = ['/', '/auth/sign-in', '/auth/sign-up', '/subscribe'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const pathIsPublic = publicPaths.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)));
    const isAuthPage = pathname.startsWith('/auth');

    if (!user && !pathIsPublic) {
      router.push('/auth/sign-in');
      return;
    }

    if (user) {
      if (isAuthPage) {
        router.push('/app');
        return;
      }
      
      const isAppEntryPoint = pathname === '/app' || pathname === '/dashboard';
      if(isAppEntryPoint) {
        if (appUser) {
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
          router.push(`/app/${communityId}`);
        }
      }
    }

  }, [user, appUser, loading, router, pathname, mounted]);
  
  const pathIsPublic = publicPaths.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)));

  if (!mounted || (loading && !pathIsPublic)) {
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

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
