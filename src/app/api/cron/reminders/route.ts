
// src/app/api/cron/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchTasksWithTags } from '@/lib/firebase';
import { sendTelegramReminder } from '@/lib/telegram';
import {
  isAfter,
  isBefore,
  subDays,
  isPast,
  format,
  differenceInMinutes,
  isSameDay,
} from 'date-fns';

// This is a simple in-memory cache to prevent sending the same reminder multiple times *within a single cron job execution*.
// For a production system with multiple server instances, a more persistent store like Firestore or Redis would be needed.
const sentReminders = new Set<string>();

const RECURRING_REMINDER_HOUR = 19; // 7 PM
const REMINDER_WINDOW_DAYS = 1; // Remind 1 day before due
const IMMINENT_WINDOWS = [30, 10]; // 30 and 10 minutes before

export async function POST(request: NextRequest) {
  console.log("Cron reminder endpoint triggered at:", new Date().toISOString());

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Cron job unauthorized. Check CRON_SECRET.");
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const tasks = await fetchTasksWithTags();
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    for (const task of tasks) {
        if (task.completed) continue;

        // --- Standard (One-Off) Task Reminders ---
        if (task.dueDate && !task.recurrence) {
            const dueDate = new Date(task.dueDate);

            // Due Soon Reminder (1 day before)
            const dueSoonKey = `${task.id}-due-soon-${format(dueDate, 'yyyy-MM-dd')}`;
            const reminderTime = subDays(dueDate, REMINDER_WINDOW_DAYS);

            if (
                isAfter(now, reminderTime) &&
                isBefore(now, dueDate) &&
                !isSameDay(now, dueDate) && // Don't send if it's due today
                !sentReminders.has(dueSoonKey)
            ) {
                console.log(`Sending 'due soon' reminder for task: ${task.title}`);
                await sendTelegramReminder(`⏰ Task due tomorrow: "${task.title}" is due at ${format(dueDate, 'p')}.`);
                sentReminders.add(dueSoonKey);
            }
            
            // Imminent Reminders (30 and 10 mins before)
            const minutesUntilDue = differenceInMinutes(dueDate, now);
            if (minutesUntilDue > 0) {
                for (const window of IMMINENT_WINDOWS) {
                    // This key ensures the reminder is sent only once in the 5-minute cron window
                    const imminentKey = `${task.id}-imminent-${window}-${format(dueDate, 'yyyy-MM-dd-HH')}`; 
                    if (minutesUntilDue <= window && minutesUntilDue > (window - 5) && !sentReminders.has(imminentKey)) {
                        console.log(`Sending 'imminent' reminder for task: ${task.title}`);
                        await sendTelegramReminder(`❗ Task due in ${window} minutes: "${task.title}".`);
                        sentReminders.add(imminentKey);
                    }
                }
            }

            // Overdue Reminder
            const overdueKey = `${task.id}-overdue-${format(dueDate, 'yyyy-MM-dd')}`;
            if (isPast(dueDate) && !sentReminders.has(overdueKey)) {
                console.log(`Sending 'overdue' reminder for task: ${task.title}`);
                await sendTelegramReminder(`⚠️ Task overdue: "${task.title}" was due on ${format(dueDate, 'MMM d, p')}.`);
                sentReminders.add(overdueKey);
            }
        }

        // --- Recurring Task Reminders ---
        if (task.recurrence === 'daily') {
            const recurringKey = `${task.id}-recurring-${todayStr}`;
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

// Allow GET requests for simple browser testing/pinging, but they won't run the job.
export async function GET() {
    return NextResponse.json({ message: "This endpoint is for a POST cron job. Please trigger it with a POST request and the correct secret." });
}
