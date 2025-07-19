// src/app/dashboard/page.tsx
"use client";

import { useMemo } from 'react';
import { useCollection } from '@/hooks/use-collection';
import type { Task, Project } from '@/types';
import { subDays, startOfDay, isAfter } from 'date-fns';
import { Loader2 } from 'lucide-react';

import StatCard from '@/components/dashboard/stat-card';
import TasksCompletedChart from '@/components/dashboard/tasks-completed-chart';
import ProjectDistributionChart from '@/components/dashboard/project-distribution-chart';
import GoalProgress from '@/components/dashboard/goal-progress';
import UpcomingTasks from '@/components/dashboard/upcoming-tasks';

export default function DashboardPage() {
  const { data: tasks, loading: tasksLoading, error: tasksError } = useCollection<Task>('tasks');
  const { data: projects, loading: projectsLoading, error: projectsError } = useCollection<Project>('projects');
  
  const loading = tasksLoading || projectsLoading;
  const error = tasksError || projectsError;

  const dashboardData = useMemo(() => {
    if (loading || error || !tasks || !projects) {
      return null;
    }

    // --- Key Metrics ---
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeTasks = totalTasks - completedTasks;
    const goalTasks = tasks.filter(t => !!t.goal);

    // --- Tasks Completed Chart Data (Last 7 Days) ---
    const last7Days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), i))).reverse();
    const tasksCompletedLast7Days = last7Days.map(day => {
      const completedOnDay = tasks.filter(task => 
        task.completed && 
        task.updatedAt &&
        startOfDay(new Date(task.updatedAt)).getTime() === day.getTime()
      ).length;
      return {
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: completedOnDay,
      };
    });

    // --- Project Distribution Chart Data ---
    const tasksByProject = projects.map(project => ({
      name: project.name,
      value: tasks.filter(t => t.projectId === project.id).length,
    })).filter(p => p.value > 0);

    // --- Upcoming & Overdue Tasks ---
    const now = startOfDay(new Date());
    const upcomingTasks = tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      isAfter(startOfDay(new Date(task.dueDate)), now)
    ).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    return {
      totalTasks,
      completedTasks,
      activeTasks,
      goalTasks,
      tasksCompletedLast7Days,
      tasksByProject,
      upcomingTasks,
    };
  }, [tasks, projects, loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>Error loading dashboard data: {error.message}</p>
      </div>
    );
  }
  
  if (!dashboardData) {
      return (
        <div className="flex items-center justify-center h-full">
            <p>No data available to display.</p>
        </div>
      )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tasks" value={dashboardData.totalTasks} />
        <StatCard title="Active Tasks" value={dashboardData.activeTasks} />
        <StatCard title="Completed Tasks" value={dashboardData.completedTasks} />
        <StatCard title="Active Goals" value={dashboardData.goalTasks.length} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-12 md:col-span-4">
            <TasksCompletedChart data={dashboardData.tasksCompletedLast7Days} />
        </div>
        <div className="col-span-12 md:col-span-3">
            <ProjectDistributionChart data={dashboardData.tasksByProject} />
        </div>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-12 md:col-span-4">
            <GoalProgress tasks={dashboardData.goalTasks} />
        </div>
        <div className="col-span-12 md:col-span-3">
           <UpcomingTasks tasks={dashboardData.upcomingTasks} />
        </div>
       </div>
    </div>
  );
}