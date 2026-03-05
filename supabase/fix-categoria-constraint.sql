-- Rode APENAS este script no SQL Editor do Supabase (sem o resto do ATUALIZAR_SUPABASE_TUDO).
-- Corrige as constraints de categoria e material que estavam com valores antigos.
-- Depois que este rodar sem erro, o app aceita servicos_3d e materiais TPU/TRITAN.

-- 1) Constraint de CATEGORIA
alter table public.tickets drop constraint if exists tickets_categoria_check;

-- Migrar dados antigos para os novos valores (obrigatório antes de criar a nova constraint)
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

-- 2) Constraint de MATERIAL (incluir TPU e TRITAN)
alter table public.tickets drop constraint if exists tickets_material_impressao_check;

alter table public.tickets
add constraint tickets_material_impressao_check check (
  material_impressao in ('PLA', 'TPU', 'PETG', 'ABS', 'TRITAN', 'RESINA', 'OUTROS')
);
