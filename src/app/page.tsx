"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Task, Project, Filters, ProgressLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  LayoutGrid,
} from 'lucide-react';
import { TaskZenIcon } from '@/components/icons';
import ProjectList from '@/components/project-list';
import TaskItem from '@/components/task-item';
import TaskForm from '@/components/task-form';
import ProgressLogDialog from '@/components/progress-log-dialog';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const initialProjects: Project[] = [
  { id: '1', name: 'Website Redesign' },
  { id: '2', name: 'Marketing Campaign' },
  { id: '3', name: 'Personal' },
  { id: '4', name: 'Health & Fitness' },
];

const initialTasks: Task[] = [
  { id: 't1', projectId: '1', title: 'Design new homepage mockup', description: 'Create a high-fidelity mockup in Figma.', completed: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), tags: ['design', 'ui'] },
  { id: 't2', projectId: '1', title: 'Develop responsive navigation', description: 'Code the navigation bar for all screen sizes.', completed: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), tags: ['development', 'css'] },
  { id: 't3', projectId: '1', title: 'Review and approve final design', completed: true, dueDate: new Date(new Date().setDate(new Date().getDate() - 1)) },
  { id: 't4', projectId: '2', title: 'Draft ad copy', description: 'Write compelling copy for the new social media ads.', completed: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), tags: ['copywriting'] },
  { id: 't5', projectId: '3', title: 'Buy groceries', completed: false, description: "Milk, bread, eggs, and cheese." },
  { id: 't6', projectId: '3', title: 'Schedule dentist appointment', completed: true, dueDate: new Date(new Date().setDate(new Date().getDate() - 10)) },
  { id: 't7', projectId: '4', title: 'Run 10km this week', completed: false, recurrence: 'weekly', goal: { type: 'amount', target: 10, unit: 'km' }, progress: [{ date: '2024-07-28', value: 3.5 }, { date: '2024-07-29', value: 2.5 }] },
  { id: 't8', projectId: '4', title: 'Read 5 articles', completed: false, recurrence: 'weekly', goal: { type: 'count', target: 5, unit: 'articles' }, progress: [{ date: '2024-07-28', value: 1 }, { date: '2024-07-29', value: 2 }] },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: 'all', tag: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loggingTask, setLoggingTask] = useState<Task | null>(null);

  useEffect(() => {
    setProjects(initialProjects);
    setTasks(initialTasks);
    setSelectedProjectId(initialProjects[0]?.id || null);
  }, []);

  const addProject = (name: string) => {
    const newProject: Project = { id: Date.now().toString(), name };
    setProjects(prev => [...prev, newProject]);
  };

  const handleTaskSubmit = (taskData: Omit<Task, 'id' | 'completed'>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...editingTask, ...taskData } : t));
    } else {
      const newTask: Task = { ...taskData, id: Date.now().toString(), completed: false, progress: taskData.goal ? [] : undefined };
      setTasks(prev => [newTask, ...prev]);
    }
    setEditingTask(null);
    setIsFormOpen(false);
  };
  
  const handleLogProgress = (taskId: string, log: ProgressLog) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const existingLogIndex = t.progress?.findIndex(p => p.date === log.date);
      let newProgress = [...(t.progress || [])];
      if (existingLogIndex !== -1) {
        newProgress[existingLogIndex] = log;
      } else {
        newProgress.push(log);
      }
      return { ...t, progress: newProgress };
    }));
    setLoggingTask(null);
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
       if (t.id === taskId) {
         if (t.recurrence) return t; // Recurring tasks aren't "completed" in the same way
         return { ...t, completed: !t.completed };
       }
       return t;
    }));
  };
  
  const handleFormOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingTask(null);
    }
    setIsFormOpen(isOpen);
  }

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => selectedProjectId ? task.projectId === selectedProjectId : true)
      .filter(task => filters.status === 'all' ? true : filters.status === 'completed' ? task.completed : !task.completed)
      .filter(task => filters.tag ? task.tags?.includes(filters.tag) : true);
  }, [tasks, selectedProjectId, filters]);

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    tasks.forEach(task => task.tags?.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [tasks]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2 border-b">
        <TaskZenIcon />
        <h1 className="text-xl font-bold">TaskZen</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ProjectList
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onAddProject={addProject}
        />
      </div>
      <div className="p-2 border-t">
        <p className="text-xs text-muted-foreground text-center">© 2024 TaskZen</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 hidden md:flex flex-col border-r">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b shrink-0">
           <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <LayoutGrid className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                 <SidebarContent />
              </SheetContent>
            </Sheet>
            <div>
              <h2 className="text-2xl font-bold">{selectedProject?.name || "All Tasks"}</h2>
              <p className="text-sm text-muted-foreground">{filteredTasks.length} tasks</p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </header>

        <div className="p-4 flex flex-col md:flex-row gap-4 items-center border-b shrink-0">
          <Input 
            placeholder="Filter by tag..."
            className="max-w-xs"
            value={filters.tag}
            onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
          />
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as Filters['status'] }))}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          {allTags.length > 0 && <span className="text-sm text-muted-foreground hidden lg:block">Available tags: {allTags.join(', ')}</span>}

        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredTasks.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onLogProgress={() => setLoggingTask(task)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h3 className="text-xl font-semibold">No tasks here!</h3>
              <p className="text-muted-foreground mt-2">
                {selectedProjectId ? "This project is empty." : "You have no tasks."}
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Task
              </Button>
            </div>
          )}
        </div>
      </main>

      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormOpen}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        projects={projects}
        defaultProjectId={selectedProjectId}
      />
      <ProgressLogDialog
        task={loggingTask}
        onOpenChange={() => setLoggingTask(null)}
        onLogProgress={handleLogProgress}
      />
    </div>
  );
}
