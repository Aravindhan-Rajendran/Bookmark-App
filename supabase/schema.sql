-- Run this in Supabase SQL Editor to create the bookmarks table and policies.
-- Safe to run multiple times (drops existing trigger/policies first).

-- Table: bookmarks (private per user)
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  created_at timestamptz not null default now()
);

-- Ensure user_id is set from the authenticated user on insert (client only sends url, title)
create or replace function public.set_bookmark_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists so we can re-run this script
drop trigger if exists set_bookmark_user_id on public.bookmarks;
create trigger set_bookmark_user_id
  before insert on public.bookmarks
  for each row execute function public.set_bookmark_user_id();

-- Row Level Security: users can only see/edit their own bookmarks
alter table public.bookmarks enable row level security;

-- Drop existing policies so we can re-run this script
drop policy if exists "Users can view own bookmarks" on public.bookmarks;
drop policy if exists "Users can insert own bookmarks" on public.bookmarks;
drop policy if exists "Users can update own bookmarks" on public.bookmarks;
drop policy if exists "Users can delete own bookmarks" on public.bookmarks;

create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- Enable Realtime for bookmarks (so list updates without refresh)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookmarks'
  ) then
    alter publication supabase_realtime add table public.bookmarks;
  end if;
end $$;
