-- Garante que o bucket feed-files existe e permite upload de imagens/arquivos.
-- Execute no SQL Editor do Supabase se o upload de anexos no feed falhar.

insert into storage.buckets (id, name, public)
values ('feed-files', 'feed-files', true)
on conflict (id) do update set public = true;

-- Políticas para leitura e inserção (autenticado)
drop policy if exists "feed_files_select" on storage.objects;
create policy "feed_files_select"
on storage.objects for select
using (bucket_id = 'feed-files');

drop policy if exists "feed_files_insert_authenticated" on storage.objects;
create policy "feed_files_insert_authenticated"
on storage.objects for insert
with check (
  bucket_id = 'feed-files'
  and auth.uid() is not null
);
