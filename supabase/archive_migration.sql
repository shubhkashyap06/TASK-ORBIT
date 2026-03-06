-- ============================================================
-- AUTO-ARCHIVE MIGRATION — TaskOrbit
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add completed_at column to tasks (tracks when moved to Done)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Backfill: tasks already in 'done' get completed_at = updated_at or now()
UPDATE tasks
SET completed_at = COALESCE(created_at, now())
WHERE status = 'done' AND completed_at IS NULL;

-- 2. Create archived_tasks table
CREATE TABLE IF NOT EXISTS archived_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,            -- original task id (for restore)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  assigned_user_id UUID,
  created_by UUID,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'            -- any extra fields for future-proofing
);

-- RLS on archived_tasks
ALTER TABLE archived_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own archived tasks" ON archived_tasks;
CREATE POLICY "Users can view own archived tasks"
  ON archived_tasks FOR SELECT
  USING (
    auth.uid() = user_id
    OR project_id IN (SELECT get_user_project_ids())
  );

DROP POLICY IF EXISTS "System can insert archived tasks" ON archived_tasks;
CREATE POLICY "System can insert archived tasks"
  ON archived_tasks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own archived tasks" ON archived_tasks;
CREATE POLICY "Users can delete own archived tasks"
  ON archived_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_archived_tasks_user ON archived_tasks (user_id, archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_project ON archived_tasks (project_id, archived_at DESC);

-- 3. RPC to archive tasks older than N hours (called from frontend)
-- Archives done tasks where completed_at is older than threshold
CREATE OR REPLACE FUNCTION archive_old_completed_tasks(threshold_hours integer DEFAULT 48)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer := 0;
BEGIN
  -- Insert into archive
  INSERT INTO archived_tasks (
    original_id, user_id, project_id, assigned_user_id, created_by,
    title, description, priority, due_date, completed_at, archived_at
  )
  SELECT
    id, user_id, project_id, assigned_user_id, created_by,
    title, description, priority, due_date, completed_at, now()
  FROM tasks
  WHERE 
    status = 'done'
    AND completed_at IS NOT NULL
    AND completed_at < now() - (threshold_hours || ' hours')::interval
    AND auth.uid() = user_id;  -- only archive own tasks

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  -- Delete from tasks
  DELETE FROM tasks
  WHERE 
    status = 'done'
    AND completed_at IS NOT NULL
    AND completed_at < now() - (threshold_hours || ' hours')::interval
    AND auth.uid() = user_id;

  RETURN archived_count;
END;
$$;

-- 4. RPC to restore a task from archive
CREATE OR REPLACE FUNCTION restore_archived_task(archived_task_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived archived_tasks%ROWTYPE;
  max_pos integer;
BEGIN
  SELECT * INTO archived FROM archived_tasks WHERE id = archived_task_id AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT COALESCE(MAX(position), -1) + 1 INTO max_pos FROM tasks WHERE status = 'done' AND user_id = auth.uid();

  INSERT INTO tasks (
    user_id, project_id, assigned_user_id, created_by,
    title, description, priority, due_date, status, completed_at, position
  ) VALUES (
    archived.user_id, archived.project_id, archived.assigned_user_id, archived.created_by,
    archived.title, archived.description, archived.priority, archived.due_date,
    'done', archived.completed_at, max_pos
  );

  DELETE FROM archived_tasks WHERE id = archived_task_id;
  RETURN true;
END;
$$;
