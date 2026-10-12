import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  AlertTriangle,
  Sparkles,
  Filter,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import {
  fetchTasks,
  deleteTask,
  toggleTaskComplete,
} from "@/services/taskService";
import { getPrioritySuggestion } from "@/services/aiService";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import type { Task, TaskStatus, Priority, SortBy } from "@/types";

const priorityColors: Record<Priority, string> = {
  High: "bg-error-600/15 text-error-400 border-error-600/30",
  Medium: "bg-warning-600/15 text-warning-400 border-warning-600/30",
  Low: "bg-success-600/15 text-success-400 border-success-600/30",
};

const priorityDot: Record<Priority, string> = {
  High: "bg-error-500",
  Medium: "bg-warning-500",
  Low: "bg-success-500",
};

export function TasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("created");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch {
      showToast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const categories = useMemo(
    () => [...new Set(tasks.map((t) => t.category))].sort(),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }

    if (statusFilter === "pending") result = result.filter((t) => !t.completed);
    if (statusFilter === "completed") result = result.filter((t) => t.completed);

    if (priorityFilter !== "all")
      result = result.filter((t) => t.priority === priorityFilter);

    if (categoryFilter !== "all")
      result = result.filter((t) => t.category === categoryFilter);

    if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    } else if (sortBy === "priority") {
      const order: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
      result.sort((a, b) => order[a.priority] - order[b.priority]);
    } else {
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return result;
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleTaskComplete(id, !completed);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
      showToast(completed ? "Task marked as pending" : "Task completed!", "success");
    } catch {
      showToast("Failed to update task", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTask(deleteId);
      setTasks((prev) => prev.filter((t) => t.id !== deleteId));
      showToast("Task deleted", "success");
      setDeleteId(null);
    } catch {
      showToast("Failed to delete task", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleAIPriority = async (task: Task) => {
    try {
      showToast("Getting AI priority suggestion...", "info");
      const result = await getPrioritySuggestion({
        title: task.title,
        description: task.description,
        dueDate: task.due_date ?? undefined,
      });
      const suggestion = result.trim() as Priority;
      if (["Low", "Medium", "High"].includes(suggestion)) {
        showToast(`AI suggests: ${suggestion} priority`, "success");
      } else {
        showToast(`AI suggestion: ${result}`, "info");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "AI request failed", "error");
    }
  };

  return (
    <DashboardLayout title="Tasks">
      {/* Search + Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="input-field pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
              className="input-field py-2 text-sm w-auto"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
              className="input-field py-2 text-sm w-auto"
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field py-2 text-sm w-auto"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="input-field py-2 text-sm w-auto"
            >
              <option value="created">Newest First</option>
              <option value="dueDate">By Due Date</option>
              <option value="priority">By Priority</option>
            </select>

            <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
              <Filter className="w-4 h-4" />
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ListTodo className="w-8 h-8" />}
            title={tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
            description={
              tasks.length === 0
                ? "Create your first task to get started."
                : "Try adjusting your search or filters."
            }
            action={
              tasks.length === 0 ? (
                <Link to="/tasks/new" className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Task
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.due_date, task.completed);
            return (
              <div
                key={task.id}
                className={cn(
                  "card p-4 flex items-start gap-3 transition-all hover:border-slate-600",
                  task.completed && "opacity-60",
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(task.id, task.completed)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-success-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-primary-500 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={cn(
                        "text-sm font-medium text-white",
                        task.completed && "line-through text-slate-500",
                      )}
                    >
                      {task.title}
                    </h3>
                    <span className={cn("badge border", priorityColors[task.priority])}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", priorityDot[task.priority])} />
                      {task.priority}
                    </span>
                    <span className="badge bg-slate-700/50 text-slate-300 border border-slate-600/30">
                      {task.category}
                    </span>
                    {overdue && (
                      <span className="badge bg-error-600/15 text-error-400 border border-error-600/30">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(task.due_date)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleAIPriority(task)}
                    className="p-2 text-slate-400 hover:text-accent-400 transition-colors"
                    title="AI Priority Suggestion"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/tasks/${task.id}/edit`}
                    className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(task.id)}
                    className="p-2 text-slate-400 hover:text-error-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Task">
        <p className="text-sm text-slate-300 mb-4">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-2">
            {deleting ? <LoadingSpinner size="sm" /> : "Delete"}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
