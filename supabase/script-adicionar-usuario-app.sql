-- Adicionar um usuário à tabela app_users para que o app mostre nome e role corretos.
-- Use quando criar um novo usuário no Auth do Supabase (Authentication → Users).
--
-- 1. No Supabase: Authentication → Users → copie o UUID do usuário.
-- 2. Substitua abaixo: UUID_DO_USUARIO, Nome do Usuário, executor (ou 'felipe' / 'admin').
-- 3. Execute no SQL Editor.

insert into public.app_users (id, name, role)
values (
  'UUID_DO_USUARIO',
  'Nome do Usuário',
  'executor'
)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role;
