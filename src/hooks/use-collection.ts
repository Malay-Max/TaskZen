// src/hooks/use-collection.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, Tag, Project } from '@/types';
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
        // We can't use onSnapshot for the complex task+tag query easily,
        // so we must use a dedicated function that fetches tasks and then their tags.
        // For real-time, we set up a listener on the tasks collection and refetch tags when tasks change.
        setLoading(true);
        const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(tasksQuery, async (snapshot) => {
            try {
                const tasksWithTags = await fetchTasksWithTags();
                setData(tasksWithTags as any as T[]);
            } catch (err) {
                 console.error(`Error fetching collection ${collectionName}:`, err);
                 if (err instanceof Error) {
                    setError(err);
                 }
            } finally {
                setLoading(false);
            }
        }, (err) => {
            console.error(`Error with snapshot listener for ${collectionName}:`, err);
            setError(err);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();

    } else {
        setLoading(true);
        let q;
        // Default sort for most collections
        let sortField = 'createdAt';
        let sortDirection: 'desc' | 'asc' = 'desc';

        if (collectionName === 'tags') {
            sortField = 'name';
            sortDirection = 'asc';
        } else if (collectionName === 'projects') {
            sortField = 'createdAt';
            sortDirection = 'asc';
        }

        q = query(collection(db, collectionName), orderBy(sortField, sortDirection));


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
