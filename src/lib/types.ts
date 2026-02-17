import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  role: "coach" | "admin";
  photoURL: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  addedBy: string;
  createdAt: Timestamp;
}

export interface Lesson {
  id: string;
  coachId: string;
  clientId: string;
  clientName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: "upcoming" | "completed";
  createdAt: Timestamp;
}
