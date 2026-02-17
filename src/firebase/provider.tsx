'use client';

import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  db: null,
});

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  value: FirebaseContextType;
}> = ({ children, value }) => {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().db;
