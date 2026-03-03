import { useEffect, useState } from 'react'
import { LayoutShell } from '../components/LayoutShell'
import type { Ticket } from '../types/ticket'
import { listTickets } from '../services/tickets'

interface ReportsData {
  totalPorResponsavelSemana: { responsavel: string; total: number }[]
  receitaTotalExternas: number
  tempoMedioEntregaDias: number | null
}

export function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { tickets } = await listTickets({}, { limit: 5000 })
        const reports = buildReports(tickets)
        setData(reports)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar relatórios.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-800">
            Indicadores do Espaço Maker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Produtividade da equipe, prazos e receita das demandas externas.
          </p>
        </header>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Calculando relatórios...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {data && !loading && !error && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Demandas por responsável (7 dias)
              </p>
              <ul className="mt-3 space-y-2">
                {data.totalPorResponsavelSemana.map((row) => (
                  <li
                    key={row.responsavel}
                    className="flex items-center justify-between text-sm text-slate-700"
                  >
                    <span>{row.responsavel}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                      {row.total} demandas
                    </span>
                  </li>
                ))}
                {data.totalPorResponsavelSemana.length === 0 && (
                  <li className="text-sm text-slate-500">
                    Nenhuma demanda na última semana.
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Receita (externas aprovadas)
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-800">
                R$ {data.receitaTotalExternas.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Orçamentos aprovados, demandas externas.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Tempo médio até entrega
              </p>
              <p className="mt-2 text-2xl font-semibold text-blue-800">
                {data.tempoMedioEntregaDias !== null
                  ? `${data.tempoMedioEntregaDias.toFixed(1)} dias`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Demandas entregues com data preenchida.
              </p>
            </div>
          </div>
        )}
      </section>
    </LayoutShell>
  )
}

function buildReports(tickets: Ticket[]): ReportsData {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)

  const porResponsavel = new Map<string, number>()

  tickets.forEach((t) => {
    const created = new Date(t.data_criacao)
    if (created >= weekAgo) {
      const key = t.responsavel_nome ?? 'Sem responsável'
      porResponsavel.set(key, (porResponsavel.get(key) ?? 0) + 1)
    }
  })

  const totalPorResponsavelSemana = Array.from(porResponsavel.entries())
    .map(([responsavel, total]) => ({ responsavel, total }))
    .sort((a, b) => b.total - a.total)

  const receitaTotalExternas = tickets
    .filter(
      (t) =>
        t.tipo === 'externa' &&
        t.orcamento &&
        t.orcamento.status === 'aprovado',
    )
    .reduce((sum, t) => sum + (t.orcamento?.total ?? 0), 0)

  const entregues = tickets.filter(
    (t) => t.status === 'entregue' && t.data_entrega,
  )
  let tempoMedioEntregaDias: number | null = null
  if (entregues.length > 0) {
    const somaDias = entregues.reduce((acc, t) => {
      const start = new Date(t.data_criacao).getTime()
      const end = new Date(t.data_entrega as string).getTime()
      return acc + (end - start) / (1000 * 60 * 60 * 24)
    }, 0)
    tempoMedioEntregaDias = somaDias / entregues.length
  }

  return {
    totalPorResponsavelSemana,
    receitaTotalExternas,
    tempoMedioEntregaDias,
  }
}

