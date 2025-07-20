# TaskZen on Firebase Studio

This is a Next.js task management application built in Firebase Studio. It uses Firebase Firestore for real-time data persistence and can send task reminders via Telegram using a scheduled GitHub Action.

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

1.  In the root of your project, create a new file named **`.env.local`**.
2.  Copy the contents of `.env` into your new `.env.local` file.
3.  Replace the placeholder values in `.env.local` with your Firebase credentials (from step 1.6), your Telegram Bot Token and Chat ID (from step 2), and create a secure, random string for `CRON_SECRET`.
4.  The `.gitignore` file is configured to **never** commit `.env.local`, so your secret keys are safe.

### 4. Install Dependencies and Run

```bash
npm install
npm run dev
```

Your app should now be running locally, connected to your Firebase Firestore database.

### How Reminders Work

The application uses a **GitHub Actions workflow** to send reminders. This is a reliable and free way to run scheduled tasks.

1.  **The Trigger**: A workflow file at `.github/workflows/reminders.yml` is configured to run on a schedule (e.g., every 15 minutes).
2.  **The API Call**: The GitHub Action sends a `POST` request to an API route within your app (`/api/cron/reminders`). This request is secured with a secret token to prevent unauthorized access.
3.  **The Logic**: The API route contains all the logic to check for tasks that are due soon, overdue, or need a recurring progress reminder. If it finds any, it sends a message using your Telegram Bot.

To get this working in your deployed application:

1.  Deploy your application to a hosting provider like Vercel.
2.  In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
3.  Create a new repository secret named `CRON_SECRET` and paste the same secret token you used in your `.env.local` file.
4.  Create another repository secret named `PRODUCTION_URL` and set its value to the full URL of your deployed application (e.g., `https://your-app-name.vercel.app`).

The GitHub Action will now automatically trigger your application's reminder endpoint on the defined schedule.
