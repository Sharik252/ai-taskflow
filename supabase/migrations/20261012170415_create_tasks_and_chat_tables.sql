/*
# Create tasks and chat_messages tables for AI TaskFlow

## Overview
Creates the core data tables for the AI TaskFlow application — a multi-user
task management platform with AI features (task breakdown, priority suggestions,
daily planner, task improvement, and a chat assistant).

## New Tables

### 1. tasks
Stores user tasks with priority, category, due date, and completion status.
- id (uuid, primary key)
- title (text, not null) — task title
- description (text) — optional task details
- completed (boolean, default false) — whether the task is done
- priority (text, not null, default 'Medium') — 'Low', 'Medium', or 'High'
- category (text, default 'General') — user-defined category
- due_date (timestamptz, nullable) — optional deadline
- user_id (uuid, not null, default auth.uid()) — owner reference
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 2. chat_messages
Stores conversation history for the AI chat assistant.
- id (uuid, primary key)
- user_id (uuid, not null, default auth.uid()) — owner reference
- role (text, not null) — 'user' or 'assistant'
- content (text, not null) — message text
- created_at (timestamptz, default now())

## Security
Both tables have Row Level Security enabled with owner-scoped policies:
- Users can only SELECT, INSERT, UPDATE, and DELETE their own rows
- user_id defaults to auth.uid() so inserts from authenticated clients work
  even when the client doesn't explicitly pass user_id
- Policies use auth.uid() for ownership checks (never current_user)

## Indexes
- tasks.user_id — for filtering tasks by owner
- tasks.due_date — for sorting by due date
- tasks.priority — for filtering by priority
- tasks.completed — for filtering by status
- chat_messages.user_id — for retrieving a user's conversation history

## Notes
1. Foreign keys reference auth.users with ON DELETE CASCADE so deleting
   a user's auth account removes their tasks and chat history.
2. updated_at is maintained via a trigger that sets it to now() on every UPDATE.
3. Priority is constrained to 'Low', 'Medium', or 'High' via a CHECK constraint.
4. Role is constrained to 'user' or 'assistant' via a CHECK constraint.
*/

-- ==================== TASKS TABLE ====================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  category text NOT NULL DEFAULT 'General',
  due_date timestamptz,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Tasks: owner-scoped CRUD
DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- ==================== CHAT_MESSAGES TABLE ====================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages: owner-scoped CRUD
DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- ==================== UPDATED_AT TRIGGER ====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();