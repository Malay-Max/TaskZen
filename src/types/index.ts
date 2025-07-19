export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date | null;
  completed: boolean;
  projectId: string;
  tags?: string[];
  // New fields for recurring & goal-oriented tasks
  recurrence?: 'daily' | 'weekly' | 'monthly' | null;
  goal?: {
    type: 'count' | 'amount';
    target: number;
    unit?: string;
  } | null;
  progress?: ProgressLog[];
};

export type ProgressLog = {
  date: string; // YYYY-MM-DD
  value: number;
};

export type Project = {
  id: string;
  name: string;
};

export type Filters = {
  status: 'all' | 'completed' | 'incomplete';
  tag: string;
};
