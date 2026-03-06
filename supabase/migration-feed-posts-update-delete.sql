-- Permite que o autor do post edite e exclua seu próprio post
-- Execute no SQL Editor do Supabase.

drop policy if exists "feed_posts_update_author" on public.feed_posts;
create policy "feed_posts_update_author"
on public.feed_posts for update
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "feed_posts_delete_author" on public.feed_posts;
create policy "feed_posts_delete_author"
on public.feed_posts for delete
using (author_id = auth.uid());
