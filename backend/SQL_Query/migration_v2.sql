-- ============================================================
-- Science & Society — Workflow Upgrade Migration v2
-- Run this ONCE in your Supabase SQL Editor.
-- SAFE: only adds columns/tables, never drops existing data.
-- ============================================================

-- 1. Update journals table: add new columns
ALTER TABLE public.journals
  ADD COLUMN IF NOT EXISTS authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS volume_number text,
  ADD COLUMN IF NOT EXISTS issue_number text,
  ADD COLUMN IF NOT EXISTS prev_reviewer_name text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 2. Update the status constraint to add new statuses
ALTER TABLE public.journals DROP CONSTRAINT IF EXISTS journals_status_check;
ALTER TABLE public.journals
  ADD CONSTRAINT journals_status_check
  CHECK (status IN (
    'submitted',
    'pending',
    'under_review',
    'review_complete',
    'approved',
    'accepted',
    'revision_required',
    'rework',
    'rejected',
    'published'
  ));

-- 3. Update paper_requests: fix status constraint and add fields
ALTER TABLE public.paper_requests DROP CONSTRAINT IF EXISTS paper_requests_status_check;
ALTER TABLE public.paper_requests
  ADD CONSTRAINT paper_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.paper_requests
  ADD COLUMN IF NOT EXISTS affiliation text,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- 4. Create notifications table (in-app)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist in case the table was created previously without them
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Notification',
  ADD COLUMN IF NOT EXISTS message text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can read own notifications'
  ) THEN
    CREATE POLICY "Users can read own notifications" ON public.notifications
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- FIX: The previous policy "Service role can insert notifications" had WITH CHECK (true)
-- which allowed ANY user to insert notifications. Service role bypasses RLS automatically,
-- so no INSERT policy is needed at all.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service role can insert notifications'
  ) THEN
    DROP POLICY "Service role can insert notifications" ON public.notifications;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can mark own notifications read'
  ) THEN
    CREATE POLICY "Users can mark own notifications read" ON public.notifications
      FOR UPDATE USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- 5. Update published_issues view
DROP VIEW IF EXISTS public.published_issues;

CREATE VIEW public.published_issues WITH (security_invoker = true) AS
SELECT
  j.id,
  j.title,
  j.abstract,
  j.category,
  j.keywords,
  j.authors,
  j.volume_number,
  j.issue_number,
  j.published_at,
  j.created_at,
  j.author_name
FROM public.journals j
WHERE j.status = 'published';

-- 6. RLS: anyone can read published journals (for public pages)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'journals' AND policyname = 'Anyone can read published journals'
  ) THEN
    CREATE POLICY "Anyone can read published journals" ON public.journals
      FOR SELECT USING (status = 'published');
  END IF;
END $$;

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_journals_status ON public.journals(status);
CREATE INDEX IF NOT EXISTS idx_journals_published_at ON public.journals(published_at DESC NULLS LAST);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'journals'
ORDER BY ordinal_position;
