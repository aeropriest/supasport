'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase/provider';
import type { User } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

export interface UseUser {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isSupaSportAdmin: boolean;
}

export function useUser(): UseUser {
  const auth = useAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        const unsubscribeDoc = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                setUser(userData);
                // Role-based redirect logic
                if (userData.role === 'admin' && pathname.startsWith('/coach')) {
                    router.replace('/admin/dashboard');
                } else if (userData.role === 'coach' && pathname.startsWith('/admin')) {
                    router.replace('/coach/dashboard');
                }
            } else {
                // This case can happen for new sign-ups (e.g. Google) but should be handled during sign-up flow.
                // We'll set a default coach profile here just in case.
                const newUser: User = {
                    uid: fbUser.uid,
                    email: fbUser.email,
                    name: fbUser.displayName,
                    role: "coach",
                    photoURL: fbUser.photoURL,
                  };
                setUser(newUser);
            }
            setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, db, pathname, router]);
  
  const isSupaSportAdmin = user?.role === 'admin' && (user?.email === '+6598503941' || user?.email === 'admin@supasport.com');

  return { user, firebaseUser, loading, isSupaSportAdmin };
}
