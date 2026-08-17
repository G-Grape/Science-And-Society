-- ============================================================
-- MIGRATION: Add prev_reviewer_name column to journals table
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- 1. Add the missing column (safe - will not error if it already exists)
ALTER TABLE public.journals ADD COLUMN IF NOT EXISTS prev_reviewer_name text;

-- 2. Confirm it was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'journals' AND column_name = 'prev_reviewer_name';
