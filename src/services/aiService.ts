import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

async function callAI(body: Record<string, unknown>): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? `Request failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  if (!data.result) throw new Error("Invalid response from AI service");
  return data.result as string;
}

export async function getTaskBreakdown(taskTitle: string): Promise<string> {
  return callAI({ action: "breakdown", input: taskTitle });
}

export async function getPrioritySuggestion(task: {
  title: string;
  description?: string;
  dueDate?: string;
}): Promise<string> {
  return callAI({ action: "priority", input: task.title });
}

export async function getDailyPlanner(
  tasks: Array<{
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    completed?: boolean;
    category?: string;
  }>,
): Promise<string> {
  const pendingTasks = tasks.filter((t) => !t.completed);
  return callAI({ action: "planner", tasks: pendingTasks });
}

export async function improveTask(taskTitle: string): Promise<string> {
  return callAI({ action: "improve", input: taskTitle });
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: string; content: string }>,
): Promise<string> {
  return callAI({ action: "chat", message, history });
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as ChatMessage[];
}

export async function clearChatHistory(): Promise<void> {
  const { error } = await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}
