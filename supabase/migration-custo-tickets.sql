-- Campo Custo por demanda (para relatório de despesas e receita líquida)
-- Execute no SQL Editor do Supabase.

alter table public.tickets
  add column if not exists custo numeric(12, 2);

comment on column public.tickets.custo is 'Custo da demanda para relatório de despesas e receita líquida';
