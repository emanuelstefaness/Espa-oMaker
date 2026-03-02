import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type { Ticket } from '../types/ticket'

// Por enquanto usamos alguns dados mockados apenas para layout / UX.
const MOCK_TICKETS: Ticket[] = [
  {
    id: 'DM-00123',
    titulo: 'Impressão 3D - suporte para sensor',
    descricao: '',
    tipo: 'externa',
    solicitante_nome: 'Startup X',
    solicitante_telefone: '(48) 99999-0000',
    categoria: 'impressao_3d',
    prioridade: 'alta',
    status: 'aguardando_aprovacao',
    responsavel_id: 'felipe',
    responsavel_nome: 'Felipe',
    colaborador_id: null,
    colaborador_nome: null,
    data_criacao: new Date().toISOString(),
    data_entrega: null,
    atraso: false,
    impressao3d: undefined,
    orcamento: {
      preco_por_peca: 35,
      quantidade: 4,
      total: 140,
      desconto: 0,
      observacoes: null,
      status: 'aguardando_aprovacao',
      sem_cobranca: false,
    },
  },
  {
    id: 'DM-00124',
    titulo: 'Ajuste em modelo 3D de peça',
    descricao: '',
    tipo: 'interna',
    solicitante_nome: 'Núcleo de Inovação',
    solicitante_telefone: null,
    categoria: 'modelagem_3d',
    prioridade: 'media',
    status: 'em_producao',
    responsavel_id: 'manu',
    responsavel_nome: 'Manu',
    colaborador_id: null,
    colaborador_nome: null,
    data_criacao: new Date().toISOString(),
    data_entrega: null,
    atraso: false,
    impressao3d: undefined,
    orcamento: null,
  },
]

export function DashboardPage() {
  const atrasadas = MOCK_TICKETS.filter((t) => t.atraso)
  const aguardando = MOCK_TICKETS.filter(
    (t) => t.status === 'aguardando_aprovacao',
  )
  const emProducao = MOCK_TICKETS.filter((t) => t.status === 'em_producao')
  const prontas = MOCK_TICKETS.filter((t) => t.status === 'pronta')
  const entregues = MOCK_TICKETS.filter((t) => t.status === 'entregue')

  return (
    <LayoutShell>
      <section className="space-y-4">
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Visão geral
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
              Demandas do Espaço Maker · Cilla Tech Park
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Acompanhe recebimento, orçamento, produção, pós-processo e
              entrega de forma colaborativa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-blue-200">
              Foco: impressão 3D e modelagem
            </span>
            <span className="rounded-full border border-slate-700 px-2 py-1">
              Time: Manu · Gabriel · Felipe · Jhonny · Moreno
            </span>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <DashboardCard
            label="Recebidas"
            value={3}
            accent="from-slate-900 to-slate-900/40"
          />
          <DashboardCard
            label="Aguardando aprovação"
            value={aguardando.length}
            highlight
            accent="from-amber-900/60 to-amber-900/10"
          />
          <DashboardCard
            label="Em produção"
            value={emProducao.length}
            accent="from-cyan-900/60 to-cyan-900/10"
          />
          <DashboardCard
            label="Atrasadas"
            value={atrasadas.length}
            critical
            accent="from-rose-900/70 to-rose-900/10"
          />
          <DashboardCard
            label="Prontas"
            value={prontas.length}
            accent="from-lime-900/60 to-lime-900/10"
          />
          <DashboardCard
            label="Entregues (7d)"
            value={entregues.length}
            accent="from-slate-900/70 to-slate-900/20"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <SectionHeader
              title="Fila ativa"
              subtitle="Demandas em análise, orçamento e produção."
              to="/demandas"
            />
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
              <ul className="divide-y divide-slate-800/80 text-sm">
                {MOCK_TICKETS.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-slate-900/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/demandas/${ticket.id}`}
                          className="truncate text-[13px] font-medium text-slate-50 hover:text-cyan-300"
                        >
                          {ticket.titulo}
                        </Link>
                        <span className="rounded-full border border-slate-700 px-2 py-[2px] text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          {ticket.tipo === 'externa' ? 'Externa' : 'Interna'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                        {ticket.solicitante_nome}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <TicketStatusPill status={ticket.status} />
                        {ticket.orcamento && (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium text-emerald-200">
                            Orç.: R$ {ticket.orcamento.total.toFixed(2)}
                          </span>
                        )}
                        {ticket.prioridade === 'urgente' && (
                          <span className="rounded-full border border-rose-500/60 bg-rose-500/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-200">
                            Urgente
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden flex-col items-end gap-1 text-[11px] text-slate-400 sm:flex">
                      <span className="rounded-full border border-slate-700 px-2 py-[2px]">
                        Resp.: {ticket.responsavel_nome ?? '—'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Criada hoje
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader
              title="Alertas rápidos"
              subtitle="O que precisa de atenção agora."
            />
            <div className="space-y-3">
              <AlertCard
                title="Demandas atrasadas"
                description="Itens com prazo de entrega já vencido."
                value={atrasadas.length}
                tone="critical"
                to="/demandas?filtro=atrasadas"
              />
              <AlertCard
                title="Prazo hoje"
                description="Demandas que precisam ser finalizadas hoje."
                value={1}
                tone="warning"
                to="/demandas?filtro=prazo_hoje"
              />
              <AlertCard
                title="Aguardando aprovação"
                description="Orçamentos enviados para cliente aguardando retorno."
                value={aguardando.length}
                tone="highlight"
                to="/demandas?status=aguardando_aprovacao"
              />
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  )
}

interface DashboardCardProps {
  label: string
  value: number
  accent: string
  critical?: boolean
  highlight?: boolean
}

function DashboardCard({
  label,
  value,
  accent,
  critical,
  highlight,
}: DashboardCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-gradient-to-br ${accent} ${
        critical
          ? 'border-rose-700/70 shadow-[0_18px_60px_rgba(190,24,93,0.45)]'
          : highlight
            ? 'border-amber-600/70 shadow-[0_18px_40px_rgba(234,179,8,0.35)]'
            : 'border-slate-800 shadow-[0_14px_40px_rgba(15,23,42,0.8)]'
      }`}
    >
      <div className="flex flex-col gap-1 px-3 py-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">
          {label}
        </span>
        <span className="text-2xl font-semibold tracking-tight text-slate-50">
          {value}
        </span>
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  subtitle?: string
  to?: string
}

function SectionHeader({ title, subtitle, to }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {to && (
        <Link
          to={to}
          className="text-[11px] font-medium text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
        >
          Ver lista
        </Link>
      )}
    </div>
  )
}

interface AlertCardProps {
  title: string
  description: string
  value: number
  tone: 'critical' | 'warning' | 'highlight'
  to?: string
}

function AlertCard({
  title,
  description,
  value,
  tone,
  to,
}: AlertCardProps) {
  const base =
    'rounded-2xl border px-3 py-3 text-xs shadow-[0_16px_40px_rgba(15,23,42,0.8)]'
  const toneClasses =
    tone === 'critical'
      ? 'border-rose-700/70 bg-rose-950/50 text-rose-50'
      : tone === 'warning'
        ? 'border-amber-600/70 bg-amber-950/50 text-amber-50'
        : 'border-cyan-600/70 bg-cyan-950/60 text-cyan-50'

  const content = (
    <div className={`${base} ${toneClasses}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
            {title}
          </p>
          <p className="mt-1 text-[11px] text-slate-200/80">{description}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/50 text-sm font-semibold">
          {value}
        </div>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    )
  }

  return content
}

