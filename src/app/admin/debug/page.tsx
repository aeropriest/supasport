"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DebugPage() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      const snapshot = await getDocs(collection(db, "coaches"));
      const coachData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Coaches in Firestore:", coachData);
      setCoaches(coachData);
    } catch (error) {
      console.error("Error loading coaches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug: Coaches in Firestore</h1>
      
      {coaches.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            ⚠️ No coaches found in Firestore. This is why coach login isn't working.
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            When you create a coach, a document should appear here with their UID, name, and email.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-green-600">✅ Found {coaches.length} coach(es) in Firestore</p>
          {coaches.map((coach) => (
            <div key={coach.id} className="bg-white border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">UID:</span> {coach.id}
                </div>
                <div>
                  <span className="font-medium">Name:</span> {coach.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {coach.email}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {coach.createdAt}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">How to Test Coach Login:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Find a coach's email from the list above</li>
          <li>Sign out from admin</li>
          <li>Login with that coach's email and the password you set</li>
          <li>You should see the calendar view</li>
        </ol>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-2">Troubleshooting:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>If no coaches appear above, check browser console when creating a coach</li>
          <li>Make sure Firestore rules are deployed: <code className="bg-gray-200 px-1">firebase deploy --only firestore:rules</code></li>
          <li>Check Firebase Console → Firestore Database → coaches collection</li>
        </ul>
      </div>
    </div>
  );
}
