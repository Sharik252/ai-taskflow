import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Lightbulb, ListTree } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/context/ToastContext";
import { createTask } from "@/services/taskService";
import { getTaskBreakdown, improveTask } from "@/services/aiService";
import type { Priority } from "@/types";

export function CreateTaskPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<"breakdown" | "improve" | null>(null);
  const [breakdown, setBreakdown] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Task title is required", "error");
      return;
    }
    setLoading(true);
    try {
      await createTask({
        title,
        description,
        priority,
        category: category || "General",
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      showToast("Task created successfully!", "success");
      navigate("/tasks");
    } catch {
      showToast("Failed to create task", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdown = async () => {
    if (!title.trim()) {
      showToast("Enter a task title first", "info");
      return;
    }
    setAiLoading("breakdown");
    setBreakdown("");
    try {
      const result = await getTaskBreakdown(title);
      setBreakdown(result);
      showToast("AI breakdown generated!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "AI request failed", "error");
    } finally {
      setAiLoading(null);
    }
  };

  const handleImprove = async () => {
    if (!title.trim()) {
      showToast("Enter a task title first", "info");
      return;
    }
    setAiLoading("improve");
    try {
      const result = await improveTask(title);
      setTitle(result);
      showToast("Task title improved by AI!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "AI request failed", "error");
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <DashboardLayout title="Create Task">
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
            {/* Title with AI actions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-300">Task Title</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleImprove}
                    disabled={!!aiLoading}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-accent-400 hover:bg-accent-600/10 rounded transition-colors"
                  >
                    {aiLoading === "improve" ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Lightbulb className="w-3.5 h-3.5" />
                    )}
                    AI Improve
                  </button>
                  <button
                    type="button"
                    onClick={handleBreakdown}
                    disabled={!!aiLoading}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary-400 hover:bg-primary-600/10 rounded transition-colors"
                  >
                    {aiLoading === "breakdown" ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <ListTree className="w-3.5 h-3.5" />
                    )}
                    AI Breakdown
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Build a portfolio website"
                className="input-field"
                required
              />
            </div>

            {/* AI Breakdown Result */}
            {breakdown && (
              <div className="rounded-lg bg-primary-600/10 border border-primary-600/20 p-4">
                <div className="flex items-center gap-2 mb-2 text-primary-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">AI Task Breakdown</span>
                </div>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {breakdown}
                </pre>
                <button
                  type="button"
                  onClick={() => setBreakdown("")}
                  className="text-xs text-slate-500 hover:text-slate-300 mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this task..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Priority + Category */}
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
                  placeholder="e.g., Work, Personal"
                  className="input-field"
                />
              </div>
            </div>

            {/* Due Date */}
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

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <LoadingSpinner size="sm" /> : "Create Task"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/tasks")}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
