-- Corrige "stack depth limit exceeded" e permite triagem ler app_users.
-- Execute este script no SQL Editor do seu projeto Supabase (uma vez).

-- 1) current_app_role() com SECURITY DEFINER evita recursão nas políticas RLS
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where id = auth.uid()
$$;

-- 2) Política para Felipe (triagem) listar todos os usuários
drop policy if exists "app_users_select_felipe_triagem" on public.app_users;

create policy "app_users_select_felipe_triagem"
on public.app_users
for select
using (public.current_app_role() = 'felipe');

-- 3) Responsável ou colaborador podem alterar fluxo (status) e cancelar demanda
drop policy if exists "tickets_update_by_executor_after_assigned" on public.tickets;

create policy "tickets_update_by_responsavel_or_colaborador"
on public.tickets
for update
using (
  public.current_app_role() = 'executor'
  and (auth.uid() = responsavel_id or auth.uid() = colaborador_id)
)
with check (
  public.current_app_role() = 'executor'
  and (auth.uid() = responsavel_id or auth.uid() = colaborador_id)
);
