-- DSA SPACE — SINGLE DATABASE SCHEMA AND MIGRATION SOURCE
-- Run this whole file once in Supabase SQL Editor. It is safe to rerun.
-- Existing profiles, personal questions, notes and attempts are preserved.
-- Question CONTENT is versioned separately in catalog/interview-pilot.json.
-- scripts/catalog-import.mjs validates that file and produces/resumes bounded batches.
-- Do not use the retired 44,810-question SQL import.
-- No password, service key or database connection string belongs in this file.
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
  topic text not null,
  difficulty text not null,
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

-- 3A. EXPANDED TOPICS AND UNRATED SOURCE PROBLEMS
-- Keep these lists aligned with src/config/topics.js. Existing rows are retained.
alter table public.questions drop constraint if exists questions_topic_check;
alter table public.questions add constraint questions_topic_check check (topic in (
  'Arrays & hashing', 'Two pointers', 'Sliding window', 'Stacks', 'Binary search',
  'Linked lists', 'Trees', 'Graphs', 'Strings', 'Sorting', 'Recursion', 'Backtracking',
  'Dynamic programming', 'Greedy', 'Heaps & priority queues', 'Tries',
  'Bit manipulation', 'Mathematics', 'Queues', 'Prefix sums', 'Disjoint sets',
  'Range queries', 'Algorithms'
));
alter table public.questions drop constraint if exists questions_difficulty_check;
alter table public.questions add constraint questions_difficulty_check
  check (difficulty in ('Easy', 'Medium', 'Hard', 'Unrated'));

alter table public.questions add column if not exists catalog_id text;
alter table public.questions add column if not exists catalog_version integer check (catalog_version > 0);

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
    (to_jsonb(q) - 'user_id' - 'created_at' - 'updated_at' - 'canonical_catalog_id'
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
      user_id, id, catalog_id, catalog_version, title, topic, difficulty, status, url, bookmarked, notes,
      solution, time_complexity, space_complexity, confidence, revision, attempts
    ) values (
      p_user_id, item->>'id', nullif(item->>'catalog_id', ''), nullif(item->>'catalog_version','')::integer, item->>'title', item->>'topic', item->>'difficulty',
      item->>'status', item->>'url', (item->>'bookmarked')::boolean,
      item->>'notes', item->>'solution', item->>'time', item->>'space',
      item->>'confidence', nullif(item->>'revision', '')::date, item->'attempts'
    ) on conflict (user_id, id) do update set
      catalog_id = excluded.catalog_id, catalog_version = excluded.catalog_version,
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

create table if not exists public.catalog_sources (
  id text primary key,
  name text not null unique,
  url text not null check (url ~ '^https://'),
  coverage text not null,
  updated_on date not null
);
create table if not exists public.catalog_questions (
  id text primary key check (length(id) <= 200),
  source text not null references public.catalog_sources(id),
  source_id text not null,
  platform text not null,
  title text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('Easy','Medium','Hard','Unrated')),
  url text not null unique check (url ~ '^https://'),
  tags text[] not null default '{}',
  summary text not null default '',
  source_rating integer,
  access text not null default 'unknown' check (access in ('free','premium','unknown')),
  attribution text not null,
  attribution_url text not null check (attribution_url ~ '^https://'),
  updated_on date not null,
  sort_order integer not null default 100,
  active boolean not null default true,
  unique (source, source_id)
);
create index if not exists catalog_filter_idx on public.catalog_questions(platform, topic, difficulty);
create index if not exists catalog_order_idx on public.catalog_questions(sort_order, title, id);
create index if not exists catalog_tags_idx on public.catalog_questions using gin(tags);
create table if not exists public.catalog_collections (
  id text primary key,
  title text not null,
  description text not null default '',
  sort_order integer not null default 100,
  published boolean not null default true
);
create table if not exists public.catalog_collection_items (
  collection_id text not null references public.catalog_collections(id) on delete cascade,
  question_id text not null references public.catalog_questions(id) on delete cascade,
  primary key (collection_id, question_id)
);

-- An optional catalog reference lets custom questions and old backups coexist.
-- A question's private fields remain snapshots: catalog updates never replace notes.
alter table public.questions drop constraint if exists questions_catalog_id_fkey;
alter table public.questions add constraint questions_catalog_id_fkey
  foreign key (catalog_id) references public.catalog_questions(id) on delete set null;
create unique index if not exists questions_user_catalog_unique
  on public.questions(user_id, catalog_id) where catalog_id is not null;

alter table public.catalog_sources enable row level security;
alter table public.catalog_questions enable row level security;
alter table public.catalog_collections enable row level security;
alter table public.catalog_collection_items enable row level security;
revoke all on public.catalog_sources, public.catalog_questions,
  public.catalog_collections, public.catalog_collection_items from public, anon, authenticated;
grant select on public.catalog_sources, public.catalog_questions,
  public.catalog_collections, public.catalog_collection_items to authenticated;
drop policy if exists "Read catalog sources" on public.catalog_sources;
create policy "Read catalog sources" on public.catalog_sources
  for select to authenticated using (true);
drop policy if exists "Read active catalog" on public.catalog_questions;
create policy "Read active catalog" on public.catalog_questions
  for select to authenticated using (active);
drop policy if exists "Read published collections" on public.catalog_collections;
create policy "Read published collections" on public.catalog_collections
  for select to authenticated using (published);
drop policy if exists "Read published collection items" on public.catalog_collection_items;
create policy "Read published collection items" on public.catalog_collection_items
  for select to authenticated using (exists (
    select 1 from public.catalog_collections c where c.id = collection_id and c.published
  ));

-- Shared identity: one catalog card can offer multiple verified source links.
-- Entries are grouped only through reviewed mappings, never fuzzy title matching.
create table if not exists public.catalog_question_families (
  question_id text primary key references public.catalog_questions(id) on delete cascade,
  canonical_id text not null references public.catalog_questions(id) on delete cascade,
  reason text not null default 'Original source question'
);
create index if not exists catalog_families_canonical_idx on public.catalog_question_families(canonical_id);
alter table public.catalog_question_families enable row level security;
revoke all on public.catalog_question_families from public, anon, authenticated;
grant select on public.catalog_question_families to authenticated;
drop policy if exists "Read question families" on public.catalog_question_families;
create policy "Read question families" on public.catalog_question_families
 for select to authenticated using (true);
insert into public.catalog_question_families(question_id,canonical_id)
 select id,id from public.catalog_questions on conflict do nothing;
alter table public.questions add column if not exists canonical_catalog_id text
 references public.catalog_questions(id) on delete set null;

-- 9. VERSIONED CONTENT, APPROACHES AND SOURCE LINKS
-- List queries return metadata only. The detail RPC loads one stored version.
-- Old versions are immutable; a personal question can pin a previous version.
alter table public.catalog_questions add column if not exists curated boolean not null default false;
alter table public.catalog_questions add column if not exists content_version integer;
alter table public.catalog_collections add column if not exists target_count integer;
create table if not exists public.catalog_question_content (
  question_id text not null references public.catalog_questions(id),
  version integer not null check (version > 0),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  verified_at timestamptz not null default now(),
  published_at timestamptz,
  primary key(question_id,version),
  check (length(btrim(document->>'description')) >= 80),
  check (jsonb_typeof(document->'examples') = 'array' and jsonb_array_length(document->'examples') >= 2),
  check (jsonb_typeof(document->'hints') = 'array' and jsonb_array_length(document->'hints') >= 2)
);
create table if not exists public.catalog_question_approaches (
  question_id text not null,
  content_version integer not null,
  id text not null,
  position integer not null,
  title text not null,
  explanation text not null,
  pseudocode text not null,
  time_complexity text not null,
  space_complexity text not null,
  assumptions text not null,
  primary key(question_id,content_version,id),
  foreign key(question_id,content_version) references public.catalog_question_content(question_id,version),
  check(length(title)>0 and length(explanation)>30 and length(pseudocode)>20),
  check(length(time_complexity)>0 and length(space_complexity)>0)
);
create table if not exists public.catalog_question_links (
  question_id text not null,
  content_version integer not null,
  id text not null,
  platform text not null,
  title text not null,
  source_id text not null,
  url text not null check (url ~ '^https://'),
  access text not null check(access in ('free','premium','unknown')),
  link_key text not null,
  primary key(question_id,content_version,id),
  unique(content_version,link_key),
  unique(content_version,id),
  foreign key(question_id,content_version) references public.catalog_question_content(question_id,version)
);
alter table public.questions drop constraint if exists questions_catalog_content_fkey;
alter table public.questions add constraint questions_catalog_content_fkey
 foreign key(canonical_catalog_id,catalog_version)
 references public.catalog_question_content(question_id,version);

-- 10. IMPORT MANIFESTS: admin-only, resumable, explicit publication
-- Importing a batch does not replace the active catalog. Publication verifies the
-- complete expected set, then switches the visible catalog in one transaction.
create table if not exists public.catalog_releases (
 id text primary key,
 expected_count integer not null check(expected_count between 1 and 6000),
 manifest jsonb not null,
 state text not null default 'draft' check(state in ('draft','published')),
 created_at timestamptz not null default now(),
 published_at timestamptz
);
create table if not exists public.catalog_release_items (
 release_id text not null references public.catalog_releases(id),
 question_id text not null,
 content_version integer not null,
 position integer not null,
 collections text[] not null,
 metadata jsonb not null,
 primary key(release_id,question_id),
 foreign key(question_id,content_version) references public.catalog_question_content(question_id,version)
);
alter table public.catalog_question_content enable row level security;
alter table public.catalog_question_approaches enable row level security;
alter table public.catalog_question_links enable row level security;
alter table public.catalog_releases enable row level security;
alter table public.catalog_release_items enable row level security;
revoke all on public.catalog_question_content, public.catalog_question_approaches,
 public.catalog_question_links, public.catalog_releases, public.catalog_release_items from public,anon,authenticated;
grant select on public.catalog_question_content, public.catalog_question_approaches,
 public.catalog_question_links to authenticated;
grant all on public.catalog_sources, public.catalog_questions, public.catalog_collections,
 public.catalog_collection_items, public.catalog_question_families, public.catalog_question_content,
 public.catalog_question_approaches, public.catalog_question_links, public.catalog_releases,
 public.catalog_release_items to service_role;
grant select,update on public.questions to service_role;

-- Saved content survives catalog retirement. Only its owner can read a pinned
-- retired version; other signed-in users see current published content only.
drop policy if exists "Read stored catalog content" on public.catalog_question_content;
create policy "Read stored catalog content" on public.catalog_question_content for select to authenticated using (
 published_at is not null and (
  exists(select 1 from public.catalog_questions q where q.id=question_id and q.active and q.content_version=version)
  or exists(select 1 from public.questions p join public.catalog_question_families f on f.question_id=p.catalog_id
    where p.user_id=(select auth.uid()) and f.canonical_id=catalog_question_content.question_id and p.catalog_version=catalog_question_content.version)
 )
);
drop policy if exists "Read stored approaches" on public.catalog_question_approaches;
create policy "Read stored approaches" on public.catalog_question_approaches for select to authenticated using (
 exists(select 1 from public.catalog_question_content c where c.question_id=catalog_question_approaches.question_id and c.version=content_version)
);
drop policy if exists "Read stored source links" on public.catalog_question_links;
create policy "Read stored source links" on public.catalog_question_links for select to authenticated using (
 exists(select 1 from public.catalog_question_content c where c.question_id=catalog_question_links.question_id and c.version=content_version)
);
drop policy if exists "Read active catalog" on public.catalog_questions;
create policy "Read active catalog" on public.catalog_questions for select to authenticated using (
 active or exists(select 1 from public.questions p join public.catalog_question_families f on f.question_id=p.catalog_id
 where p.user_id=(select auth.uid()) and f.canonical_id=catalog_questions.id)
);

-- 11. PRIVATE IMPORT IDENTITY AND CONTENT VERSION
-- Preserve historical extra copies rather than deleting independent user notes.
-- Only one old copy claims the canonical identity; new duplicate imports fail.
drop trigger if exists private_question_identity on public.questions;
drop index if exists public.questions_user_canonical_unique;
update public.questions set canonical_catalog_id=null where canonical_catalog_id is not null;
with ranked as (
 select q.user_id,q.id,f.canonical_id,row_number() over(partition by q.user_id,f.canonical_id order by q.created_at,q.id) as position
 from public.questions q join public.catalog_question_families f on f.question_id=q.catalog_id
)
update public.questions q set canonical_catalog_id=r.canonical_id from ranked r
 where q.user_id=r.user_id and q.id=r.id and r.position=1;
create unique index questions_user_canonical_unique on public.questions(user_id,canonical_catalog_id) where canonical_catalog_id is not null;
create or replace function public.set_private_question_identity()
returns trigger language plpgsql security invoker set search_path='' as $$
declare previous public.questions%rowtype;
begin
 -- Admin migrations may repair internal references; browser roles cannot.
 if TG_OP='UPDATE' and current_user in ('postgres','service_role') and new.catalog_id is not distinct from old.catalog_id then return new;end if;
 if new.catalog_id is null then new.canonical_catalog_id:=null;new.catalog_version:=null;return new;end if;
 if TG_OP='UPDATE' and new.catalog_id is not distinct from old.catalog_id then
  new.canonical_catalog_id:=old.canonical_catalog_id;
  new.catalog_version:=coalesce(new.catalog_version,old.catalog_version);
  return new;
 end if;
 if TG_OP='INSERT' then
  select * into previous from public.questions q where q.user_id=new.user_id and q.id=new.id;
  if found and previous.catalog_id is not distinct from new.catalog_id then
   new.canonical_catalog_id:=previous.canonical_catalog_id;
   new.catalog_version:=coalesce(new.catalog_version,previous.catalog_version);
   return new;
  end if;
 end if;
 select f.canonical_id into new.canonical_catalog_id from public.catalog_question_families f where f.question_id=new.catalog_id;
 return new;
end;
$$;
revoke all on function public.set_private_question_identity() from public,anon,authenticated;
create trigger private_question_identity before insert or update of catalog_id,canonical_catalog_id,catalog_version
 on public.questions for each row execute function public.set_private_question_identity();

-- Compatibility during setup: keep the existing catalog visible until publication.
create or replace function public.legacy_browse_catalog(
 p_query text default '', p_topic text default '', p_platform text default '',
 p_difficulty text default '', p_collection text default '', p_page integer default 1
) returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb; search_term text;
begin
 if auth.uid() is null then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_page is null or p_page < 1 or p_page > 100000 or length(coalesce(p_query,'')) > 120 then
  raise exception 'Invalid catalog filters' using errcode='22023';
 end if;
 search_term := '%'||replace(replace(replace(lower(btrim(coalesce(p_query,''))),E'\\',E'\\\\'),'%',E'\\%'),'_',E'\\_')||'%';
 with matched as materialized (
  select distinct f.canonical_id from public.catalog_questions q
  join public.catalog_question_families f on f.question_id=q.id
  where q.active
   and (coalesce(p_query,'')='' or lower(q.title||' '||q.source_id||' '||array_to_string(q.tags,' ')) like search_term)
   and (coalesce(p_topic,'')='' or q.topic=p_topic or p_topic=any(q.tags))
   and (coalesce(p_platform,'')='' or q.platform=p_platform)
   and (coalesce(p_difficulty,'')='' or q.difficulty=p_difficulty)
   and (coalesce(p_collection,'')='' or exists(select 1 from public.catalog_collection_items ci where ci.question_id=q.id and ci.collection_id=p_collection))
 ), paged as (
  select q.* from matched m join public.catalog_questions q on q.id=m.canonical_id and q.active
  order by q.sort_order,q.title,q.id limit 25 offset ((p_page-1)*25)
 ), cards as (
  select p.*, links.source_links, links.variant_ids from paged p
  cross join lateral (
   select jsonb_agg(jsonb_build_object('id',v.id,'platform',v.platform,'title',v.title,
    'source_id',v.source_id,'url',v.url,'difficulty',v.difficulty,'source_rating',v.source_rating,
    'access',v.access,'attribution',v.attribution,'attribution_url',v.attribution_url)
    order by v.sort_order,v.platform,v.id) as source_links,
    jsonb_agg(v.id order by v.sort_order,v.id) as variant_ids
   from public.catalog_question_families f join public.catalog_questions v on v.id=f.question_id and v.active
   where f.canonical_id=p.id
  ) links
 )
 select jsonb_build_object('total',(select count(*) from matched),'pageSize',25,
  'questions',coalesce((select jsonb_agg(to_jsonb(c)-'active'-'sort_order' order by c.sort_order,c.title,c.id) from cards c),'[]'::jsonb)) into result;
 return result;
end;
$$;

create or replace function public.legacy_catalog_metadata()
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Not authorized' using errcode='42501'; end if;
 return jsonb_build_object(
  'total',(select count(distinct f.canonical_id) from public.catalog_question_families f join public.catalog_questions q on q.id=f.question_id and q.active),
  'source_link_count',(select count(*) from public.catalog_questions where active),
  'sources',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('question_count',
    (select count(*) from public.catalog_questions q where q.source=s.id and q.active)) order by s.name) from public.catalog_sources s),'[]'::jsonb),
  'collections',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('question_count',
    (select count(distinct f.canonical_id) from public.catalog_collection_items ci
     join public.catalog_question_families f on f.question_id=ci.question_id
     join public.catalog_questions q on q.id=ci.question_id and q.active where ci.collection_id=c.id)) order by c.sort_order,c.title)
    from public.catalog_collections c where c.published),'[]'::jsonb)
 );
end;
$$;
revoke all on function public.legacy_browse_catalog(text,text,text,text,text,integer) from public, anon;
revoke all on function public.legacy_catalog_metadata() from public, anon;
grant execute on function public.legacy_browse_catalog(text,text,text,text,text,integer) to authenticated;
grant execute on function public.legacy_catalog_metadata() to authenticated;


-- 12. BROWSE METADATA ONLY; FILTER SOURCE LINKS WITHOUT DUPLICATING CARDS
create or replace function public.browse_catalog(
 p_query text default '',p_topic text default '',p_platform text default '',
 p_difficulty text default '',p_collection text default '',p_page integer default 1
) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;term text;
begin
 if auth.uid() is null then raise exception 'Not authorized' using errcode='42501';end if;
 if p_page is null or p_page<1 or p_page>100000 or length(coalesce(p_query,''))>120 then
  raise exception 'Invalid catalog filters' using errcode='22023';end if;
 if not exists(select 1 from public.catalog_question_content where published_at is not null) then
  return public.legacy_browse_catalog(p_query,p_topic,p_platform,p_difficulty,p_collection,p_page);end if;
 term:='%'||replace(replace(replace(lower(btrim(coalesce(p_query,''))),E'\\',E'\\\\'),'%',E'\\%'),'_',E'\\_')||'%';
 with matched as materialized (
  select q.* from public.catalog_questions q
  where q.active and q.curated and q.content_version is not null
   and exists(select 1 from public.catalog_question_content c where c.question_id=q.id and c.version=q.content_version and c.published_at is not null)
   and (coalesce(p_query,'')='' or lower(q.title||' '||q.source_id||' '||array_to_string(q.tags,' ')) like term
    or exists(select 1 from public.catalog_question_links l where l.question_id=q.id and l.content_version=q.content_version and lower(l.title||' '||l.source_id) like term))
   and (coalesce(p_topic,'')='' or q.topic=p_topic or p_topic=any(q.tags))
   and (coalesce(p_platform,'')='' or exists(select 1 from public.catalog_question_links l where l.question_id=q.id and l.content_version=q.content_version and l.platform=p_platform))
   and (coalesce(p_difficulty,'')='' or q.difficulty=p_difficulty)
   and (coalesce(p_collection,'')='' or exists(select 1 from public.catalog_collection_items ci join public.catalog_collections c on c.id=ci.collection_id and c.published where ci.question_id=q.id and ci.collection_id=p_collection))
 ), paged as (
  select * from matched order by sort_order,title,id limit 25 offset ((p_page-1)*25)
 ), cards as (
  select p.*,links.source_links,links.variant_ids from paged p cross join lateral (
   select jsonb_agg(to_jsonb(l)-'question_id'-'content_version'-'link_key' order by l.platform,l.id) as source_links,
    jsonb_agg(l.id order by l.id) as variant_ids
   from public.catalog_question_links l where l.question_id=p.id and l.content_version=p.content_version
  ) links
 ) select jsonb_build_object('total',(select count(*) from matched),'pageSize',25,
  'questions',coalesce((select jsonb_agg(to_jsonb(c)-'active'-'curated'-'sort_order' order by c.sort_order,c.title,c.id) from cards c),'[]'::jsonb)) into result;
 return result;
end;
$$;

create or replace function public.catalog_metadata()
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Not authorized' using errcode='42501';end if;
 if not exists(select 1 from public.catalog_question_content where published_at is not null) then return public.legacy_catalog_metadata();end if;
 return jsonb_build_object(
 'total',(select count(*) from public.catalog_questions where active and curated and content_version is not null),
 'sources',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'url',s.url,
   'coverage','Related practice links for independently authored DSA Space exercises.','updated_on',s.updated_on,
   'question_count',(select count(distinct l.question_id) from public.catalog_question_links l join public.catalog_questions q on q.id=l.question_id and q.content_version=l.content_version and q.active and q.curated where l.platform=s.name)) order by s.name)
  from public.catalog_sources s where exists(select 1 from public.catalog_question_links l join public.catalog_questions q on q.id=l.question_id and q.content_version=l.content_version and q.active and q.curated where l.platform=s.name)),'[]'::jsonb),
 'collections',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('question_count',
   (select count(*) from public.catalog_collection_items ci join public.catalog_questions q on q.id=ci.question_id and q.active and q.curated where ci.collection_id=c.id)) order by c.sort_order,c.title)
   from public.catalog_collections c where c.published),'[]'::jsonb));
end;
$$;

create or replace function public.read_catalog_question(p_id text,p_version integer default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare root_id text;question public.catalog_questions%rowtype;stored public.catalog_question_content%rowtype;
begin
 if auth.uid() is null then raise exception 'Not authorized' using errcode='42501';end if;
 select canonical_id into root_id from public.catalog_question_families where question_id=p_id;
 select * into question from public.catalog_questions where id=coalesce(root_id,p_id);
 if not found then raise exception 'Stored content is not available for this question' using errcode='P0002';end if;
 select * into stored from public.catalog_question_content where question_id=question.id and version=coalesce(p_version,question.content_version) and published_at is not null;
 if not found then raise exception 'Stored content is not available for this question' using errcode='P0002';end if;
 return jsonb_build_object('id',question.id,'title',question.title,'topic',question.topic,'difficulty',question.difficulty,
  'version',stored.version,'latest_version',question.content_version,'content',stored.document,
  'approaches',coalesce((select jsonb_agg(to_jsonb(a)-'question_id'-'content_version'-'position' order by a.position) from public.catalog_question_approaches a where a.question_id=question.id and a.content_version=stored.version),'[]'::jsonb),
  'source_links',coalesce((select jsonb_agg(to_jsonb(l)-'question_id'-'content_version'-'link_key' order by l.platform,l.id) from public.catalog_question_links l where l.question_id=question.id and l.content_version=stored.version),'[]'::jsonb));
end;
$$;
revoke all on function public.browse_catalog(text,text,text,text,text,integer),public.catalog_metadata(),public.read_catalog_question(text,integer) from public,anon;
grant execute on function public.browse_catalog(text,text,text,text,text,integer),public.catalog_metadata(),public.read_catalog_question(text,integer) to authenticated;

-- 13. ADMIN BATCH IMPORT
-- Called from SQL Editor or a LOCAL server-key script. Never grant to authenticated.
-- A repeated identical batch is safe. Changing a saved version requires a new version.
create or replace function public.import_catalog_batch(p_manifest jsonb,p_questions jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare release public.catalog_releases%rowtype;item jsonb;q jsonb;a jsonb;l jsonb;existing jsonb;position integer;stored_version integer;key text;prior public.catalog_release_items%rowtype;example jsonb;
begin
 if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions) not between 1 and 25
  or coalesce(p_manifest->>'release_id','')='' or (p_manifest->>'expected_count')::integer not between 1 and 6000 then
  raise exception 'Invalid catalog import manifest or batch';end if;
 insert into public.catalog_releases(id,expected_count,manifest) values(p_manifest->>'release_id',(p_manifest->>'expected_count')::integer,p_manifest)
  on conflict(id) do nothing;
 select * into release from public.catalog_releases where id=p_manifest->>'release_id' for update;
 if release.manifest<>p_manifest then raise exception 'Release manifest changed; use a new release ID';end if;
 for item in select value from jsonb_array_elements(p_questions) loop
  q:=item->'question';stored_version:=(item->>'version')::integer;
  select * into prior from public.catalog_release_items where release_id=release.id and question_id=q->>'id';
  if found then
   if prior.metadata<>q or prior.content_version<>stored_version or to_jsonb(prior.collections)<>item->'collections' then raise exception 'Release item changed; use a new release ID';end if;
  elsif release.state='published' then raise exception 'Published releases cannot accept new questions';end if;
  if coalesce(q->>'id','')='' or stored_version<1 or length(coalesce(item->'content'->>'description',''))<80
   or jsonb_typeof(item->'content'->'examples') is distinct from 'array' or jsonb_array_length(item->'content'->'examples')<2
   or jsonb_typeof(item->'content'->'constraints') is distinct from 'array' or jsonb_array_length(item->'content'->'constraints')<1
   or jsonb_typeof(item->'content'->'hints') is distinct from 'array' or jsonb_array_length(item->'content'->'hints')<2
   or coalesce(item->'content'->>'license','')<>'CC-BY-4.0'
   or length(coalesce(item->'content'->>'authorship',''))<30
   or length(coalesce(item->'content'->>'input_format',''))<5 or length(coalesce(item->'content'->>'output_format',''))<5
   or jsonb_typeof(item->'approaches') is distinct from 'array' or jsonb_array_length(item->'approaches')<1
   or jsonb_typeof(item->'links') is distinct from 'array' or jsonb_array_length(item->'links')<1 then
    raise exception 'Incomplete question %',q->>'id';end if;
  for example in select value from jsonb_array_elements(item->'content'->'examples') loop
   if jsonb_typeof(example->'input') is distinct from 'object' or not (example ? 'output') or length(coalesce(example->>'explanation',''))<15 then raise exception 'Invalid example for %',q->>'id';end if;
  end loop;
  select document into existing from public.catalog_question_content where question_id=q->>'id' and version=stored_version;
  if found then
   if existing<>item->'content' or
    (select jsonb_agg(to_jsonb(x)-'question_id'-'content_version'-'position' order by x.position) from public.catalog_question_approaches x where x.question_id=q->>'id' and x.content_version=stored_version)<>item->'approaches' or
    (select jsonb_agg(to_jsonb(x)-'question_id'-'content_version'-'link_key' order by id) from public.catalog_question_links x where x.question_id=q->>'id' and x.content_version=stored_version)<>
    (select jsonb_agg(value order by value->>'id') from jsonb_array_elements(item->'links')) then
     raise exception 'Version % of % is immutable; increment version',stored_version,q->>'id';end if;
  else
   if release.state='published' then raise exception 'Published releases cannot accept new questions';end if;
   insert into public.catalog_questions(id,source,source_id,platform,title,topic,difficulty,url,tags,summary,source_rating,access,attribution,attribution_url,updated_on,sort_order,active)
   values(q->>'id',q->>'source',q->>'source_id',q->>'platform',q->>'title',q->>'topic',q->>'difficulty',q->>'url',array(select jsonb_array_elements_text(q->'tags')),q->>'summary',(q->>'source_rating')::integer,q->>'access',q->>'attribution',q->>'attribution_url',(q->>'updated_on')::date,(q->>'sort_order')::integer,false)
   on conflict(id) do nothing;
   insert into public.catalog_question_families(question_id,canonical_id) values(q->>'id',q->>'id') on conflict do nothing;
   insert into public.catalog_question_content(question_id,version,document) values(q->>'id',stored_version,item->'content');
   position:=0;
   for a in select value from jsonb_array_elements(item->'approaches') loop
    insert into public.catalog_question_approaches values(q->>'id',stored_version,a->>'id',position,a->>'title',a->>'explanation',a->>'pseudocode',a->>'time_complexity',a->>'space_complexity',a->>'assumptions');
    position:=position+1;
   end loop;
   for l in select value from jsonb_array_elements(item->'links') loop
    key:=rtrim(replace(lower(split_part(split_part(l->>'url','?',1),'#',1)),'://www.','://'),'/');
    insert into public.catalog_question_links values(q->>'id',stored_version,l->>'id',l->>'platform',l->>'title',l->>'source_id',l->>'url',l->>'access',key);
   end loop;
  end if;
  insert into public.catalog_release_items values(release.id,q->>'id',stored_version,(q->>'sort_order')::integer,array(select jsonb_array_elements_text(item->'collections')),q)
   on conflict(release_id,question_id) do nothing;
 end loop;
 return jsonb_build_object('release',release.id,'imported',(select count(*) from public.catalog_release_items where release_id=release.id),'expected',release.expected_count);
end;
$$;

create or replace function public.publish_catalog_release(p_release_id text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare release public.catalog_releases%rowtype;collection jsonb;counted integer;
begin
 select * into release from public.catalog_releases where id=p_release_id for update;
 if not found then raise exception 'Release not found';end if;
 if release.state='published' then return jsonb_build_object('release',release.id,'questions',release.expected_count,'state','published');end if;
 select count(*) into counted from public.catalog_release_items where release_id=release.id;
 if counted<>release.expected_count then raise exception 'Incomplete release: % of % questions',counted,release.expected_count;end if;
 if exists(select 1 from public.catalog_release_items i where i.release_id=release.id and not exists(
  select 1 from public.catalog_question_approaches a where a.question_id=i.question_id and a.content_version=i.content_version)) then raise exception 'Question is missing approaches';end if;
 update public.catalog_question_content c set published_at=coalesce(c.published_at,now()) from public.catalog_release_items i
  where i.release_id=release.id and i.question_id=c.question_id and i.content_version=c.version;
 -- Soft retirement preserves old references and every user's notes/history.
 update public.catalog_questions set active=false where active;
 update public.catalog_questions q set active=true,curated=true,content_version=i.content_version,sort_order=i.position,
  title=i.metadata->>'title', topic=i.metadata->>'topic', difficulty=i.metadata->>'difficulty',
  tags=array(select jsonb_array_elements_text(i.metadata->'tags')),summary=i.metadata->>'summary'
  from public.catalog_release_items i where i.release_id=release.id and i.question_id=q.id;
 update public.catalog_collections set published=false where published;
 for collection in select value from jsonb_array_elements(release.manifest->'collections') loop
  insert into public.catalog_collections(id,title,description,sort_order,published,target_count)
  values(collection->>'id',collection->>'title',collection->>'description',(collection->>'sort_order')::integer,true,(collection->>'target_count')::integer)
  on conflict(id) do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order,published=true,target_count=excluded.target_count;
  delete from public.catalog_collection_items where collection_id=collection->>'id';
  insert into public.catalog_collection_items select collection->>'id',question_id from public.catalog_release_items where release_id=release.id and (collection->>'id')=any(collections);
 end loop;
 -- Map only the reviewed practice identities in this complete release.
 update public.catalog_question_families f set canonical_id=l.question_id,reason='Reviewed related practice identity'
  from public.catalog_question_links l join public.catalog_release_items i on i.question_id=l.question_id and i.content_version=l.content_version and i.release_id=release.id
  where f.question_id=l.id;
 if exists(select 1 from public.catalog_question_families f join public.catalog_question_families root on root.question_id=f.canonical_id where root.canonical_id<>root.question_id) then raise exception 'Question identity mappings must not form chains';end if;
 update public.questions set canonical_catalog_id=null where canonical_catalog_id is not null;
 with ranked as (
  select p.user_id,p.id,f.canonical_id,row_number() over(partition by p.user_id,f.canonical_id order by p.created_at,p.id) as position
  from public.questions p join public.catalog_question_families f on f.question_id=p.catalog_id
 ) update public.questions p set canonical_catalog_id=r.canonical_id from ranked r where p.user_id=r.user_id and p.id=r.id and r.position=1;
 -- Existing imported pilot questions gain a content pin, without changing notes.
 update public.questions p set catalog_version=i.content_version
  from public.catalog_question_families f join public.catalog_release_items i on i.question_id=f.canonical_id and i.release_id=release.id
  where p.catalog_id=f.question_id and p.catalog_version is null;
 update public.catalog_releases set state='published',published_at=now() where id=release.id;
 return jsonb_build_object('release',release.id,'questions',counted,'state','published');
end;
$$;
revoke all on function public.import_catalog_batch(jsonb,jsonb),public.publish_catalog_release(text) from public,anon,authenticated;
grant execute on function public.import_catalog_batch(jsonb,jsonb),public.publish_catalog_release(text) to service_role;

-- 14. SOURCE REGISTRY ONLY (NO BULK QUESTION SEED)
insert into public.catalog_sources(id,name,url,coverage,updated_on) values
 ('leetcode','LeetCode','https://leetcode.com/problemset/','Related practice links. Stored exercise text is independently authored.','2026-11-03'),
 ('gfg','GeeksforGeeks','https://www.geeksforgeeks.org/explore','Related practice links.','2026-11-03'),
 ('cses','CSES','https://cses.fi/problemset/','Related practice links; the DSA Space edition may use a different input format.','2026-11-03'),
 ('hackerrank','HackerRank','https://www.hackerrank.com/domains/algorithms','Related practice links.','2026-11-03'),
 ('interviewbit','InterviewBit','https://www.interviewbit.com/coding-interview-questions/','Related practice links.','2026-11-03'),
 ('code360','Code360','https://www.naukri.com/code360/problems','Curated related practice links; availability may vary.','2026-11-03')
 on conflict(id) do update set coverage=excluded.coverage,updated_on=excluded.updated_on;

-- 15. ADMIN EXAMPLES (commented, never creates users automatically)
-- First create an account under Authentication > Users. Copy that account's UID:
-- insert into public.profiles(id,full_name) values('AUTH-USER-UUID','Full Name')
-- on conflict(id) do update set full_name=excluded.full_name;
-- select p.id,p.full_name,u.email from public.profiles p join auth.users u on u.id=p.id;
-- Import: node scripts/catalog-import.mjs --sql (creates bounded admin SQL files).
-- Or run locally with SUPABASE_URL and SUPABASE_SECRET_KEY: --apply
-- Export shared content: node scripts/catalog-import.mjs --export catalog-backup.json
-- Use a server secret ONLY on your local machine; never VITE_ or a browser bundle.
-- Authentication users can read the catalog and edit only their own workspace.
commit;
