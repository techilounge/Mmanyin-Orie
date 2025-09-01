
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { AppUser, Member } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  communityRole: Member['role'] | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true, communityRole: null });

const publicPaths = ['/', '/auth/sign-in', '/auth/sign-up', '/auth/accept-invite', '/subscribe', '/create-community'];
const isAuthPage = (path: string) => path.startsWith('/auth');

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [communityRole, setCommunityRole] = useState<Member['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const communityId = pathname.split('/')[2];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeUserDoc: () => void;
    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setAppUser({ uid: docSnap.id, ...docSnap.data() } as AppUser);
        } else {
          setAppUser(null);
        }
        // Moved loading(false) to the role listener to wait for all data
      }, (error) => {
        console.error("Error listening to user document:", error);
        setAppUser(null);
        setLoading(false);
      });
    } else {
      setAppUser(null);
      setCommunityRole(null);
      setLoading(false);
    }
    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [user]);

  useEffect(() => {
    let unsubscribeMemberDoc: () => void;
    if (user && communityId) {
        const memberDocRef = doc(db, 'communities', communityId, 'members', user.uid);
        unsubscribeMemberDoc = onSnapshot(memberDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setCommunityRole((docSnap.data() as Member).role);
            } else {
                setCommunityRole(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to member document:", error);
            setCommunityRole(null);
            setLoading(false);
        });
    } else if (!user) {
        setCommunityRole(null);
    }

    return () => {
        if (unsubscribeMemberDoc) unsubscribeMemberDoc();
    }
  }, [user, communityId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const pathIsPublic = publicPaths.some(p => pathname.startsWith(p));
    const isOnAppPath = pathname.startsWith('/app');

    if (!user && !pathIsPublic) {
      router.push('/auth/sign-in');
      return;
    }
    
    if (user && appUser) {
      const memberships = appUser.memberships || [];
      const hasCommunity = memberships.length > 0;

      if (isAuthPage(pathname) && !pathname.startsWith('/auth/accept-invite')) {
        if (hasCommunity) {
          router.push('/app');
        } else {
          router.push('/subscribe');
        }
        return;
      }
      
      if (!hasCommunity && !pathIsPublic) {
        router.push('/subscribe');
        return;
      }
      
      if (hasCommunity && (pathname === '/subscribe' || pathname === '/create-community')) {
          router.push('/app');
          return;
      }

      if (pathname === '/app') {
          if (appUser.primaryCommunityId) {
              router.replace(`/app/${appUser.primaryCommunityId}`);
          } else if (memberships.length > 1) {
              router.replace('/app/switch-community');
          } else if (memberships.length === 1) {
              router.replace(`/app/${memberships[0]}`);
          } else {
              router.replace('/subscribe');
          }
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
    <AuthContext.Provider value={{ user, appUser, loading, communityRole }}>
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
