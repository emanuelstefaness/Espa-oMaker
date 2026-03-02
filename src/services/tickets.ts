import { supabase } from '../lib/supabaseClient'
import type {
  Ticket,
  TicketCategoria,
  TicketPrioridade,
  TicketStatus,
  TicketTipo,
} from '../types/ticket'

export interface TicketFilters {
  search?: string
  status?: TicketStatus | 'atrasadas' | 'prazo_hoje'
  responsavelId?: string
  prioridade?: TicketPrioridade
  categoria?: TicketCategoria
  tipo?: TicketTipo
  dataInicial?: string
  dataFinal?: string
}

export async function listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  let query = supabase.from('tickets').select(
    `
      id,
      codigo,
      titulo,
      descricao,
      tipo,
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
      responsavel:responsavel_id ( id, name )
    `,
  )

  if (filters.status && filters.status !== 'atrasadas' && filters.status !== 'prazo_hoje') {
    query = query.eq('status', filters.status)
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

  if (filters.dataInicial) {
    query = query.gte('data_entrega', filters.dataInicial)
  }
  if (filters.dataFinal) {
    query = query.lte('data_entrega', filters.dataFinal)
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    query = query.or(
      `titulo.ilike.${term},descricao.ilike.${term},solicitante_nome.ilike.${term},codigo.ilike.${term}`,
    )
  }

  const { data, error } = await query.order('data_criacao', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapRowToTicket)
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
  solicitante_nome: string
  solicitante_telefone?: string
  categoria: TicketCategoria
  prioridade: TicketPrioridade
  data_entrega?: string
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
      solicitante_nome: input.solicitante_nome,
      solicitante_telefone: input.solicitante_telefone,
      categoria: input.categoria,
      prioridade: input.prioridade,
      data_entrega: input.data_entrega ?? null,
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
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapRowToTicket(data)
}

export interface UpdateTicketResponsavelInput {
  responsavel_id: string | null
  colaborador_id?: string | null
}

export async function updateTicketResponsavel(
  id: string,
  payload: UpdateTicketResponsavelInput,
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      responsavel_id: payload.responsavel_id,
      colaborador_id: payload.colaborador_id ?? null,
    })
    .eq('id', id)
    .select()
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

export async function uploadTicketFile(
  ticketId: string,
  file: File,
  kind: 'foto' | 'arquivo',
): Promise<void> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { error: insertError } = await supabase.from('ticket_files').insert({
    ticket_id: ticketId,
    uploaded_by: null,
    kind,
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
    row.categoria === 'impressao_3d'
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
    titulo: row.titulo,
    descricao: row.descricao ?? null,
    tipo: row.tipo,
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
    impressao3d,
    orcamento: orcamento ?? null,
  }
}

