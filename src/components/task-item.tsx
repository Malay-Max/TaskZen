
"use client";

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { MoreVertical, Calendar as CalendarIcon, Pencil, Trash2, PlusCircle, Repeat } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onLogProgress: (task: Task) => void;
  onView: (task: Task) => void;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete, onLogProgress, onView }: TaskItemProps) {
  const { id, title, description, completed, dueDate, tags, recurrence, goal, progress } = task;

  const dueDateStatus = dueDate
    ? isPast(dueDate) && !isToday(dueDate)
      ? 'overdue'
      : isToday(dueDate)
      ? 'due-today'
      : 'upcoming'
    : 'none';
    
  const currentProgress = useMemo(() => {
    if (!progress) return 0;
    return progress.reduce((acc, log) => acc + log.value, 0);
  }, [progress]);

  const progressPercentage = useMemo(() => {
    if (!goal || !goal.target) return 0;
    return (currentProgress / goal.target) * 100;
  }, [currentProgress, goal]);
  
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Stop propagation if the click is on an interactive element
    if ((e.target as HTMLElement).closest('[data-interactive]')) {
      return;
    }
    onView(task);
  };

  return (
    <Card 
        className={cn(
            "flex flex-col transition-all hover:shadow-md cursor-pointer", 
            completed ? "bg-card/60" : "bg-card"
        )}
        onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
        <div data-interactive onClick={(e) => e.stopPropagation()}>
            {!recurrence && (
            <Checkbox
                id={`task-${id}`}
                checked={completed}
                onCheckedChange={() => onToggle(id)}
                className="mt-1 shrink-0"
            />
            )}
            {recurrence && (
                <div className="mt-1 shrink-0">
                    <Repeat className="w-4 h-4 text-muted-foreground" />
                </div>
            )}
        </div>
        <div className="flex-1">
          <CardTitle
            className={cn(
              'text-lg font-semibold transition-colors',
              completed && 'text-muted-foreground line-through'
            )}
          >
            {title}
          </CardTitle>
        </div>
        <div data-interactive onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 flex-1 space-y-4">
        {description && (
          <p className={cn(
            "text-sm text-muted-foreground truncate",
            completed && "line-through"
          )}>
            {description}
          </p>
        )}
        {goal && (
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{currentProgress.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit || ''}</span>
                </div>
                <Progress value={progressPercentage} />
            </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-2 pt-2">
        <div className="flex-1 flex flex-wrap gap-2">
            {dueDate && !recurrence && (
              <Badge
                variant="outline"
                className={cn({
                  'text-red-600 border-red-600/50 dark:text-red-400 dark:border-red-400/50': dueDateStatus === 'overdue' && !completed,
                  'text-amber-600 border-amber-600/50 dark:text-amber-400 dark:border-amber-400/50': dueDateStatus === 'due-today' && !completed,
                })}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {format(dueDate, 'MMM d')}
              </Badge>
            )}
            {recurrence && (
                <Badge variant="outline">
                    <Repeat className="mr-1.5 h-3 w-3" />
                    {recurrence.charAt(0).toUpperCase() + recurrence.slice(1)}
                </Badge>
            )}
            {tags?.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
        </div>
        {goal && (
          <div data-interactive onClick={(e) => e.stopPropagation()}>
             <Button variant="outline" size="sm" onClick={() => onLogProgress(task)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Log
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
