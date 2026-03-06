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
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      author_id: authorId,
      tipo: input.tipo,
      conteudo: input.conteudo.trim(),
      ticket_id: input.ticket_id || null,
    })
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
    .single()

  if (error) throw error

  const r = data as Record<string, unknown>
  const author = r.author as { name?: string; avatar_url?: string | null } | null | undefined
  const ticket = r.ticket as { titulo?: string; codigo?: string | null } | null | undefined
  return {
    id: r.id as string,
    author_id: r.author_id as string,
    author_name: author?.name ?? 'Usuário',
    author_avatar_url: author?.avatar_url ?? null,
    tipo: r.tipo as FeedPostTipo,
    conteudo: r.conteudo as string,
    ticket_id: (r.ticket_id as string | null) ?? null,
    ticket_titulo: ticket?.titulo ?? null,
    ticket_codigo: ticket?.codigo ?? null,
    created_at: r.created_at as string,
    attachments: [],
  }
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

  if (uploadError) throw uploadError

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

  if (insertError) throw insertError
}
