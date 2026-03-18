-- Marca quando a receita monetária foi efetivamente paga (null = ainda não paga / "A ser faturada")
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS pagamento_pago_em timestamptz NULL;

