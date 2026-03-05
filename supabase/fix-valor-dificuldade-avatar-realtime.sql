-- Migração: valor da demanda, nível dificuldade, avatar do usuário
-- Execute no SQL Editor do Supabase.

-- 1. Valor da demanda e nível de dificuldade (tickets)
alter table public.tickets
add column if not exists valor_demanda numeric(12, 2);

alter table public.tickets
add column if not exists nivel_dificuldade text check (nivel_dificuldade in ('baixa', 'media', 'alta'));

comment on column public.tickets.valor_demanda is 'Valor lançado da demanda para relatório';
comment on column public.tickets.nivel_dificuldade is 'Nível de dificuldade: baixa, media, alta';

-- 2. Avatar do usuário (app_users)
alter table public.app_users
add column if not exists avatar_url text;

-- 3. Storage para avatares (bucket público de leitura)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar leitura pública"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Avatar upload próprio"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Avatar update próprio"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
