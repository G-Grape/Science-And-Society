-- ⚠️⚠️⚠️  DEPRECATED — DO NOT RUN THIS FILE  ⚠️⚠️⚠️
-- ===========================================================
-- This file is an OLD, UNSAFE version of the account-deletion cron job.
-- It was superseded by the version in safe_update_only.sql (Section 10).
--
-- KNOWN DEFECTS IN THIS FILE (do NOT run it to "fix" them):
--   1. Missing `is_permanent = false` guard → can deactivate the permanent admin.
--   2. Status exclusion list (`status != 'approved'`) would delete
--      PUBLISHED papers (status = 'published' != 'approved' is TRUE).
--   3. Missing SET search_path = public → vulnerable to search-path injection.
--   4. No cron.unschedule() before cron.schedule() → creates duplicate cron job.
--
-- Use safe_update_only.sql (Section 10) for the correct, hardened version.
-- ===========================================================

-- SUPABASE SCHEDULED CRON JOB: Replace the node-cron that was removed from the backend.
-- This runs in Supabase's own infrastructure every day at midnight UTC.
-- 
-- HOW TO SET UP:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project → Edge Functions → Cron Jobs
-- 3. Or go to SQL Editor and run this SQL:

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Enable the http extension to call Edge Functions or run direct SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 3: Create the cron job that runs every day at midnight UTC
-- This directly deletes expired accounts from the database.
-- (Your backend RLS is bypassed because this runs as a Postgres SECURITY DEFINER function)

-- First, create the cleanup function:
CREATE OR REPLACE FUNCTION delete_expired_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
  fifteen_days_ago TIMESTAMPTZ := NOW() - INTERVAL '15 days';
BEGIN
  -- Find all profiles scheduled for deletion more than 15 days ago
  FOR profile_record IN
    SELECT id FROM profiles
    WHERE deletion_scheduled_at IS NOT NULL
    AND deletion_scheduled_at < fifteen_days_ago
  LOOP
    -- Delete all non-approved journals for this user
    DELETE FROM journals
    WHERE student_id = profile_record.id
    AND status != 'approved';

    -- The remaining approved journals will have student_id set to NULL
    -- automatically via ON DELETE SET NULL constraint on the foreign key.

    -- Note: auth.users deletion must still be done via the service role.
    -- The cron job marks the profile for deletion; the actual auth user
    -- deletion happens when they try to log in next (handled by backend).
    -- As a fallback, update the profile status to 'deleted' so they cannot log in.
    UPDATE profiles
    SET status = 'inactive'
    WHERE id = profile_record.id;

  END LOOP;
END;
$$;

-- Step 4: Schedule the cron job to run every day at midnight UTC
SELECT cron.schedule(
  'delete-expired-accounts',  -- Job name
  '0 0 * * *',                 -- Cron expression: daily at midnight UTC
  'SELECT delete_expired_accounts()'
);
