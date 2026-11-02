-- ============================================================================
-- DSA SPACE: ALL DATABASE SQL
-- Run this entire file in the Supabase SQL Editor. It can be run again safely.
-- Existing profiles, questions and practice history are preserved.
-- Login emails/passwords are managed through Authentication > Users.
-- ============================================================================
begin;

-- 1. MANUALLY MAINTAINED USER PROFILES
-- Add an Auth account first; use its UID as profiles.id.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

-- 2. WORKSPACE SETTINGS AND SAVE VERSION
-- One record per account. Its existence prevents starter questions reappearing
-- after someone deletes them. revision prevents stale devices overwriting work.
create table if not exists public.question_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_goal integer not null default 3 check (daily_goal between 1 and 20),
  question_order text[] not null default '{}',
  revision bigint not null default 0 check (revision >= 0),
  last_mutation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PRIVATE QUESTIONS
-- Practice attempts stay with their question as JSON, matching the app model.
-- This keeps a practice log, status, confidence and revision date in one save.
-- IDs remain text so existing JSON backups can be imported without rewriting IDs.
create table if not exists public.questions (
  user_id uuid not null references public.question_workspaces(user_id) on delete cascade,
  id text not null check (length(id) between 1 and 100000),
  title text not null check (length(btrim(title)) between 1 and 100000),
  topic text not null check (topic in (
    'Arrays & hashing', 'Two pointers', 'Sliding window', 'Stacks',
    'Binary search', 'Linked lists', 'Trees', 'Graphs'
  )),
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  status text not null default 'Not started'
    check (status in ('Not started', 'Learning', 'Solved', 'Revisit')),
  url text not null default '' check (url = '' or url ~* '^https?://'),
  bookmarked boolean not null default false,
  notes text not null default '' check (length(notes) <= 100000),
  solution text not null default '' check (length(solution) <= 100000),
  time_complexity text not null default '' check (length(time_complexity) <= 100000),
  space_complexity text not null default '' check (length(space_complexity) <= 100000),
  confidence text not null default 'Learning'
    check (confidence in ('Learning', 'With a hint', 'Comfortable')),
  revision date,
  attempts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(attempts) = 'array' and jsonb_array_length(attempts) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 4. DATABASE-ENFORCED OWNERSHIP
-- Every operation checks the signed-in user's Auth UID. A frontend filter alone
-- is not sufficient. The composite question key also separates imported IDs.
alter table public.question_workspaces enable row level security;
alter table public.questions enable row level security;
revoke all on public.question_workspaces, public.questions from public, anon, authenticated;
grant select, insert, update on public.question_workspaces to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
drop policy if exists "Own question workspace" on public.question_workspaces;
create policy "Own question workspace" on public.question_workspaces
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Own questions" on public.questions;
create policy "Own questions" on public.questions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 5. LOAD A WORKSPACE, INITIALIZING IT ONCE
-- Both starter questions are Easy, unsolved, with no fabricated practice history.
-- The expected user ID protects a queued request if the browser changes accounts.
create or replace function public.read_question_workspace(p_user_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  new_user uuid;
  workspace public.question_workspaces%rowtype;
  question_list jsonb;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.question_workspaces (user_id, question_order)
  values (p_user_id, array['starter-running-sum', 'starter-reverse-string'])
  on conflict (user_id) do nothing returning user_id into new_user;

  select * into workspace from public.question_workspaces
  where user_id = p_user_id for update;

  if new_user is not null then
    insert into public.questions (user_id, id, title, topic, difficulty, url)
    values
      (p_user_id, 'starter-running-sum', 'Running Sum of 1D Array',
       'Arrays & hashing', 'Easy', 'https://leetcode.com/problems/running-sum-of-1d-array/'),
      (p_user_id, 'starter-reverse-string', 'Reverse String',
       'Two pointers', 'Easy', 'https://leetcode.com/problems/reverse-string/');
  end if;

  select coalesce(jsonb_agg(
    (to_jsonb(q) - 'user_id' - 'created_at' - 'updated_at'
      - 'time_complexity' - 'space_complexity') ||
    jsonb_build_object('time', q.time_complexity, 'space', q.space_complexity,
      'revision', coalesce(q.revision::text, ''))
    order by array_position(workspace.question_order, q.id), q.created_at, q.id
  ), '[]'::jsonb) into question_list
  from public.questions q where q.user_id = p_user_id;

  return jsonb_build_object('revision', workspace.revision,
    'data', jsonb_build_object('version', 1, 'dailyGoal', workspace.daily_goal,
      'questions', question_list));
end;
$$;

-- 6. SAVE ONLY CHANGED QUESTIONS, ATOMICALLY
-- Updates, deletions, ordering and daily goal commit together, or all roll back.
-- A repeated mutation ID acknowledges a successful request whose response was
-- lost. A mismatched revision rejects stale work instead of silently replacing it.
create or replace function public.save_question_changes(
  p_user_id uuid,
  p_expected_revision bigint,
  p_mutation_id uuid,
  p_daily_goal integer,
  p_question_order text[],
  p_changes jsonb,
  p_deleted_ids text[]
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  workspace public.question_workspaces%rowtype;
  item jsonb;
  attempt jsonb;
  next_revision bigint;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into workspace from public.question_workspaces
  where user_id = p_user_id for update;
  if not found then
    raise exception 'Load your workspace before saving' using errcode = '22023';
  end if;
  if p_mutation_id is null then
    raise exception 'Missing save identifier' using errcode = '22023';
  end if;
  if workspace.last_mutation_id = p_mutation_id then
    return workspace.revision;
  end if;
  if workspace.revision is distinct from p_expected_revision then
    raise exception 'Workspace changed on another device' using errcode = '40001';
  end if;
  if p_daily_goal is null or p_daily_goal not between 1 and 20
     or p_question_order is null or cardinality(p_question_order) > 2000
     or p_changes is null or jsonb_typeof(p_changes) <> 'array'
     or p_deleted_ids is null then
    raise exception 'Invalid workspace data' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_changes) loop
    if jsonb_typeof(item->'attempts') is distinct from 'array'
       or jsonb_array_length(item->'attempts') > 10000 then
      raise exception 'Invalid practice history' using errcode = '22023';
    end if;
    for attempt in select value from jsonb_array_elements(item->'attempts') loop
      if coalesce(attempt->>'id', '') = ''
         or coalesce(attempt->>'date', '') !~ '^\d{4}-\d{2}-\d{2}$'
         or (attempt->>'date')::date is null
         or jsonb_typeof(attempt->'minutes') is distinct from 'number'
         or (attempt->>'minutes')::numeric <= 0
         or (attempt->>'minutes')::numeric > 1440
         or jsonb_typeof(attempt->'language') is distinct from 'string'
         or jsonb_typeof(attempt->'note') is distinct from 'string'
         or coalesce(attempt->>'outcome', '') not in ('Solved', 'Revisit', 'Learning') then
        raise exception 'Invalid practice attempt' using errcode = '22023';
      end if;
    end loop;

    insert into public.questions (
      user_id, id, title, topic, difficulty, status, url, bookmarked, notes,
      solution, time_complexity, space_complexity, confidence, revision, attempts
    ) values (
      p_user_id, item->>'id', item->>'title', item->>'topic', item->>'difficulty',
      item->>'status', item->>'url', (item->>'bookmarked')::boolean,
      item->>'notes', item->>'solution', item->>'time', item->>'space',
      item->>'confidence', nullif(item->>'revision', '')::date, item->'attempts'
    ) on conflict (user_id, id) do update set
      title = excluded.title, topic = excluded.topic, difficulty = excluded.difficulty,
      status = excluded.status, url = excluded.url, bookmarked = excluded.bookmarked,
      notes = excluded.notes, solution = excluded.solution,
      time_complexity = excluded.time_complexity, space_complexity = excluded.space_complexity,
      confidence = excluded.confidence, revision = excluded.revision,
      attempts = excluded.attempts, updated_at = now();
  end loop;

  delete from public.questions where user_id = p_user_id and id = any(p_deleted_ids);

  -- An order must contain every remaining question ID exactly once.
  if cardinality(p_question_order) <> (select count(*) from public.questions where user_id = p_user_id)
     or cardinality(p_question_order) <> (select count(distinct value) from unnest(p_question_order) value)
     or exists (select 1 from unnest(p_question_order) value
       where not exists (select 1 from public.questions q where q.user_id = p_user_id and q.id = value)) then
    raise exception 'Invalid question order' using errcode = '22023';
  end if;

  update public.question_workspaces set daily_goal = p_daily_goal,
    question_order = p_question_order, revision = revision + 1,
    last_mutation_id = p_mutation_id, updated_at = now()
  where user_id = p_user_id returning revision into next_revision;
  return next_revision;
end;
$$;

-- 7. ONLY SIGNED-IN USERS MAY CALL THE WORKSPACE FUNCTIONS
revoke all on function public.read_question_workspace(uuid) from public, anon;
revoke all on function public.save_question_changes(uuid, bigint, uuid, integer, text[], jsonb, text[]) from public, anon;
grant execute on function public.read_question_workspace(uuid) to authenticated;
grant execute on function public.save_question_changes(uuid, bigint, uuid, integer, text[], jsonb, text[]) to authenticated;

commit;

-- 8. MANUAL ADMIN EXAMPLES (commented out; run separately after editing)
-- Add a profile after creating the Auth account:
-- insert into public.profiles (id, full_name)
-- values ('AUTH_USER_UID'::uuid, 'Your Name');
-- Verify accounts, profiles and question counts in the admin SQL Editor:
-- select u.id, u.email, p.full_name, count(q.id) as question_count
-- from auth.users u left join public.profiles p on p.id = u.id
-- left join public.questions q on q.user_id = u.id
-- group by u.id, u.email, p.full_name;
