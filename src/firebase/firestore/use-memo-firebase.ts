'use client';
import { useMemo } from 'react';

/**
 * A hook to memoize Firebase queries and references.
 * @param factory A function that returns a Firebase query or reference.
 * @param deps The dependencies for the useMemo hook.
 * @returns The memoized query or reference.
 */
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
