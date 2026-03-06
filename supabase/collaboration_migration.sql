-- ============================================================
-- COLLABORATION MIGRATION — TaskOrbit
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 0: HELPER FUNCTIONS (Bypass RLS for policy checks)
-- ============================================================
-- This prevents the "infinite recursion" error in Supabase RLS policies
-- by running these checks outside the context of the RLS user.

CREATE OR REPLACE FUNCTION get_user_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id FROM project_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_project_owner_or_admin(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = target_project_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_project_owner(target_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = target_project_id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  );
$$;

-- ============================================================
-- STEP 1: CREATE ALL TABLES FIRST (no policies yet)
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT DEFAULT encode(gen_random_bytes(6), 'hex') UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROJECT MEMBERS TABLE
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- (If table already existed referencing auth.users, try adding the profiles FK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE project_members
    ADD CONSTRAINT project_members_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('assignment', 'update', 'reminder', 'invite', 'info')),
  message TEXT NOT NULL,
  link TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT 'task',
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ALTER TASKS TABLE (add collaboration columns)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE tasks ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- (If table already existed with auth.users references, add the profiles FKs for joins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_user_id_profiles_fkey FOREIGN KEY (assigned_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_created_by_profiles_fkey'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_created_by_profiles_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update existing tasks: set created_by = user_id
UPDATE tasks SET created_by = user_id WHERE created_by IS NULL;


-- ============================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 3: CREATE ALL RLS POLICIES (drop first to be idempotent)
-- ============================================================

-- PROFILES policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- PROJECTS policies
DROP POLICY IF EXISTS "Project members can view projects" ON projects;
CREATE POLICY "Project members can view projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    id IN (SELECT get_user_project_ids())
  );

DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update projects" ON projects;
CREATE POLICY "Owners can update projects"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete projects" ON projects;
CREATE POLICY "Owners can delete projects"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- PROJECT MEMBERS policies
DROP POLICY IF EXISTS "Project members can view members" ON project_members;
CREATE POLICY "Project members can view members"
  ON project_members FOR SELECT
  USING (
    project_id IN (SELECT get_user_project_ids()) OR
    auth.uid() IN (SELECT owner_id FROM projects WHERE id = project_members.project_id)
  );

DROP POLICY IF EXISTS "Owners and admins can add members" ON project_members;
CREATE POLICY "Owners and admins can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    is_project_owner_or_admin(project_id)
    OR auth.uid() IN (SELECT owner_id FROM projects WHERE id = project_members.project_id)
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Owners can remove members" ON project_members;
CREATE POLICY "Owners can remove members"
  ON project_members FOR DELETE
  USING (
    is_project_owner(project_id)
    OR auth.uid() = user_id
  );

-- TASKS policies (replace old ones)
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Members can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Members can insert project tasks" ON tasks;
DROP POLICY IF EXISTS "Members can update project tasks" ON tasks;
DROP POLICY IF EXISTS "Members can delete project tasks" ON tasks;

CREATE POLICY "Members can view project tasks"
  ON tasks FOR SELECT
  USING (
    auth.uid() = user_id
    OR project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY "Members can insert project tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY "Members can update project tasks"
  ON tasks FOR UPDATE
  USING (
    auth.uid() = user_id
    OR project_id IN (SELECT get_user_project_ids())
  );

CREATE POLICY "Members can delete project tasks"
  ON tasks FOR DELETE
  USING (
    auth.uid() = user_id
    OR project_id IN (SELECT get_user_project_ids())
  );

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ACTIVITY LOG policies
DROP POLICY IF EXISTS "Project members can view activity" ON activity_log;
CREATE POLICY "Project members can view activity"
  ON activity_log FOR SELECT
  USING (project_id IN (SELECT get_user_project_ids()));

DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_log;
CREATE POLICY "Authenticated users can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- STEP 4: TRIGGERS & FUNCTIONS
-- ============================================================

-- Secure RPC to join a project by invite code (bypasses RLS SELECT restrictions)
CREATE OR REPLACE FUNCTION join_project_by_invite(invite_code_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_project_id uuid;
BEGIN
  SELECT id INTO target_project_id
  FROM projects
  WHERE invite_code = invite_code_input;

  IF target_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO project_members (project_id, user_id, role)
  VALUES (target_project_id, auth.uid(), 'member')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  RETURN target_project_id;
END;
$$;

-- Auto-add creator as project owner
CREATE OR REPLACE FUNCTION auto_add_project_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION auto_add_project_owner();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill profiles for existing users
INSERT INTO profiles (id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- STEP 5: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log (project_id, created_at DESC);


-- ============================================================
-- STEP 6: ENABLE REALTIME (ignore if already added)
-- ============================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Done!
