-- ============================================================
-- Science & Society — Legacy Publishing Migration (v3)
-- Run this ONCE in your Supabase SQL Editor.
-- SAFE: only adds an RLS policy.
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'journals' AND policyname = 'Admins can insert journals'
  ) THEN
    CREATE POLICY "Admins can insert journals" ON public.journals
      FOR INSERT WITH CHECK (
        exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
      );
  END IF;
END $$;
