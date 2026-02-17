'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

import { firebaseConfig } from './config';

// Exports an initializeFirebase() function that returns an object containing
// the FirebaseApp, Firestore, and Auth instances.
export function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
}

// Export all provider hooks and components
export * from './provider';
export * from './client-provider';

// Export all auth and firestore hooks
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-memo-firebase';
