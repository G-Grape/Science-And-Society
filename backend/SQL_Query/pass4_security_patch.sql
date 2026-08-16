-- ====================================================================
-- PASS 4 SECURITY PATCHES
-- Run this file in your Supabase SQL Editor.
-- It is 100% safe to run on existing data. It uses CREATE OR REPLACE
-- and does not drop any tables or delete any records.
-- ====================================================================

-- 1. FIX: Published Issues View
-- Ensures the view uses SECURITY DEFINER semantics (so public users can read it
-- without needing direct access to the journals table), filters correctly by
-- status = 'published', and deliberately excludes sensitive columns like file_url.
CREATE OR REPLACE VIEW public.published_issues WITH (security_invoker = false) AS
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

-- Re-grant SELECT to ensure anon users can query the view
GRANT SELECT ON public.published_issues TO anon, authenticated;


-- 2. FIX: approve_reviewer RPC
-- Prevents the approve_reviewer function from being abused to activate non-reviewers.
-- The added `AND role = 'reviewer'` guard ensures only intended accounts are activated.
CREATE OR REPLACE FUNCTION public.approve_reviewer(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    -- Guard: only activate accounts that are actually pending reviewers.
    UPDATE public.profiles SET status = 'active'
    WHERE id = target_user_id AND role = 'reviewer';
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$;

-- Ensure execute permissions are locked down to authenticated users only
REVOKE EXECUTE ON FUNCTION public.approve_reviewer(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.approve_reviewer(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_reviewer(uuid) TO authenticated;
