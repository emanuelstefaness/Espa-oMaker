import type { TicketStatus } from '../types/ticket'

const LABELS: Record<TicketStatus, string> = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  orcamento_em_criacao: 'Orçamento em criação',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  em_producao: 'Em produção',
  pos_processo: 'Pós-processo',
  pronta: 'Pronta',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
}

/** Cores interpretativas: fundo claro, texto legível */
const STYLES: Record<TicketStatus, string> = {
  recebida: 'bg-slate-100 text-slate-700 border border-slate-300',
  em_analise: 'bg-blue-50 text-blue-800 border border-blue-200',
  orcamento_em_criacao: 'bg-sky-50 text-sky-800 border border-sky-200',
  aguardando_aprovacao: 'bg-amber-50 text-amber-800 border border-amber-300',
  aprovado: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
  em_producao: 'bg-violet-50 text-violet-800 border border-violet-300',
  pos_processo: 'bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-300',
  pronta: 'bg-lime-50 text-lime-800 border border-lime-400',
  entregue: 'bg-slate-100 text-slate-600 border border-slate-300',
  cancelada: 'bg-rose-50 text-rose-800 border border-rose-300',
}

export function TicketStatusPill({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {LABELS[status]}
    </span>
  )
}
