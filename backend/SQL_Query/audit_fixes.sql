-- ============================================================
-- Science & Society — Deep Audit Fixes
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- 1. Fix Issue 9: Enforce active status on reviewer assignment
CREATE OR REPLACE FUNCTION public.assign_reviewer_to_journal(
  p_journal_id uuid,
  p_reviewer_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Check reviewer is active
  IF (SELECT status FROM public.profiles WHERE id = p_reviewer_id) != 'active' THEN
    RAISE EXCEPTION 'Cannot assign: Reviewer is not active';
  END IF;
  
  -- Atomic check-and-insert (single transaction, no TOCTOU)
  IF EXISTS (SELECT 1 FROM public.assignments WHERE journal_id = p_journal_id FOR UPDATE) THEN
    RAISE EXCEPTION 'Journal already has a reviewer assigned';
  END IF;
  
  INSERT INTO public.assignments (journal_id, reviewer_id)
  VALUES (p_journal_id, p_reviewer_id);
  
  UPDATE public.journals SET status = 'under_review'
  WHERE id = p_journal_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assign_reviewer_to_journal(uuid, uuid) FROM public;
GRANT  EXECUTE ON FUNCTION public.assign_reviewer_to_journal(uuid, uuid) TO authenticated;

-- 2. Fix Issue 4: Secure Unpublish RPC
CREATE OR REPLACE FUNCTION public.unpublish_journal(
  p_journal_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Only published journals can be unpublished
  IF (SELECT status FROM public.journals WHERE id = p_journal_id) != 'published' THEN
    RAISE EXCEPTION 'Cannot unpublish: Journal is not currently published';
  END IF;

  UPDATE public.journals SET 
    status = 'accepted',
    published_at = NULL,
    volume_number = NULL,
    issue_number = NULL
  WHERE id = p_journal_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.unpublish_journal(uuid) FROM public;
GRANT  EXECUTE ON FUNCTION public.unpublish_journal(uuid) TO authenticated;

-- 3. Fix Issue 5: Secure Admin Decision RPC
CREATE OR REPLACE FUNCTION public.admin_make_decision(
  p_journal_id uuid,
  p_status text,
  p_admin_comments text,
  p_approval_proof_url text,
  p_revision_report_url text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Status Whitelist
  IF p_status NOT IN ('accepted', 'rejected', 'rework') THEN
    RAISE EXCEPTION 'Invalid decision status. Allowed: accepted, rejected, rework';
  END IF;

  UPDATE public.journals SET 
    status = p_status,
    admin_comments = p_admin_comments,
    approval_proof_url = p_approval_proof_url,
    revision_report_url = p_revision_report_url
  WHERE id = p_journal_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_make_decision(uuid, text, text, text, text) FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_make_decision(uuid, text, text, text, text) TO authenticated;

-- 4. Fix Issue 2 (Phase 2): Secure Unassign RPC
CREATE OR REPLACE FUNCTION public.unassign_reviewer_from_journal(
  p_journal_id uuid,
  p_assignment_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  DELETE FROM public.assignments WHERE id = p_assignment_id AND journal_id = p_journal_id;
  
  -- If no assignments remain for this journal, revert status to submitted
  IF NOT EXISTS (SELECT 1 FROM public.assignments WHERE journal_id = p_journal_id) THEN
    UPDATE public.journals SET status = 'submitted' WHERE id = p_journal_id;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.unassign_reviewer_from_journal(uuid, uuid) FROM public;
GRANT  EXECUTE ON FUNCTION public.unassign_reviewer_from_journal(uuid, uuid) TO authenticated;

-- 5. Fix Issue 3 (Phase 2): Secure Admin Compile Issue RPC
CREATE OR REPLACE FUNCTION public.admin_compile_issue(
  p_volume text,
  p_issue text,
  p_journal_ids uuid[]
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update all selected papers
  UPDATE public.journals SET 
    volume_number = p_volume,
    issue_number = p_issue,
    published_at = now()
  WHERE id = ANY(p_journal_ids);
  
  -- Update current issue tracker
  UPDATE public.current_issue SET 
    volume_number = p_volume,
    issue_number = p_issue
  WHERE id = 1;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_compile_issue(text, text, uuid[]) FROM public;
GRANT  EXECUTE ON FUNCTION public.admin_compile_issue(text, text, uuid[]) TO authenticated;
