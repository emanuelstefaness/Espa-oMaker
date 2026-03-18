import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type { Ticket, TicketStatus } from '../types/ticket'
import {
  listTickets,
  setTicketOrcamentoPago,
  updateTicketStatus,
} from '../services/tickets'
import { useAuth } from '../auth/AuthContext'

const ORCAMENTO_STATUSES: TicketStatus[] = [
  'recebida',
  'orcamento_em_criacao',
  'aguardando_aprovacao',
  'aprovado',
]

function isOrcamentoStage(status: TicketStatus) {
  return ORCAMENTO_STATUSES.includes(status)
}

export function OrcamentosPage() {
  const { appUser } = useAuth()
  const isFelipe = appUser?.role === 'felipe'

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await listTickets({ statusIn: ORCAMENTO_STATUSES }, { limit: 500 })
      setTickets(res.tickets.filter((t) => isOrcamentoStage(t.status)))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar orçamentos.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const sorted = useMemo(() => {
    const order: Record<TicketStatus, number> = {
      recebida: 0,
      orcamento_em_criacao: 1,
      aguardando_aprovacao: 2,
      aprovado: 3,
      em_analise: 99,
      em_producao: 99,
      pos_processo: 99,
      pronta: 99,
      entregue: 99,
      cancelada: 99,
    }
    return [...tickets].sort((a, b) => {
      const ao = order[a.status] ?? 50
      const bo = order[b.status] ?? 50
      if (ao !== bo) return ao - bo
      return (b.data_criacao ?? '').localeCompare(a.data_criacao ?? '')
    })
  }, [tickets])

  const setStatus = async (id: string, status: TicketStatus) => {
    try {
      setSavingId(id)
      const updated = await updateTicketStatus(id, { status })
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar status.'
      setError(msg)
    } finally {
      setSavingId(null)
    }
  }

  const togglePago = async (id: string, next: boolean) => {
    try {
      setSavingId(id)
      const updated = await setTicketOrcamentoPago(id, next)
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao marcar pagamento.'
      setError(msg)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Orçamentos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Controle do fluxo de orçamento. Atribuição de responsável só acontece após orçamento <strong>aprovado</strong> e <strong>pago</strong>.
            </p>
          </div>
          <Link
            to="/triagem"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ir para triagem (atribuir)
          </Link>
        </header>

        {!isFelipe && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Apenas o usuário de triagem (Felipe) pode avançar status e marcar pagamento. Você pode visualizar.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">
              {sorted.length} demandas em orçamento
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Carregando...</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sorted.map((t) => {
                const pago = !!t.orcamento_pago_em
                const isSaving = savingId === t.id
                return (
                  <li key={t.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <Link to={`/demandas/${t.id}`} className="font-medium text-slate-800 hover:underline">
                        {t.titulo}
                      </Link>
                      <p className="text-sm text-slate-500">{t.solicitante_nome}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TicketStatusPill status={t.status} />
                        {t.status === 'aprovado' && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              pago
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            {pago ? 'Pago' : 'Não pago'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!isFelipe || isSaving}
                        onClick={() => setStatus(t.id, 'orcamento_em_criacao')}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Aguardando orçamento
                      </button>
                      <button
                        type="button"
                        disabled={!isFelipe || isSaving}
                        onClick={() => setStatus(t.id, 'aguardando_aprovacao')}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                      >
                        Enviar p/ aprovação
                      </button>
                      <button
                        type="button"
                        disabled={!isFelipe || isSaving}
                        onClick={() => setStatus(t.id, 'aprovado')}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        Orçamento aprovado
                      </button>

                      {t.status === 'aprovado' && (
                        <button
                          type="button"
                          disabled={!isFelipe || isSaving}
                          onClick={() => togglePago(t.id, !pago)}
                          className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                        >
                          {pago ? 'Desmarcar pago' : 'Marcar como pago'}
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {!loading && sorted.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhuma demanda em orçamento.
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  )
}

