-- Permite usuários autenticados excluírem anexos de demandas (fotos/arquivos).
-- Execute no SQL Editor do Supabase.

-- Tabela: permitir delete para autenticados
create policy "ticket_files_delete_authenticated"
on public.ticket_files
for delete
using (auth.uid() is not null);

-- Storage: permitir delete no bucket ticket-files para autenticados
create policy "Permitir exclusão autenticada de arquivos de tickets"
on storage.objects
for delete
using (
  bucket_id = 'ticket-files'
  and auth.role() = 'authenticated'
);
