-- Receita recorrente mensal vinculada à demanda (ticket)
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS receita_recorrente boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS receita_recorrente_dia_pagamento int NULL,
ADD COLUMN IF NOT EXISTS receita_recorrente_inicio date NULL,
ADD COLUMN IF NOT EXISTS receita_recorrente_fim date NULL;

-- Dia do pagamento deve ser 1..31 quando recorrente
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_receita_recorrente_dia_check;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_receita_recorrente_dia_check
CHECK (
  receita_recorrente = false
  OR (receita_recorrente_dia_pagamento BETWEEN 1 AND 31)
);

-- Início/fim: fim >= inicio quando ambos preenchidos
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_receita_recorrente_periodo_check;

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_receita_recorrente_periodo_check
CHECK (
  receita_recorrente = false
  OR receita_recorrente_inicio IS NOT NULL
);

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_receita_recorrente_fim_check
CHECK (
  receita_recorrente_fim IS NULL
  OR receita_recorrente_inicio IS NULL
  OR receita_recorrente_fim >= receita_recorrente_inicio
);

