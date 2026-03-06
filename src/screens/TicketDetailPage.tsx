import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import { TicketStatusPill } from '../components/TicketStatusPill'
import type {
  Ticket,
  TicketStatus,
  TicketCategoria,
  TicketPrioridade,
} from '../types/ticket'
import {
  addComment,
  listComments,
  listTicketFiles,
  updateTicketStatus,
  updateTicketDados,
  uploadTicketFile,
  getTicket,
  setTicketExcluida,
  listTicketTasks,
  createTicketTask,
  updateTicketTaskStatus,
} from '../services/tickets'
import type {
  TicketComment,
  TicketFile,
  TicketTask,
  TicketTaskStatus,
} from '../services/tickets'
import { useAuth } from '../auth/AuthContext'
import { CATEGORIAS } from '../constants/ticketOptions'
import { CategorySelect } from '../components/CategorySelect'
import { MaterialSelect } from '../components/MaterialSelect'
import { UserAvatar } from '../components/UserAvatar'

const STATUS_LABELS: Record<TicketStatus, string> = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  orcamento_em_criacao: 'Orçamento em criação',
  aguardando_aprovacao: 'Aguardando aprovação de orçamento',
  aprovado: 'Orçamento aprovado',
  em_producao: 'Em produção',
  pos_processo: 'Pós-processo',
  pronta: 'Pronta',
  entregue: 'Entregue (finalizado)',
  cancelada: 'Cancelada',
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [comments, setComments] = useState<TicketComment[]>([])
  const [commentText, setCommentText] = useState('')

  const [files, setFiles] = useState<TicketFile[]>([])
  const [uploading, setUploading] = useState(false)

  const [tasks, setTasks] = useState<TicketTask[]>([])
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [taskTitulo, setTaskTitulo] = useState('')
  const [taskDescricao, setTaskDescricao] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  const { appUser } = useAuth()
  const isFelipe = appUser?.role === 'felipe'
  const isExecutor = appUser?.role === 'executor'
  const isResponsavelOuColaborador = (t: Ticket) =>
    t.responsavel_id === appUser?.id || t.colaborador_id === appUser?.id

  const podeEditarDados = (t: Ticket) =>
    !t.excluida_em && (isFelipe || (isExecutor && isResponsavelOuColaborador(t)))
  const [editingDados, setEditingDados] = useState(false)
  const [savingDados, setSavingDados] = useState(false)
  const [formDados, setFormDados] = useState({
    titulo: '',
    descricao: '',
    solicitante_nome: '',
    solicitante_telefone: '',
    categoria: 'servicos_3d' as TicketCategoria,
    prioridade: 'media' as TicketPrioridade,
    data_entrega: '',
    material_impressao: '',
    cor: '',
    quantidade_pecas: '' as number | '',
    tamanho_escala: '',
    observacoes_tecnicas: '',
    valor_demanda: '' as number | '',
  })

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
        const [c, f, t] = await Promise.all([
          listComments(id),
          listTicketFiles(id),
          listTicketTasks(id),
        ])
        setComments(c)
        setFiles(f)
        setTasks(t)
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
    setError(null)
    try {
      const updated = await updateTicketStatus(id, {
        status: next,
      })
      setTicket(updated)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as Error).message)
          : 'Erro ao atualizar status.'
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

  const TASK_STATUS_LABELS: Record<TicketTaskStatus, string> = {
    pendente: 'Pendente',
    em_producao: 'Em produção',
    concluido: 'Concluído',
  }

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault()
    if (!id || !appUser || !taskTitulo.trim()) return
    setSavingTask(true)
    try {
      const newTask = await createTicketTask(id, {
        titulo: taskTitulo.trim(),
        descricao: taskDescricao.trim() || null,
        responsavel_id: appUser.id,
      })
      setTasks((prev) => [...prev, newTask])
      setTaskTitulo('')
      setTaskDescricao('')
      setShowNewTaskForm(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar task.'
      setError(message)
    } finally {
      setSavingTask(false)
    }
  }

  const handleTaskStatusChange = async (taskId: number, status: TicketTaskStatus) => {
    try {
      await updateTicketTaskStatus(taskId, status)
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao atualizar status.'
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

  const openEditDados = () => {
    if (!ticket) return
    setFormDados({
      titulo: ticket.titulo,
      descricao: ticket.descricao ?? '',
      solicitante_nome: ticket.solicitante_nome,
      solicitante_telefone: ticket.solicitante_telefone ?? '',
      categoria: ticket.categoria,
      prioridade: ticket.prioridade,
      data_entrega: ticket.data_entrega ?? '',
      material_impressao: ticket.impressao3d?.material ?? '',
      cor: ticket.impressao3d?.cor ?? '',
      quantidade_pecas:
        ticket.impressao3d?.quantidade_pecas ?? ('' as number | ''),
      tamanho_escala: ticket.impressao3d?.tamanho_escala ?? '',
      observacoes_tecnicas:
        ticket.impressao3d?.observacoes_tecnicas ?? '',
      valor_demanda: ticket.valor_demanda ?? ('' as number | ''),
    })
    setEditingDados(true)
  }

  const handleSaveDados = async (event: FormEvent) => {
    event.preventDefault()
    if (!id || !ticket) return
    setSavingDados(true)
    try {
      const updated = await updateTicketDados(id, {
        titulo: formDados.titulo,
        descricao: formDados.descricao || null,
        solicitante_nome: formDados.solicitante_nome,
        solicitante_telefone: formDados.solicitante_telefone || null,
        categoria: formDados.categoria,
        prioridade: formDados.prioridade,
        data_entrega: formDados.data_entrega || null,
        material_impressao:
          formDados.categoria === 'servicos_3d' && formDados.material_impressao
            ? formDados.material_impressao
            : null,
        cor:
          formDados.categoria === 'servicos_3d' && formDados.cor
            ? formDados.cor
            : null,
        quantidade_pecas:
          formDados.categoria === 'servicos_3d' && formDados.quantidade_pecas
            ? Number(formDados.quantidade_pecas)
            : null,
        tamanho_escala:
          formDados.categoria === 'servicos_3d' && formDados.tamanho_escala
            ? formDados.tamanho_escala
            : null,
        observacoes_tecnicas:
          formDados.categoria === 'servicos_3d' &&
          formDados.observacoes_tecnicas
            ? formDados.observacoes_tecnicas
            : null,
        valor_demanda:
          formDados.valor_demanda !== ''
            ? Number(formDados.valor_demanda)
            : null,
      })
      setTicket(updated)
      setEditingDados(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar dados.'
      setError(message)
    } finally {
      setSavingDados(false)
    }
  }

  if (loading) {
    return (
      <LayoutShell>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Carregando demanda...
        </div>
      </LayoutShell>
    )
  }

  if (error || !ticket) {
    return (
      <LayoutShell>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
          {error ?? 'Demanda não encontrada.'}
        </div>
      </LayoutShell>
    )
  }

  const podeAlterarStatus =
    !ticket.excluida_em &&
    (isFelipe || (isExecutor && isResponsavelOuColaborador(ticket)))

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
              {ticket.titulo}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {ticket.solicitante_nome}{' '}
              {ticket.tipo === 'externa' ? '· Externa' : '· Interna'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ticket.origem === 'formulario' && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                WhatsApp
              </span>
            )}
            <TicketStatusPill status={ticket.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              Resp.:{' '}
              {ticket.responsavel_nome ? (
                <UserAvatar
                  avatarUrl={ticket.responsavel_avatar_url}
                  name={ticket.responsavel_nome}
                  size="sm"
                  showName
                />
              ) : (
                '—'
              )}
            </span>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1.4fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Informações principais
                </p>
                {podeEditarDados(ticket) && !editingDados && (
                  <button
                    type="button"
                    onClick={openEditDados}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {ticket.origem === 'formulario'
                      ? 'Completar dados'
                      : 'Editar dados'}
                  </button>
                )}
              </div>

              {editingDados ? (
                <form
                  onSubmit={handleSaveDados}
                  className="mt-4 space-y-4"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Título
                      </label>
                      <input
                        required
                        value={formDados.titulo}
                        onChange={(e) =>
                          setFormDados((p) => ({ ...p, titulo: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Solicitante
                      </label>
                      <input
                        required
                        value={formDados.solicitante_nome}
                        onChange={(e) =>
                          setFormDados((p) => ({
                            ...p,
                            solicitante_nome: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Telefone
                      </label>
                      <input
                        value={formDados.solicitante_telefone}
                        onChange={(e) =>
                          setFormDados((p) => ({
                            ...p,
                            solicitante_telefone: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Prioridade
                      </label>
                      <select
                        value={formDados.prioridade}
                        onChange={(e) =>
                          setFormDados((p) => ({
                            ...p,
                            prioridade: e.target.value as TicketPrioridade,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Categoria
                      </label>
                      <CategorySelect
                        value={formDados.categoria}
                        onChange={(categoria) =>
                          setFormDados((p) => ({ ...p, categoria }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Prazo de entrega
                      </label>
                      <input
                        type="date"
                        value={formDados.data_entrega}
                        onChange={(e) =>
                          setFormDados((p) => ({
                            ...p,
                            data_entrega: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Valor da demanda (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formDados.valor_demanda === '' ? '' : formDados.valor_demanda}
                      onChange={(e) =>
                        setFormDados((p) => ({
                          ...p,
                          valor_demanda:
                            e.target.value === ''
                              ? ('' as number | '')
                              : Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Descrição
                    </label>
                    <textarea
                      value={formDados.descricao}
                      onChange={(e) =>
                        setFormDados((p) => ({ ...p, descricao: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  {formDados.categoria === 'servicos_3d' && (
                    <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Material
                        </label>
                        <MaterialSelect
                          value={formDados.material_impressao ?? ''}
                          onChange={(material_impressao) =>
                            setFormDados((p) => ({ ...p, material_impressao }))
                          }
                          className="w-full"
                          placeholder="—"
                          allowEmpty
                        />
                      </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Cor
                      </label>
                      <input
                        value={formDados.cor}
                        onChange={(e) =>
                          setFormDados((p) => ({ ...p, cor: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Ex: preto"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Quantidade de peças
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formDados.quantidade_pecas}
                        onChange={(e) =>
                          setFormDados((p) => ({
                            ...p,
                            quantidade_pecas:
                              e.target.value === ''
                                ? ('' as number | '')
                                : parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Tamanho / escala
                      </label>
                      <input
                        value={formDados.tamanho_escala}
                        onChange={(e) =>
                          setFormDados((p) => ({
                            ...p,
                            tamanho_escala: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Ex: 1:1, 200%"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Observações técnicas
                      </label>
                      <textarea
                        value={formDados.observacoes_tecnicas}
                        onChange={(e) =>
                          setFormDados((p) => ({
                            ...p,
                            observacoes_tecnicas: e.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingDados}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingDados ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDados(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <Field label="Tipo">
                      {ticket.tipo === 'externa' ? 'Externa' : 'Interna'}
                    </Field>
                    <Field label="Prioridade">
                      {ticket.prioridade.toUpperCase()}
                    </Field>
                    <Field label="Categoria">
                      {CATEGORIAS.find((c) => c.value === ticket.categoria)
                        ?.label ?? ticket.categoria}
                    </Field>
                    <Field label="Prazo de entrega">
                      {ticket.data_entrega ?? '—'}
                    </Field>
                    <Field label="Valor da demanda">
                      {ticket.valor_demanda != null
                        ? `R$ ${Number(ticket.valor_demanda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </Field>
                    <Field label="Criada em">{ticket.data_criacao}</Field>
                    <Field label="Telefone do solicitante">
                      {ticket.solicitante_telefone ?? '—'}
                    </Field>
                  </div>
                  {ticket.descricao && (
                    <div className="mt-3">
                      <Field label="Descrição">
                        <p className="whitespace-pre-line text-sm text-slate-700">
                          {ticket.descricao}
                        </p>
                      </Field>
                    </div>
                  )}
                </>
              )}
            </div>

            {ticket.categoria === 'servicos_3d' && ticket.impressao3d && (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-blue-50/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                  Serviços 3D
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

            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Comentários
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{c.author_name}</span>
                      <span>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{c.body}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-slate-500">Nenhum comentário ainda.</p>
                )}
              </div>
              <form onSubmit={handleCommentSubmit} className="mt-3 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Enviar
                </button>
              </form>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tasks da Demanda
                </p>
                {!ticket.excluida_em && appUser && (
                  <button
                    type="button"
                    onClick={() => setShowNewTaskForm((v) => !v)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    + Nova Task
                  </button>
                )}
              </div>
              {showNewTaskForm && appUser && (
                <form
                  onSubmit={handleCreateTask}
                  className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                >
                  <input
                    value={taskTitulo}
                    onChange={(e) => setTaskTitulo(e.target.value)}
                    placeholder="Título da task"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <textarea
                    value={taskDescricao}
                    onChange={(e) => setTaskDescricao(e.target.value)}
                    placeholder="Descrição (opcional)"
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <p className="text-xs text-slate-500">
                    Responsável: você ({appUser.name})
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={savingTask}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {savingTask ? 'Salvando…' : 'Criar task'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewTaskForm(false)
                        setTaskTitulo('')
                        setTaskDescricao('')
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{task.titulo}</p>
                      {task.descricao && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                          {task.descricao}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        Responsável: {task.responsavel_nome}
                        {task.created_by_nome && (
                          <> · Criada por {task.created_by_nome}</>
                        )}{' '}
                        · {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.status === 'concluido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'em_producao'
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                    {!ticket.excluida_em && (
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleTaskStatusChange(
                            task.id,
                            e.target.value as TicketTaskStatus,
                          )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_producao">Em produção</option>
                        <option value="concluido">Concluído</option>
                      </select>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && !showNewTaskForm && (
                  <p className="text-sm text-slate-500">Nenhuma task ainda.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Workflow
              </p>
              {ticket.excluida_em ? (
                <p className="text-sm text-slate-500">Esta demanda foi excluída e não pode mais ser alterada.</p>
              ) : (
                <>
                  {podeAlterarStatus && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-600">
                        Alterar status
                      </label>
                      <select
                        value={ticket.status}
                        onChange={(e) => {
                          const next = e.target.value as TicketStatus
                          if (next === ticket.status) return
                          const label = STATUS_LABELS[next]
                          if (
                            window.confirm(
                              `Tem certeza que deseja alterar o status para "${label}"?`,
                            )
                          ) {
                            handleStatusChange(next)
                          }
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="recebida">Recebida</option>
                        <option value="em_analise">Em análise</option>
                        <option value="orcamento_em_criacao">
                          Orçamento em criação
                        </option>
                        <option value="aguardando_aprovacao">
                          Aguardando aprovação de orçamento
                        </option>
                        <option value="aprovado">Orçamento aprovado</option>
                        <option value="em_producao">Em produção</option>
                        <option value="pos_processo">Pós-processo</option>
                        <option value="pronta">Pronta</option>
                        <option value="entregue">Entregue (finalizado)</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                  )}
                  {!podeAlterarStatus && (
                    <p className="text-sm text-slate-500">
                      Apenas triagem (Felipe) ou o responsável pela demanda podem alterar o fluxo.
                    </p>
                  )}
                </>
              )}
            </div>

            {!ticket.excluida_em && podeAlterarStatus && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Tem certeza que deseja excluir esta demanda? Ela não aparecerá mais nas listas e não poderá ser alterada.')) return
                    try {
                      await setTicketExcluida(ticket.id)
                      setTicket((t) => (t ? { ...t, excluida_em: new Date().toISOString() } : null))
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : 'Erro ao excluir.'
                      window.alert(msg)
                    }
                  }}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Excluir demanda
                </button>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Anexos
              </p>
              {!ticket.excluida_em && (
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    + Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadChange(e, 'foto')}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    + Arquivo
                    <input
                      type="file"
                      accept=".stl,.obj,.3mf,.pdf,image/*"
                      className="hidden"
                      onChange={(e) => handleUploadChange(e, 'arquivo')}
                    />
                  </label>
                  {uploading && (
                    <span className="text-sm text-slate-500">Enviando...</span>
                  )}
                </div>
              )}
              <div className="mt-3 space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="truncate">{f.file_name}</span>
                    <a
                      href={f.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      Abrir
                    </a>
                  </div>
                ))}
                {files.length === 0 && (
                  <p className="text-sm text-slate-500">Nenhum anexo ainda.</p>
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
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  )
}

