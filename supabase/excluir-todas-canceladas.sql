-- Marca todas as demandas CANCELADAS como excluídas (excluida_em).
-- Elas somem das listas e do card Canceladas; continuam no banco em modo só leitura.
-- Execute no SQL Editor do Supabase (uma vez).

update public.tickets
set excluida_em = now()
where status = 'cancelada'
  and excluida_em is null;
