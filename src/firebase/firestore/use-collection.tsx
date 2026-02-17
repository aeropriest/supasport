'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, queryEqual, QuerySnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(q: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [prevQuery, setPrevQuery] = useState<Query<T> | null>(null);

  useEffect(() => {
    if (q === null) {
      setData(null);
      setLoading(false);
      return;
    }
    if (prevQuery && queryEqual(prevQuery, q)) {
      return;
    }

    setLoading(true);
    setPrevQuery(q);
    const unsubscribe = onSnapshot(
      q,
      (snap: QuerySnapshot<T>) => {
        const docs = snap.docs.map((doc) => ({
          ...(doc.data() as object),
          id: doc.id,
        })) as T[];
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        const permissionError = new FirestorePermissionError({
          path: (q as any)._query?.path?.segments.join('/') || 'unknown path',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q, prevQuery]);

  return { data, loading, error };
}
