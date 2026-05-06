-- Adicionar um usuário à tabela app_users para que o app mostre nome e role corretos.
-- Use quando criar um novo usuário no Auth do Supabase (Authentication → Users).
--
-- 1. No Supabase: Authentication → Users → copie o UUID do usuário.
-- 2. Substitua abaixo: UUID_DO_USUARIO, Nome do Usuário, executor (ou 'felipe' / 'admin').
-- 3. Defina can_access_feed = false para usuário sem acesso ao feed.
-- 3. Execute no SQL Editor.

insert into public.app_users (id, name, role, can_access_feed)
values (
  'UUID_DO_USUARIO',
  'Nome do Usuário',
  'executor',
  true
)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  can_access_feed = excluded.can_access_feed;
