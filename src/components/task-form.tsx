
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { Task, Project } from '@/types';
import { extractTaskFromUrl, type ExtractTaskFromUrlOutput } from '@/ai/flows/extract-task-from-url';
import { useToast } from '@/hooks/use-toast';
import { GenerateTaskIcon } from '@/components/icons';


// Omit properties that are auto-generated or handled separately
type TaskSubmitData = Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt' | 'progress' | 'tags' | 'tagIds'> & { tags: string[] };


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
  onSubmit: (data: any) => void; // Changed to any to accommodate simpler submit data
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: defaultProjectId || '',
      dueDate: null,
      tags: '',
      isRecurring: false,
      recurrence: undefined,
      goalType: undefined,
      goalTarget: undefined,
      goalUnit: '',
    },
  });

  const isRecurring = form.watch('isRecurring');

  const resetForm = (taskToReset?: Task | null) => {
    if (taskToReset) {
      form.reset({
        title: taskToReset.title,
        description: taskToReset.description || '',
        projectId: taskToReset.projectId,
        dueDate: taskToReset.dueDate || null,
        tags: taskToReset.tags?.map(t => t.name).join(', ') || '',
        isRecurring: !!taskToReset.recurrence,
        recurrence: taskToReset.recurrence || undefined,
        goalType: taskToReset.goal?.type || undefined,
        goalTarget: taskToReset.goal?.target || undefined,
        goalUnit: taskToReset.goal?.unit || '',
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
  };

  useEffect(() => {
    if (open) {
      resetForm(task);
      setUrl('');
    }
  }, [task, open, defaultProjectId, projects]);
  
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

  const handleGenerateTask = async () => {
    if (!url) return;
    setIsGenerating(true);
    try {
      const result = await extractTaskFromUrl({ url });
      
      // Populate form with AI results
      form.setValue('title', result.title);
      form.setValue('description', result.description);

      if (result.dueDate) {
        try {
          form.setValue('dueDate', parseISO(result.dueDate));
        } catch (e) {
          console.error("Invalid date from AI", e);
          form.setValue('dueDate', null);
        }
      } else {
        form.setValue('dueDate', null);
      }
      
      const existingTags = form.getValues('tags') || '';
      const newTags = ['ai', ...result.tags];
      const combinedTags = [...new Set([...existingTags.split(',').map(t => t.trim()), ...newTags])].filter(Boolean).join(', ');
      form.setValue('tags', combinedTags);

      if (result.recurrence && result.goalType && result.goalTarget) {
        form.setValue('isRecurring', true);
        form.setValue('recurrence', result.recurrence);
        form.setValue('goalType', result.goalType);
        form.setValue('goalTarget', result.goalTarget);
        form.setValue('goalUnit', result.goalUnit);
      } else {
        form.setValue('isRecurring', false);
      }

    } catch (error) {
      console.error('Failed to generate task:', error);
      toast({
        variant: 'destructive',
        title: 'Task Generation Failed',
        description: 'Could not extract task details from the URL.',
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const handleSubmit = (data: TaskFormValues) => {
    const { isRecurring, goalType, goalTarget, goalUnit, ...rest } = data;
    const processedData = {
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the details of your task.' : 'Fill in the details or generate from a URL.'}
          </DialogDescription>
        </DialogHeader>
        {!task && (
          <>
            <div className="flex gap-2 items-center pt-2">
              <Input
                type="url"
                placeholder="Paste a link (e.g., Twitter, blog post)..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isGenerating}
              />
              <Button onClick={handleGenerateTask} disabled={isGenerating || !url} variant="outline" size="icon">
                {isGenerating ? <Loader2 className="animate-spin" /> : <GenerateTaskIcon />}
                 <span className="sr-only">Generate Task</span>
              </Button>
            </div>
            <div className="relative py-2">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">OR</span>
            </div>
          </>
        )}
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
                    <Textarea placeholder="Add more details..." {...field} value={field.value || ''} rows={5}/>
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
                      <Input placeholder="e.g. urgent, marketing, design" {...field} value={field.value || ''} />
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
                                        <Input type="number" placeholder="e.g. 10" {...field} value={field.value ?? ''} onChange={event => field.onChange(+event.target.value)} />
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
