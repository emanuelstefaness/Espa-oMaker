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
        const tickets = await listTickets()
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
      <section className="space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Relatórios
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
              Indicadores do Espaço Maker
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Visão de produtividade da equipe, prazos e receita das demandas
              externas.
            </p>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-center text-xs text-slate-400">
            Calculando relatórios...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-700/60 bg-rose-950/50 px-4 py-3 text-xs text-rose-50">
            {error}
          </div>
        )}

        {data && !loading && !error && (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Demandas por responsável (últimos 7 dias)
              </p>
              <ul className="mt-2 space-y-1.5">
                {data.totalPorResponsavelSemana.map((row) => (
                  <li
                    key={row.responsavel}
                    className="flex items-center justify-between text-[11px] text-slate-100"
                  >
                    <span>{row.responsavel}</span>
                    <span className="rounded-full border border-slate-700 px-2 py-[2px] text-slate-200">
                      {row.total} demandas
                    </span>
                  </li>
                ))}
                {data.totalPorResponsavelSemana.length === 0 && (
                  <li className="text-[11px] text-slate-500">
                    Nenhuma demanda criada na última semana.
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2 rounded-2xl border border-emerald-700/70 bg-emerald-950/40 p-3 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Receita total das demandas externas
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-50">
                R$ {data.receitaTotalExternas.toFixed(2)}
              </p>
              <p className="mt-1 text-[11px] text-emerald-100/80">
                Soma dos orçamentos aprovados para demandas externas.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-cyan-700/70 bg-cyan-950/40 p-3 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Tempo médio até entrega
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-cyan-50">
                {data.tempoMedioEntregaDias !== null
                  ? `${data.tempoMedioEntregaDias.toFixed(1)} dias`
                  : '—'}
              </p>
              <p className="mt-1 text-[11px] text-cyan-100/80">
                Considerando apenas demandas marcadas como &quot;Entregue&quot;
                com data de entrega preenchida.
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

