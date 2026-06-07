import React, { useState, useEffect } from "react";
import "./App.css";
import TaskBoard from "./components/TaskBoard";
import UserPresence from "./components/UserPresence";
import { 
  subscribeToAuth, 
  loginUser, 
  registerUser, 
  logoutUser, 
  updatePresence,
  isFirebaseConfigured 
} from "./firebase";
import { FiMail, FiLock, FiLogOut, FiUser, FiInfo, FiActivity, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      if (user) {
        updatePresence(user, "online");
      }
    });

    // Handle user going offline before closing tab/window
    const handleBeforeUnload = () => {
      if (currentUser) {
        updatePresence(currentUser, "offline");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUser]);

  // Submit Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    // Simple Form Validations
    if (!email.trim() || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (isLoginView) {
        await loginUser(email.trim(), password);
        showToast("Logged in successfully!", "success");
      } else {
        await registerUser(email.trim(), password);
        showToast("Registration successful! Welcome to TaskFlowApp.", "success");
      }
      // Clear forms
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      if (err.message.includes("auth/wrong-password") || err.message.includes("user-not-found") || err.message.includes("wrong-password-or-user-not-found")) {
        setAuthError("Invalid email or password.");
      } else if (err.message.includes("auth/email-already-in-use")) {
        setAuthError("This email is already in use.");
      } else if (err.message.includes("auth/invalid-email")) {
        setAuthError("Invalid email format.");
      } else {
        setAuthError("Authentication failed. Please try again.");
      }
      showToast("Authentication failed.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast("Logged out successfully.", "success");
    } catch (err) {
      console.error("Logout error:", err);
      showToast("Logout failed.", "danger");
    }
  };

  if (authLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-white">
        <div className="spinner-border mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="fw-semibold">Loading TaskFlow...</h5>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      {currentUser ? (
        // ==========================================
        // MAIN APPLICATION VIEW (LOGGED IN)
        // ==========================================
        <>
          <nav className="navbar navbar-expand navbar-dark app-navbar py-3 sticky-top">
            <div className="container align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="navbar-logo navbar-logo-icon" aria-label="TaskFlow logo">
                  <FiActivity size={24} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="navbar-brand m-0">⚡ TaskFlow</span>
                    {!isFirebaseConfigured && (
                      <span className="preview-badge" title="Configure .env.local file to sync across devices">
                        Local Preview
                      </span>
                    )}
                  </div>
                  <div className="navbar-tagline d-none d-md-block">
                    Bold workflow control with modern insights
                  </div>
                </div>
              </div>

              <div className="navbar-links d-none d-lg-flex align-items-center gap-2 mx-4">
                <span className="nav-chip">🚀 Live</span>
                <span className="nav-chip">📊 Insights</span>
                <span className="nav-chip">✨ Focus</span>
              </div>

              <div className="d-flex align-items-center ms-auto gap-3">
                <UserPresence currentUser={currentUser} />

                <div className="d-none d-md-flex align-items-center gap-2 me-3 text-light opacity-90">
                  <FiUser className="text-info" />
                  <span className="small fw-medium">{currentUser.email}</span>
                </div>

                <button 
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 px-3 py-2"
                  style={{ borderRadius: "10px", fontWeight: "700" }}
                  onClick={handleLogout}
                >
                  <FiLogOut /> <span className="d-none d-sm-inline">Log Out</span>
                </button>
              </div>
            </div>
          </nav>

          <main className="flex-grow-1">
            <TaskBoard currentUser={currentUser} />
          </main>
        </>
      ) : (
        // ==========================================
        // AUTHENTICATION SCREEN (LOGGED OUT)
        // ==========================================
        <div className="auth-container">
          {/* Tailwind-style floating animated backgrounds */}
          <div className="auth-background-decor">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>

          <div className="auth-split-wrapper">
            {/* Left Brand Column */}
            <div className="auth-brand-col">
              <div className="brand-badge">PRODUCTIVITY HUB</div>
              <h2 className="brand-heading">Streamline your workflow with TaskFlow</h2>
              <p className="brand-text">
                Organize tasks, manage your schedule, and track progress with our beautiful real-time Kanban board.
              </p>
              
              <div className="feature-cards-container">
                <div className="feature-mini-card">
                  <div className="feature-icon-wrapper">⚡</div>
                  <div>
                    <div className="feature-mini-title">Real-time Cloud Sync</div>
                    <div className="feature-mini-desc">Sync tasks instantly across all devices and browser tabs using Firebase Firestore.</div>
                  </div>
                </div>
                <div className="feature-mini-card">
                  <div className="feature-icon-wrapper">🎨</div>
                  <div>
                    <div className="feature-mini-title">Rich Glassmorphism UI</div>
                    <div className="feature-mini-desc">Beautiful purple/blue gradients with smooth animations, priority badges, and search filters.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="auth-form-col">
              <div className="auth-card text-center">
                <div className="mb-4">
                  <h1 className="auth-logo">TaskFlowApp</h1>
                  <p className="auth-subtitle">
                    {isLoginView ? "Sign in to manage your tasks" : "Create an account to get started"}
                  </p>
                </div>

                {/* Local mode helper message banner */}
                {!isFirebaseConfigured && (
                  <div 
                    className="d-flex align-items-center gap-2 p-2 mb-3 rounded"
                    style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", textAlign: "left" }}
                  >
                    <FiInfo className="text-warning flex-shrink-0" />
                    <span style={{ fontSize: "0.75rem", color: "#92400e" }}>
                      <strong>Demo Mode</strong>: Firebase config is missing. Registration will run locally and store in browser cache.
                    </span>
                  </div>
                )}

                {authError && (
                  <div className="alert alert-danger py-2 mb-3 text-start" style={{ fontSize: "0.85rem" }} role="alert">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit}>
                  {/* Email Input */}
                  <div className="text-start mb-3">
                    <label className="form-label small fw-semibold text-secondary">Email address</label>
                    <div className="auth-input-group">
                      <input
                        type="email"
                        className="auth-input"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={submitting}
                      />
                      <div className="auth-input-icon">
                        <FiMail size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="text-start mb-4">
                    <label className="form-label small fw-semibold text-secondary">Password</label>
                    <div className="auth-input-group">
                      <input
                        type="password"
                        className="auth-input"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={submitting}
                      />
                      <div className="auth-input-icon">
                        <FiLock size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    type="submit" 
                    className="auth-btn text-white mb-3"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    {isLoginView ? "Log In" : "Register"}
                  </button>
                </form>

                {/* Toggle Login/Register Link */}
                <div className="auth-switch-text mt-3">
                  {isLoginView ? "Don't have an account? " : "Already have an account? "}
                  <span 
                    className="auth-switch-link"
                    onClick={() => {
                      setIsLoginView(!isLoginView);
                      setAuthError("");
                    }}
                  >
                    {isLoginView ? "Register here" : "Login here"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Notification */}
      {toast && (
        <div className={`app-toast toast-${toast.type}`} role="alert">
          {toast.type === "success" ? (
            <FiCheckCircle size={20} className="text-success" />
          ) : (
            <FiAlertCircle size={20} className="text-danger" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
