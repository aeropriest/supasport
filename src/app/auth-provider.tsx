"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/lib/types";
import { redirect } from "next/navigation";
import { usePathname } from 'next/navigation'


interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSupaSportAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSupaSportAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const isSupaSportAdmin =
    user?.role === "admin" &&
    (user.email === "+6598503941" || user.email === "admin@supasport.com");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);

          if (userData.role === 'admin' && pathname.startsWith('/coach')) {
            redirect('/admin/dashboard');
          } else if (userData.role === 'coach' && pathname.startsWith('/admin')) {
            redirect('/coach/dashboard');
          }

        } else {
          // Create a new user document for new sign-ups (e.g., via Google)
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: "coach", // Default role
            photoURL: firebaseUser.photoURL,
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  const value = { user, loading, isSupaSportAdmin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
