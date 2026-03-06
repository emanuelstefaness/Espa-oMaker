import { supabase } from '../lib/supabaseClient'

const FEED_BUCKET = 'feed-files'
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB

export type FeedPostTipo = 'atualizacao' | 'bug' | 'ideia'

export interface FeedPostAttachment {
  id: string
  post_id: string
  file_name: string
  url: string
  mime_type: string | null
  size_bytes: number | null
}

export interface FeedPost {
  id: string
  author_id: string
  author_name: string
  author_avatar_url: string | null
  tipo: FeedPostTipo
  conteudo: string
  ticket_id: string | null
  ticket_titulo: string | null
  ticket_codigo: string | null
  created_at: string
  attachments: FeedPostAttachment[]
}

export interface CreateFeedPostInput {
  tipo: FeedPostTipo
  conteudo: string
  ticket_id?: string | null
}

export interface TicketOption {
  id: string
  titulo: string
  codigo: string | null
}

/** Lista posts do feed, mais recentes primeiro. */
export async function listFeedPosts(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('feed_posts')
    .select(
      `
      id,
      author_id,
      tipo,
      conteudo,
      ticket_id,
      created_at,
      author:author_id ( id, name, avatar_url ),
      ticket:ticket_id ( id, titulo, codigo )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error

  const postIds = (data ?? []).map((r: any) => r.id)
  if (postIds.length === 0) return []

  const { data: attachmentsData } = await supabase
    .from('feed_post_attachments')
    .select('id, post_id, file_name, storage_path, mime_type, size_bytes')
    .in('post_id', postIds)

  const attachmentsByPost = new Map<string, any[]>()
  for (const a of attachmentsData ?? []) {
    const list = attachmentsByPost.get(a.post_id) ?? []
    list.push(a)
    attachmentsByPost.set(a.post_id, list)
  }

  return (data ?? []).map((row: any) => {
    const atts = (attachmentsByPost.get(row.id) ?? []).map((a) => {
      const { data: urlData } = supabase.storage
        .from(FEED_BUCKET)
        .getPublicUrl(a.storage_path)
      return {
        id: a.id,
        post_id: a.post_id,
        file_name: a.file_name,
        url: urlData.publicUrl,
        mime_type: a.mime_type ?? null,
        size_bytes: a.size_bytes ?? null,
      }
    })
    return {
      id: row.id,
      author_id: row.author_id,
      author_name: row.author?.name ?? 'Usuário',
      author_avatar_url: row.author?.avatar_url ?? null,
      tipo: row.tipo,
      conteudo: row.conteudo,
      ticket_id: row.ticket_id ?? null,
      ticket_titulo: row.ticket?.titulo ?? null,
      ticket_codigo: row.ticket?.codigo ?? null,
      created_at: row.created_at,
      attachments: atts,
    }
  })
}

/** Cria um post no feed. Retorna o post criado. */
export async function createFeedPost(
  input: CreateFeedPostInput,
  authorId: string,
): Promise<FeedPost> {
  const { data: row, error } = await supabase
    .from('feed_posts')
    .insert({
      author_id: authorId,
      tipo: input.tipo,
      conteudo: input.conteudo.trim(),
      ticket_id: input.ticket_id || null,
    })
    .select('id, author_id, tipo, conteudo, ticket_id, created_at')
    .single()

  if (error) throw error
  if (!row) throw new Error('Post não retornado')

  const authorIdVal = row.author_id as string
  const ticketIdVal = row.ticket_id as string | null

  const [authorRes, ticketRes] = await Promise.all([
    supabase.from('app_users').select('name, avatar_url').eq('id', authorIdVal).single(),
    ticketIdVal
      ? supabase.from('tickets').select('titulo, codigo').eq('id', ticketIdVal).single()
      : Promise.resolve({ data: null }),
  ])

  const author = authorRes.data as { name: string; avatar_url: string | null } | null
  const ticket = ticketRes.data as { titulo: string; codigo: string | null } | null

  return {
    id: row.id,
    author_id: authorIdVal,
    author_name: author?.name ?? 'Usuário',
    author_avatar_url: author?.avatar_url ?? null,
    tipo: row.tipo as FeedPostTipo,
    conteudo: row.conteudo,
    ticket_id: ticketIdVal,
    ticket_titulo: ticket?.titulo ?? null,
    ticket_codigo: ticket?.codigo ?? null,
    created_at: row.created_at,
    attachments: [],
  }
}

/** Atualiza um post (apenas o autor). */
export interface UpdateFeedPostInput {
  tipo?: FeedPostTipo
  conteudo?: string
  ticket_id?: string | null
}

export async function updateFeedPost(
  postId: string,
  input: UpdateFeedPostInput,
): Promise<FeedPost> {
  const payload: Record<string, unknown> = {}
  if (input.tipo !== undefined) payload.tipo = input.tipo
  if (input.conteudo !== undefined) payload.conteudo = input.conteudo.trim()
  if (input.ticket_id !== undefined) payload.ticket_id = input.ticket_id || null

  const { data: row, error } = await supabase
    .from('feed_posts')
    .update(payload)
    .eq('id', postId)
    .select('id, author_id, tipo, conteudo, ticket_id, created_at')
    .single()

  if (error) throw error
  if (!row) throw new Error('Post não encontrado')

  const authorIdVal = row.author_id as string
  const ticketIdVal = row.ticket_id as string | null

  const [authorRes, ticketRes] = await Promise.all([
    supabase.from('app_users').select('name, avatar_url').eq('id', authorIdVal).single(),
    ticketIdVal
      ? supabase.from('tickets').select('titulo, codigo').eq('id', ticketIdVal).single()
      : Promise.resolve({ data: null }),
  ])

  const author = authorRes.data as { name: string; avatar_url: string | null } | null
  const ticket = ticketRes.data as { titulo: string; codigo: string | null } | null

  return {
    id: row.id,
    author_id: authorIdVal,
    author_name: author?.name ?? 'Usuário',
    author_avatar_url: author?.avatar_url ?? null,
    tipo: row.tipo as FeedPostTipo,
    conteudo: row.conteudo,
    ticket_id: ticketIdVal,
    ticket_titulo: ticket?.titulo ?? null,
    ticket_codigo: ticket?.codigo ?? null,
    created_at: row.created_at,
    attachments: [], // edição não altera anexos; ao recarregar o feed eles vêm
  }
}

/** Exclui um post (apenas o autor). Comentários e anexos são removidos em cascata. */
export async function deleteFeedPost(postId: string): Promise<void> {
  const { error } = await supabase.from('feed_posts').delete().eq('id', postId)
  if (error) throw error
}

/** Lista demandas (id, titulo, codigo) para o seletor do feed. Apenas não excluídas. */
export async function listTicketsForFeed(): Promise<TicketOption[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, titulo, codigo')
    .is('excluida_em', null)
    .order('data_criacao', { ascending: false })
    .limit(500)

  if (error) throw error

  return (data ?? []).map((r: any) => ({
    id: r.id,
    titulo: r.titulo,
    codigo: r.codigo ?? null,
  }))
}

const FEED_UPLOAD_HINT =
  ' Crie o bucket no Supabase: Storage → New bucket → id "feed-files", marque como público. Ou execute o script supabase/migration-feed.sql.'

/** Faz upload de anexo para um post. */
export async function uploadFeedPostAttachment(
  postId: string,
  file: File,
  userId: string,
): Promise<void> {
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))
    throw new Error(`Arquivo muito grande (máx. ${mb} MB).`)
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${postId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(FEED_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    const msg = uploadError.message ?? String(uploadError)
    const isBucketOrPolicy =
      /bucket|not found|resource|policy|denied|permission/i.test(msg)
    throw new Error(
      msg + (isBucketOrPolicy ? FEED_UPLOAD_HINT : ''),
    )
  }

  const { error: insertError } = await supabase
    .from('feed_post_attachments')
    .insert({
      post_id: postId,
      uploaded_by: userId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })

  if (insertError) {
    const msg = insertError.message ?? String(insertError)
    throw new Error(msg + (msg.includes('policy') || msg.includes('row') ? FEED_UPLOAD_HINT : ''))
  }
}

// --- Comentários em posts do feed ---

export interface FeedPostComment {
  id: string
  post_id: string
  author_id: string
  author_name: string
  author_avatar_url: string | null
  body: string
  created_at: string
}

/** Lista comentários de vários posts (para exibir no feed). */
export async function listFeedPostComments(
  postIds: string[],
): Promise<FeedPostComment[]> {
  if (postIds.length === 0) return []
  const { data, error } = await supabase
    .from('feed_post_comments')
    .select(
      `
      id,
      post_id,
      author_id,
      body,
      created_at,
      author:author_id ( id, name, avatar_url )
    `,
    )
    .in('post_id', postIds)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const author = row.author as { name?: string; avatar_url?: string | null } | null
    return {
      id: row.id,
      post_id: row.post_id,
      author_id: row.author_id,
      author_name: author?.name ?? 'Usuário',
      author_avatar_url: author?.avatar_url ?? null,
      body: row.body,
      created_at: row.created_at,
    }
  })
}

/** Adiciona um comentário a um post. */
export async function addFeedPostComment(
  postId: string,
  body: string,
  authorId: string,
): Promise<FeedPostComment> {
  const { data, error } = await supabase
    .from('feed_post_comments')
    .insert({ post_id: postId, author_id: authorId, body: body.trim() })
    .select(
      `
      id,
      post_id,
      author_id,
      body,
      created_at,
      author:author_id ( id, name, avatar_url )
    `,
    )
    .single()

  if (error) throw error

  const row = data as any
  const author = row?.author as { name?: string; avatar_url?: string | null } | null
  return {
    id: row.id,
    post_id: row.post_id,
    author_id: row.author_id,
    author_name: author?.name ?? 'Usuário',
    author_avatar_url: author?.avatar_url ?? null,
    body: row.body,
    created_at: row.created_at,
  }
}
