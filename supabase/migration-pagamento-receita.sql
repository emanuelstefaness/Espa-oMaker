-- Campos para controlar recebimento de receita monetária
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS pagamento_tipo text NULL,
ADD COLUMN IF NOT EXISTS pagamento_data date NULL;

-- Valores permitidos (mantém NULL para compatibilidade com registros antigos)
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_pagamento_tipo_check;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_pagamento_tipo_check
CHECK (pagamento_tipo IS NULL OR pagamento_tipo IN ('avista', 'a_definir'));

