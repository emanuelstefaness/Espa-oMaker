import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import { UserAvatar } from '../components/UserAvatar'
import type { Ticket } from '../types/ticket'
import { listTickets } from '../services/tickets'

function formatPrazo(data: string | null | undefined): string {
  if (!data) return '—'
  const d = data.split('-')
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : data
}

export function WhatsAppDemandsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { tickets: data } = await listTickets(
          { origem: 'formulario' },
          { limit: 500, orderBy: 'data_criacao', orderDirection: 'desc' },
        )
        setTickets(data)
      } catch (err) {
        const raw =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Error).message)
            : 'Erro ao carregar demandas.'
        const isMissingColumn =
          /origem|column.*does not exist|não existe/i.test(raw)
        const message = isMissingColumn
          ? 'A coluna "origem" ainda não existe no banco. Execute no SQL Editor do Supabase (local ou remoto) o script: supabase/fix-origem-formulario.sql'
          : raw
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const semResponsavel = tickets.filter((t) => !t.responsavel_id)
  const comResponsavel = tickets.filter((t) => !!t.responsavel_id)

  const renderTabela = (rows: Ticket[], emptyText: string) => {
    if (loading) {
      return (
        <div className="p-8 text-center text-sm text-slate-500">
          Carregando…
        </div>
      )
    }
    if (rows.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      )
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-4 py-3 font-medium text-slate-600">
                Demanda
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Solicitante
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Responsável
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Prazo
              </th>
              <th className="px-4 py-3 font-medium text-slate-600">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr
                key={t.id}
                className="border-b border-slate-100 hover:bg-slate-50/50"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800">
                    {t.titulo}
                  </span>
                  {t.codigo && (
                    <span className="ml-2 text-xs text-slate-400">
                      {t.codigo}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {t.solicitante_nome}
                  {t.solicitante_telefone && (
                    <span className="block text-xs text-slate-400">
                      {t.solicitante_telefone}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TicketStatusPill status={t.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {t.responsavel_nome ? (
                    <UserAvatar
                      avatarUrl={t.responsavel_avatar_url}
                      name={t.responsavel_nome}
                      size="sm"
                      showName
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatPrazo(t.data_entrega)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/demandas/${t.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-800">
            Demandas WhatsApp
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Solicitações vindas do formulário público (link WhatsApp). Atribua responsável e altere status no detalhe para seguir o fluxo.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">
              {semResponsavel.length} demanda(s) sem responsável
            </span>
          </div>
          {renderTabela(
            semResponsavel,
            'Nenhuma demanda do link WhatsApp sem responsável no momento.',
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">
              {comResponsavel.length} demanda(s) com responsável
            </span>
          </div>
          {renderTabela(
            comResponsavel,
            'Nenhuma demanda do link WhatsApp com responsável no momento.',
          )}
        </div>
      </section>
    </LayoutShell>
  )
}
