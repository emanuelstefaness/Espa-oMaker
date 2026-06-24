import type { TicketCategoria } from '../types/ticket'

/** Cor de destaque (hex) por categoria — usada em detalhes (dot, borda fina). */
export const CATEGORIA_COR: Record<TicketCategoria, string> = {
  servicos_3d: '#8B5CF6',
  reparos: '#F59E0B',
  engenharia: '#3B82F6',
  workshop: '#22C55E',
  sublimacao: '#EC4899',
  saude: '#14B8A6',
  servicos_gerais: '#94A3B8',
  outros: '#94A3B8',
}

/**
 * Classes de linha/card no padrão CTP: fundo branco e limpo, hover sutil.
 * A cor agora fica só nos detalhes (status, dot de categoria); urgente recebe
 * um leve realce vermelho para continuar visível, sem "pintar" a tela inteira.
 */
export function getTicketCardClasses(
  _categoria: TicketCategoria,
  prioridade?: string,
): string {
  if (prioridade === 'urgente') {
    return 'border-rose-200 bg-rose-50/60 hover:bg-rose-50'
  }
  return 'border-[#E8EDF3] bg-white hover:bg-[#F6F9FC]'
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
