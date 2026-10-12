import { Link } from "react-router-dom";
import {
  CheckSquare,
  Sparkles,
  ListTodo,
  LayoutDashboard,
  TrendingUp,
  Brain,
  ArrowRight,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AI TaskFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/30 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-800/60 border border-slate-700 rounded-full text-sm text-slate-300 mb-6">
            <Sparkles className="w-4 h-4 text-accent-400" />
            AI-Powered Task Management
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto mb-6">
            Manage tasks smarter with{" "}
            <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              AI by your side
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Create, organize, and track your tasks while AI helps you break down complex work,
            prioritize intelligently, and plan your day for maximum productivity.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all hover:scale-105"
            >
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: ListTodo,
              title: "Smart Task Management",
              desc: "Create, edit, search, filter, and sort tasks by priority, category, status, and due date.",
              color: "text-primary-400",
            },
            {
              icon: Brain,
              title: "AI Task Breakdown",
              desc: "Enter a complex task and AI generates a step-by-step breakdown to get you started.",
              color: "text-accent-400",
            },
            {
              icon: TrendingUp,
              title: "AI Priority Suggestions",
              desc: "AI analyzes urgency, complexity, and due dates to suggest the right priority level.",
              color: "text-success-400",
            },
            {
              icon: LayoutDashboard,
              title: "Productivity Dashboard",
              desc: "Track progress with stats, charts, and insights into your task completion patterns.",
              color: "text-warning-400",
            },
            {
              icon: Sparkles,
              title: "AI Daily Planner",
              desc: "Generate an optimized daily schedule based on your pending tasks and priorities.",
              color: "text-primary-400",
            },
            {
              icon: Brain,
              title: "AI Chat Assistant",
              desc: "Ask questions about programming, productivity, and project management anytime.",
              color: "text-accent-400",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="card p-6 hover:border-slate-600 transition-all hover:scale-[1.02]"
              >
                <div className={`w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="card p-12 bg-gradient-to-br from-slate-800/80 to-slate-900/80">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to boost your productivity?
          </h2>
          <p className="text-slate-400 mb-8">
            Join AI TaskFlow and let AI help you work smarter, not harder.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all hover:scale-105"
          >
            Create Your Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <CheckSquare className="w-5 h-5" />
            <span className="text-sm">AI TaskFlow</span>
          </div>
          <p className="text-sm text-slate-500">Smart task management powered by AI</p>
        </div>
      </footer>
    </div>
  );
}
