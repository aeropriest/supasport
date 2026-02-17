export interface Coach {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Package {
  id: string;
  clientId: string;
  clientName: string;
  lessonType: string;
  packageDate: string;
  packageSize: number;
  packageBalance: number;
  pricePerLesson: number;
  totalPrice: number;
  status: "active" | "completed" | "expired";
  createdAt: string;
}

export interface Lesson {
  id: string;
  coachId: string;
  coachName: string;
  clientIds: string[];
  clientNames: string[];
  packageId?: string;
  lessonType: string;
  date: string;
  time: string;
  hours: number;
  sessionId: string;
  coachHours: number;
  payment: number;
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

export type UserRole = "admin" | "coach";
