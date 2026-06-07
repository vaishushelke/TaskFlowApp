import React, { useState } from "react";
import "../styles/TaskCard.css";
import { 
  FiEdit3, 
  FiTrash2, 
  FiChevronLeft, 
  FiChevronRight, 
  FiCalendar, 
  FiCheck, 
  FiX, 
  FiAlertTriangle 
} from "react-icons/fi";

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || "");
  const [editPriority, setEditPriority] = useState(task.priority || "medium");
  const [editDueDate, setEditDueDate] = useState(task.dueDate || "");
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    setError("");
    try {
      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        dueDate: editDueDate
      });
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update.");
    }
  };

  const handleStatusChange = (newStatus) => {
    onUpdate(task.id, { status: newStatus });
  };

  const shiftStatus = (direction) => {
    const statuses = ["ToDo", "InProgress", "Done"];
    const currentIndex = statuses.indexOf(task.status);
    if (direction === "left" && currentIndex > 0) {
      handleStatusChange(statuses[currentIndex - 1]);
    } else if (direction === "right" && currentIndex < statuses.length - 1) {
      handleStatusChange(statuses[currentIndex + 1]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const options = { month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const isOverdue = (dateStr) => {
    if (!dateStr || task.status === "Done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dateStr);
    return dueDateObj < today;
  };

  return (
    <div className={`task-card priority-${task.priority || "medium"}`}>
      {isEditing ? (
        // EDIT MODE
        <div>
          {error && <div className="text-danger small mb-1">{error}</div>}
          <input
            type="text"
            className="task-edit-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
          />
          <textarea
            className="task-edit-textarea"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Task description"
            rows="2"
          />
          <div className="d-flex gap-2 mb-2">
            <select
              className="form-select form-select-sm"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              className="form-control form-control-sm"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
          </div>
          <div className="d-flex justify-content-end gap-1">
            <button className="task-card-action-btn edit" onClick={handleSave} title="Save">
              <FiCheck size={16} />
            </button>
            <button className="task-card-action-btn delete" onClick={() => setIsEditing(false)} title="Cancel">
              <FiX size={16} />
            </button>
          </div>
        </div>
      ) : isDeleting ? (
        // DELETE CONFIRMATION STATE (Saves user from boring prompts)
        <div className="text-center py-2 animate-fade-in">
          <FiAlertTriangle className="text-danger mb-2" size={24} />
          <p className="small mb-2 fw-medium text-dark">Delete this task permanently?</p>
          <div className="d-flex justify-content-center gap-2">
            <button 
              className="btn btn-danger btn-sm px-3" 
              onClick={() => onDelete(task.id)}
              style={{ borderRadius: "6px" }}
            >
              Yes, Delete
            </button>
            <button 
              className="btn btn-light btn-sm px-3" 
              onClick={() => setIsDeleting(false)}
              style={{ borderRadius: "6px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // READ-ONLY VIEW MODE
        <>
          <div className="d-flex justify-content-between align-items-start gap-2">
            <h5 className="task-card-title">{task.title}</h5>
            <div className="task-card-actions">
              <button 
                className="task-card-action-btn edit" 
                onClick={() => setIsEditing(true)}
                title="Edit task"
              >
                <FiEdit3 size={14} />
              </button>
              <button 
                className="task-card-action-btn delete" 
                onClick={() => setIsDeleting(true)}
                title="Delete task"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>

          {task.description && (
            <div>
              <p className={`task-card-desc ${isExpanded ? "expanded" : ""}`}>
                {task.description}
              </p>
              {task.description.length > 80 && (
                <button
                  className="btn btn-link p-0 text-decoration-none small text-primary mb-2"
                  style={{ fontSize: "0.75rem", border: "none", outline: "none" }}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          )}

          <div className="task-card-meta">
            {/* Left and Right Shifts */}
            <div className="d-flex align-items-center gap-1">
              {task.status !== "ToDo" && (
                <button
                  className="task-card-action-btn p-1"
                  onClick={() => shiftStatus("left")}
                  title="Move left"
                >
                  <FiChevronLeft size={16} />
                </button>
              )}
              
              <span className={`task-priority-badge ${task.priority || "medium"}`}>
                {task.priority || "medium"}
              </span>

              {task.status !== "Done" && (
                <button
                  className="task-card-action-btn p-1"
                  onClick={() => shiftStatus("right")}
                  title="Move right"
                >
                  <FiChevronRight size={16} />
                </button>
              )}
            </div>

            {/* Due Date Indicator */}
            {task.dueDate && (
              <span 
                className={`task-date-badge ${isOverdue(task.dueDate) ? "text-danger fw-semibold" : ""}`}
                title={isOverdue(task.dueDate) ? "Overdue task!" : "Due date"}
              >
                <FiCalendar />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
