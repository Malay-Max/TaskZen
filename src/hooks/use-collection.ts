// src/hooks/use-collection.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to convert Firestore Timestamps to JS Dates
const convertTimestamps = (data: any) => {
  if (!data) return data;
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    }
  }
  return data;
};

export function useCollection<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          const convertedData = convertTimestamps(docData);
          items.push({ id: doc.id, ...convertedData } as T);
        });
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching collection ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
}
