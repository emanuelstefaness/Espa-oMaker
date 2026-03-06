import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { UserAvatar } from '../components/UserAvatar'
import {
  listFeedPosts,
  createFeedPost,
  listTicketsForFeed,
  uploadFeedPostAttachment,
} from '../services/feed'
import type {
  FeedPost,
  FeedPostTipo,
  TicketOption,
} from '../services/feed'
import { useAuth } from '../auth/AuthContext'

const TIPO_LABELS: Record<FeedPostTipo, string> = {
  atualizacao: 'Atualização',
  bug: 'Bug',
  ideia: 'Ideia',
}

const TIPO_STYLES: Record<FeedPostTipo, string> = {
  atualizacao: 'bg-blue-100 text-blue-800',
  bug: 'bg-rose-100 text-rose-800',
  ideia: 'bg-emerald-100 text-emerald-800',
}

export function FeedPage() {
  const { appUser } = useAuth()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<FeedPostTipo>('atualizacao')
  const [conteudo, setConteudo] = useState('')
  const [ticketId, setTicketId] = useState<string>('')
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([])
  const [publishing, setPublishing] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [showNewPostModal, setShowNewPostModal] = useState(false)

  const loadPosts = () => {
    setLoading(true)
    setError(null)
    listFeedPosts()
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar feed.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPosts()
    listTicketsForFeed().then(setTicketOptions).catch(() => setTicketOptions([]))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!appUser || !conteudo.trim()) return
    setPublishing(true)
    setError(null)
    try {
      const post = await createFeedPost(
        {
          tipo,
          conteudo: conteudo.trim(),
          ticket_id: ticketId || null,
        },
        appUser.id,
      )
      const uploadErrors: string[] = []
      for (const file of files) {
        try {
          await uploadFeedPostAttachment(post.id, file, appUser.id)
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Falha no envio'
          uploadErrors.push(`${file.name}: ${msg}`)
        }
      }
      setConteudo('')
      setTicketId('')
      setFiles([])
      setShowNewPostModal(false)
      loadPosts()
      if (uploadErrors.length > 0) {
        setError(`Post publicado. Não foi possível enviar alguns anexos: ${uploadErrors.join('; ')}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar.')
    } finally {
      setPublishing(false)
    }
  }

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files
    if (!chosen?.length) return
    setFiles((prev) => [...prev, ...Array.from(chosen)])
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const closeModal = () => {
    if (!publishing) setShowNewPostModal(false)
  }

  return (
    <LayoutShell>
      <section className="mx-auto max-w-2xl space-y-6 pb-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Feed interno</h1>
            <p className="mt-1 text-sm text-slate-500">
              Atualizações, bugs e ideias da equipe. Vincule demandas quando fizer sentido.
            </p>
          </div>
          {appUser && (
            <button
              type="button"
              onClick={() => setShowNewPostModal(true)}
              className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-600"
            >
              + Novo post
            </button>
          )}
        </header>

        {showNewPostModal && appUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeModal}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 id="modal-title" className="text-sm font-semibold text-slate-800">
                  Novo post
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as FeedPostTipo)}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="atualizacao">Atualização</option>
                    <option value="bug">Bug</option>
                    <option value="ideia">Ideia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Conteúdo</label>
                  <textarea
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    placeholder="Escreva algo para a equipe..."
                    rows={3}
                    required
                    className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">
                    Vincular demanda (opcional)
                  </label>
                  <select
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">Selecionar demanda</option>
                    {ticketOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.codigo ? `${t.codigo} – ` : ''}{t.titulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">
                    Anexar arquivos
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={addFiles}
                    className="mt-0.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
                  />
                  {files.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {f.name}
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-slate-500 hover:text-rose-600"
                            aria-label="Remover"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={publishing || !conteudo.trim()}
                    className="flex-1 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {publishing ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Timeline</h2>
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Carregando...
            </p>
          ) : posts.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-white py-12 text-center text-sm text-slate-500">
              Nenhum post ainda. Seja o primeiro a publicar.
            </p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <UserAvatar
                      avatarUrl={post.author_avatar_url}
                      name={post.author_name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {post.author_name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_STYLES[post.tipo]}`}
                        >
                          {TIPO_LABELS[post.tipo]}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(post.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                        {post.conteudo}
                      </p>
                      {post.ticket_id && (
                        <Link
                          to={`/demandas/${post.ticket_id}`}
                          className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {post.ticket_codigo
                            ? `${post.ticket_codigo} – `
                            : ''}
                          {post.ticket_titulo ?? 'Ver demanda'}
                          <span className="ml-1">→</span>
                        </Link>
                      )}
                      {post.attachments.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {post.attachments.map((a) => {
                            const isImage =
                              (a.mime_type && a.mime_type.startsWith('image/')) ||
                              /\.(png|jpe?g|gif|webp|bmp)$/i.test(a.file_name)
                            return (
                              <li key={a.id}>
                                {isImage ? (
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                                  >
                                    <img
                                      src={a.url}
                                      alt={a.file_name}
                                      className="max-h-64 max-w-full object-contain"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                                  >
                                    {a.file_name}
                                  </a>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      <button
                        type="button"
                        className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Comentários (em breve)"
                      >
                        💬 Comentários (em breve)
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </LayoutShell>
  )
}
