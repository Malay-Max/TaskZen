"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { format, parseISO } from 'date-fns';
import type { Task, ProgressLog } from '@/types';

const formSchema = z.object({
  value: z.coerce.number().min(0, { message: 'Progress must be a positive number.' }),
  date: z.string(),
});

type ProgressFormValues = z.infer<typeof formSchema>;

interface ProgressLogDialogProps {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  onLogProgress: (taskId: string, log: ProgressLog) => void;
}

export default function ProgressLogDialog({ task, onOpenChange, onLogProgress }: ProgressLogDialogProps) {
  const [currentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const isOpen = !!task;

  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: currentDate,
      value: 0,
    },
  });

  useEffect(() => {
    if (task) {
      const todaysLog = task.progress?.find(p => p.date === currentDate);
      form.reset({
        date: currentDate,
        value: todaysLog?.value || 0,
      });
    }
  }, [task, currentDate, form]);

  if (!task) {
    return null;
  }
  
  const handleSubmit = (data: ProgressFormValues) => {
    if (task) {
      onLogProgress(task.id, data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Progress for "{task.title}"</DialogTitle>
          <DialogDescription>
            Enter your progress for today ({format(new Date(), 'MMM d, yyyy')}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Today's Progress {task.goal?.unit ? `(${task.goal.unit})` : ''}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Log Progress</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
