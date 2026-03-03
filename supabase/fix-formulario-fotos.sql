-- Migração: permitir anexar até 5 fotos no formulário público (/solicitar)
-- Execute no SQL Editor do Supabase após fix-origem-formulario.sql

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
