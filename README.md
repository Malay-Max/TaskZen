# TaskZen on Firebase Studio

This is a Next.js task management application built in Firebase Studio. It uses Firebase Firestore for real-time data persistence.

## Getting Started

To run this project locally, you'll need to set up a Firebase project and configure the app to use it.

### 1. Set up a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the steps to create a new project.
3.  Once your project is created, go to the **Project Settings** (click the gear icon next to "Project Overview").
4.  In the "Your apps" section, click the **Web icon (`</>`)** to create a new web app.
5.  Give your app a nickname and click **"Register app"**.
6.  You'll see a `firebaseConfig` object with your project's credentials. You will need these for the next step.
7.  In the Firebase console, go to the **Firestore Database** section.
8.  Click **"Create database"** and start in **test mode** for now. This will allow open read/write access for development. *For production, you should set up proper security rules.*

### 2. Configure Environment Variables

1.  In the root of your project, create a new file named `.env.local`.
2.  Copy the contents of `.env.local.example` into your new `.env.local` file.
3.  Replace the placeholder values with the actual credentials from your Firebase project's web app configuration (from step 1.6).

### 3. Install Dependencies and Run

```bash
npm install
npm run dev
```

Your app should now be running locally, connected to your Firebase Firestore database!
