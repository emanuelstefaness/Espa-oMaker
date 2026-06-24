import type {
  TicketCategoria,
  TicketPrioridade,
  TicketTipo,
} from '../types/ticket'

/* ====== CATEGORIA ====== */
const CATEGORIA_STYLES: Record<TicketCategoria, { bg: string; color: string }> = {
  servicos_3d: { bg: '#F5F3FF', color: '#5B21B6' },
  reparos: { bg: '#FFFBEB', color: '#92400E' },
  engenharia: { bg: '#EFF6FF', color: '#1E40AF' },
  workshop: { bg: '#F0FDF4', color: '#14532D' },
  sublimacao: { bg: '#FDF2F8', color: '#9D174D' },
  saude: { bg: '#F0FDFA', color: '#134E4A' },
  servicos_gerais: { bg: '#F1F5F9', color: '#475569' },
  outros: { bg: '#F1F5F9', color: '#475569' },
}

export const CATEGORIA_LABELS: Record<TicketCategoria, string> = {
  servicos_3d: 'Serviços 3D',
  reparos: 'Reparos',
  engenharia: 'Engenharia',
  workshop: 'Workshop',
  sublimacao: 'Sublimação',
  saude: 'Saúde',
  servicos_gerais: 'Serviços gerais',
  outros: 'Outros',
}

export function CategoriaBadge({ categoria }: { categoria: TicketCategoria }) {
  const s = CATEGORIA_STYLES[categoria] ?? CATEGORIA_STYLES.outros
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {CATEGORIA_LABELS[categoria] ?? categoria}
    </span>
  )
}

/* ====== PRIORIDADE ====== */
const PRIORIDADE_STYLES: Record<TicketPrioridade, { bg: string; color: string; label: string }> = {
  baixa: { bg: '#F1F5F9', color: '#475569', label: 'Baixa' },
  media: { bg: '#EFF6FF', color: '#1E40AF', label: 'Média' },
  alta: { bg: '#FFF7ED', color: '#9A3412', label: 'Alta' },
  urgente: { bg: '#FEF2F2', color: '#991B1B', label: '🔴 Urgente' },
}

export function PrioridadeBadge({ prioridade }: { prioridade: TicketPrioridade }) {
  const s = PRIORIDADE_STYLES[prioridade] ?? PRIORIDADE_STYLES.media
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

/* ====== TIPO (interna / externa) ====== */
const TIPO_STYLES: Record<TicketTipo, { bg: string; color: string; label: string }> = {
  interna: { bg: '#EFF6FF', color: '#1E40AF', label: 'Interna' },
  externa: { bg: '#F0FDF4', color: '#14532D', label: 'Externa' },
}

export function TipoBadge({ tipo }: { tipo: TicketTipo }) {
  const s = TIPO_STYLES[tipo] ?? TIPO_STYLES.interna
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}
