import React, { useEffect, useState } from "react";
import "../styles/TaskBoard.css";
import TaskCard from "./TaskCard";
import AddTaskForm from "./AddTaskForm";
import { subscribeToTasks, addTask, updateTask, deleteTask } from "../firebase";
import { FiPlus, FiSearch, FiSliders, FiCheckSquare, FiAlertCircle, FiTrendingUp } from "react-icons/fi";

export default function TaskBoard({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showAddForm, setShowAddForm] = useState(false);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    // Real-time subscription to user tasks
    const unsubscribe = subscribeToTasks(currentUser.uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Task Handlers
  const handleAddTaskSubmit = async (taskData) => {
    try {
      await addTask(
        currentUser.uid,
        taskData.title,
        taskData.description,
        "ToDo", // initial status
        taskData.priority,
        taskData.dueDate
      );
    } catch (err) {
      console.error(err);
      setDbError("Failed to add task to database.");
      setTimeout(() => setDbError(""), 4000);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await updateTask(taskId, updates);
    } catch (err) {
      console.error(err);
      setDbError("Failed to update task.");
      setTimeout(() => setDbError(""), 4000);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error(err);
      setDbError("Failed to delete task.");
      setTimeout(() => setDbError(""), 4000);
    }
  };

  // Filter & Search Logic
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      if (sortBy === "oldest") return a.createdAt - b.createdAt;
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });

  // Columns partition
  const columns = {
    ToDo: filteredTasks.filter((t) => t.status === "ToDo" || !t.status),
    InProgress: filteredTasks.filter((t) => t.status === "InProgress"),
    Done: filteredTasks.filter((t) => t.status === "Done")
  };

  // Stats calculation
  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const overdueCount = tasks.filter((t) => {
    if (!t.dueDate || t.status === "Done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(t.dueDate) < today;
  }).length;

  return (
    <div className="container board-container">
      {/* DB Error Notification */}
      {dbError && (
        <div className="alert alert-danger fixed-top mx-auto mt-4 shadow" style={{ maxWidth: "400px", zIndex: 9999 }}>
          {dbError}
        </div>
      )}

      {/* Quick Dashboard Statistics */}
      <div className="stats-summary">
        <div className="stat-widget">
          <div className="stat-val d-flex align-items-center justify-content-center gap-2">
            <FiTrendingUp className="text-info" /> {totalCount}
          </div>
          <div className="stat-lbl">Total Tasks</div>
        </div>
        <div className="stat-widget">
          <div className="stat-val d-flex align-items-center justify-content-center gap-2">
            <FiAlertCircle className={overdueCount > 0 ? "text-danger" : "text-muted"} /> {overdueCount}
          </div>
          <div className="stat-lbl">Overdue Tasks</div>
        </div>
        <div className="stat-widget">
          <div className="stat-val d-flex align-items-center justify-content-center gap-2">
            <FiCheckSquare className="text-success" /> {doneCount}
          </div>
          <div className="stat-lbl">Completed Tasks</div>
        </div>
      </div>

      {/* Toolbar / Search & Filter Panel */}
      <div className="filter-panel">
        <div className="row g-3 align-items-center">
          {/* Search bar */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text border-end-0 filter-input text-secondary">
                <FiSearch />
              </span>
              <input
                type="text"
                className="form-control border-start-0 filter-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter options */}
          <div className="col-6 col-md-3">
            <div className="d-flex align-items-center gap-2">
              <FiSliders className="text-white opacity-75" />
              <select
                className="form-select filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort tasks"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>

          {/* Create button */}
          <div className="col-12 col-md-2 text-md-end">
            <button
              className="btn btn-primary w-100 auth-btn new-task-btn d-flex align-items-center justify-content-center gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <FiPlus /> New Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Grid */}
      {isLoading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-white">
          <div className="spinner-border mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="fw-medium">Syncing Kanban board...</p>
        </div>
      ) : (
        <div className="kanban-grid">
          {/* TO DO COLUMN */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h5 className="kanban-column-title">To Do</h5>
              <span className="column-badge">{columns.ToDo.length}</span>
            </div>
            <div className="task-list-container">
              {columns.ToDo.length === 0 ? (
                <div className="empty-state-card">
                  <span>No tasks to do.</span>
                  <button 
                    className="btn btn-sm btn-link text-white-50 text-decoration-none"
                    onClick={() => setShowAddForm(true)}
                  >
                    + Add a task
                  </button>
                </div>
              ) : (
                columns.ToDo.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </div>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h5 className="kanban-column-title">In Progress</h5>
              <span className="column-badge">{columns.InProgress.length}</span>
            </div>
            <div className="task-list-container">
              {columns.InProgress.length === 0 ? (
                <div className="empty-state-card">
                  <span>No tasks in progress.</span>
                </div>
              ) : (
                columns.InProgress.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <h5 className="kanban-column-title">Done</h5>
              <span className="column-badge">{columns.Done.length}</span>
            </div>
            <div className="task-list-container">
              {columns.Done.length === 0 ? (
                <div className="empty-state-card">
                  <span>No tasks completed.</span>
                </div>
              ) : (
                columns.Done.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showAddForm && (
        <AddTaskForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddTaskSubmit}
        />
      )}
    </div>
  );
}
