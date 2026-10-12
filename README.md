# AI TaskFlow

A modern, full-stack AI-powered task management application. Create, organize, and track your tasks while AI helps you break down complex work, prioritize intelligently, improve task descriptions, plan your day, and answer your productivity questions.

## Features

### Authentication
- User registration with name, email, and password
- Secure login with JWT-based sessions
- Protected routes — only authenticated users can access the app
- Each user only sees their own tasks and chat history

### Task Management
- Create, view, update, and delete tasks
- Mark tasks as completed or pending
- Search tasks by title, description, or category
- Filter by status (all / pending / completed)
- Filter by priority (Low / Medium / High)
- Filter by category
- Sort by due date, priority, or creation date

### AI Features (powered by OpenAI via secure backend)
1. **AI Task Breakdown** — Enter a complex task and AI generates a step-by-step action plan
2. **AI Priority Suggestion** — AI analyzes task urgency, complexity, and due date to recommend a priority level
3. **AI Daily Planner** — Generates an optimized time-based schedule from your pending tasks
4. **AI Task Improvement** — Transforms vague task titles into clear, actionable descriptions
5. **AI Chat Assistant** — Conversational assistant for programming, productivity, task planning, and project management (with saved chat history)

### Dashboard
- Total, completed, pending, high-priority, and overdue task stats
- Donut chart: Completed vs Pending
- Bar charts: Tasks by Priority and Tasks by Category
- Upcoming tasks preview
- AI Daily Planner quick-generate button

### UI/UX
- Professional dark-themed developer-focused design
- Responsive sidebar and navbar layout
- Toast notifications for user feedback
- Modal dialogs for confirmations
- Loading indicators throughout
- Empty states and error states
- 404 page

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Routing | React Router DOM |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (JWT + bcrypt) |
| AI | OpenAI API (gpt-4o-mini) |

## Architecture

This project uses Supabase as the backend — replacing the traditional separate Express/MongoDB server with an integrated solution:

- **Database**: PostgreSQL with Row Level Security (RLS) ensuring users can only access their own data
- **Auth**: Supabase Auth handles registration, login, JWT sessions, and password hashing
- **AI Backend**: A Supabase Edge Function (`ai-assistant`) securely proxies all AI API calls, keeping the OpenAI API key on the server — never exposed to the frontend
- **Real-time**: Direct client-to-database communication via the Supabase JS client

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── BarChart.tsx
│   │   │   └── DonutChart.tsx
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── ui/
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Modal.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── TasksPage.tsx
│   │   ├── CreateTaskPage.tsx
│   │   ├── EditTaskPage.tsx
│   │   ├── AssistantPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/
│   │   ├── aiService.ts
│   │   └── taskService.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   └── ai-assistant/
│   │       └── index.ts
│   └── migrations/
│       └── create_tasks_and_chat_tables.sql
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Environment Variables

The following are pre-configured automatically:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous API key |

### AI API Key

The OpenAI API key is stored securely as a Supabase Edge Function secret:
- Open the Bolt project database settings
- Go to **Secrets**
- Add a secret named `OPENAI_API_KEY` with your OpenAI API key value

The key is never exposed to the frontend — all AI requests go through the edge function.

## AI Integration

All AI features are handled by a single Supabase Edge Function (`ai-assistant`) that acts as a secure proxy:

1. The frontend sends a request with an `action` field (`breakdown`, `priority`, `planner`, `improve`, or `chat`)
2. The edge function verifies the user's JWT authentication
3. The function calls the OpenAI API using the server-side API key
4. For chat messages, the function saves both user and assistant messages to the `chat_messages` table
5. The result is returned to the frontend

This architecture ensures the API key is never exposed to the browser.

## API Reference

### Authentication (Supabase Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/v1/signup` | Register a new user |
| POST | `/auth/v1/token?grant_type=password` | Login |
| POST | `/auth/v1/logout` | Logout |
| GET | `/auth/v1/user` | Get current user |

### Tasks (Supabase REST API)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rest/v1/tasks` | List user's tasks |
| POST | `/rest/v1/tasks` | Create a task |
| PATCH | `/rest/v1/tasks?id=eq.{id}` | Update a task |
| DELETE | `/rest/v1/tasks?id=eq.{id}` | Delete a task |

### AI (Edge Function)
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/functions/v1/ai-assistant` | `{ action: "breakdown", input }` | Task breakdown |
| POST | `/functions/v1/ai-assistant` | `{ action: "priority", input }` | Priority suggestion |
| POST | `/functions/v1/ai-assistant` | `{ action: "planner", tasks }` | Daily planner |
| POST | `/functions/v1/ai-assistant` | `{ action: "improve", input }` | Task improvement |
| POST | `/functions/v1/ai-assistant` | `{ action: "chat", message, history }` | Chat assistant |

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Security

- JWT authentication via Supabase Auth
- Password hashing with bcrypt (handled by Supabase)
- Row Level Security (RLS) on all tables — users can only access their own data
- AI API key stored as a server-side secret, never exposed to the frontend
- Input validation on all forms
- User-friendly error messages for all failure cases
- CORS configuration on the edge function

## Future Improvements

- Task tags and labels for richer categorization
- Recurring tasks and reminders
- Collaborative task sharing between users
- Dark/light theme toggle
- Mobile app (React Native)
- AI-powered task estimation (time predictions)
- Integration with calendar apps
- Offline support with sync
