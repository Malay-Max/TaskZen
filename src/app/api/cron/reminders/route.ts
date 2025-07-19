
// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import { fetchTasksWithTags } from '@/lib/firebase';
import { sendTelegramReminder } from '@/lib/telegram';
import {
  isAfter,
  isBefore,
  subHours,
  isPast,
  format,
} from 'date-fns';

// This is a simple in-memory cache to prevent sending the same reminder multiple times.
// For a production system, you might use a more persistent store like Firestore or Redis.
const sentReminders = new Set<string>();

const RECURRING_REMINDER_HOUR = 19; // 7 PM
const REMINDER_WINDOW_HOURS = 1; // Remind 1 hour before due

export async function GET() {
  try {
    const tasks = await fetchTasksWithTags();
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    for (const task of tasks) {
        if (task.completed) continue;

        // --- Standard (One-Off) Task Reminders ---
        if (task.dueDate && !task.recurrence) {
            const dueDate = new Date(task.dueDate);
            const reminderTime = subHours(dueDate, REMINDER_WINDOW_HOURS);

            // Due Soon Reminder
            const dueSoonKey = `${task.id}-${format(dueDate, 'yyyy-MM-dd')}-due-soon`;
            if (
                isAfter(now, reminderTime) &&
                isBefore(now, dueDate) &&
                !sentReminders.has(dueSoonKey)
            ) {
                console.log(`Sending 'due soon' reminder for task: ${task.title}`);
                await sendTelegramReminder(`⏰ Task due soon: "${task.title}" is due at ${format(dueDate, 'p')}.`);
                sentReminders.add(dueSoonKey);
            }

            // Overdue Reminder
            const overdueKey = `${task.id}-${format(dueDate, 'yyyy-MM-dd')}-overdue`;
            if (isPast(dueDate) && !sentReminders.has(overdueKey)) {
                console.log(`Sending 'overdue' reminder for task: ${task.title}`);
                await sendTelegramReminder(`⚠️ Task overdue: "${task.title}" was due on ${format(dueDate, 'MMM d')}.`);
                sentReminders.add(overdueKey);
            }
        }

        // --- Recurring Task Reminders ---
        if (task.recurrence === 'daily') {
            const recurringKey = `${task.id}-${todayStr}-recurring`;
            const progressToday = task.progress?.some(p => p.date === todayStr);

            if (
                !progressToday &&
                now.getHours() >= RECURRING_REMINDER_HOUR &&
                !sentReminders.has(recurringKey)
            ) {
                console.log(`Sending 'recurring' reminder for task: ${task.title}`);
                await sendTelegramReminder(`🔁 Daily reminder: Don't forget to log your progress for "${task.title}" today!`);
                sentReminders.add(recurringKey);
            }
        }
    }

    return NextResponse.json({ success: true, message: 'Reminders checked.' });

  } catch (error) {
    console.error('Cron job for reminders failed:', error);
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'An unknown error occurred.' }, { status: 500 });
  }
}
