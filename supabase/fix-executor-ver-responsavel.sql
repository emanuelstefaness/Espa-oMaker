-- Executores devem poder ver nome e avatar dos responsáveis nas demandas.
-- Hoje o RLS em app_users só permite: próprio perfil, admin ou Felipe.
-- Com isso, o join responsavel:responsavel_id ( name, avatar_url ) vinha null para executores.
-- Esta política permite que executores leiam todos os app_users (só leitura, para exibir nas listas).

drop policy if exists "app_users_select_executor" on public.app_users;

create policy "app_users_select_executor"
on public.app_users
for select
using (public.current_app_role() = 'executor');
