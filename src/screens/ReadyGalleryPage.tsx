import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import { UserAvatar } from '../components/UserAvatar'
import type { Ticket } from '../types/ticket'
import { listTickets, listTicketFiles } from '../services/tickets'
import type { TicketFile } from '../services/tickets'

interface TicketWithPhoto extends Ticket {
  photo?: TicketFile
}

export function ReadyGalleryPage() {
  const [items, setItems] = useState<TicketWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { tickets: allTickets } = await listTickets({}, { limit: 2000 })
        const filtered = allTickets.filter(
          (t) => t.status === 'pronta' || t.status === 'entregue',
        )

        const withPhotos: TicketWithPhoto[] = []
        for (const t of filtered) {
          const files = await listTicketFiles(t.id)
          const photo =
            files.find((f) => f.kind === 'foto') ?? files.at(0) ?? undefined
          withPhotos.push({ ...t, photo })
        }

        setItems(withPhotos)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar prontos.'
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
            Prontos e entregues
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vitrine dos trabalhos concluídos no Espaço Maker.
          </p>
        </header>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Carregando galeria...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/demandas/${item.id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  {item.photo ? (
                    <img
                      src={item.photo.public_url}
                      alt={item.titulo}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-slate-400">
                      <span className="h-12 w-12 rounded-full border-2 border-dashed border-slate-300" />
                      <span>Sem foto</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="line-clamp-2 font-medium text-slate-800">
                    {item.titulo}
                  </p>
                  <p className="text-sm text-slate-500">{item.solicitante_nome}</p>
                  <div className="flex items-center justify-between gap-2">
                    <TicketStatusPill status={item.status} />
                    <span className="text-xs text-slate-500">
                      {item.responsavel_nome ? (
                        <UserAvatar
                          avatarUrl={item.responsavel_avatar_url}
                          name={item.responsavel_nome}
                          size="sm"
                          showName
                        />
                      ) : (
                        'Equipe'
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {items.length === 0 && (
              <div className="col-span-full rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Nenhum item pronto ou entregue com foto para exibir.
              </div>
            )}
          </div>
        )}
      </section>
    </LayoutShell>
  )
}
