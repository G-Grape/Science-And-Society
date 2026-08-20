# Archive — Deprecated SQL Files

## `supabase_cron_job.deprecated.sql`

**DO NOT RUN THIS FILE.** This file is superseded by Section 10 of `../safe_update_only.sql`.

### Why it was deprecated

The original file contained several known defects (documented in its own header):
- Missing permanent-admin guard in the scheduled deletion job
- Wrong status filter (checked `'scheduled'` instead of `null` with a timestamp check)
- Missing `search_path` security setting on the cron function
- No `cron.unschedule()` call before `cron.schedule()`, causing duplicate jobs on re-run

### What supersedes it

`safe_update_only.sql` (Section 10 — "pg_cron scheduled deletion") provides the corrected, production-safe version of the scheduled account deletion job. This is the only version that should ever be run against a production database.

### Why this file is kept

Git history preserves all prior content, but this archive folder is an extra safety measure so the file cannot be accidentally executed by a maintainer scanning the `SQL_Query/` directory for runnable migrations.
