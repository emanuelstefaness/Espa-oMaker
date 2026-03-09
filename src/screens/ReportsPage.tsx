import { useEffect, useRef, useState } from 'react'
import { LayoutShell } from '../components/LayoutShell'
import type { Ticket } from '../types/ticket'
import { listTickets } from '../services/tickets'

interface ReportsData {
  totalPorResponsavelSemana: { responsavel: string; total: number }[]
  receitaTotalExternas: number
  custoTotal: number
  receitaLiquida: number
}

const COLS_RELATORIO = [
  'STATUS',
  'RESPONSÁVEL',
  'CLIENTE',
  'PRODUTO',
  'MATERIAL',
  'COR',
  'QUANTIDADE TOTAL',
  'VALOR DO PRODUTO',
  'CUSTO',
  'PRAZO DE ENTREGA',
] as const

function ticketToRow(t: Ticket): string[] {
  const valor =
    t.valor_demanda != null
      ? Number(t.valor_demanda).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : ''
  const custoStr =
    t.custo != null
      ? Number(t.custo).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : ''
  return [
    t.status,
    t.responsavel_nome ?? '',
    t.solicitante_nome ?? '',
    t.titulo ?? '',
    t.impressao3d?.material ?? '',
    t.impressao3d?.cor ?? '',
    String(t.impressao3d?.quantidade_pecas ?? ''),
    valor,
    custoStr,
    t.data_entrega ?? '',
  ]
}

function exportXLS(tickets: Ticket[]) {
  const BOM = '\uFEFF'
  const header = COLS_RELATORIO.join(';')
  const rows = tickets.map((t) =>
    ticketToRow(t)
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(';'),
  )
  const csv = BOM + header + '\r\n' + rows.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-demandas-${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const load = async (override?: { dataInicio?: string; dataFim?: string }) => {
    const inicio = override?.dataInicio ?? dataInicio
    const fim = override?.dataFim ?? dataFim
    try {
      setLoading(true)
      setError(null)
      const filters: Parameters<typeof listTickets>[0] = {}
      if (inicio) filters.dataCriacaoInicial = inicio
      if (fim) filters.dataCriacaoFinal = fim
      const { tickets: list } = await listTickets(filters, { limit: 5000 })
      setTickets(list)
      const reports = buildReports(list)
      setData(reports)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar relatórios.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleFiltrar = () => {
    void load()
  }

  const handleLimparFiltro = () => {
    setDataInicio('')
    setDataFim('')
    void load({ dataInicio: '', dataFim: '' })
  }

  const handleExportPDF = () => {
    if (!printRef.current) return
    const prevTitle = document.title
    document.title = `Relatório de demandas - ${new Date().toISOString().slice(0, 10)}`
    const printContent = printRef.current.innerHTML
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>${document.title}</title>
      <style>
        body { font-family: system-ui, sans-serif; font-size: 12px; padding: 16px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; }
      </style></head><body>${printContent}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
    document.title = prevTitle
  }

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
          <>
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

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">
                Resumo financeiro
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Período filtrado · demandas externas com orçamento aprovado ou mais
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                    Receita geral
                  </p>
                  <p className="mt-1 text-xl font-semibold text-emerald-800">
                    R$ {data.receitaTotalExternas.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-700">
                    Custo geral
                  </p>
                  <p className="mt-1 text-xl font-semibold text-amber-800">
                    R$ {data.custoTotal.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-blue-700">
                    Receita líquida
                  </p>
                  <p className="mt-1 text-xl font-semibold text-blue-800">
                    R$ {data.receitaLiquida.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Relatório de demandas (tabela + exportação) */}
        {!loading && !error && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-800">
                Relatório de demandas
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => exportXLS(tickets)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Exportar XLS
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Exportar PDF
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
              <span className="text-sm font-medium text-slate-700">
                Período (data de criação):
              </span>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">De</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              </label>
              <button
                type="button"
                onClick={handleFiltrar}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={handleLimparFiltro}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Limpar período
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-slate-200 text-left text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {COLS_RELATORIO.map((col) => (
                      <th
                        key={col}
                        className="border border-slate-200 px-3 py-2 font-semibold text-slate-700"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      {ticketToRow(t).map((cell, i) => (
                        <td
                          key={i}
                          className="border border-slate-100 px-3 py-2 text-slate-600"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td
                        colSpan={COLS_RELATORIO.length}
                        className="border border-slate-100 px-3 py-4 text-center text-slate-500"
                      >
                        Nenhuma demanda encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Área usada só na impressão/PDF */}
            <div
              ref={printRef}
              className="hidden"
              aria-hidden
            >
              <table>
                <thead>
                  <tr>
                    {COLS_RELATORIO.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      {ticketToRow(t).map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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

  const statusAprovadoOuApos = [
    'aprovado',
    'em_producao',
    'pos_processo',
    'pronta',
    'entregue',
  ] as const
  const demandasAprovadasOuApos = tickets.filter(
    (t) =>
      t.tipo === 'externa' &&
      statusAprovadoOuApos.includes(t.status as (typeof statusAprovadoOuApos)[number]),
  )
  const receitaTotalExternas = demandasAprovadasOuApos.reduce(
    (sum, t) => sum + (t.valor_demanda ?? t.orcamento?.total ?? 0),
    0,
  )
  const custoTotal = demandasAprovadasOuApos.reduce(
    (sum, t) => sum + (t.custo ?? 0),
    0,
  )
  const receitaLiquida = receitaTotalExternas - custoTotal

  return {
    totalPorResponsavelSemana,
    receitaTotalExternas,
    custoTotal,
    receitaLiquida,
  }
}

