-- Limpa todas as sessões de trabalho (horas trabalhadas / play-pause).
-- Execute no SQL Editor do Supabase quando quiser zerar os dados de tempo.
-- Atenção: esta ação não pode ser desfeita.

-- Remove todos os registros da tabela de sessões de trabalho
truncate table public.ticket_work_sessions;

-- Opcional: confira que a tabela está vazia
-- select count(*) from public.ticket_work_sessions;
