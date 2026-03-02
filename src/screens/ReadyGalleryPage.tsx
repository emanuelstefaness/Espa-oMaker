import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import type { Ticket } from '../types/ticket'
import { listTickets, listTicketFiles, TicketFile } from '../services/tickets'

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
        const tickets = await listTickets()
        const filtered = tickets.filter(
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
      <section className="space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Galeria
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
              Produtos prontos e entregues
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Vitrine dos trabalhos concluídos no Espaço Maker, com foco em
              impressão 3D, modelagem e outros serviços.
            </p>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-center text-xs text-slate-400">
            Carregando galeria...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-700/60 bg-rose-950/50 px-4 py-3 text-xs text-rose-50">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/demandas/${item.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-[0_16px_40px_rgba(15,23,42,0.9)]"
              >
                <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                  {item.photo ? (
                    <img
                      src={item.photo.public_url}
                      alt={item.titulo}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:opacity-95"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] text-slate-500">
                      <span className="h-8 w-8 rounded-full border border-slate-700" />
                      <span>Sem foto anexada</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/0 to-transparent" />
                </div>
                <div className="space-y-1.5 px-3 py-3 text-xs">
                  <p className="line-clamp-2 text-[13px] font-semibold text-slate-50">
                    {item.titulo}
                  </p>
                  <p className="line-clamp-1 text-[11px] text-slate-400">
                    {item.solicitante_nome}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span className="rounded-full border border-slate-700 px-2 py-[2px]">
                      {item.status === 'entregue' ? 'Entregue' : 'Pronta'}
                    </span>
                    <span className="truncate">
                      Resp.: {item.responsavel_nome ?? 'Equipe'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {items.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-6 text-xs text-slate-500">
                Ainda não há produtos marcados como prontos ou entregues com
                fotos para exibir.
              </div>
            )}
          </div>
        )}
      </section>
    </LayoutShell>
  )
}

