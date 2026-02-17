import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const PACKAGE_TYPES = [
  "Private",
  "Semi-Private Group",
  "Custom-Private",
  "Custom-Semi-Private",
  "Custom Group",
];

export async function initializePackageTypes() {
  const typesRef = doc(db, "settings", "packageTypes");
  await setDoc(typesRef, {
    types: PACKAGE_TYPES,
    updatedAt: new Date().toISOString(),
  });
  return PACKAGE_TYPES;
}

export async function getPackageTypes(): Promise<string[]> {
  return PACKAGE_TYPES;
}
