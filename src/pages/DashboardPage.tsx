import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Plus,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchTasks } from "@/services/taskService";
import { getDailyPlanner } from "@/services/aiService";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { isOverdue, formatDate } from "@/lib/utils";
import type { Task } from "@/types";
import { Modal } from "@/components/ui/Modal";

interface Stats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  overdue: number;
}

function computeStats(tasks: Task[]): Stats {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    pending: tasks.filter((t) => !t.completed).length,
    highPriority: tasks.filter((t) => t.priority === "High" && !t.completed).length,
    overdue: tasks.filter((t) => isOverdue(t.due_date, t.completed)).length,
  };
}

const statCards = [
  { key: "total", label: "Total Tasks", icon: ListTodo, color: "text-primary-400", bg: "bg-primary-600/10" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-success-400", bg: "bg-success-600/10" },
  { key: "pending", label: "Pending", icon: Clock, color: "text-warning-400", bg: "bg-warning-600/10" },
  { key: "highPriority", label: "High Priority", icon: Flame, color: "text-error-400", bg: "bg-error-600/10" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "text-error-400", bg: "bg-error-600/10" },
] as const;

export function DashboardPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [planner, setPlanner] = useState("");
  const [plannerLoading, setPlannerLoading] = useState(false);

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

  const stats = computeStats(tasks);

  const priorityData = [
    { label: "High", value: tasks.filter((t) => t.priority === "High").length, color: "#ef4444" },
    { label: "Medium", value: tasks.filter((t) => t.priority === "Medium").length, color: "#f59e0b" },
    { label: "Low", value: tasks.filter((t) => t.priority === "Low").length, color: "#22c55e" },
  ];

  const statusData = [
    { label: "Completed", value: stats.completed, color: "#22c55e" },
    { label: "Pending", value: stats.pending, color: "#f59e0b" },
  ];

  const categories = [...new Set(tasks.map((t) => t.category))];
  const categoryData = categories.map((cat, i) => ({
    label: cat,
    value: tasks.filter((t) => t.category === cat).length,
    color: ["#3b82f6", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e"][i % 6],
  }));

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const handleGeneratePlanner = async () => {
    setPlannerOpen(true);
    setPlannerLoading(true);
    setPlanner("");
    try {
      const result = await getDailyPlanner(tasks);
      setPlanner(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate planner", "error");
      setPlannerOpen(false);
    } finally {
      setPlannerLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-6">
        <p className="text-slate-400">
          Welcome back, <span className="text-white font-medium">{user?.user_metadata?.name ?? "User"}</span>
        </p>
      </div>

      {/* AI Planner CTA */}
      <div className="card p-4 mb-6 flex items-center justify-between bg-gradient-to-r from-primary-900/20 to-accent-900/20 border-primary-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Daily Planner</h3>
            <p className="text-xs text-slate-400">Generate an optimized plan for today's tasks</p>
          </div>
        </div>
        <button onClick={handleGeneratePlanner} className="btn-primary text-sm">
          Generate
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="card p-4">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stats[card.key]}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ListTodo className="w-8 h-8" />}
            title="No tasks yet"
            description="Create your first task to start tracking your productivity."
            action={
              <Link to="/tasks/new" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Task
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Completed vs Pending */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Completed vs Pending</h3>
            <DonutChart data={statusData} />
          </div>

          {/* Tasks by Priority */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Tasks by Priority</h3>
            <BarChart data={priorityData} />
          </div>

          {/* Tasks by Category */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Tasks by Category</h3>
            {categoryData.length > 0 ? (
              <BarChart data={categoryData} />
            ) : (
              <p className="text-sm text-slate-500">No categories yet</p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Tasks</h3>
          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <Link
                key={task.id}
                to="/tasks"
                className="card p-4 flex items-center justify-between hover:border-slate-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      task.priority === "High"
                        ? "bg-error-500"
                        : task.priority === "Medium"
                          ? "bg-warning-500"
                          : "bg-success-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-white">{task.title}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(task.due_date)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI Planner Modal */}
      <Modal open={plannerOpen} onClose={() => setPlannerOpen(false)} title="AI Daily Planner">
        {plannerLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3 text-accent-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Your optimized plan for today</span>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {planner}
            </pre>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
