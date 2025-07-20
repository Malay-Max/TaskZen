
"use client";

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Repeat, Folder, Tag as TagIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, Project } from '@/types';

interface TaskDetailModalProps {
  task: Task | null;
  projects: Project[];
  onOpenChange: (open: boolean) => void;
}

export default function TaskDetailModal({ task, projects, onOpenChange }: TaskDetailModalProps) {
  const isOpen = !!task;

  const project = useMemo(() => {
    if (!task || !projects) return null;
    return projects.find(p => p.id === task.projectId);
  }, [task, projects]);
  
  const currentProgress = useMemo(() => {
    if (!task || !task.progress) return 0;
    return task.progress.reduce((acc, log) => acc + log.value, 0);
  }, [task]);

  const progressPercentage = useMemo(() => {
    if (!task || !task.goal || !task.goal.target) return 0;
    return (currentProgress / task.goal.target) * 100;
  }, [currentProgress, task]);
  
  const hasTime = useMemo(() => {
    if (!task?.dueDate) return false;
    const date = new Date(task.dueDate);
    return date.getHours() !== 0 || date.getMinutes() !== 0;
  }, [task]);


  if (!task) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
          <DialogDescription>
            Task Details
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {task.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
             {project && (
                <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Project:</span>
                    <span className="text-muted-foreground">{project.name}</span>
                </div>
            )}
            {task.dueDate && !task.recurrence && (
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Due:</span>
                    <span className="text-muted-foreground">
                        {format(task.dueDate, 'PPP')}
                        {hasTime && ` at ${format(task.dueDate, 'p')}`}
                    </span>
                </div>
            )}
            {task.recurrence && (
                 <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Recurs:</span>
                    <span className="text-muted-foreground capitalize">{task.recurrence}</span>
                </div>
            )}
          </div>
          
           {task.tags && task.tags.length > 0 && (
             <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                        <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                    ))}
                </div>
             </div>
           )}

           {task.goal && (
            <div>
                <h3 className="font-semibold mb-2">Goal Progress</h3>
                <div className="space-y-2">
                    <Progress value={progressPercentage} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                            {currentProgress.toLocaleString()} / {task.goal.target.toLocaleString()} {task.goal.unit || ''}
                        </span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                </div>
            </div>
           )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
