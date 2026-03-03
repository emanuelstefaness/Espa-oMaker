import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type { Ticket, TicketStatus } from '../types/ticket'
import {
  addComment,
  listComments,
  listTicketFiles,
  updateTicketOrcamento,
  updateTicketStatus,
  uploadTicketFile,
  getTicket,
} from '../services/tickets'
import type { TicketComment, TicketFile } from '../services/tickets'
import { useAuth } from '../auth/AuthContext'

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [comments, setComments] = useState<TicketComment[]>([])
  const [commentText, setCommentText] = useState('')

  const [files, setFiles] = useState<TicketFile[]>([])
  const [uploading, setUploading] = useState(false)

  const [orcPreco, setOrcPreco] = useState<number | ''>('')
  const [orcQtde, setOrcQtde] = useState<number | ''>('')
  const [orcDesconto, setOrcDesconto] = useState<number | ''>('')
  const [orcObs, setOrcObs] = useState('')
  const [orcStatus, setOrcStatus] =
    useState<'aguardando_aprovacao' | 'aprovado' | 'reprovado'>(
      'aguardando_aprovacao',
    )
  const [semCobranca, setSemCobranca] = useState(false)
  const [savingOrcamento, setSavingOrcamento] = useState(false)

  const { appUser } = useAuth()
  const isFelipe = appUser?.role === 'felipe'
  const isExecutor = appUser?.role === 'executor'
  const isResponsavel =
    ticket &&
    (ticket.responsavel_id === appUser?.id ||
      ticket.colaborador_id === appUser?.id)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getTicket(id)
        if (!data) {
          setError('Demanda não encontrada.')
          setTicket(null)
          return
        }
        setTicket(data)
        if (data.orcamento) {
          setOrcPreco(data.orcamento.preco_por_peca)
          setOrcQtde(data.orcamento.quantidade)
          setOrcDesconto(data.orcamento.desconto ?? '')
          setOrcObs(data.orcamento.observacoes ?? '')
          setOrcStatus(data.orcamento.status)
          setSemCobranca(data.orcamento.sem_cobranca)
        }
        const [c, f] = await Promise.all([
          listComments(id),
          listTicketFiles(id),
        ])
        setComments(c)
        setFiles(f)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar demanda.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleStatusChange = async (next: TicketStatus) => {
    if (!id) return
    try {
      const updated = await updateTicketStatus(id, {
        status: next,
      })
      setTicket(updated)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar status.'
      setError(message)
    }
  }

  const handleCommentSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!id || !commentText.trim()) return
    try {
      await addComment(id, commentText.trim())
      setCommentText('')
      const data = await listComments(id)
      setComments(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao enviar comentário.'
      setError(message)
    }
  }

  const handleUploadChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: 'foto' | 'arquivo',
  ) => {
    const file = event.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    try {
      await uploadTicketFile(id, file, kind)
      const data = await listTicketFiles(id)
      setFiles(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao enviar arquivo.'
      setError(message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleOrcamentoSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!id) return
    if (typeof orcPreco !== 'number' || typeof orcQtde !== 'number') {
      setError('Informe preço por peça e quantidade para salvar o orçamento.')
      return
    }

    try {
      setSavingOrcamento(true)
      const updated = await updateTicketOrcamento(id, {
        preco_por_peca: orcPreco,
        quantidade_orcamento: orcQtde,
        desconto: typeof orcDesconto === 'number' ? orcDesconto : undefined,
        observacoes_orcamento: orcObs || undefined,
        status_orcamento: orcStatus,
        sem_cobranca: semCobranca,
      })
      setTicket(updated)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar orçamento.'
      setError(message)
    } finally {
      setSavingOrcamento(false)
    }
  }

  if (loading) {
    return (
      <LayoutShell>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-center text-xs text-slate-400">
          Carregando demanda...
        </div>
      </LayoutShell>
    )
  }

  if (error || !ticket) {
    return (
      <LayoutShell>
        <div className="rounded-2xl border border-rose-700/60 bg-rose-950/50 px-4 py-6 text-xs text-rose-50">
          {error ?? 'Demanda não encontrada.'}
        </div>
      </LayoutShell>
    )
  }

  const total =
    typeof orcPreco === 'number' && typeof orcQtde === 'number'
      ? orcPreco * orcQtde
      : 0

  const podeAlterarStatus =
    (isFelipe && ticket.status !== 'entregue' && ticket.status !== 'cancelada') ||
    (isExecutor && isResponsavel)

  return (
    <LayoutShell>
      <section className="space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Detalhe da demanda
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
              {ticket.titulo}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {ticket.solicitante_nome}{' '}
              {ticket.tipo === 'externa' ? '· Demanda externa' : '· Demanda interna'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <TicketStatusPill status={ticket.status} />
            <span className="rounded-full border border-slate-700 px-2 py-[2px] text-slate-300">
              Resp.: {ticket.responsavel_nome ?? '—'}
            </span>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-rose-600/70 bg-rose-950/50 px-3 py-2 text-[11px] text-rose-50">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[2fr_1.4fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Informações principais
              </p>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <Field label="Tipo">
                  {ticket.tipo === 'externa' ? 'Externa' : 'Interna'}
                </Field>
                <Field label="Prioridade">
                  {ticket.prioridade.toUpperCase()}
                </Field>
                <Field label="Categoria">
                  {ticket.categoria === 'impressao_3d'
                    ? 'Impressão 3D'
                    : ticket.categoria === 'modelagem_3d'
                      ? 'Modelagem 3D'
                      : ticket.categoria === 'reparo'
                        ? 'Reparo'
                        : ticket.categoria === 'laser'
                          ? 'Laser'
                          : 'Outros'}
                </Field>
                <Field label="Prazo de entrega">
                  {ticket.data_entrega ?? '—'}
                </Field>
                <Field label="Criada em">{ticket.data_criacao}</Field>
                <Field label="Telefone do solicitante">
                  {ticket.solicitante_telefone ?? '—'}
                </Field>
              </div>
              {ticket.descricao && (
                <div className="mt-3">
                  <Field label="Descrição">
                    <p className="whitespace-pre-line text-[11px] text-slate-200">
                      {ticket.descricao}
                    </p>
                  </Field>
                </div>
              )}
            </div>

            {ticket.categoria === 'impressao_3d' && ticket.impressao3d && (
              <div className="space-y-2 rounded-2xl border border-cyan-700/60 bg-cyan-950/40 p-3 text-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Impressão 3D
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Material">{ticket.impressao3d.material}</Field>
                  <Field label="Cor">{ticket.impressao3d.cor ?? '—'}</Field>
                  <Field label="Quantidade de peças">
                    {ticket.impressao3d.quantidade_pecas ?? '—'}
                  </Field>
                  <Field label="Tamanho / escala">
                    {ticket.impressao3d.tamanho_escala ?? '—'}
                  </Field>
                </div>
                {ticket.impressao3d.observacoes_tecnicas && (
                  <Field label="Observações técnicas">
                    {ticket.impressao3d.observacoes_tecnicas}
                  </Field>
                )}
              </div>
            )}

            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Comentários / chat interno
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span>{c.author_name}</span>
                      <span>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-100">
                      {c.body}
                    </p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Nenhum comentário ainda.
                  </p>
                )}
              </div>
              <form onSubmit={handleCommentSubmit} className="mt-2 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-[11px] font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-3">
            <form
              onSubmit={handleOrcamentoSubmit}
              className="space-y-2 rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Orçamento
                </p>
                {ticket.tipo === 'interna' && (
                  <label className="flex items-center gap-2 text-[11px] text-emerald-100">
                    <input
                      type="checkbox"
                      checked={semCobranca}
                      onChange={(e) => setSemCobranca(e.target.checked)}
                      className="h-3 w-3 rounded border border-emerald-500 bg-transparent text-emerald-500"
                    />
                    Sem cobrança
                  </label>
                )}
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Field label="Preço por peça (R$)">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={orcPreco}
                    onChange={(e) =>
                      setOrcPreco(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </Field>
                <Field label="Quantidade">
                  <input
                    type="number"
                    min={1}
                    value={orcQtde}
                    onChange={(e) =>
                      setOrcQtde(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </Field>
                <Field label="Total (R$)">
                  <input
                    disabled
                    value={total.toFixed(2)}
                    className="w-full rounded-lg border border-emerald-600 bg-emerald-900/40 px-2 py-1.5 text-[11px] text-emerald-50"
                  />
                </Field>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Field label="Desconto (R$ opcional)">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={orcDesconto}
                    onChange={(e) =>
                      setOrcDesconto(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </Field>
                <Field label="Status do orçamento">
                  <select
                    value={orcStatus}
                    onChange={(e) =>
                      setOrcStatus(
                        e.target.value as
                          | 'aguardando_aprovacao'
                          | 'aprovado'
                          | 'reprovado',
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="aguardando_aprovacao">
                      Aguardando aprovação
                    </option>
                    <option value="aprovado">Aprovado</option>
                    <option value="reprovado">Reprovado</option>
                  </select>
                </Field>
              </div>

              <Field label="Observações do orçamento">
                <textarea
                  rows={2}
                  value={orcObs}
                  onChange={(e) => setOrcObs(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
                  {ticket.tipo === 'externa' && (
                    <button
                      type="button"
                      disabled={savingOrcamento}
                      onClick={() => setOrcStatus('aprovado')}
                      className="rounded-full border border-emerald-400/70 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-100 hover:bg-emerald-500/20"
                    >
                      Marcar como aprovado
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={savingOrcamento}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {savingOrcamento ? 'Salvando...' : 'Salvar orçamento'}
                </button>
              </div>
            </form>

            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Workflow / andamento
              </p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {podeAlterarStatus && (
                  <>
                    {ticket.status === 'recebida' && isFelipe && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange('em_analise')}
                        className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-700"
                      >
                        Mover para análise
                      </button>
                    )}
                    {ticket.status === 'aguardando_aprovacao' &&
                      isFelipe && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange('aprovado')}
                            className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400"
                          >
                            Marcar orçamento aprovado
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrcStatus('reprovado')}
                            className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-semibold text-rose-50 hover:bg-rose-500"
                          >
                            Marcar orçamento reprovado
                          </button>
                        </>
                      )}
                    {['aprovado', 'orcamento_em_criacao'].includes(
                      ticket.status,
                    ) &&
                      (isFelipe || isExecutor) && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange('em_producao')}
                          className="rounded-full bg-cyan-500 px-3 py-1 text-[11px] font-semibold text-cyan-950 hover:bg-cyan-400"
                        >
                          Iniciar produção
                        </button>
                      )}
                    {ticket.status === 'em_producao' && isExecutor && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange('pos_processo')}
                        className="rounded-full bg-fuchsia-500 px-3 py-1 text-[11px] font-semibold text-fuchsia-950 hover:bg-fuchsia-400"
                      >
                        Enviar para pós-processo
                      </button>
                    )}
                    {ticket.status === 'pos_processo' && isExecutor && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange('pronta')}
                        className="rounded-full bg-lime-400 px-3 py-1 text-[11px] font-semibold text-lime-950 hover:bg-lime-300"
                      >
                        Marcar como pronta
                      </button>
                    )}
                    {ticket.status === 'pronta' && isExecutor && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange('entregue')}
                        className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-950 hover:bg-white"
                      >
                        Concluir entrega
                      </button>
                    )}
                  </>
                )}
                {!podeAlterarStatus && (
                  <p className="text-[11px] text-slate-500">
                    Apenas Felipe (triagem) ou o responsável podem avançar o
                    fluxo desta demanda.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Anexos (fotos e arquivos)
              </p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400">
                  <span>+ Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadChange(e, 'foto')}
                  />
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 px-3 py-1 hover:border-cyan-400">
                  <span>+ Arquivo (STL/OBJ/3MF/IMG/PDF)</span>
                  <input
                    type="file"
                    accept=".stl,.obj,.3mf,.pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleUploadChange(e, 'arquivo')}
                  />
                </label>
                {uploading && (
                  <span className="text-[11px] text-slate-400">
                    Enviando arquivo...
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1.5"
                  >
                    <span className="truncate text-[11px] text-slate-100">
                      {f.file_name}
                    </span>
                    <a
                      href={f.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-medium text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                    >
                      Abrir
                    </a>
                  </div>
                ))}
                {files.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Nenhum anexo enviado ainda.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-0.5 text-[11px]">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <div className="text-slate-100">{children}</div>
    </div>
  )
}

