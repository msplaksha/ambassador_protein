-- ========================================================
-- Supabase Table Setup for "The AI Era of Biology"
-- ========================================================
-- Run this script in your Supabase Dashboard:
-- 1. Go to your Supabase Project -> SQL Editor
-- 2. Paste this entire query and click "Run"

-- 1. Create the students table
create table if not exists public.students (
  id text primary key,
  name text not null,
  section text default '',
  joined_at timestamptz default now(),
  last_active timestamptz default now(),
  activities_done integer default 0,
  questions_answered integer default 0,
  correct_first_try integer default 0,
  summary jsonb default '{}'::jsonb,
  doc jsonb default '{}'::jsonb
);

-- 2. Create indices for fast teacher roster queries
create index if not exists idx_students_last_active on public.students (last_active desc);
create index if not exists idx_students_section on public.students (section);

-- 3. Enable Row Level Security (RLS)
-- This ensures the table is 100% PRIVATE and cannot be queried directly by the public.
-- Only your Vercel serverless function (which uses the secret service role key) can read/write.
alter table public.students enable row level security;

-- (No public policies are added, making the table completely inaccessible to unauthorized visitors)
