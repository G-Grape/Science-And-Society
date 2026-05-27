-- ============================================================
-- Gyan Samavesh 2026 — Supabase Schema
-- Run this in your Supabase SQL Editor (once)
-- ============================================================

-- 1. Profiles (extends Supabase auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('student', 'reviewer', 'admin')),
  status     text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz default now()
);

-- RLS: profiles
alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Journals
create table public.journals (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references public.profiles(id) on delete cascade,
  title        text not null,
  abstract     text not null, -- Stores the public URL to the uploaded abstract PDF
  category     text not null,
  keywords     text not null,
  file_url     text,
  status       text not null default 'submitted'
                 check (status in ('submitted', 'under_review', 'approved', 'revision_required', 'rejected')),
  review_level int not null default 0,
  admin_comments     text,
  revision_report_url text,
  approval_proof_url  text,
  resubmission_count  int not null default 0,
  prev_admin_comments     text,
  prev_revision_report_url text,
  prev_reviewer_comments   text,
  created_at   timestamptz default now()
);

-- RLS: journals
alter table public.journals enable row level security;
create policy "Students see own journals" on public.journals for select
  using (auth.uid() = student_id or
         exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'reviewer')));
create policy "Students can insert journals" on public.journals for insert
  with check (auth.uid() = student_id);
create policy "Admins can update journals" on public.journals for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Students can update own journals" on public.journals for update
  using (auth.uid() = student_id);

-- 3. Assignments (reviewer ↔ journal)
create table public.assignments (
  id          uuid primary key default gen_random_uuid(),
  journal_id  uuid references public.journals(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (journal_id, reviewer_id)
);

-- RLS: assignments
alter table public.assignments enable row level security;
create policy "Anyone authenticated can view assignments" on public.assignments for select using (auth.uid() is not null);
create policy "Admins can insert assignments" on public.assignments for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete assignments" on public.assignments for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. Reviews
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  journal_id  uuid references public.journals(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete cascade,
  decision    text not null check (decision in ('approve', 'revision', 'reject')),
  comments    text not null,
  originality int check (originality between 1 and 5),
  methodology int check (methodology between 1 and 5),
  clarity     int check (clarity between 1 and 5),
  refs        int check (refs between 1 and 5),
  overall     int check (overall between 1 and 5),
  created_at  timestamptz default now()
);

-- RLS: reviews
alter table public.reviews enable row level security;
create policy "Anyone authenticated can read reviews" on public.reviews for select using (auth.uid() is not null);
create policy "Reviewers can insert reviews" on public.reviews for insert
  with check (auth.uid() = reviewer_id);
create policy "Reviewers can update reviews" on public.reviews for update
  using (auth.uid() = reviewer_id);
create policy "Students can delete reviews on own journals" on public.reviews for delete
  using (journal_id in (select id from public.journals where student_id = auth.uid()));

-- 5. Storage bucket for PDFs
-- Run in Supabase dashboard → Storage → Create bucket named "journals" (public)
-- Or via SQL:
insert into storage.buckets (id, name, public) values ('journals', 'journals', true)
  on conflict do nothing;

create policy "Anyone can read journal files" on storage.objects for select
  using (bucket_id = 'journals');
create policy "Authenticated users can upload" on storage.objects for insert
  with check (bucket_id = 'journals' and auth.uid() is not null);

-- 6. Published Issues View
-- A dynamic view that only returns journals with 'approved' or 'Accepted' status.
create or replace view public.published_issues as
select j.id, j.title, j.abstract, j.category, j.created_at, p.name as author_name
from public.journals j
left join public.profiles p on j.student_id = p.id
where j.status in ('approved', 'Accepted');

-- 7. Paper Requests
create table public.paper_requests (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid references public.journals(id) on delete cascade,
  journal_title text not null,
  requester_name text not null,
  requester_email text not null,
  status text not null default 'pending' check (status in ('pending', 'responded')),
  created_at timestamptz default now()
);

-- RLS: paper_requests
alter table public.paper_requests enable row level security;
-- Public can insert (so non-logged-in visitors can request papers)
create policy "Anyone can insert paper_requests" on public.paper_requests for insert with check (true);
-- Only Admins can see the requests
create policy "Admins can select paper_requests" on public.paper_requests for select 
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
-- Admins can update the status
create policy "Admins can update paper_requests" on public.paper_requests for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 8. Admin RPC functions for user management
-- These functions bypass RLS (security definer) to allow admins to manage users
create or replace function public.approve_reviewer(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    update public.profiles set status = 'active' where id = target_user_id;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;

create or replace function public.delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    -- Deleting from auth.users cascades to public.profiles and frees up the email
    delete from auth.users where id = target_user_id;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;
