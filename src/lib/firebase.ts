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
  query,
  where,
  getDocs,
  documentId,
} from 'firebase/firestore';
import type { Task, Project, ProgressLog, Tag, TaskTag } from '@/types';
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

// --- Collections ---
const projectsCollection = collection(db, 'projects');
const tasksCollection = collection(db, 'tasks');
const tagsCollection = collection(db, 'tags');
const taskTagsCollection = collection(db, 'task_tags');

// --- Helper: Manage Tags ---
const findOrCreateTags = async (tagNames: string[], batch: any): Promise<string[]> => {
    if (tagNames.length === 0) return [];

    const lowerCaseTagNames = tagNames.map(t => t.toLowerCase());

    const tagsQuery = query(tagsCollection, where('name', 'in', lowerCaseTagNames));
    const querySnapshot = await getDocs(tagsQuery);
    
    const existingTags = new Map<string, string>(); // name -> id
    querySnapshot.forEach(doc => {
        const tag = doc.data() as Tag;
        existingTags.set(tag.name.toLowerCase(), doc.id);
    });

    const newTagNames = lowerCaseTagNames.filter(name => !existingTags.has(name));
    const tagIds = Array.from(existingTags.values());

    for (const name of newTagNames) {
        if(name) {
            const newTagRef = doc(tagsCollection);
            batch.set(newTagRef, { name });
            tagIds.push(newTagRef.id);
        }
    }

    return tagIds;
};


// --- Projects API ---
export const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
  return addDoc(projectsCollection, {
    ...project,
    createdAt: serverTimestamp(),
  });
};

// --- Tasks API ---
type AddTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'tags'> & {
  completed: boolean;
  tags: string[]; // Pass tag names as strings
};

export const addTask = async (task: AddTaskData) => {
    const batch = writeBatch(db);
    const taskRef = doc(tasksCollection);

    // Handle tags
    const tagIds = await findOrCreateTags(task.tags, batch);

    // Add task_tags entries
    for (const tagId of tagIds) {
        const taskTagRef = doc(taskTagsCollection);
        batch.set(taskTagRef, { taskId: taskRef.id, tagId });
    }

    // Add task
    const { tags, ...taskData } = task;
    const newTask = {
        ...taskData,
        dueDate: taskData.dueDate ? Timestamp.fromDate(taskData.dueDate) : null,
        progress: taskData.goal ? [] : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    batch.set(taskRef, newTask);

    return batch.commit();
};

export const updateTask = async (taskId: string, task: Partial<Omit<Task, 'id' | 'tags'>> & { tags?: string[] }) => {
    const batch = writeBatch(db);
    const taskRef = doc(db, 'tasks', taskId);

    // Handle tags if they are being updated
    if (task.tags !== undefined) {
        // 1. Delete existing tag associations for this task
        const q = query(taskTagsCollection, where('taskId', '==', taskId));
        const oldTaskTagsSnapshot = await getDocs(q);
        oldTaskTagsSnapshot.forEach(doc => batch.delete(doc.ref));

        // 2. Create new tags and associations
        const tagIds = await findOrCreateTags(task.tags, batch);
        for (const tagId of tagIds) {
            const taskTagRef = doc(taskTagsCollection);
            batch.set(taskTagRef, { taskId, tagId });
        }
    }

    // Prepare task data for update
    const { tags, ...taskData } = task;
    const dataToUpdate: { [key: string]: any } = { ...taskData };
    if (taskData.dueDate) {
        dataToUpdate.dueDate = Timestamp.fromDate(taskData.dueDate);
    }
    dataToUpdate.updatedAt = serverTimestamp();

    batch.update(taskRef, dataToUpdate);

    return batch.commit();
};


export const deleteTask = async (taskId: string) => {
    const batch = writeBatch(db);
    
    // Delete task document
    const taskRef = doc(db, 'tasks', taskId);
    batch.delete(taskRef);

    // Delete associated tag links
    const q = query(taskTagsCollection, where('taskId', '==', taskId));
    const taskTagsSnapshot = await getDocs(q);
    taskTagsSnapshot.forEach(doc => batch.delete(doc.ref));

    return batch.commit();
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

export async function fetchTasksWithTags(): Promise<Task[]> {
  const tasksSnapshot = await getDocs(query(collection(db, 'tasks')));
  if (tasksSnapshot.empty) return [];

  const tasks: Task[] = tasksSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : null,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      tags: [], // Start with empty tags
    } as Task;
  });

  const taskIds = tasks.map(t => t.id);

  // Get all task-tag relationships
  const taskTagsQuery = query(taskTagsCollection, where('taskId', 'in', taskIds));
  const taskTagsSnapshot = await getDocs(taskTagsQuery);
  const taskTags = taskTagsSnapshot.docs.map(doc => doc.data() as TaskTag);
  
  if (taskTags.length === 0) return tasks;

  // Get all unique tag IDs from the relationships
  const tagIds = [...new Set(taskTags.map(tt => tt.tagId))];

  // Get all tag documents
  const tagsQuery = query(tagsCollection, where(documentId(), 'in', tagIds));
  const tagsSnapshot = await getDocs(tagsQuery);
  const tagsMap = new Map<string, Tag>();
  tagsSnapshot.forEach(doc => tagsMap.set(doc.id, { id: doc.id, ...doc.data() } as Tag));

  // Map tags back to their tasks
  const tasksById = new Map(tasks.map(t => [t.id, t]));
  for (const taskTag of taskTags) {
    const task = tasksById.get(taskTag.taskId);
    const tag = tagsMap.get(taskTag.tagId);
    if (task && tag) {
      task.tags?.push(tag);
    }
  }

  return Array.from(tasksById.values()).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}


export { db };
