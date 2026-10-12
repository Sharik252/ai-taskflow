export type Priority = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  category: string;
  due_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  category?: string;
  due_date?: string | null;
  completed?: boolean;
}

export type TaskStatus = "all" | "pending" | "completed";
export type SortBy = "dueDate" | "priority" | "created";
export type SortOrder = "asc" | "desc";
