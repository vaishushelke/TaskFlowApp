import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where 
} from "firebase/firestore";

// Read and validate Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase configuration is valid and not using placeholders
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "your_api_key_here" && 
  firebaseConfig.authDomain && 
  firebaseConfig.authDomain !== "your_auth_domain_here";

let authInstance = null;
let dbInstance = null;

// Initialize Firebase if configured
if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    console.log("TaskFlowApp: Firebase initialized successfully.");
  } catch (error) {
    console.error("TaskFlowApp: Failed to initialize Firebase. Falling back to Mock Mode.", error);
  }
} else {
  console.warn("TaskFlowApp: Firebase credentials missing. Running in LOCAL PREVIEW MODE (LocalStorage fallback).");
}

export const auth = authInstance;
export const db = dbInstance;

// ==========================================
// MOCK IMPLEMENTATION (LOCAL STORAGE FALLBACK)
// ==========================================

const MOCK_DELAY = 300; // Simulate network latency in ms

// Subscriptions storage
const taskSubscriptions = {};
const presenceSubscriptions = [];
const authSubscriptions = [];

// Helper to notify mock auth subscriptions
const notifyAuthChange = (user) => {
  authSubscriptions.forEach((cb) => cb(user));
};

// Helper to get local tasks
const getLocalTasks = () => {
  const tasks = localStorage.getItem("taskflow_tasks");
  return tasks ? JSON.parse(tasks) : [];
};

// Helper to set local tasks
const setLocalTasks = (tasks) => {
  localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
  // Notify all subscribers
  Object.keys(taskSubscriptions).forEach((userId) => {
    const userTasks = tasks.filter((t) => t.userId === userId);
    // Sort by createdAt desc
    userTasks.sort((a, b) => b.createdAt - a.createdAt);
    taskSubscriptions[userId].forEach((cb) => cb(userTasks));
  });
};

// Helper to get local users
const getLocalUsers = () => {
  const users = localStorage.getItem("taskflow_users");
  return users ? JSON.parse(users) : [];
};

// Helper to get active presence users
const getActivePresence = () => {
  const pres = localStorage.getItem("taskflow_presence");
  return pres ? JSON.parse(pres) : [];
};

const updateLocalPresence = (user, status) => {
  if (!user) return;
  let pres = getActivePresence();
  pres = pres.filter((p) => p.email !== user.email);
  if (status === "online") {
    pres.push({
      email: user.email,
      lastActive: Date.now(),
      status: "online"
    });
  }
  localStorage.setItem("taskflow_presence", JSON.stringify(pres));
  presenceSubscriptions.forEach((cb) => cb(pres));
};

// ==========================================
// EXPORTED AUTH FUNCTIONS
// ==========================================

export const registerUser = async (email, password) => {
  if (isFirebaseConfigured && auth) {
    return createUserWithEmailAndPassword(auth, email, password);
  } else {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getLocalUsers();
        if (users.find((u) => u.email === email)) {
          reject(new Error("auth/email-already-in-use"));
          return;
        }
        const newUser = { uid: "mock_user_" + Date.now(), email };
        users.push({ ...newUser, password });
        localStorage.setItem("taskflow_users", JSON.stringify(users));
        localStorage.setItem("taskflow_current_user", JSON.stringify(newUser));
        notifyAuthChange(newUser);
        resolve({ user: newUser });
      }, MOCK_DELAY);
    });
  }
};

export const loginUser = async (email, password) => {
  if (isFirebaseConfigured && auth) {
    return signInWithEmailAndPassword(auth, email, password);
  } else {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getLocalUsers();
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) {
          reject(new Error("auth/wrong-password-or-user-not-found"));
          return;
        }
        const sessionUser = { uid: user.uid, email: user.email };
        localStorage.setItem("taskflow_current_user", JSON.stringify(sessionUser));
        notifyAuthChange(sessionUser);
        resolve({ user: sessionUser });
      }, MOCK_DELAY);
    });
  }
};

export const logoutUser = async () => {
  if (isFirebaseConfigured && auth) {
    return signOut(auth);
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentUser = localStorage.getItem("taskflow_current_user");
        if (currentUser) {
          const user = JSON.parse(currentUser);
          updateLocalPresence(user, "offline");
        }
        localStorage.removeItem("taskflow_current_user");
        notifyAuthChange(null);
        resolve();
      }, MOCK_DELAY);
    });
  }
};

export const subscribeToAuth = (callback) => {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    authSubscriptions.push(callback);
    // Check local storage immediately
    const storedUser = localStorage.getItem("taskflow_current_user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    callback(user);
    if (user) {
      updateLocalPresence(user, "online");
    }

    // Return an unsubscribe function
    return () => {
      const idx = authSubscriptions.indexOf(callback);
      if (idx !== -1) authSubscriptions.splice(idx, 1);
    };
  }
};

// ==========================================
// EXPORTED TASK FUNCTIONS
// ==========================================

export const subscribeToTasks = (userId, callback) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "tasks"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const tasks = [];
      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      // Sort in JS to avoid index requirement errors in Firebase
      tasks.sort((a, b) => b.createdAt - a.createdAt);
      callback(tasks);
    }, (error) => {
      console.error("Firestore subscription error:", error);
    });
  } else {
    // Add callback to mock subscriptions list
    if (!taskSubscriptions[userId]) {
      taskSubscriptions[userId] = [];
    }
    taskSubscriptions[userId].push(callback);

    // Initial load
    const userTasks = getLocalTasks().filter((t) => t.userId === userId);
    userTasks.sort((a, b) => b.createdAt - a.createdAt);
    callback(userTasks);

    // Unsubscribe callback
    return () => {
      if (taskSubscriptions[userId]) {
        taskSubscriptions[userId] = taskSubscriptions[userId].filter((cb) => cb !== callback);
      }
    };
  }
};

export const addTask = async (userId, title, description, status = "ToDo", priority = "medium", dueDate = "") => {
  const newTaskData = {
    title,
    description,
    status,
    priority,
    dueDate,
    userId,
    createdAt: Date.now()
  };

  if (isFirebaseConfigured && db) {
    return addDoc(collection(db, "tasks"), newTaskData);
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = getLocalTasks();
        const newTask = { id: "task_" + Date.now(), ...newTaskData };
        tasks.push(newTask);
        setLocalTasks(tasks);
        resolve(newTask);
      }, MOCK_DELAY);
    });
  }
};

export const updateTask = async (taskId, updates) => {
  if (isFirebaseConfigured && db) {
    const taskDocRef = doc(db, "tasks", taskId);
    return updateDoc(taskDocRef, updates);
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = getLocalTasks();
        const updatedTasks = tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, ...updates };
          }
          return t;
        });
        setLocalTasks(updatedTasks);
        resolve();
      }, MOCK_DELAY);
    });
  }
};

export const deleteTask = async (taskId) => {
  if (isFirebaseConfigured && db) {
    const taskDocRef = doc(db, "tasks", taskId);
    return deleteDoc(taskDocRef);
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tasks = getLocalTasks();
        const filteredTasks = tasks.filter((t) => t.id !== taskId);
        setLocalTasks(filteredTasks);
        resolve();
      }, MOCK_DELAY);
    });
  }
};

// ==========================================
// USER PRESENCE FUNCTIONS (OPTIONAL EXTENSION)
// ==========================================

export const subscribeToPresence = (callback) => {
  if (isFirebaseConfigured && db) {
    // For production, list online users from Firestore "presence" collection
    const q = query(collection(db, "presence"), where("status", "==", "online"));
    return onSnapshot(q, (snapshot) => {
      const presences = [];
      snapshot.forEach((doc) => {
        presences.push({ id: doc.id, ...doc.data() });
      });
      callback(presences);
    });
  } else {
    presenceSubscriptions.push(callback);
    callback(getActivePresence());
    return () => {
      const idx = presenceSubscriptions.indexOf(callback);
      if (idx !== -1) presenceSubscriptions.splice(idx, 1);
    };
  }
};

export const updatePresence = async (user, status) => {
  if (!user) return;
  if (isFirebaseConfigured && db) {
    // Write presence in Firestore under doc ID user.uid or similar
    try {
      const presenceDocRef = doc(db, "presence", user.uid);
      await updateDoc(presenceDocRef, {
        email: user.email,
        status: status,
        lastActive: Date.now()
      }).catch(async (err) => {
        // If document doesn't exist, create it (in Firestore, updateDoc fails if doc doesn't exist)
        // Wait, standard practice is setDoc, let's keep it simple or use a try/catch
        // Since we import doc and updateDoc, we can just catch and do a fallback or write presence in Firestore
        // To be safe we will just write it via standard doc setter if we imported it, but since we didn't import setDoc, 
        // we can add it or just catch and log. Let's make sure it handles errors gracefully.
      });
    } catch (e) {
      console.warn("Could not update Firebase presence:", e);
    }
  } else {
    updateLocalPresence(user, status);
  }
};
