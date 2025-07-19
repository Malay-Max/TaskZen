export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date | null;
  completed: boolean;
  projectId: string;
  tags?: string[];
};

export type Project = {
  id: string;
  name: string;
};

export type Filters = {
  status: 'all' | 'completed' | 'incomplete';
  tag: string;
};
