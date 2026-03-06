-- Feed interno: posts (atualizações, bugs, ideias) com anexos e vínculo opcional a demandas
-- Execute no SQL Editor do Supabase.

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.app_users (id) on delete cascade,
  tipo text not null check (tipo in ('atualizacao', 'bug', 'ideia')),
  conteudo text not null,
  ticket_id uuid references public.tickets (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.feed_posts is 'Posts do feed interno (atualizações, bugs, ideias).';

create index if not exists feed_posts_created_at_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_author_idx on public.feed_posts (author_id);
create index if not exists feed_posts_ticket_idx on public.feed_posts (ticket_id);

create table if not exists public.feed_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  uploaded_by uuid references public.app_users (id),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists feed_post_attachments_post_idx on public.feed_post_attachments (post_id);

alter table public.feed_posts enable row level security;
alter table public.feed_post_attachments enable row level security;

drop policy if exists "feed_posts_select_authenticated" on public.feed_posts;
create policy "feed_posts_select_authenticated"
on public.feed_posts for select
using (auth.uid() is not null);

drop policy if exists "feed_posts_insert_authenticated" on public.feed_posts;
create policy "feed_posts_insert_authenticated"
on public.feed_posts for insert
with check (auth.uid() is not null);

drop policy if exists "feed_post_attachments_select_authenticated" on public.feed_post_attachments;
create policy "feed_post_attachments_select_authenticated"
on public.feed_post_attachments for select
using (auth.uid() is not null);

drop policy if exists "feed_post_attachments_insert_authenticated" on public.feed_post_attachments;
create policy "feed_post_attachments_insert_authenticated"
on public.feed_post_attachments for insert
with check (auth.uid() is not null);

-- Bucket para anexos do feed (criar no painel Storage se preferir)
insert into storage.buckets (id, name, public)
values ('feed-files', 'feed-files', true)
on conflict (id) do nothing;

drop policy if exists "feed_files_select" on storage.objects;
create policy "feed_files_select"
on storage.objects for select
using (bucket_id = 'feed-files');

drop policy if exists "feed_files_insert_authenticated" on storage.objects;
create policy "feed_files_insert_authenticated"
on storage.objects for insert
with check (
  bucket_id = 'feed-files'
  and auth.uid() is not null
);
