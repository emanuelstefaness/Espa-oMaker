-- Sessões de trabalho (play/pause) por demanda para relatório de tempo e feed.
-- Execute no SQL Editor do Supabase.

create table if not exists public.ticket_work_sessions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references public.app_users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

comment on table public.ticket_work_sessions is 'Sessões de trabalho (play/pause) por demanda para relatório de tempo.';

create index if not exists ticket_work_sessions_ticket_idx on public.ticket_work_sessions (ticket_id);
create index if not exists ticket_work_sessions_user_idx on public.ticket_work_sessions (user_id);
create index if not exists ticket_work_sessions_started_idx on public.ticket_work_sessions (started_at);

alter table public.ticket_work_sessions enable row level security;

create policy "ticket_work_sessions_select_authenticated"
on public.ticket_work_sessions for select
using (auth.uid() is not null);

create policy "ticket_work_sessions_insert_own"
on public.ticket_work_sessions for insert
with check (auth.uid() = user_id);

create policy "ticket_work_sessions_update_own"
on public.ticket_work_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
