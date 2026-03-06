-- Apaga APENAS as tasks cujo responsável é o Felipe (role = 'felipe').
-- Execute no SQL Editor do Supabase.

delete from public.ticket_tasks
where responsavel_id in (
  select id from public.app_users where role = 'felipe'
);
