-- =============================================================================
-- SCRIPT ÚNICO: tudo que você deve rodar no SQL Editor do Supabase
-- para deixar o banco alinhado com o app.
--
-- Inclui:
-- 1. Tickets: valor_demanda, nivel_dificuldade
-- 2. App_users: avatar_url
-- 3. Storage: bucket e políticas para avatares
-- 4. Categorias: migração de dados + nova constraint (servicos_3d, reparos, etc.)
-- 5. Material impressão: nova constraint (PLA, TPU, PETG, ABS, TRITAN, RESINA, OUTROS)
-- 6. Formulário público (/solicitar): fotos sem login (upload anon)
--
-- Execute em ordem. Pode rodar mais de uma vez (usa IF NOT EXISTS / IF EXISTS).
-- Se já rodou fix-categoria-constraint.sql, as partes 4 e 5 já estão ok.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TICKETS: valor da demanda e nível de dificuldade (colunas)
-- -----------------------------------------------------------------------------
alter table public.tickets
add column if not exists valor_demanda numeric(12, 2);

alter table public.tickets
add column if not exists nivel_dificuldade text check (nivel_dificuldade in ('baixa', 'media', 'alta'));

comment on column public.tickets.valor_demanda is 'Valor lançado da demanda para relatório';
comment on column public.tickets.nivel_dificuldade is 'Nível de dificuldade: baixa, media, alta (opcional na UI)';

-- -----------------------------------------------------------------------------
-- 2. APP_USERS: avatar (foto do usuário)
-- -----------------------------------------------------------------------------
alter table public.app_users
add column if not exists avatar_url text;

-- -----------------------------------------------------------------------------
-- 3. STORAGE: bucket e políticas para avatares
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar leitura pública" on storage.objects;
create policy "Avatar leitura pública"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Avatar upload próprio" on storage.objects;
create policy "Avatar upload próprio"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Avatar update próprio" on storage.objects;
create policy "Avatar update próprio"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- -----------------------------------------------------------------------------
-- 4. CATEGORIAS: migrar valores antigos para os novos
-- Ordem obrigatória: DROP -> UPDATE dados -> ADD constraint (senão a constraint
-- falha ao ser criada se ainda existirem linhas com valores antigos).
-- -----------------------------------------------------------------------------
alter table public.tickets drop constraint if exists tickets_categoria_check;

update public.tickets set categoria = 'servicos_3d' where categoria in ('impressao_3d', 'modelagem_3d');
update public.tickets set categoria = 'reparos' where categoria = 'reparo';
update public.tickets set categoria = 'outros' where categoria = 'laser';

alter table public.tickets
add constraint tickets_categoria_check check (
  categoria in (
    'servicos_3d', 'reparos', 'engenharia', 'workshop',
    'sublimacao', 'saude', 'servicos_gerais', 'outros'
  )
);

-- -----------------------------------------------------------------------------
-- 5. MATERIAL IMPRESSÃO: incluir TPU e TRITAN
-- -----------------------------------------------------------------------------
alter table public.tickets drop constraint if exists tickets_material_impressao_check;

alter table public.tickets
add constraint tickets_material_impressao_check check (
  material_impressao in ('PLA', 'TPU', 'PETG', 'ABS', 'TRITAN', 'RESINA', 'OUTROS')
);

-- -----------------------------------------------------------------------------
-- 6. FORMULÁRIO PÚBLICO (/solicitar): fotos sem login
-- -----------------------------------------------------------------------------
-- uploaded_by opcional para demandas do formulário (anon)
alter table public.ticket_files
alter column uploaded_by drop not null;

-- Função usada pela política de storage (upload anon só para tickets origem=formulario)
create or replace function public.ticket_permite_upload_anon(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.tickets where id = p_ticket_id and origem = 'formulario');
$$;

-- Storage: permitir insert anon quando o path é de um ticket formulário
drop policy if exists "Permitir upload anon para tickets formulario" on storage.objects;
create policy "Permitir upload anon para tickets formulario"
on storage.objects
for insert
with check (
  bucket_id = 'ticket-files'
  and (
    auth.role() = 'authenticated'
    or public.ticket_permite_upload_anon(split_part(name, '/', 1)::uuid)
  )
);

-- ticket_files: insert anon só com uploaded_by null e ticket com origem formulario
drop policy if exists "ticket_files_insert_formulario_anon" on public.ticket_files;
create policy "ticket_files_insert_formulario_anon"
on public.ticket_files
for insert
with check (
  uploaded_by is null
  and exists (
    select 1 from public.tickets t
    where t.id = ticket_id and t.origem = 'formulario'
  )
);

-- =============================================================================
-- FIM. Após executar, ative Realtime na tabela tickets se quiser dashboard
-- em tempo real: Database → Replication → marque a tabela public.tickets.
-- =============================================================================
