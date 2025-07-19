// src/components/reminder-system.tsx
"use client";

import { useEffect, useRef } from 'react';
import { useCollection } from '@/hooks/use-collection';
import { Task } from '@/types';
import { sendTelegramReminder } from '@/lib/telegram';
import {
  isAfter,
  isBefore,
  subHours,
  isToday,
  startOfToday,
  isPast,
  format,
} from 'date-fns';

const REMINDER_CHECK_INTERVAL = 60 * 1000; // 1 minute
const REMINDER_WINDOW_HOURS = 1; // Remind 1 hour before due
const RECURRING_REMINDER_HOUR = 19; // 7 PM

export default function ReminderSystem() {
  const { data: tasks, loading } = useCollection<Task>('tasks');
  const sentReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = async () => {
      if (loading || !tasks) return;

      const now = new Date();

      for (const task of tasks) {
        if (task.completed) continue;

        const reminderKeyBase = `${task.id}-${format(now, 'yyyy-MM-dd')}`;

        // --- Standard (One-Off) Task Reminders ---
        if (task.dueDate && !task.recurrence) {
          const dueDate = new Date(task.dueDate);
          const reminderTime = subHours(dueDate, REMINDER_WINDOW_HOURS);

          // Due Soon Reminder
          const dueSoonKey = `${reminderKeyBase}-due-soon`;
          if (
            isAfter(now, reminderTime) &&
            isBefore(now, dueDate) &&
            !sentReminders.current.has(dueSoonKey)
          ) {
            console.log(`Sending 'due soon' reminder for task: ${task.title}`);
            await sendTelegramReminder(`⏰ Task due soon: "${task.title}" is due at ${format(dueDate, 'p')}.`);
            sentReminders.current.add(dueSoonKey);
          }

          // Overdue Reminder
          const overdueKey = `${reminderKeyBase}-overdue`;
          if (isPast(dueDate) && !sentReminders.current.has(overdueKey)) {
             console.log(`Sending 'overdue' reminder for task: ${task.title}`);
            await sendTelegramReminder(`⚠️ Task overdue: "${task.title}" was due on ${format(dueDate, 'MMM d')}.`);
            sentReminders.current.add(overdueKey);
          }
        }

        // --- Recurring Task Reminders ---
        if (task.recurrence === 'daily') {
            const recurringKey = `${reminderKeyBase}-recurring`;
            const progressToday = task.progress?.some(p => p.date === format(now, 'yyyy-MM-dd'));

            if (
                !progressToday &&
                now.getHours() >= RECURRING_REMINDER_HOUR &&
                !sentReminders.current.has(recurringKey)
            ) {
                 console.log(`Sending 'recurring' reminder for task: ${task.title}`);
                 await sendTelegramReminder(`🔁 Daily reminder: Don't forget to log your progress for "${task.title}" today!`);
                 sentReminders.current.add(recurringKey);
            }
        }
      }
    };

    const intervalId = setInterval(checkReminders, REMINDER_CHECK_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [tasks, loading]);

  // This is a background component and does not render anything
  return null;
}
