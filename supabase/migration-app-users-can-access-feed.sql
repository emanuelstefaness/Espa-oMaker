-- Permissão por usuário para acesso ao Feed interno.
-- true  = pode ver o Feed
-- false = Feed oculto e rota bloqueada no app
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS can_access_feed boolean NOT NULL DEFAULT true;

