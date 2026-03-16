-- Tipo de receita (monetária ou contrapartida) e dados da contrapartida (material, quantidade).
-- Execute no SQL Editor do Supabase.

alter table public.tickets
  add column if not exists tipo_receita text check (tipo_receita in ('monetaria', 'contrapartida')) default 'monetaria',
  add column if not exists contrapartida_material text,
  add column if not exists contrapartida_quantidade numeric(12, 2);

comment on column public.tickets.tipo_receita is 'Receita monetária ou contrapartida (ex.: material)';
comment on column public.tickets.contrapartida_material is 'Material da contrapartida quando tipo_receita = contrapartida';
comment on column public.tickets.contrapartida_quantidade is 'Quantidade do material na contrapartida';
