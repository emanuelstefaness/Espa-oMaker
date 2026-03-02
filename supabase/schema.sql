-- Esquema Supabase para gerenciamento de demandas do Espaço Maker

-- Tabela de usuários de aplicação (espelha auth.users com metadados relevantes)
create table if not exists public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null check (role in ('felipe', 'executor', 'admin')),
  created_at timestamptz not null default now()
);

comment on table public.app_users is 'Usuários da aplicação: Felipe (triagem), executores e admin.';

-- Tabela principal de demandas
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  codigo text generated always as (
    'DM-' || lpad((extract(epoch from data_criacao)::bigint % 100000)::text, 5, '0')
  ) stored,
  titulo text not null,
  descricao text,

  tipo text not null check (tipo in ('interna', 'externa')),

  solicitante_nome text not null,
  solicitante_telefone text,

  categoria text not null check (
    categoria in ('impressao_3d', 'modelagem_3d', 'reparo', 'laser', 'outros')
  ),
  prioridade text not null check (
    prioridade in ('baixa', 'media', 'alta', 'urgente')
  ),

  status text not null check (
    status in (
      'recebida',
      'em_analise',
      'orcamento_em_criacao',
      'aguardando_aprovacao',
      'aprovado',
      'em_producao',
      'pos_processo',
      'pronta',
      'entregue',
      'cancelada'
    )
  ) default 'recebida',

  responsavel_id uuid references public.app_users (id),
  colaborador_id uuid references public.app_users (id),

  data_criacao date not null default current_date,
  data_entrega date,

  material_impressao text check (
    material_impressao in ('PLA', 'PETG', 'ABS', 'RESINA', 'OUTROS')
  ),
  cor text,
  quantidade_pecas integer,
  tamanho_escala text,
  observacoes_tecnicas text,

  preco_por_peca numeric(10, 2),
  quantidade_orcamento integer,
  total_orcamento numeric(12, 2),
  desconto numeric(10, 2),
  observacoes_orcamento text,
  status_orcamento text check (
    status_orcamento in (
      'aguardando_aprovacao',
      'aprovado',
      'reprovado'
    )
  ),
  sem_cobranca boolean not null default false,

  created_by uuid references public.app_users (id),
  updated_at timestamptz not null default now()
);

comment on table public.tickets is 'Demanda principal do Espaço Maker.';

create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_responsavel_idx on public.tickets (responsavel_id);
create index if not exists tickets_prioridade_idx on public.tickets (prioridade);
create index if not exists tickets_data_entrega_idx on public.tickets (data_entrega);

-- Tabela de histórico / timeline
create table if not exists public.ticket_logs (
  id bigserial primary key,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  created_at timestamptz not null default now(),
  actor_id uuid references public.app_users (id),
  action text not null,
  data jsonb
);

comment on table public.ticket_logs is 'Timeline / log de ações por demanda.';

create index if not exists ticket_logs_ticket_idx on public.ticket_logs (ticket_id);

-- Tabela de comentários de feed interno
create table if not exists public.ticket_comments (
  id bigserial primary key,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  created_at timestamptz not null default now(),
  author_id uuid not null references public.app_users (id),
  body text not null
);

create index if not exists ticket_comments_ticket_idx on public.ticket_comments (ticket_id);

-- Tabela de anexos (fotos, arquivos STL, etc)
create table if not exists public.ticket_files (
  id bigserial primary key,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  created_at timestamptz not null default now(),
  uploaded_by uuid not null references public.app_users (id),
  kind text not null check (kind in ('foto', 'arquivo')),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint
);

create index if not exists ticket_files_ticket_idx on public.ticket_files (ticket_id);

-- Storage: bucket para anexos ------------------------------------------------
-- Crie um bucket chamado 'ticket-files' no painel de Storage do Supabase.
-- Depois aplique estas políticas para permitir leitura pública e escrita autenticada.

insert into storage.buckets (id, name, public)
values ('ticket-files', 'ticket-files', true)
on conflict (id) do nothing;

create policy "Permitir leitura pública dos arquivos de tickets"
on storage.objects
for select
using (bucket_id = 'ticket-files');

create policy "Permitir upload autenticado para arquivos de tickets"
on storage.objects
for insert
with check (
  bucket_id = 'ticket-files'
  and auth.role() = 'authenticated'
);

-- RLS / Permissões --------------------------------------------------------

alter table public.app_users enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_logs enable row level security;
alter table public.ticket_comments enable row level security;
alter table public.ticket_files enable row level security;

-- Helper: role atual
create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select role
  from public.app_users
  where id = auth.uid()
$$;

-- app_users: cada usuário só vê/edita a si mesmo, admin vê todos
create policy "app_users_select_self_or_admin"
on public.app_users
for select
using (
  auth.uid() = id
  or public.current_app_role() = 'admin'
);

create policy "app_users_update_self_or_admin"
on public.app_users
for update
using (
  auth.uid() = id
  or public.current_app_role() = 'admin'
);

-- tickets: todos podem ver, mas regras de escrita específicas
create policy "tickets_select_all"
on public.tickets
for select
using (true);

-- criação: qualquer usuário autenticado pode criar
create policy "tickets_insert_any_authenticated"
on public.tickets
for insert
with check (auth.uid() is not null);

-- atualização por Felipe (triagem) - pode mudar responsável, triagem, status inicial
create policy "tickets_update_by_felipe_triagem"
on public.tickets
for update
using (public.current_app_role() = 'felipe')
with check (public.current_app_role() = 'felipe');

-- atualização por executores - apenas em etapas de produção/pós/pronta/entregue
create policy "tickets_update_by_executor_after_assigned"
on public.tickets
for update
using (
  public.current_app_role() = 'executor'
  and auth.uid() = responsavel_id
  and status in ('em_producao', 'pos_processo', 'pronta', 'entregue')
)
with check (
  public.current_app_role() = 'executor'
  and auth.uid() = responsavel_id
  and status in ('em_producao', 'pos_processo', 'pronta', 'entregue')
);

-- logs, comentários e arquivos: qualquer usuário autenticado envolvido pode inserir
create policy "ticket_logs_select_all"
on public.ticket_logs
for select
using (true);

create policy "ticket_logs_insert_authenticated"
on public.ticket_logs
for insert
with check (auth.uid() is not null);

create policy "ticket_comments_select_all"
on public.ticket_comments
for select
using (true);

create policy "ticket_comments_insert_authenticated"
on public.ticket_comments
for insert
with check (auth.uid() is not null);

create policy "ticket_files_select_all"
on public.ticket_files
for select
using (true);

create policy "ticket_files_insert_authenticated"
on public.ticket_files
for insert
with check (auth.uid() is not null);

-- SEED INICIAL DE USUÁRIOS -----------------------------------------------
-- Execute antes disso a criação dos usuários no painel Auth do Supabase
-- e substitua os UUIDs abaixo.

-- Exemplo (ajuste os ids):
-- insert into public.app_users (id, name, role)
-- values
--   ('UUID-FELIPE-AQUI', 'Felipe', 'felipe'),
--   ('UUID-MANU-AQUI', 'Manu', 'executor'),
--   ('UUID-GABRIEL-AQUI', 'Gabriel', 'executor'),
--   ('UUID-JHONNY-AQUI', 'Jhonny', 'executor'),
--   ('UUID-MORENO-AQUI', 'Moreno', 'executor');

