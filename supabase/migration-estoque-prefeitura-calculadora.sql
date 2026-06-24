-- Migration: Estoque, Prefeitura e Calculadora de Orçamento
-- Novas funcionalidades (visual CTP). Execute no SQL Editor do Supabase.

-- ============================================================
-- ESTOQUE
-- ============================================================
create table if not exists public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  quantidade numeric(12, 2) not null default 0,
  unidade text not null,
  quantidade_minima numeric(12, 2) not null default 1,
  localizacao text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.estoque_itens is 'Itens de estoque do Espaço Maker.';

-- ============================================================
-- PREFEITURA (parcerias com municípios)
-- ============================================================
create table if not exists public.prefeitura_registros (
  id uuid primary key default gen_random_uuid(),
  municipio text not null,
  contato text not null,
  telefone text,
  email text not null,
  num_processo text,
  descricao text,
  status text not null default 'em_negociacao' check (
    status in ('ativo', 'em_negociacao', 'concluido', 'cancelado')
  ),
  created_at timestamptz not null default now()
);

comment on table public.prefeitura_registros is 'Parcerias com prefeituras / municípios.';

-- ============================================================
-- CALCULADORA DE ORÇAMENTO (materiais e impressoras)
-- ============================================================
create table if not exists public.calculadora_materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco_por_kg numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.calculadora_impressoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  manut_h numeric(12, 4) not null default 0,
  pot_w numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.calculadora_materiais is 'Materiais e preços (R$/kg) para a calculadora de orçamento.';
comment on table public.calculadora_impressoras is 'Impressoras/máquinas (manutenção e potência) para a calculadora.';

-- ============================================================
-- RLS — qualquer usuário autenticado pode ler e escrever.
-- (mesmo modelo permissivo do restante do sistema)
-- ============================================================
alter table public.estoque_itens enable row level security;
alter table public.prefeitura_registros enable row level security;
alter table public.calculadora_materiais enable row level security;
alter table public.calculadora_impressoras enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'estoque_itens',
    'prefeitura_registros',
    'calculadora_materiais',
    'calculadora_impressoras'
  ]
  loop
    execute format('drop policy if exists "%s_select" on public.%I;', t, t);
    execute format('drop policy if exists "%s_write" on public.%I;', t, t);

    execute format(
      'create policy "%s_select" on public.%I for select using (true);', t, t
    );
    execute format(
      'create policy "%s_write" on public.%I for all using (auth.uid() is not null) with check (auth.uid() is not null);',
      t, t
    );
  end loop;
end$$;

-- ============================================================
-- SEED — valores padrão da calculadora (só insere se vazio)
-- ============================================================
insert into public.calculadora_materiais (nome, preco_por_kg)
select * from (values
  ('PETG', 180), ('ABS', 85), ('PLA', 130), ('Resina', 245),
  ('Silk', 220), ('TPU', 195), ('MDF Cru', 40)
) as v(nome, preco_por_kg)
where not exists (select 1 from public.calculadora_materiais);

insert into public.calculadora_impressoras (nome, manut_h, pot_w)
select * from (values
  ('Entrada', 0.18, 120), ('Profissional', 0.35, 150), ('Industrial', 1.20, 300),
  ('Resina', 0.50, 80), ('Due Flow', 1.11, 150)
) as v(nome, manut_h, pot_w)
where not exists (select 1 from public.calculadora_impressoras);
