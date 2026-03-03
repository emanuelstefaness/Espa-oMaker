-- Migração: executores podem ter as mesmas funções que Felipe, exceto atribuir responsável
-- Execute no SQL Editor do Supabase após aplicar o schema principal.

-- Remover política antiga (executor só atualizava quando era responsável/colaborador)
drop policy if exists "tickets_update_by_responsavel_or_colaborador" on public.tickets;

-- Nova política: qualquer executor pode atualizar qualquer demanda
create policy "tickets_update_by_executor"
on public.tickets
for update
using (public.current_app_role() = 'executor')
with check (public.current_app_role() = 'executor');

-- Função + trigger: só Felipe pode alterar responsavel_id e colaborador_id
create or replace function public.tickets_block_executor_assign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_app_role() = 'executor' then
    if old.responsavel_id is distinct from new.responsavel_id
       or old.colaborador_id is distinct from new.colaborador_id then
      raise exception 'Apenas triagem (Felipe) pode atribuir responsável ou colaborador.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_block_executor_assign_trigger on public.tickets;
create trigger tickets_block_executor_assign_trigger
  before update on public.tickets
  for each row
  execute function public.tickets_block_executor_assign();
