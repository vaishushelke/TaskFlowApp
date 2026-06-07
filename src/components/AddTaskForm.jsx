import React, { useState } from "react";
import "../styles/AddTaskForm.css";
import { FiX, FiCheck, FiAlertCircle } from "react-icons/fi";

export default function AddTaskForm({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (title.length > 80) {
      setError("Task title cannot exceed 80 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-task-modal-overlay" onClick={onClose}>
      <div 
        className="add-task-card" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="add-task-title m-0">Create New Task</h4>
          <button 
            className="btn btn-link text-secondary p-1 border-0" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
            <FiAlertCircle className="flex-shrink-0" />
            <div style={{ fontSize: "0.9rem" }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-3">
            <label htmlFor="task-title" className="form-label fw-semibold text-secondary small">
              Task Title *
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              id="task-title"
              placeholder="e.g., Design Landing Page"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label htmlFor="task-desc" className="form-label fw-semibold text-secondary small">
              Description
            </label>
            <textarea
              className="form-control"
              id="task-desc"
              rows="3"
              placeholder="Provide a detailed description of the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            ></textarea>
          </div>

          {/* Priority */}
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">
              Priority Level
            </label>
            <div className="priority-selector">
              <button
                type="button"
                className={`priority-btn low ${priority === "low" ? "active" : ""}`}
                onClick={() => setPriority("low")}
                disabled={isSubmitting}
              >
                Low
              </button>
              <button
                type="button"
                className={`priority-btn medium ${priority === "medium" ? "active" : ""}`}
                onClick={() => setPriority("medium")}
                disabled={isSubmitting}
              >
                Medium
              </button>
              <button
                type="button"
                className={`priority-btn high ${priority === "high" ? "active" : ""}`}
                onClick={() => setPriority("high")}
                disabled={isSubmitting}
              >
                High
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div className="mb-4">
            <label htmlFor="task-date" className="form-label fw-semibold text-secondary small">
              Due Date
            </label>
            <input
              type="date"
              className="form-control"
              id="task-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="d-flex align-items-center justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light px-4 py-2"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ borderRadius: "10px", fontWeight: "600" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary px-4 py-2 auth-btn text-white d-flex align-items-center gap-2"
              disabled={isSubmitting}
              style={{ minWidth: "120px", justifyContent: "center" }}
            >
              {isSubmitting ? (
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <>
                  <FiCheck /> Save Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
