-- Migração: novas categorias e materiais (TPU, TRITAN)
-- 1. Migrar categorias antigas para as novas
update public.tickets
set categoria = 'servicos_3d'
where categoria in ('impressao_3d', 'modelagem_3d');

update public.tickets
set categoria = 'reparos'
where categoria = 'reparo';

update public.tickets
set categoria = 'outros'
where categoria = 'laser';

-- 2. Remover constraint antiga de categoria e criar nova
alter table public.tickets
drop constraint if exists tickets_categoria_check;

alter table public.tickets
add constraint tickets_categoria_check check (
  categoria in (
    'servicos_3d', 'reparos', 'engenharia', 'workshop',
    'sublimacao', 'saude', 'servicos_gerais', 'outros'
  )
);

-- 3. Incluir TPU e TRITAN em material_impressao
alter table public.tickets
drop constraint if exists tickets_material_impressao_check;

alter table public.tickets
add constraint tickets_material_impressao_check check (
  material_impressao in ('PLA', 'TPU', 'PETG', 'ABS', 'TRITAN', 'RESINA', 'OUTROS')
);
