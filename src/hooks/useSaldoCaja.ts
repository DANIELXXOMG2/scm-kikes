'use client';

import { useState, useEffect } from 'react';

import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { type Saldo } from '@/lib/schemas';

export function useSaldoCaja() {
  const [saldo, setSaldo] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // (RF-M6.1) Este es nuestro documento singleton
    const docRef = doc(db, 'contabilidad', 'saldo');

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSaldo((docSnap.data() as Saldo).monto);
        } else {
          setSaldo(0); // Si no existe, el saldo es 0
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar saldo:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { saldo, loading };
}
