export type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completed: boolean;
  projectId: string;
  // tags are now managed via a join table
  tags?: Tag[]; // This will be populated after fetching from the join table
  recurrence: 'daily' | 'weekly' | 'monthly' | null;
  goal: {
    type: 'count' | 'amount';
    target: number;
    unit: string | null;
  } | null;
  progress: ProgressLog[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProgressLog = {
  date: string; // YYYY-MM-DD
  value: number;
};

export type Project = {
  id: string;
  name: string;
  createdAt: Date;
};

export type Tag = {
    id: string;
    name: string;
}

export type TaskTag = {
    taskId: string;
    tagId: string;
}

export type Filters = {
  status: 'all' | 'completed' | 'incomplete';
  tag: string; // This will now be a tag NAME, not ID
};
