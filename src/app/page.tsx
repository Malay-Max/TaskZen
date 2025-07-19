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
import { useCollection } from '@/hooks/use-collection';
import {
  addProject,
  addTask,
  updateTask,
  deleteTask,
  logProgress,
} from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";


export default function Home() {
  const { data: projects, loading: projectsLoading } = useCollection<Project>('projects');
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ status: 'all', tag: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loggingTask, setLoggingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Select the first project by default when projects load
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);


  const handleAddProject = async (name: string) => {
    try {
      await addProject({ name });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error adding project." });
      console.error(error);
    }
  };

  const handleTaskSubmit = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        toast({ title: "Task updated!" });
      } else {
        await addTask({ ...taskData, completed: false });
        toast({ title: "Task added!" });
      }
      setEditingTask(null);
      setIsFormOpen(false);
    } catch (error) {
       toast({ variant: 'destructive', title: "Error saving task." });
       console.error(error);
    }
  };
  
  const handleLogProgress = async (taskId: string, log: ProgressLog) => {
    try {
        await logProgress(taskId, log);
        setLoggingTask(null);
        toast({ title: "Progress logged!" });
    } catch (error) {
        toast({ variant: 'destructive', title: "Error logging progress." });
        console.error(error);
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
     if (window.confirm("Are you sure you want to delete this task?")) {
        try {
            await deleteTask(taskId);
            toast({ title: "Task deleted." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error deleting task." });
            console.error(error);
        }
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Prevent toggling recurring tasks
    if (task.recurrence) return;

    try {
        await updateTask(taskId, { completed: !task.completed });
    } catch (error) {
        toast({ variant: 'destructive', title: "Error updating task status." });
        console.error(error);
    }
  };
  
  const handleFormOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingTask(null);
    }
    setIsFormOpen(isOpen);
  }

  const filteredTasks = useMemo(() => {
    return (tasks || [])
      .filter(task => selectedProjectId ? task.projectId === selectedProjectId : true)
      .filter(task => filters.status === 'all' ? true : filters.status === 'completed' ? task.completed : !task.completed)
      .filter(task => filters.tag ? task.tags?.includes(filters.tag) : true);
  }, [tasks, selectedProjectId, filters]);

  const selectedProject = useMemo(() => projects?.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const allTags = useMemo(() => {
    if (!tasks) return [];
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
          projects={projects || []}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onAddProject={handleAddProject}
          loading={projectsLoading}
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
          <Button onClick={() => setIsFormOpen(true)} disabled={projectsLoading || !projects || projects.length === 0}>
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
          {tasksLoading ? (
             <div className="flex items-center justify-center h-full">
                <p>Loading tasks...</p>
             </div>
          ) : filteredTasks.length > 0 ? (
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
              <Button className="mt-4" onClick={() => setIsFormOpen(true)} disabled={projectsLoading || !projects || projects.length === 0}>
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
        projects={projects || []}
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
