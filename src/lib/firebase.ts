// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import type { Task, Project, ProgressLog } from '@/types';
import { format } from 'date-fns';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// --- Projects API ---

const projectsCollection = collection(db, 'projects');

export const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
  return addDoc(projectsCollection, {
    ...project,
    createdAt: serverTimestamp(),
  });
};

// --- Tasks API ---

const tasksCollection = collection(db, 'tasks');

type AddTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress'> & {
  completed: boolean;
};

export const addTask = async (task: AddTaskData) => {
  const newTask = {
    ...task,
    dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    progress: task.goal ? [] : null, // Initialize progress if it's a goal task
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(tasksCollection, newTask);
};

export const updateTask = async (taskId: string, task: Partial<Omit<Task, 'id'>>) => {
  const taskRef = doc(db, 'tasks', taskId);
  const dataToUpdate: { [key: string]: any } = { ...task };
  
  if (task.dueDate) {
    dataToUpdate.dueDate = Timestamp.fromDate(task.dueDate);
  }

  return updateDoc(taskRef, {
    ...dataToUpdate,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTask = async (taskId: string) => {
  const taskRef = doc(db, 'tasks', taskId);
  return deleteDoc(taskRef);
};


export const logProgress = async (taskId: string, log: ProgressLog) => {
  const taskRef = doc(db, 'tasks', taskId);
  const taskDoc = await getDoc(taskRef);

  if (!taskDoc.exists()) {
    throw new Error("Task not found!");
  }

  const taskData = taskDoc.data();
  // Ensure progress is an array, converting from Firestore Timestamps if necessary
  const progress: ProgressLog[] = (taskData.progress || []).map((p: any) => ({
      ...p,
      date: p.date instanceof Timestamp ? format(p.date.toDate(), 'yyyy-MM-dd') : p.date
  }));

  const logDate = log.date; // Already in YYYY-MM-DD format

  const existingLogIndex = progress.findIndex(p => p.date === logDate);

  const batch = writeBatch(db);

  if (existingLogIndex !== -1) {
    // If a log for today exists, we overwrite the whole array.
    const newProgress = [...progress];
    newProgress[existingLogIndex] = { ...log, date: logDate };
    batch.update(taskRef, { progress: newProgress, updatedAt: serverTimestamp() });
  } else {
    // Atomically add a new log to the "progress" array field.
    batch.update(taskRef, {
      progress: arrayUnion({ ...log, date: logDate }),
      updatedAt: serverTimestamp(),
    });
  }

  return batch.commit();
};


export { db };
