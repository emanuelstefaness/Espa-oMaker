-- Comentários em posts do feed
-- Execute no SQL Editor do Supabase.

create table if not exists public.feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  author_id uuid not null references public.app_users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

comment on table public.feed_post_comments is 'Comentários em posts do feed interno.';

create index if not exists feed_post_comments_post_idx on public.feed_post_comments (post_id);

alter table public.feed_post_comments enable row level security;

drop policy if exists "feed_post_comments_select_authenticated" on public.feed_post_comments;
create policy "feed_post_comments_select_authenticated"
on public.feed_post_comments for select
using (auth.uid() is not null);

drop policy if exists "feed_post_comments_insert_authenticated" on public.feed_post_comments;
create policy "feed_post_comments_insert_authenticated"
on public.feed_post_comments for insert
with check (auth.uid() is not null);
