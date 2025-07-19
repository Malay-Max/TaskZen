// src/components/dashboard/upcoming-tasks.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday } from 'date-fns';
import type { Task } from '@/types';

interface UpcomingTasksProps {
  tasks: Task[];
}

export default function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
        <CardDescription>Tasks that are due soon.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.slice(0, 5).map(task => ( // Show top 5
              <div key={task.id} className="flex items-center justify-between">
                <p className="text-sm font-medium truncate pr-4">{task.title}</p>
                {task.dueDate && (
                  <Badge variant={isToday(new Date(task.dueDate)) ? 'destructive' : 'outline'}>
                    {format(new Date(task.dueDate), 'MMM d')}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No upcoming tasks.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
