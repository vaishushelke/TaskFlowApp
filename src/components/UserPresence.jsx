import React, { useEffect, useState } from "react";
import { subscribeToPresence, isFirebaseConfigured } from "../firebase";
import { FiUsers, FiUser, FiActivity } from "react-icons/fi";

export default function UserPresence({ currentUser }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to real-time user presence updates
    const unsubscribe = subscribeToPresence((presenceList) => {
      // De-duplicate presence users by email
      const uniqueUsers = {};
      presenceList.forEach((user) => {
        if (user.email) {
          uniqueUsers[user.email] = user;
        }
      });
      setOnlineUsers(Object.values(uniqueUsers));
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="position-relative me-3">
      <button
        className="btn btn-outline-light d-flex align-items-center gap-2 px-3 py-2 border-0 glass-panel"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          color: "rgba(255, 255, 255, 0.9)",
          fontSize: "0.9rem"
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Active Users"
      >
        <FiUsers />
        <span className="badge rounded-pill bg-success" style={{ fontSize: "0.75rem" }}>
          {onlineUsers.length || 1}
        </span>
      </button>

      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 p-3 shadow-lg border-0 text-dark"
          style={{
            width: "280px",
            background: "rgba(255, 255, 255, 0.98)",
            borderRadius: "14px",
            zIndex: 1050,
            animation: "fadeIn 0.2s ease-out",
            border: "1px solid rgba(0, 0, 0, 0.05)"
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
            <h6 className="m-0 fw-bold d-flex align-items-center gap-2" style={{ color: "#764ba2" }}>
              <FiActivity className="text-success" /> Active Sessions
            </h6>
            <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
              {isFirebaseConfigured ? "Firestore Sync" : "Local Preview"}
            </span>
          </div>

          <div
            className="overflow-auto"
            style={{ maxHeight: "200px", scrollbarWidth: "thin" }}
          >
            {onlineUsers.length === 0 ? (
              <div className="d-flex align-items-center gap-2 py-2">
                <div
                  className="bg-success rounded-circle"
                  style={{ width: "8px", height: "8px" }}
                ></div>
                <span className="small text-truncate fw-medium">
                  {currentUser.email} (You)
                </span>
              </div>
            ) : (
              onlineUsers.map((user, idx) => (
                <div
                  key={idx}
                  className="d-flex align-items-center justify-content-between py-2 border-bottom border-light"
                >
                  <div className="d-flex align-items-center gap-2 text-truncate">
                    <FiUser className="text-secondary" />
                    <span
                      className={`small text-truncate ${
                        user.email === currentUser.email ? "fw-bold text-primary" : ""
                      }`}
                    >
                      {user.email}
                      {user.email === currentUser.email && " (You)"}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className="bg-success rounded-circle"
                      style={{
                        width: "8px",
                        height: "8px",
                        boxShadow: "0 0 8px rgba(40, 167, 69, 0.6)"
                      }}
                    ></span>
                    <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                      online
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
