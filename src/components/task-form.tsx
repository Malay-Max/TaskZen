"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { Task, Project } from '@/types';

// Omit properties that are auto-generated or handled separately
type TaskSubmitData = Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt' | 'progress'>;


const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(100),
  description: z.string().max(500).optional().transform(val => val || null),
  projectId: z.string({ required_error: 'Please select a project.' }),
  dueDate: z.date().nullable().optional(),
  tags: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(['daily', 'weekly', 'monthly']).optional(),
  goalType: z.enum(['count', 'amount']).optional(),
  goalTarget: z.coerce.number().positive().optional(),
  goalUnit: z.string().optional().transform(val => val || null),
}).refine(data => {
    if (data.isRecurring) {
        return !!data.recurrence && !!data.goalType && !!data.goalTarget;
    }
    return true;
}, {
    message: "Recurring tasks require a recurrence pattern, goal type, and target.",
    path: ["isRecurring"],
});


type TaskFormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskSubmitData) => void;
  task?: Task | null;
  projects: Project[];
  defaultProjectId?: string | null;
}

export default function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  task,
  projects,
  defaultProjectId,
}: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: defaultProjectId || '',
      dueDate: null,
      tags: '',
      isRecurring: false,
    },
  });

  const isRecurring = form.watch('isRecurring');

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        projectId: task.projectId,
        dueDate: task.dueDate || null,
        tags: task.tags?.join(', ') || '',
        isRecurring: !!task.recurrence,
        recurrence: task.recurrence || undefined,
        goalType: task.goal?.type || undefined,
        goalTarget: task.goal?.target || undefined,
        goalUnit: task.goal?.unit || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        projectId: defaultProjectId || projects[0]?.id || '',
        dueDate: null,
        tags: '',
        isRecurring: false,
        recurrence: undefined,
        goalType: undefined,
        goalTarget: undefined,
        goalUnit: '',
      });
    }
  }, [task, open, defaultProjectId, form, projects]);
  
  // When isRecurring is toggled, clear dependent fields
  useEffect(() => {
    if (!isRecurring) {
        form.setValue('dueDate', form.getValues('dueDate')); // keep due date
        form.setValue('recurrence', undefined);
        form.setValue('goalType', undefined);
        form.setValue('goalTarget', undefined);
        form.setValue('goalUnit', '');
    } else {
       form.setValue('dueDate', null); // Recurring tasks don't have a fixed due date
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurring]);

  const handleSubmit = (data: TaskFormValues) => {
    const { isRecurring, goalType, goalTarget, goalUnit, ...rest } = data;
    const processedData: TaskSubmitData = {
      ...rest,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      // Set recurrence and goal to null if not a recurring task
      recurrence: isRecurring ? data.recurrence! : null,
      goal: isRecurring && goalType && goalTarget ? { type: goalType, target: goalTarget, unit: goalUnit || null } : null
    };
    onSubmit(processedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the details of your task.' : 'Fill in the details for your new task.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Finalize quarterly report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                               isRecurring && 'opacity-50 cursor-not-allowed'
                            )}
                            disabled={isRecurring}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. urgent, marketing, design" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring / Goal</FormLabel>
                    <DialogDescription>Is this a recurring task with a goal?</DialogDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {isRecurring && (
                <div className="space-y-4 rounded-lg border p-3 shadow-sm">
                    <FormField
                      control={form.control}
                      name="recurrence"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repeats</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a recurrence" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="goalType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Goal Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a goal type" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="count">Count</SelectItem>
                                            <SelectItem value="amount">Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="goalTarget"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 10" {...field} onChange={event => field.onChange(+event.target.value)} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="goalUnit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit (optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. km, articles, hours" {...field} value={field.value || ''}/>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{task ? 'Save Changes' : 'Create Task'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
