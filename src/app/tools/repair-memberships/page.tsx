'use client';

import { useState } from 'react';
import {
  getApp, getApps, initializeApp,
} from 'firebase/app';
import {
  getAuth, onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc,
  serverTimestamp, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig as any);
  return { app, db: getFirestore(app), auth: getAuth(app) };
}

export default function RepairMembershipsPage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const append = (s: string) => setLog((x) => [...x, s]);

  const run = async () => {
    setRunning(true);
    setLog([]);
    setDone(false);
    const { db, auth } = getFirebase();

    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, () => resolve());
      setTimeout(() => resolve(), 500);
      return () => unsub();
    });

    const user = auth.currentUser;
    if (!user) {
      append('Error: Please sign in first.');
      setRunning(false);
      return;
    }
    
    append(`Signed in as ${user.email}. Starting repair...`);

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      append(`Warning: User document at /users/${user.uid} not found. Trying to create it.`);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        memberships: [],
        createdAt: serverTimestamp(),
      });
      append("User document created. Please accept any invitations again.");
      setRunning(false);
      setDone(true);
      return;
    }
    
    const userDoc = userSnap.data() as any;
    const memberships: string[] = Array.isArray(userDoc.memberships) ? userDoc.memberships : [];
    if (memberships.length === 0) {
      append('No memberships found on your user document. Nothing to repair.');
      setRunning(false);
      setDone(true);
      return;
    }
    
    append(`Found ${memberships.length} communities in your profile.`);

    for (const communityId of memberships) {
      const uidDocRef = doc(db, 'communities', communityId, 'members', user.uid);
      const uidDoc = await getDoc(uidDocRef);
      if (uidDoc.exists()) {
        append(`- OK: Membership for community ${communityId} is correctly configured.`);
        continue;
      }

      append(`- INFO: Membership for ${communityId} needs repair. Searching for placeholder...`);
      // Look for any placeholder member doc that carries your UID in a field
      const q = query(
        collection(db, 'communities', communityId, 'members'),
        where('uid', '==', user.uid)
      );
      const res = await getDocs(q);
      const placeholder = res.docs[0]?.data() as any | undefined;

      const base = placeholder ?? {
        uid: user.uid,
        email: user.email ?? '',
        name: user.displayName ?? '',
        role: 'user',
        status: 'active',
      };

      await setDoc(uidDocRef, {
        ...base,
        uid: user.uid,
        role: 'user',         // enforce plain user
        status: base.status ?? 'active',
        joinDate: base.joinDate ?? new Date().toISOString(),
      }, { merge: true });

      append(`- FIXED: Created correct membership document for community ${communityId}.`);
    }

    append('\nRepair process complete.');
    setRunning(false);
    setDone(true);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-xl mx-4">
        <CardHeader>
            <CardTitle>Membership Repair Tool</CardTitle>
            <CardDescription>
                If you've accepted an invitation but can't see your community, this tool can fix it. It ensures your membership record is correctly linked to your account for each community you belong to.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={run} disabled={running} className="w-full">
            {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Repairing...</> : 'Repair My Memberships'}
          </Button>
          {log.length > 0 && (
            <pre className="mt-6 p-4 bg-muted rounded-md text-xs h-64 overflow-y-auto whitespace-pre-wrap font-mono">
                {log.join('\n')}
            </pre>
          )}
          {done && (
             <div className="mt-4 text-center">
                 <p className="text-sm text-green-600">Repair complete! You can now navigate back to the app.</p>
                 <Button asChild variant="outline" className="mt-2">
                     <Link href="/app">Go to App</Link>
                 </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
