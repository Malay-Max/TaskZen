// src/hooks/use-collection.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, Tag } from '@/types';
import { fetchTasksWithTags } from '@/lib/firebase';


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

export function useCollection<T extends {id: string}>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Special handling for tasks to include tags
    if (collectionName === 'tasks') {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                // We cannot use onSnapshot easily for this complex query,
                // so we will poll for now. For a production app, this would
                // need a more sophisticated real-time strategy.
                const tasksWithTags = await fetchTasksWithTags();
                setData(tasksWithTags as T[]);
            } catch (err) {
                 console.error(`Error fetching collection ${collectionName}:`, err);
                 if (err instanceof Error) {
                    setError(err);
                 }
            } finally {
                setLoading(false);
            }
        }
        fetchTasks();
        // Simple polling every 30 seconds to simulate realtime
        const interval = setInterval(fetchTasks, 30000);
        return () => clearInterval(interval);

    } else {
        setLoading(true);
        let q;
        if (collectionName === 'tags') {
            q = query(collection(db, collectionName), orderBy('name', 'asc'));
        } else {
             q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        }

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
    }
  }, [collectionName]);

  return { data, loading, error };
}
