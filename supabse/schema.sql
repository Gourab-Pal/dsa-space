-- ============================================================================
-- DSA SPACE — DATABASE SCHEMA
-- Keep all application SQL in this file, grouped and explained by feature.
-- Run the executable sections in the Supabase SQL Editor.
-- This script also works with the profiles table from our initial setup.
-- Existing profile rows are preserved when the script is run again.
-- ============================================================================

-- 1. LOGIN ACCOUNTS (managed by Supabase Auth; no custom SQL required)
-- Create accounts through Authentication > Users > Add user > Create new user.
-- Email and passwords belong to Supabase Auth, never to public.profiles.
-- Keep public signup disabled while accounts are created manually.

begin;

-- 2. USER PROFILES
-- id must match an existing Authentication User UID. Do not generate a new UUID.
-- Deleting an Auth account also deletes its profile through the foreign key.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- 3. PROFILE ACCESS
-- Browser clients can read only their own profile.
-- You manage inserts/updates/deletes manually in the Supabase dashboard.
alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;

-- Replace this policy inside the transaction so the file can be rerun.
drop policy if exists "Users can read their own profile" on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

commit;

-- 4. ADD A PROFILE MANUALLY (example only — intentionally commented out)
-- First create the login account through Authentication > Users.
-- Then replace AUTH_USER_UID with that account's UID, edit the name,
-- and run the INSERT separately. You can also use Table Editor > profiles.
--
-- insert into public.profiles (id, full_name)
-- values ('AUTH_USER_UID'::uuid, 'Your Name');

-- 5. VERIFY PROFILES (admin SQL Editor only — intentionally commented out)
-- This joins Auth email with the manually maintained profile name.
--
-- select p.id, p.full_name, u.email, p.created_at
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- order by p.created_at desc;

-- 6. QUESTIONS AND PRACTICE
-- Tables for questions and practice logs will be added here when cloud saving
-- is implemented. This version enables Auth; dashboard data stays in browser
-- storage under a separate key for each authenticated user.
