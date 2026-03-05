import { supabase } from '../lib/supabaseClient'
import type {
  Ticket,
  TicketCategoria,
  TicketPrioridade,
  TicketStatus,
  TicketTipo,
  TicketOrigem,
} from '../types/ticket'

export interface TicketFilters {
  search?: string
  status?: TicketStatus | 'atrasadas' | 'prazo_hoje'
  responsavelId?: string
  prioridade?: TicketPrioridade
  categoria?: TicketCategoria
  tipo?: TicketTipo
  origem?: TicketOrigem
  /** Filtro por data de entrega (prazo) */
  dataInicial?: string
  dataFinal?: string
  /** Filtro por data de criação (para relatórios por período) */
  dataCriacaoInicial?: string
  dataCriacaoFinal?: string
}

export interface ListTicketsOptions {
  limit?: number
  offset?: number
}

export interface ListTicketsResult {
  tickets: Ticket[]
  hasMore: boolean
}

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 5000

export async function listTickets(
  filters: TicketFilters = {},
  options: ListTicketsOptions = {},
): Promise<ListTicketsResult> {
  const limit = Math.min(
    options.limit ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  )
  const offset = options.offset ?? 0
  const fetchSize = limit + 1

  let query = supabase.from('tickets').select(
    `
      id,
      codigo,
      titulo,
      descricao,
      tipo,
      origem,
      solicitante_nome,
      solicitante_telefone,
      categoria,
      prioridade,
      status,
      responsavel_id,
      colaborador_id,
      data_criacao,
      data_entrega,
      material_impressao,
      cor,
      quantidade_pecas,
      tamanho_escala,
      observacoes_tecnicas,
      preco_por_peca,
      quantidade_orcamento,
      total_orcamento,
      desconto,
      observacoes_orcamento,
      status_orcamento,
      sem_cobranca,
      valor_demanda,
      nivel_dificuldade,
      responsavel:responsavel_id ( id, name )
    `,
  )

  if (filters.status && filters.status !== 'atrasadas' && filters.status !== 'prazo_hoje') {
    query = query.eq('status', filters.status)
  }

  if (filters.status !== 'cancelada') {
    query = query.neq('status', 'cancelada')
  }

  if (filters.responsavelId) {
    query = query.eq('responsavel_id', filters.responsavelId)
  }

  if (filters.prioridade) {
    query = query.eq('prioridade', filters.prioridade)
  }

  if (filters.categoria) {
    query = query.eq('categoria', filters.categoria)
  }

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo)
  }

  if (filters.origem) {
    query = query.eq('origem', filters.origem)
  }

  if (filters.dataInicial) {
    query = query.gte('data_entrega', filters.dataInicial)
  }
  if (filters.dataFinal) {
    query = query.lte('data_entrega', filters.dataFinal)
  }

  if (filters.dataCriacaoInicial) {
    query = query.gte('data_criacao', filters.dataCriacaoInicial)
  }
  if (filters.dataCriacaoFinal) {
    query = query.lte('data_criacao', filters.dataCriacaoFinal)
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    query = query.or(
      `titulo.ilike.${term},descricao.ilike.${term},solicitante_nome.ilike.${term},codigo.ilike.${term}`,
    )
  }

  const { data, error } = await query
    .order('data_criacao', { ascending: false })
    .range(offset, offset + fetchSize - 1)

  if (error) {
    throw error
  }

  const rows = data ?? []
  const hasMore = rows.length > limit
  const page = rows.slice(0, limit)
  const tickets = page.map(mapRowToTicket)

  return { tickets, hasMore }
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
        id,
        codigo,
        titulo,
        descricao,
        tipo,
        origem,
        solicitante_nome,
        solicitante_telefone,
        categoria,
        prioridade,
        status,
        responsavel_id,
        colaborador_id,
        data_criacao,
        data_entrega,
        material_impressao,
        cor,
        quantidade_pecas,
        tamanho_escala,
        observacoes_tecnicas,
        preco_por_peca,
        quantidade_orcamento,
        total_orcamento,
        desconto,
        observacoes_orcamento,
        status_orcamento,
        sem_cobranca,
        valor_demanda,
        nivel_dificuldade,
        responsavel:responsavel_id ( id, name )
      `,
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapRowToTicket(data)
}

export interface CreateTicketInput {
  titulo: string
  descricao?: string
  tipo: TicketTipo
  /** Default 'interno'. Use 'formulario' para demandas do link público/WhatsApp. */
  origem?: TicketOrigem
  solicitante_nome: string
  solicitante_telefone?: string
  categoria: TicketCategoria
  prioridade: TicketPrioridade
  data_entrega?: string
  valor_demanda?: number | null
  material_impressao?: string
  cor?: string
  quantidade_pecas?: number
  tamanho_escala?: string
  observacoes_tecnicas?: string
  preco_por_peca?: number
  quantidade_orcamento?: number
  desconto?: number
  observacoes_orcamento?: string
  status_orcamento?: 'aguardando_aprovacao' | 'aprovado' | 'reprovado'
  sem_cobranca?: boolean
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      titulo: input.titulo,
      descricao: input.descricao,
      tipo: input.tipo,
      origem: input.origem ?? 'interno',
      solicitante_nome: input.solicitante_nome,
      solicitante_telefone: input.solicitante_telefone,
      categoria: input.categoria,
      prioridade: input.prioridade,
      data_entrega: input.data_entrega ?? null,
      valor_demanda: input.valor_demanda ?? null,
      material_impressao: input.material_impressao ?? null,
      cor: input.cor ?? null,
      quantidade_pecas: input.quantidade_pecas ?? null,
      tamanho_escala: input.tamanho_escala ?? null,
      observacoes_tecnicas: input.observacoes_tecnicas ?? null,
      preco_por_peca: input.preco_por_peca ?? null,
      quantidade_orcamento: input.quantidade_orcamento ?? null,
      total_orcamento:
        input.preco_por_peca && input.quantidade_orcamento
          ? input.preco_por_peca * input.quantidade_orcamento
          : null,
      desconto: input.desconto ?? null,
      observacoes_orcamento: input.observacoes_orcamento ?? null,
      status_orcamento: input.status_orcamento ?? null,
      sem_cobranca: input.sem_cobranca ?? false,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapRowToTicket(data)
}

export interface UpdateTicketStatusInput {
  status: TicketStatus
  data_entrega?: string | null
}

const TICKET_SELECT_WITH_RESPONSAVEL = `
  id,
  codigo,
  titulo,
  descricao,
  tipo,
  origem,
  solicitante_nome,
  solicitante_telefone,
  categoria,
  prioridade,
  status,
  responsavel_id,
  colaborador_id,
  data_criacao,
  data_entrega,
  material_impressao,
  cor,
  quantidade_pecas,
  tamanho_escala,
  observacoes_tecnicas,
  preco_por_peca,
  quantidade_orcamento,
  total_orcamento,
  desconto,
  observacoes_orcamento,
  status_orcamento,
  sem_cobranca,
  valor_demanda,
  nivel_dificuldade,
  responsavel:responsavel_id ( id, name )
`

export async function updateTicketStatus(
  id: string,
  payload: UpdateTicketStatusInput,
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: payload.status,
      data_entrega: payload.data_entrega ?? null,
    })
    .eq('id', id)
    .select(TICKET_SELECT_WITH_RESPONSAVEL)
    .single()

  if (error) {
    throw error
  }

  return mapRowToTicket(data)
}

/** Atualização de dados gerais da demanda (Felipe e responsável/colaborador podem editar tudo). */
export interface UpdateTicketDadosInput {
  titulo?: string
  descricao?: string | null
  solicitante_nome?: string
  solicitante_telefone?: string | null
  categoria?: TicketCategoria
  prioridade?: TicketPrioridade
  data_entrega?: string | null
  material_impressao?: string | null
  cor?: string | null
  quantidade_pecas?: number | null
  tamanho_escala?: string | null
  observacoes_tecnicas?: string | null
  valor_demanda?: number | null
  nivel_dificuldade?: import('../types/ticket').NivelDificuldade | null
}

export async function updateTicketDados(
  id: string,
  payload: UpdateTicketDadosInput,
): Promise<Ticket> {
  const updatePayload: Record<string, unknown> = {}
  if (payload.titulo !== undefined) updatePayload.titulo = payload.titulo
  if (payload.descricao !== undefined) updatePayload.descricao = payload.descricao
  if (payload.solicitante_nome !== undefined)
    updatePayload.solicitante_nome = payload.solicitante_nome
  if (payload.solicitante_telefone !== undefined)
    updatePayload.solicitante_telefone = payload.solicitante_telefone
  if (payload.categoria !== undefined) updatePayload.categoria = payload.categoria
  if (payload.prioridade !== undefined) updatePayload.prioridade = payload.prioridade
  if (payload.data_entrega !== undefined)
    updatePayload.data_entrega = payload.data_entrega
  if (payload.material_impressao !== undefined)
    updatePayload.material_impressao = payload.material_impressao
  if (payload.cor !== undefined) updatePayload.cor = payload.cor
  if (payload.quantidade_pecas !== undefined)
    updatePayload.quantidade_pecas = payload.quantidade_pecas
  if (payload.tamanho_escala !== undefined)
    updatePayload.tamanho_escala = payload.tamanho_escala
  if (payload.observacoes_tecnicas !== undefined)
    updatePayload.observacoes_tecnicas = payload.observacoes_tecnicas
  if (payload.valor_demanda !== undefined)
    updatePayload.valor_demanda = payload.valor_demanda
  if (payload.nivel_dificuldade !== undefined)
    updatePayload.nivel_dificuldade = payload.nivel_dificuldade

  const { data, error } = await supabase
    .from('tickets')
    .update(updatePayload)
    .eq('id', id)
    .select(
      `
      *,
      responsavel:responsavel_id ( id, name )
    `,
    )
    .single()

  if (error) throw error
  return mapRowToTicket(data)
}

export interface UpdateTicketResponsavelInput {
  responsavel_id: string | null
  colaborador_id?: string | null
  /** Ao atribuir na triagem, avança para em_analise para a demanda sair da caixa de entrada */
  status?: TicketStatus
  data_entrega?: string | null
}

export async function updateTicketResponsavel(
  id: string,
  payload: UpdateTicketResponsavelInput,
): Promise<Ticket> {
  const updatePayload: Record<string, unknown> = {
    responsavel_id: payload.responsavel_id,
    colaborador_id: payload.colaborador_id ?? null,
  }
  if (payload.status !== undefined) updatePayload.status = payload.status
  if (payload.data_entrega !== undefined) updatePayload.data_entrega = payload.data_entrega

  const { data, error } = await supabase
    .from('tickets')
    .update(updatePayload)
    .eq('id', id)
    .select(
      `
      *,
      responsavel:responsavel_id ( id, name )
    `,
    )
    .single()

  if (error) {
    throw error
  }

  return mapRowToTicket(data)
}

export interface UpdateTicketOrcamentoInput {
  preco_por_peca: number
  quantidade_orcamento: number
  desconto?: number
  observacoes_orcamento?: string
  status_orcamento: 'aguardando_aprovacao' | 'aprovado' | 'reprovado'
  sem_cobranca?: boolean
}

export async function updateTicketOrcamento(
  id: string,
  payload: UpdateTicketOrcamentoInput,
): Promise<Ticket> {
  const total = payload.preco_por_peca * payload.quantidade_orcamento

  const { data, error } = await supabase
    .from('tickets')
    .update({
      preco_por_peca: payload.preco_por_peca,
      quantidade_orcamento: payload.quantidade_orcamento,
      total_orcamento: total,
      desconto: payload.desconto ?? null,
      observacoes_orcamento: payload.observacoes_orcamento ?? null,
      status_orcamento: payload.status_orcamento,
      sem_cobranca: payload.sem_cobranca ?? false,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapRowToTicket(data)
}

export interface TicketComment {
  id: number
  ticket_id: string
  created_at: string
  author_name: string
  body: string
}

export async function listComments(ticketId: string): Promise<TicketComment[]> {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select(
      `
        id,
        ticket_id,
        created_at,
        body,
        author:author_id ( id, name )
      `,
    )
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (
    data?.map((row: any) => ({
      id: row.id,
      ticket_id: row.ticket_id,
      created_at: row.created_at,
      body: row.body,
      author_name: row.author?.name ?? 'Usuário',
    })) ?? []
  )
}

export async function addComment(
  ticketId: string,
  body: string,
): Promise<void> {
  const { error } = await supabase
    .from('ticket_comments')
    .insert({ ticket_id: ticketId, body })

  if (error) throw error
}

export interface TicketFile {
  id: number
  ticket_id: string
  created_at: string
  kind: 'foto' | 'arquivo'
  file_name: string
  public_url: string
}

const BUCKET = 'ticket-files'

/** Limite máximo por arquivo (50 MB no plano Free do Supabase). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export async function uploadTicketFile(
  ticketId: string,
  file: File,
  kind: 'foto' | 'arquivo',
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Faça login para enviar anexos.')

  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))
    throw new Error(
      `Arquivo muito grande (máx. ${mb} MB). Comprima o arquivo ou use um menor.`,
    )
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    const msg = uploadError.message ?? ''
    if (
      /maximum allowed size|exceeded.*size|object.*size/i.test(msg) ||
      uploadError.message?.includes('Payload too large')
    ) {
      throw new Error(
        'Arquivo maior que o limite do Storage. No Supabase: Storage → Settings, aumente o "Global file size limit" (ex.: 50 MB). No bucket "ticket-files", em Editar, aumente o limite de tamanho por arquivo.',
      )
    }
    throw uploadError
  }

  const { error: insertError } = await supabase.from('ticket_files').insert({
    ticket_id: ticketId,
    uploaded_by: user.id,
    kind,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  })

  if (insertError) throw insertError
}

/** Limite por foto no formulário público (10 MB). */
export const MAX_PUBLIC_PHOTO_BYTES = 10 * 1024 * 1024

/**
 * Upload de foto sem login (formulário público /solicitar).
 * Só funciona para tickets com origem = 'formulario'.
 */
export async function uploadTicketFilePublic(
  ticketId: string,
  file: File,
): Promise<void> {
  if (file.size > MAX_PUBLIC_PHOTO_BYTES) {
    const mb = Math.round(MAX_PUBLIC_PHOTO_BYTES / (1024 * 1024))
    throw new Error(`Imagem muito grande (máx. ${mb} MB).`)
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    const msg = uploadError.message ?? ''
    if (
      /maximum allowed size|exceeded.*size|object.*size/i.test(msg) ||
      uploadError.message?.includes('Payload too large')
    ) {
      throw new Error(
        'Imagem maior que o limite. Use uma foto menor (até 10 MB).',
      )
    }
    throw uploadError
  }

  const { error: insertError } = await supabase.from('ticket_files').insert({
    ticket_id: ticketId,
    uploaded_by: null,
    kind: 'foto',
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  })

  if (insertError) throw insertError
}

export async function listTicketFiles(ticketId: string): Promise<TicketFile[]> {
  const { data, error } = await supabase
    .from('ticket_files')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (
    data?.map((row) => {
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(row.storage_path)
      return {
        id: row.id,
        ticket_id: row.ticket_id,
        created_at: row.created_at,
        kind: row.kind,
        file_name: row.file_name,
        public_url: publicUrlData.publicUrl,
      } as TicketFile
    }) ?? []
  )
}

function mapRowToTicket(row: any): Ticket {
  const impressao3d =
    row.categoria === 'servicos_3d'
      ? {
          material: (row.material_impressao ?? 'PLA') as any,
          cor: row.cor,
          quantidade_pecas: row.quantidade_pecas,
          tamanho_escala: row.tamanho_escala,
          observacoes_tecnicas: row.observacoes_tecnicas,
        }
      : undefined

  const orcamento =
    row.preco_por_peca && row.quantidade_orcamento
      ? {
          preco_por_peca: Number(row.preco_por_peca),
          quantidade: Number(row.quantidade_orcamento),
          total: Number(row.total_orcamento ?? 0),
          desconto: row.desconto ? Number(row.desconto) : null,
          observacoes: row.observacoes_orcamento,
          status: row.status_orcamento ?? 'aguardando_aprovacao',
          sem_cobranca: !!row.sem_cobranca,
        }
      : undefined

  return {
    id: row.id,
    codigo: row.codigo ?? null,
    titulo: row.titulo,
    descricao: row.descricao ?? null,
    tipo: row.tipo,
    origem: (row.origem ?? 'interno') as TicketOrigem,
    solicitante_nome: row.solicitante_nome,
    solicitante_telefone: row.solicitante_telefone ?? null,
    categoria: row.categoria,
    prioridade: row.prioridade,
    status: row.status,
    responsavel_id: row.responsavel_id ?? null,
    responsavel_nome: row.responsavel?.name ?? null,
    colaborador_id: row.colaborador_id ?? null,
    data_criacao: row.data_criacao,
    data_entrega: row.data_entrega ?? null,
    valor_demanda: row.valor_demanda != null ? Number(row.valor_demanda) : null,
    nivel_dificuldade: row.nivel_dificuldade ?? null,
    impressao3d,
    orcamento: orcamento ?? null,
  }
}

