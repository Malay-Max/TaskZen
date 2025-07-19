export type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completed: boolean;
  projectId: string;
  tags: string[] | null;
  // New fields for recurring & goal-oriented tasks
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

export type Filters = {
  status: 'all' | 'completed' | 'incomplete';
  tag: string;
};
