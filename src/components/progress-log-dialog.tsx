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
import { format } from 'date-fns';
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
    // Reset the form when the dialog opens for a new task.
    // We no longer set the value to the day's existing log,
    // as we are now adding to it.
    if (task) {
      form.reset({
        date: currentDate,
        value: 0, // Always start with 0 for additive logging
      });
    }
  }, [task, currentDate, form]);

  if (!task) {
    return null;
  }
  
  const handleSubmit = (data: ProgressFormValues) => {
    if (task && data.value > 0) { // Only log if there's a value
      onLogProgress(task.id, data);
    } else {
      // If value is 0, just close the dialog without doing anything
      onOpenChange(false);
    }
  };

  const totalProgressToday = task.progress?.find(p => p.date === currentDate)?.value || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Progress for "{task.title}"</DialogTitle>
          <DialogDescription>
            Enter the additional progress you made today ({format(new Date(), 'MMM d, yyyy')}).
            <br />
            You've logged <span className="font-semibold">{totalProgressToday.toLocaleString()}</span> so far today.
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
                    Additional Progress {task.goal?.unit ? `(${task.goal.unit})` : ''}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} autoFocus />
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
