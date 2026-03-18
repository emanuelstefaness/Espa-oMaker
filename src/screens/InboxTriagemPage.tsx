import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type { Ticket } from '../types/ticket'
import { listTickets, updateTicketStatus } from '../services/tickets'
import { useAuth } from '../auth/AuthContext'

const FASE_ORCAMENTO: { value: Ticket['status']; label: string }[] = [
  { value: 'recebida', label: 'Recebida' },
  { value: 'orcamento_em_criacao', label: 'Orçamento em criação' },
  { value: 'aguardando_aprovacao', label: 'Aguardando aprovação' },
  { value: 'aprovado', label: 'Orçamento aprovado → definir responsável' },
  { value: 'cancelada', label: 'Cancelar demanda' },
]

export function InboxTriagemPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  /** Evita “piscar” do select enquanto o PATCH não termina */
  const [selectDraft, setSelectDraft] = useState<Record<string, Ticket['status']>>(
    {},
  )
  const { appUser } = useAuth()
  const navigate = useNavigate()

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const ticketsResult = await listTickets(
        { statusIn: ['recebida', 'orcamento_em_criacao', 'aguardando_aprovacao'] },
        { limit: 500 },
      )
      setTickets(ticketsResult.tickets)
    } catch (err) {
      const raw =
        err && typeof err === 'object' && 'message' in err
          ? String((err as Error).message)
          : 'Erro ao carregar caixa de entrada.'
      setError(raw)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const displayStatus = (t: Ticket) => selectDraft[t.id] ?? t.status

  const handleFaseChange = async (ticket: Ticket, newStatus: Ticket['status']) => {
    if (newStatus === ticket.status) {
      setSelectDraft((d) => {
        const n = { ...d }
        delete n[ticket.id]
        return n
      })
      return
    }

    if (newStatus === 'cancelada') {
      if (
        !window.confirm(
          'Cancelar esta demanda? Ela sairá do fluxo de orçamento.',
        )
      ) {
        setSelectDraft((d) => {
          const n = { ...d }
          delete n[ticket.id]
          return n
        })
        return
      }
    } else if (newStatus === 'aprovado') {
      const precisaResponsavel = !ticket.responsavel_id
      if (
        !window.confirm(
          precisaResponsavel
            ? 'Marcar orçamento como aprovado? A demanda sai da caixa de entrada. Ir para definir o responsável?'
            : 'Marcar orçamento como aprovado? A demanda sai da caixa (já tem responsável atribuído).',
        )
      ) {
        setSelectDraft((d) => {
          const n = { ...d }
          delete n[ticket.id]
          return n
        })
        return
      }
    }

    try {
      setSavingId(ticket.id)
      setError(null)
      await updateTicketStatus(ticket.id, { status: newStatus })

      if (newStatus === 'aprovado') {
        setTickets((prev) => prev.filter((x) => x.id !== ticket.id))
        setSelectDraft((d) => {
          const n = { ...d }
          delete n[ticket.id]
          return n
        })
        if (!ticket.responsavel_id) {
          navigate('/atribuir')
        }
        return
      }
      if (newStatus === 'cancelada') {
        setTickets((prev) => prev.filter((x) => x.id !== ticket.id))
      } else {
        setTickets((prev) =>
          prev.map((x) =>
            x.id === ticket.id ? { ...x, status: newStatus } : x,
          ),
        )
      }
      setSelectDraft((d) => {
        const n = { ...d }
        delete n[ticket.id]
        return n
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar fase.'
      setError(message)
      setSelectDraft((d) => {
        const n = { ...d }
        delete n[ticket.id]
        return n
      })
    } finally {
      setSavingId(null)
    }
  }

  const isFelipe = appUser?.role === 'felipe'
  const selectClass =
    'min-w-[14rem] max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-800">
            Caixa de entrada
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Workflow do orçamento. Escolha a fase de cada demanda. Ao aprovar o
            orçamento, você pode ir direto para definir o responsável.
          </p>
        </header>

        {!isFelipe && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Apenas o usuário de triagem (Felipe) pode alterar a fase. Você pode
            visualizar.
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
              {tickets.length} demandas na caixa de entrada
            </span>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Carregando...
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">{ticket.titulo}</p>
                    <p className="text-sm text-slate-500">
                      {ticket.solicitante_nome}
                    </p>
                    <div className="mt-2">
                      <TicketStatusPill status={ticket.status} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 sm:items-end">
                    <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Fase do orçamento
                    </label>
                    <select
                      className={selectClass}
                      disabled={!isFelipe || savingId === ticket.id}
                      value={displayStatus(ticket)}
                      onChange={(e) => {
                        const v = e.target.value as Ticket['status']
                        setSelectDraft((d) => ({ ...d, [ticket.id]: v }))
                        void handleFaseChange(ticket, v)
                      }}
                    >
                      {FASE_ORCAMENTO.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {savingId === ticket.id && (
                      <span className="text-xs text-slate-400">Salvando…</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && tickets.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhuma demanda na caixa de entrada.
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  )
}
