import type { TicketCategoria } from '../types/ticket'

/** Classes Tailwind para card/linha por categoria (cor clarinha). Urgente usa vermelho forte. */
export function getTicketCardClasses(
  categoria: TicketCategoria,
  prioridade?: string,
): string {
  if (prioridade === 'urgente') {
    return 'border-rose-200 bg-rose-100/90 hover:bg-rose-100'
  }
  const map: Record<TicketCategoria, string> = {
    servicos_3d: 'border-violet-200/80 bg-violet-50/70 hover:bg-violet-50',
    reparos: 'border-amber-200/80 bg-amber-50/70 hover:bg-amber-50',
    engenharia: 'border-blue-200/80 bg-blue-50/70 hover:bg-blue-50',
    workshop: 'border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-50',
    sublimacao: 'border-pink-200/80 bg-pink-50/70 hover:bg-pink-50',
    saude: 'border-teal-200/80 bg-teal-50/70 hover:bg-teal-50',
    servicos_gerais: 'border-slate-200 bg-slate-50/80 hover:bg-slate-100',
    outros: 'border-slate-200 bg-slate-50/60 hover:bg-slate-100',
  }
  return map[categoria] ?? 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
}

/** Categorias de demanda com rótulo e descrição (Solicitar + App). */
export const CATEGORIAS = [
  {
    value: 'servicos_3d',
    label: 'Serviços 3D',
    descricao: 'Impressão e modelagem 3D.',
  },
  { value: 'reparos', label: 'Reparos', descricao: 'Concerto de peças.' },
  {
    value: 'engenharia',
    label: 'Engenharia',
    descricao: 'Elaboração de firmware, software e hardware.',
  },
  { value: 'workshop', label: 'Workshop', descricao: '' },
  {
    value: 'sublimacao',
    label: 'Sublimação',
    descricao: 'Canecas e bottons.',
  },
  { value: 'saude', label: 'Saúde', descricao: '' },
  { value: 'servicos_gerais', label: 'Serviços gerais', descricao: '' },
  { value: 'outros', label: 'Outros', descricao: '' },
] as const

/** Materiais de impressão 3D com descrição (uso em Serviços 3D). */
export const MATERIAIS_IMPRESSAO = [
  {
    value: 'PLA',
    label: 'PLA',
    descricao:
      'Ideal para protótipos e peças decorativas. Fácil de imprimir.',
  },
  {
    value: 'TPU',
    label: 'TPU',
    descricao: 'Usado para peças flexíveis, como capas e amortecedores.',
  },
  {
    value: 'PETG',
    label: 'PETG',
    descricao: 'Bom para peças resistentes e com contato com água.',
  },
  {
    value: 'ABS',
    label: 'ABS',
    descricao: 'Indicado para peças mecânicas que precisam suportar calor.',
  },
  {
    value: 'TRITAN',
    label: 'TRITAN',
    descricao:
      'Usado para peças fortes e seguras para contato com alimentos.',
  },
  {
    value: 'RESINA',
    label: 'Resina',
    descricao: 'Ideal para peças com muitos detalhes e alta precisão.',
  },
  { value: 'OUTROS', label: 'Outros', descricao: '' },
] as const
