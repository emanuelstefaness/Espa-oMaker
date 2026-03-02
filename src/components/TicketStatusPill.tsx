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

const STYLES: Record<TicketStatus, string> = {
  recebida:
    'bg-slate-900/60 text-slate-200 ring-1 ring-slate-600/70 border border-slate-900/60',
  em_analise:
    'bg-indigo-950/60 text-indigo-200 ring-1 ring-indigo-500/70 border border-indigo-900/60',
  orcamento_em_criacao:
    'bg-sky-950/60 text-sky-200 ring-1 ring-sky-500/70 border border-sky-900/60',
  aguardando_aprovacao:
    'bg-amber-950/70 text-amber-200 ring-1 ring-amber-500/80 border border-amber-900/70',
  aprovado:
    'bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-500/80 border border-emerald-900/70',
  em_producao:
    'bg-cyan-950/70 text-cyan-200 ring-1 ring-cyan-500/80 border border-cyan-900/70',
  pos_processo:
    'bg-fuchsia-950/60 text-fuchsia-200 ring-1 ring-fuchsia-500/70 border border-fuchsia-900/60',
  pronta:
    'bg-lime-950/70 text-lime-200 ring-1 ring-lime-500/80 border border-lime-900/70',
  entregue:
    'bg-slate-900/70 text-slate-300 ring-1 ring-slate-600/70 border border-slate-900/60',
  cancelada:
    'bg-rose-950/70 text-rose-200 ring-1 ring-rose-500/80 border border-rose-900/70',
}

export function TicketStatusPill({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  )
}

