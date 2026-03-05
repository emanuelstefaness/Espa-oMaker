-- Exclusão de demandas (soft delete): demandas excluídas somem das listas
-- mas continuam no banco e podem ser abertas em modo só leitura.

alter table public.tickets
add column if not exists excluida_em timestamptz;

comment on column public.tickets.excluida_em is 'Quando preenchido, a demanda foi excluída e não aparece nas listas.';
