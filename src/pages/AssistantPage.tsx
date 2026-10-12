import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send, Trash2, User, Bot } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/context/ToastContext";
import { sendChatMessage, fetchChatHistory, clearChatHistory } from "@/services/aiService";
import { formatTime } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const suggestedQuestions = [
  "How do I break down a large project into manageable tasks?",
  "What are some productivity techniques for developers?",
  "How should I prioritize tasks with conflicting deadlines?",
  "What's a good project management approach for a small team?",
];

export function AssistantPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchChatHistory();
      setMessages(data);
    } catch {
      showToast("Failed to load chat history", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await sendChatMessage(text, history);

      const assistantMsg: ChatMessage = {
        id: "temp-ai-" + Date.now(),
        role: "assistant",
        content: result,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      await loadHistory();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      showToast(err instanceof Error ? err.message : "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearChatHistory();
      setMessages([]);
      showToast("Chat history cleared", "success");
    } catch {
      showToast("Failed to clear history", "error");
    }
  };

  return (
    <DashboardLayout title="AI Assistant">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header bar */}
        <div className="card p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI TaskFlow Assistant</h3>
              <p className="text-xs text-slate-400">
                Ask about programming, productivity, task planning, or project management
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-error-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto card p-4 mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-8 h-8" />}
              title="Start a conversation"
              description="Ask me anything about programming, productivity, task planning, or project management."
            />
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-primary-600"
                        : "bg-gradient-to-br from-primary-500 to-accent-500"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary-600/20 border border-primary-600/30"
                        : "bg-slate-800 border border-slate-700"
                    }`}
                  >
                    <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5">{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                    <LoadingSpinner size="sm" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggested questions */}
        {messages.length === 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="card p-3 text-left text-sm text-slate-300 hover:border-primary-600/50 hover:text-white transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="card p-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={sending}
            className="input-field flex-1"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            className="btn-primary flex items-center gap-2 px-3"
          >
            {sending ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
