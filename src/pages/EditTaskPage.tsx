import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/context/ToastContext";
import { fetchTasks, updateTask } from "@/services/taskService";
import type { Priority } from "@/types";

export function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const tasks = await fetchTasks();
        const task = tasks.find((t) => t.id === id);
        if (!task) {
          showToast("Task not found", "error");
          navigate("/tasks");
          return;
        }
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setCategory(task.category);
        setCompleted(task.completed);
        if (task.due_date) {
          setDueDate(new Date(task.due_date).toISOString().split("T")[0]);
        }
      } catch {
        showToast("Failed to load task", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, showToast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !title.trim()) return;
    setSaving(true);
    try {
      await updateTask(id, {
        title,
        description,
        priority,
        category: category || "General",
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        completed,
      });
      showToast("Task updated successfully!", "success");
      navigate("/tasks");
    } catch {
      showToast("Failed to update task", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Task">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Task">
      <button
        onClick={() => navigate("/tasks")}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tasks
      </button>

      <div className="max-w-2xl">
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="input-field"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setCompleted(!completed)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  completed
                    ? "bg-success-600 border-success-600"
                    : "border-slate-600 hover:border-primary-500"
                }`}
              >
                {completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-slate-300">Mark as completed</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <LoadingSpinner size="sm" /> : "Save Changes"}
              </button>
              <button type="button" onClick={() => navigate("/tasks")} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
