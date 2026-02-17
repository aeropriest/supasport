"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserRole } from "./types";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@supasport.com";
        if (firebaseUser.email === adminEmail) {
          setRole("admin");
          setLoading(false);
        } else {
          try {
            const coachDoc = await getDoc(doc(db, "coaches", firebaseUser.uid));
            console.log("Coach doc exists:", coachDoc.exists(), "for UID:", firebaseUser.uid);
            if (coachDoc.exists()) {
              setRole("coach");
            } else {
              console.warn("No coach document found for user:", firebaseUser.email);
              setRole(null);
            }
          } catch (error) {
            console.error("Error fetching coach document:", error);
            setRole(null);
          }
          setLoading(false);
        }
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
