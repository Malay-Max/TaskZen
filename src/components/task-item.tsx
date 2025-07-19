"use client";

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
import { MoreVertical, Calendar as CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const { id, title, description, completed, dueDate, tags } = task;

  const dueDateStatus = dueDate
    ? isPast(dueDate) && !isToday(dueDate)
      ? 'overdue'
      : isToday(dueDate)
      ? 'due-today'
      : 'upcoming'
    : 'none';

  return (
    <Card className={cn(
        "flex flex-col transition-all hover:shadow-md", 
        completed ? "bg-card/60" : "bg-card"
    )}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
        <Checkbox
          id={`task-${id}`}
          checked={completed}
          onCheckedChange={() => onToggle(id)}
          className="mt-1 shrink-0"
        />
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
      </CardHeader>

      {description && (
        <CardContent className="pt-0 pb-4 flex-1">
          <p className={cn(
            "text-sm text-muted-foreground",
            completed && "line-through"
          )}>
            {description}
          </p>
        </CardContent>
      )}

      <CardFooter className="flex flex-wrap items-center gap-2 pt-2">
        {dueDate && (
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
        {tags?.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}
