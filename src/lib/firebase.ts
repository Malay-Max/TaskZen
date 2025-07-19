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
import type { Task, Project, ProgressLog, Tag } from '@/types';
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

// --- Helper: Manage Tags ---
const findOrCreateTags = async (tagNames: string[]): Promise<string[]> => {
    if (!tagNames || tagNames.length === 0) return [];
    
    const batch = writeBatch(db);
    const lowerCaseTagNames = tagNames.map(t => t.toLowerCase().trim()).filter(Boolean);
    const uniqueTagNames = [...new Set(lowerCaseTagNames)];

    const tagsQuery = query(tagsCollection, where('name', 'in', uniqueTagNames));
    const querySnapshot = await getDocs(tagsQuery);
    
    const existingTags = new Map<string, string>(); // name -> id
    querySnapshot.forEach(doc => {
        const tag = doc.data() as Tag;
        existingTags.set(tag.name.toLowerCase(), doc.id);
    });

    const newTagNames = uniqueTagNames.filter(name => !existingTags.has(name));
    const tagIds = Array.from(existingTags.values());

    for (const name of newTagNames) {
        if(name) {
            const newTagRef = doc(tagsCollection);
            batch.set(newTagRef, { name, createdAt: serverTimestamp() });
            tagIds.push(newTagRef.id);
        }
    }
    
    await batch.commit();
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
type AddTaskData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'tags' | 'tagIds'> & {
  completed: boolean;
  tags: string[]; // Pass tag names as strings
};

export const addTask = async (task: AddTaskData) => {
    const batch = writeBatch(db);
    const taskRef = doc(tasksCollection);

    // Handle tags: find or create them and get their IDs
    const tagIds = await findOrCreateTags(task.tags);

    // Add task
    const { tags, ...taskData } = task;
    const newTask = {
        ...taskData,
        tagIds, // Store array of tag IDs
        dueDate: taskData.dueDate ? Timestamp.fromDate(taskData.dueDate) : null,
        progress: taskData.goal ? [] : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    batch.set(taskRef, newTask);

    return batch.commit();
};

export const updateTask = async (taskId: string, task: Partial<Omit<Task, 'id' | 'tags' | 'tagIds'>> & { tags?: string[] }) => {
    const taskRef = doc(db, 'tasks', taskId);

    // Prepare task data for update
    const { tags, ...taskData } = task;
    const dataToUpdate: { [key: string]: any } = { ...taskData };

    // Handle tags if they are being updated
    if (tags !== undefined) {
         const tagIds = await findOrCreateTags(tags);
         dataToUpdate.tagIds = tagIds;
    }
    
    if (taskData.dueDate) {
        dataToUpdate.dueDate = Timestamp.fromDate(taskData.dueDate);
    }
    dataToUpdate.updatedAt = serverTimestamp();

    return updateDoc(taskRef, dataToUpdate);
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

export async function fetchTasksWithTags(): Promise<Task[]> {
  const tasksSnapshot = await getDocs(query(collection(db, 'tasks')));
  if (tasksSnapshot.empty) return [];

  const tasks: Task[] = tasksSnapshot.docs.map(doc => {
    const data = doc.data();
    // Handle pending server timestamps
    const now = new Date();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : now;
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : now;

    return {
      id: doc.id,
      ...data,
      dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : null,
      createdAt,
      updatedAt,
      tagIds: data.tagIds || [],
      tags: [], // Start with empty tags, to be populated
    } as Task;
  });

  const allTagIds = [...new Set(tasks.flatMap(t => t.tagIds))];

  if (allTagIds.length > 0) {
      // Chunk tag IDs to avoid exceeding Firestore's 'in' query limit (max 30)
      const tagChunks: string[][] = [];
      for (let i = 0; i < allTagIds.length; i += 30) {
        tagChunks.push(allTagIds.slice(i, i + 30));
      }
      
      const tagsMap = new Map<string, Tag>();
      
      for (const chunk of tagChunks) {
        if(chunk.length > 0) {
            const tagsQuery = query(tagsCollection, where(documentId(), 'in', chunk));
            const tagsSnapshot = await getDocs(tagsQuery);
            tagsSnapshot.forEach(doc => tagsMap.set(doc.id, { id: doc.id, ...doc.data() } as Tag));
        }
      }
  
      // Map tags back to their tasks
      tasks.forEach(task => {
          task.tags = task.tagIds.map(tagId => tagsMap.get(tagId)).filter(Boolean) as Tag[];
      });
  }


  return tasks.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
}


export { db };
