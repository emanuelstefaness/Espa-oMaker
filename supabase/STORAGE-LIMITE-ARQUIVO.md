# Aumentar limite de tamanho para upload (ex.: STL)

Se aparecer **"The object exceeded the maximum allowed size"** ao enviar um arquivo (ex.: STL):

1. **Supabase Dashboard** → **Storage** → **Settings** (engrenagem).
2. Em **Global file size limit**, aumente o valor (plano Free: máximo **50 MB**).
3. Opcional: em **Storage** → clique no bucket **ticket-files** → **⋮** → **Edit bucket**.
4. Em **Restrict file size**, marque e defina o limite em bytes (ex.: `52428800` = 50 MB).

Salve e tente o upload novamente.
