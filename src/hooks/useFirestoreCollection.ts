import { useEffect, useState } from 'react';

import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '@/lib/firebase';

interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirestoreCollection<T>(path: string): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        setState({
          data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[],
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState((prev) => ({ ...prev, loading: false, error }));
      },
    );

    return () => unsubscribe();
  }, [path]);

  return state;
}
