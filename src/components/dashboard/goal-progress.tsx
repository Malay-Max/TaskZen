// src/components/dashboard/goal-progress.tsx
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Task } from '@/types';

interface GoalProgressProps {
  tasks: Task[];
}

export default function GoalProgress({ tasks }: GoalProgressProps) {

  const goalTasksWithProgress = useMemo(() => {
    return tasks
      .filter(task => task.goal && task.goal.target > 0)
      .map(task => {
        const currentProgress = task.progress?.reduce((acc, log) => acc + log.value, 0) || 0;
        const progressPercentage = (currentProgress / task.goal!.target) * 100;
        return {
          ...task,
          currentProgress,
          progressPercentage,
        };
      });
  }, [tasks]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Goal Progress</CardTitle>
        <CardDescription>Your progress on recurring tasks with goals.</CardDescription>
      </CardHeader>
      <CardContent>
        {goalTasksWithProgress.length > 0 ? (
          <div className="space-y-6">
            {goalTasksWithProgress.map(task => (
              <div key={task.id} className="space-y-2">
                <div className="flex justify-between items-baseline">
                   <p className="text-sm font-medium">{task.title}</p>
                   <p className="text-xs text-muted-foreground">{task.recurrence}</p>
                </div>
                <Progress value={task.progressPercentage} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {task.currentProgress.toLocaleString()} / {task.goal!.target.toLocaleString()} {task.goal!.unit || ''}
                  </span>
                  <span>{Math.round(task.progressPercentage)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No tasks with goals found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
