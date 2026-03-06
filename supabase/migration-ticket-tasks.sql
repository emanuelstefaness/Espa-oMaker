-- Tasks da demanda: subtarefas dentro de cada ticket
-- Execute no SQL Editor do Supabase.

create table if not exists public.ticket_tasks (
  id bigserial primary key,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  titulo text not null,
  descricao text,
  responsavel_id uuid not null references public.app_users (id),
  created_by uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  status text not null check (status in ('pendente', 'em_producao', 'concluido')) default 'pendente'
);

comment on table public.ticket_tasks is 'Tasks (subtarefas) de cada demanda.';

create index if not exists ticket_tasks_ticket_idx on public.ticket_tasks (ticket_id);

alter table public.ticket_tasks enable row level security;

create policy "ticket_tasks_select_all"
on public.ticket_tasks for select using (true);

create policy "ticket_tasks_insert_authenticated"
on public.ticket_tasks for insert
with check (auth.uid() is not null);

create policy "ticket_tasks_update_authenticated"
on public.ticket_tasks for update
using (auth.uid() is not null)
with check (auth.uid() is not null);
