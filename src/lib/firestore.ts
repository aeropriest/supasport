import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { Coach, Client, Package, Lesson } from "./types";

// ==================== COACHES ====================
export async function getCoaches(): Promise<Coach[]> {
  const snapshot = await getDocs(query(collection(db, "coaches"), orderBy("name")));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Coach));
}

export async function getCoachById(id: string): Promise<Coach | null> {
  const snap = await getDoc(doc(db, "coaches", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Coach;
}

export async function addCoach(data: Omit<Coach, "id">, password: string): Promise<string> {
  // Use a secondary app to create the user without signing out the current admin
  const secondaryApp = initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    "secondary-" + Date.now()
  );
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, data.email, password);
    const uid = cred.user.uid;
    await setDoc(doc(db, "coaches", uid), {
      name: data.name,
      email: data.email,
      createdAt: data.createdAt,
    });
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function updateCoach(id: string, data: Partial<Coach>): Promise<void> {
  const { id: _, ...rest } = data as Coach;
  await updateDoc(doc(db, "coaches", id), rest);
}

export async function deleteCoach(id: string): Promise<void> {
  await deleteDoc(doc(db, "coaches", id));
}

// ==================== CLIENTS ====================
export async function getClients(): Promise<Client[]> {
  const snapshot = await getDocs(query(collection(db, "clients"), orderBy("name")));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
}

export async function addClient(data: Omit<Client, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "clients"), data);
  return docRef.id;
}

export async function updateClient(id: string, data: Partial<Client>): Promise<void> {
  const { id: _, ...rest } = data as Client;
  await updateDoc(doc(db, "clients", id), rest);
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(db, "clients", id));
}

// ==================== PACKAGES ====================
export async function getPackages(): Promise<Package[]> {
  const snapshot = await getDocs(query(collection(db, "packages"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Package));
}

export async function getPackagesByClient(clientId: string): Promise<Package[]> {
  const snapshot = await getDocs(
    query(collection(db, "packages"), where("clientId", "==", clientId))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Package));
}

export async function addPackage(data: Omit<Package, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "packages"), data);
  return docRef.id;
}

export async function updatePackage(id: string, data: Partial<Package>): Promise<void> {
  const { id: _, ...rest } = data as Package;
  await updateDoc(doc(db, "packages", id), rest);
}

export async function deletePackage(id: string): Promise<void> {
  await deleteDoc(doc(db, "packages", id));
}

// ==================== LESSONS ====================
export async function getLessons(): Promise<Lesson[]> {
  const snapshot = await getDocs(query(collection(db, "lessons"), orderBy("date", "desc")));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson));
}

export async function getLessonsByCoach(coachId: string): Promise<Lesson[]> {
  const snapshot = await getDocs(
    query(collection(db, "lessons"), where("coachId", "==", coachId), orderBy("date", "desc"))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson));
}

export async function getLessonsByClient(clientId: string): Promise<Lesson[]> {
  const snapshot = await getDocs(
    query(collection(db, "lessons"), where("clientIds", "array-contains", clientId), orderBy("date", "desc"))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lesson));
}

export async function addLesson(data: Omit<Lesson, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "lessons"), data);

  // Decrement package balance for each client if packageId is set
  if (data.packageId) {
    const pkgRef = doc(db, "packages", data.packageId);
    const pkgSnap = await getDoc(pkgRef);
    if (pkgSnap.exists()) {
      const pkg = pkgSnap.data();
      const newBalance = Math.max(0, (pkg.packageBalance || 0) - 1);
      await updateDoc(pkgRef, {
        packageBalance: newBalance,
        status: newBalance === 0 ? "completed" : "active",
      });
    }
  }

  return docRef.id;
}

export async function updateLesson(id: string, data: Partial<Lesson>): Promise<void> {
  const { id: _, ...rest } = data as Lesson;
  await updateDoc(doc(db, "lessons", id), rest);
}

export async function deleteLesson(id: string): Promise<void> {
  await deleteDoc(doc(db, "lessons", id));
}

export async function markLessonCompleted(lessonId: string): Promise<void> {
  await updateDoc(doc(db, "lessons", lessonId), { status: "completed" });
}
