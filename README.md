# TaskZen on Firebase Studio

This is a Next.js task management application built in Firebase Studio. It uses Firebase Firestore for real-time data persistence and sends task reminders via Telegram.

## Getting Started

To run this project locally, you'll need to set up a Firebase project and a Telegram Bot, then configure the app to use them.

### 1. Set up a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the steps to create a new project.
3.  Once your project is created, go to the **Project Settings** (click the gear icon next to "Project Overview").
4.  In the "Your apps" section, click the **Web icon (`</>`)** to create a new web app.
5.  Give your app a nickname and click **"Register app"**.
6.  You'll see a `firebaseConfig` object with your project's credentials. You will need these for the next step.
7.  In the Firebase console, go to the **Firestore Database** section.
8.  Click **"Create database"** and start in **test mode** for now. This will allow open read/write access for development. *For production, you should set up proper security rules.*

### 2. Set up a Telegram Bot for Reminders

1.  **Create a Bot**: Open Telegram and search for the **"BotFather"**. Start a chat with him and follow the instructions to create a new bot (`/newbot` command). He will give you a **Bot Token**.
2.  **Get your Chat ID**: Search for your newly created bot in Telegram and send it a message (any message will do). Then, open your web browser and go to the following URL, replacing `<BOT_TOKEN>` with the token you just received: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`.
3.  Look for the JSON response. Inside `result[0].message.chat`, you will find your `id`. This is your **Chat ID**.

### 3. Configure Environment Variables

1.  In the root of your project, create a new file named `.env.local` if it doesn't exist.
2.  Copy the contents of `.env` into your new `.env.local` file.
3.  Replace the placeholder values with your Firebase credentials (from step 1.6), and your Telegram Bot Token and Chat ID (from step 2).

### 4. Install Dependencies and Run

```bash
npm install
npm run dev
```

Your app should now be running locally, connected to your Firebase Firestore database and ready to send Telegram reminders!

### How Reminders Work

The application checks for tasks that need reminders every minute *while the app is open in a browser tab*. This includes:
-   Tasks that are due within the next hour.
-   Tasks that are overdue.
-   Daily recurring tasks that have not had progress logged by 7 PM local time.

For a production environment, you would want to move this reminder logic to a server-side cron job (e.g., using Firebase Functions or Vercel Cron Jobs) to ensure reminders are sent even when the app is closed.
