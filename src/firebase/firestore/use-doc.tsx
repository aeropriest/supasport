'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [prevRef, setPrevRef] = useState<DocumentReference<T> | null>(null);

  useEffect(() => {
    if (ref === null) {
      setData(null);
      setLoading(false);
      return;
    }
    if (prevRef && prevRef.isEqual(ref)) {
      return;
    }

    setLoading(true);
    setPrevRef(ref);
    const unsubscribe = onSnapshot(
      ref,
      (snap: DocumentSnapshot<T>) => {
        if (snap.exists()) {
          setData({ ...(snap.data() as object), id: snap.id } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref, prevRef]);

  return { data, loading, error };
}
