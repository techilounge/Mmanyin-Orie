
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true });

const publicPaths = ['/', '/auth/sign-in', '/auth/sign-up', '/auth/accept-invite', '/subscribe'];
const isAuthPage = (path: string) => path.startsWith('/auth');

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This outer listener handles Firebase Auth state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    // The cleanup function for the auth state listener.
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // This effect hook handles the Firestore user document listener.
    // It runs whenever the authenticated user changes.
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setAppUser({ uid: docSnap.id, ...docSnap.data() } as AppUser);
        } else {
          setAppUser(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to user document:", error);
        setAppUser(null);
        setLoading(false);
      });

      // When the user changes (or logs out), this cleanup function is called.
      return () => unsubscribeUserDoc();
    } else {
      // If there is no user, clear the app user state and stop loading.
      setAppUser(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const pathIsPublic = publicPaths.some(p => pathname.startsWith(p));

    // If user is not logged in and not on a public page, redirect to sign-in
    if (!user && !pathIsPublic) {
      router.push('/auth/sign-in');
      return;
    }
    
    // If user is logged in
    if (user && appUser) {
      const memberships = appUser.memberships || [];
      const hasCommunity = memberships.length > 0;

      // If on an auth page (but not accept-invite), redirect to app
      if (isAuthPage(pathname) && !pathname.startsWith('/auth/accept-invite')) {
        router.push('/app');
        return;
      }
      
      // If user has no community and tries to access a protected page, redirect to subscribe
      if (!hasCommunity && !pathIsPublic) {
        router.push('/subscribe');
        return;
      }

      // If user has a community but lands on subscribe page, redirect to app
      if (hasCommunity && pathname === '/subscribe') {
        router.push('/app');
        return;
      }

      // This is the key change: redirect from the abstract /app to a concrete community page
      if (pathname === '/app') {
        const communityId = appUser.primaryCommunityId || memberships[0];
        if (!communityId) {
          router.push('/subscribe'); // Should be rare, but a safe fallback
          return;
        }
        router.replace(`/app/${communityId}`);
      }
    } else if (user && !appUser && !isAuthPage(pathname)) {
        // This case handles a logged-in Firebase user whose appUser doc is still loading or missing
        // It's safer to keep them on public pages or wait, rather than redirecting prematurely
        if (!pathIsPublic) {
          // You might want a loading screen here, but for now we prevent redirection loops
        }
    }

  }, [user, appUser, loading, router, pathname, mounted]);
  
  if (!mounted) {
    return null;
  }
  
  const pathIsPublic = publicPaths.some(p => pathname.startsWith(p));

  if (loading && !pathIsPublic) {
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
