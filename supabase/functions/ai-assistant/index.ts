import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

type ChatMessage = { role: string; content: string };

interface RequestBody {
  action: "breakdown" | "priority" | "planner" | "improve" | "chat";
  input?: string;
  tasks?: Array<{
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    completed?: boolean;
    category?: string;
  }>;
  history?: ChatMessage[];
  message?: string;
}

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("AI_API_KEY_NOT_CONFIGURED");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI request failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");
  return content;
}

function buildBreakdownMessages(taskTitle: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a project planning assistant. Break down the given task into clear, actionable numbered steps. Return only the numbered list, no preamble or postamble. Keep each step concise and practical.",
    },
    {
      role: "user",
      content: `Break down this task into actionable steps:\n\n${taskTitle}`,
    },
  ];
}

function buildPriorityMessages(task: {
  title: string;
  description?: string;
  dueDate?: string;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        'You are a task prioritization assistant. Analyze the task\'s urgency, complexity, due date, and description. Respond with exactly one word: "Low", "Medium", or "High". No other text.',
    },
    {
      role: "user",
      content: `Task title: ${task.title}\nDescription: ${task.description || "N/A"}\nDue date: ${task.dueDate || "No due date"}\n\nWhat priority should this task be?`,
    },
  ];
}

function buildPlannerMessages(tasks: RequestBody["tasks"]): ChatMessage[] {
  const taskList = (tasks || [])
    .map(
      (t) =>
        `- ${t.title}${t.dueDate ? ` (due: ${t.dueDate})` : ""}${
          t.priority ? ` [${t.priority} priority]` : ""
        }${t.category ? ` (${t.category})` : ""}`,
    )
    .join("\n");

  return [
    {
      role: "system",
      content:
        "You are a daily planning assistant. Given a list of pending tasks, create a structured daily plan with time slots. Format each line as 'HH:MM - Task description'. Consider priority and due dates. Return only the schedule lines, no extra text.",
    },
    {
      role: "user",
      content: `Create a daily plan for these pending tasks:\n\n${taskList}`,
    },
  ];
}

function buildImproveMessages(taskTitle: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a task writing assistant. Improve the given vague task into a clear, specific, actionable task description. Return only the improved task text, no explanation.",
    },
    {
      role: "user",
      content: `Improve this task:\n\n${taskTitle}`,
    },
  ];
}

function buildChatMessages(history: ChatMessage[], message: string): ChatMessage[] {
  const systemMsg: ChatMessage = {
    role: "system",
    content:
      "You are AI TaskFlow Assistant, a helpful AI assistant specialized in programming, productivity, task planning, and project management. Provide clear, actionable, and concise answers. When relevant, suggest breaking down complex tasks.",
  };
  return [systemMsg, ...history, { role: "user", content: message }];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { action } = body;

    let result: string;
    let shouldSaveChat = false;

    switch (action) {
      case "breakdown":
        result = await callOpenAI(buildBreakdownMessages(body.input ?? ""));
        break;
      case "priority":
        result = await callOpenAI(
          buildPriorityMessages({
            title: body.input ?? "",
            description: body.input,
            dueDate: undefined,
          }),
        );
        break;
      case "planner":
        result = await callOpenAI(buildPlannerMessages(body.tasks));
        break;
      case "improve":
        result = await callOpenAI(buildImproveMessages(body.input ?? ""));
        break;
      case "chat": {
        const history = body.history ?? [];
        const message = body.message ?? "";
        result = await callOpenAI(buildChatMessages(history, message));
        shouldSaveChat = true;
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    if (shouldSaveChat) {
      const userMsg = body.message ?? "";
      const { error: insertUserErr } = await supabase
        .from("chat_messages")
        .insert({ role: "user", content: userMsg });
      if (insertUserErr) console.error("Failed to save user message:", insertUserErr);

      const { error: insertAssistantErr } = await supabase
        .from("chat_messages")
        .insert({ role: "assistant", content: result });
      if (insertAssistantErr) console.error("Failed to save assistant message:", insertAssistantErr);
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isKeyError = message === "AI_API_KEY_NOT_CONFIGURED";
    return new Response(
      JSON.stringify({
        error: isKeyError
          ? "AI API key is not configured. Please add OPENAI_API_KEY in the Secrets settings."
          : message,
      }),
      {
        status: isKeyError ? 503 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
