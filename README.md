# TaskFlowApp

TaskFlowApp is a modern, production-ready, beautiful Kanban Board task management application. Built with React (Vite), Bootstrap 5, and Firebase Firestore, it provides seamless real-time syncing across devices and a stunning visual experience.

> [!TIP]
> **No Firebase Config? No Problem!**
> If you run the app without a Firebase setup, it will automatically fall back to **Local Preview Mode** (backed by browser `localStorage`). You can test, create tasks, and explore the Kanban board immediately without entering any credentials.

---

## ✨ Features

- **Authentication**: Complete secure login and registration with email/password (backed by Firebase Auth).
- **Kanban Board Layout**: Three status columns:
  - **To Do**
  - **In Progress**
  - **Done**
- **Dynamic Task Management**: Add, edit, delete (with custom card-embedded warnings), and transition tasks across columns.
- **Priority Indicator Levels**: Color-coded borders and filter/sort options for Low, Medium, and High priority tasks.
- **Overdue Task Tracking**: Highlights due dates when they are overdue compared to current local time.
- **Task Search & Filtering**: Real-time debounced searches on title/description, plus sorting by date created or due date.
- **Active Sessions (Optional)**: Real-time user presence tracking widget showing currently online accounts.
- **Premium Styling**: Glassmorphic layout panels, Outfit typography, custom scrollbars, and micro-animations for interactions.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), HTML5, CSS3, Bootstrap 5
- **Real-time Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Icons**: `react-icons` (Feather Icons pack)

---

## 🚀 Getting Started

### 1. Setup the project
Navigate to the project directory, install dependencies, and start the local development server:

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Connecting Firebase

To enable real-time cloud database storage and multi-device syncing, connect your own Firebase project:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and follow the prompts.

### Step 2: Set up Authentication
1. In the sidebar, go to **Build > Authentication** and click **Get Started**.
2. Select the **Sign-in method** tab.
3. Enable the **Email/Password** provider.

### Step 3: Create Firestore Database
1. Go to **Build > Firestore Database** and click **Create Database**.
2. Start in **Production mode** or **Test mode**.
3. Select a location closest to your users.

### Step 4: Register a Web App
1. Go to Project Settings (gear icon next to Project Overview).
2. Under "Your Apps", click the **Web** icon (`</>`).
3. Register the app (e.g. "TaskFlowApp").
4. Copy the `firebaseConfig` object variables.

### Step 5: Configure `.env.local`
1. Open the project root.
2. In the `.env.local` file, replace the placeholder values with your Firebase keys:

```env
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=taskflowapp-...
VITE_FIREBASE_PROJECT_ID=taskflowapp-...
VITE_FIREBASE_STORAGE_BUCKET=taskflowapp-...
VITE_FIREBASE_MESSAGING_SENDER_ID=8274...
VITE_FIREBASE_APP_ID=1:8274...
```

### Step 6: Deploy Firestore Rules
Navigate to the **Rules** tab in your Firebase Firestore Database console and paste the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only logged-in users can CRUD their own tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Authenticated users can write and read online presence records
    match /presence/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📦 Production Build & Deployment

To optimize the application for production:

```bash
# Build the application
npm run build
```

This compiles static assets into the `dist/` directory, ready to be hosted on platforms like Vercel, Netlify, or Firebase Hosting.

### Deploying to Vercel (CLI)
```bash
# Install vercel CLI globally if not already installed
npm install -g vercel

# Run deployment
vercel
```
Vercel will automatically detect the Vite build settings and host the application.
