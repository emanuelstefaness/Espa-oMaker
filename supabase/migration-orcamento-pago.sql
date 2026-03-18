-- Adiciona flag de pagamento do orçamento (null = não pago)
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS orcamento_pago_em timestamptz NULL;

