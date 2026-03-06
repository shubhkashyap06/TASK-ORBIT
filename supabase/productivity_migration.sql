-- ============================================================
-- PRODUCTIVITY REPORTS TABLE — TaskOrbit
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS productivity_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  productivity_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE productivity_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reports" ON productivity_reports;
CREATE POLICY "Users manage own reports"
  ON productivity_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prod_reports_user
  ON productivity_reports (user_id, report_type, period_start DESC);
