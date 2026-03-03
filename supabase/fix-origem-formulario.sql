-- Migração: adicionar coluna origem e política para formulário público (Opção A)
-- Execute no SQL Editor do Supabase se a tabela tickets já existir sem a coluna origem.

alter table public.tickets
add column if not exists origem text not null check (origem in ('interno', 'formulario')) default 'interno';

-- Política para permitir insert anônimo quando origem = 'formulario' (link WhatsApp)
create policy "tickets_insert_formulario_anon"
on public.tickets
for insert
with check (origem = 'formulario');
