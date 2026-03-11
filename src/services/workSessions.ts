import { supabase } from '../lib/supabaseClient'

export interface TicketWorkSession {
  id: string
  ticket_id: string
  user_id: string
  started_at: string
  ended_at: string | null
}

export interface WorkSessionReportRow {
  ticketId: string
  ticketTitulo: string
  userName: string
  diasTrabalhados: number
  horasTrabalhadas: number
}

/** Encerra qualquer sessão ativa do usuário (ended_at = null). */
async function endAllActiveSessionsForUser(userId: string): Promise<void> {
  const now = new Date().toISOString()
  await supabase
    .from('ticket_work_sessions')
    .update({ ended_at: now })
    .eq('user_id', userId)
    .is('ended_at', null)
}

/** Inicia uma sessão de trabalho na demanda. Encerra qualquer outra sessão ativa do usuário. */
export async function startWorkSession(
  ticketId: string,
  userId: string,
): Promise<TicketWorkSession> {
  await endAllActiveSessionsForUser(userId)

  const { data, error } = await supabase
    .from('ticket_work_sessions')
    .insert({ ticket_id: ticketId, user_id: userId })
    .select('id, ticket_id, user_id, started_at, ended_at')
    .single()

  if (error) throw error
  if (!data) throw new Error('Sessão não criada')
  return data as TicketWorkSession
}

/** Encerra a sessão ativa do usuário na demanda (ou a sessão ativa em qualquer demanda). */
export async function endWorkSession(userId: string): Promise<void> {
  await endAllActiveSessionsForUser(userId)
}

/** Retorna a sessão ativa do usuário (ended_at = null), se houver. */
export async function getActiveSessionForUser(
  userId: string,
): Promise<TicketWorkSession | null> {
  const { data, error } = await supabase
    .from('ticket_work_sessions')
    .select('id, ticket_id, user_id, started_at, ended_at')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as TicketWorkSession | null
}

export interface ActiveSessionInfo {
  ticketId: string
  userName: string
}

/** Lista todas as sessões ativas (alguém em play) para exibir ícone no dashboard e na lista. */
export async function getActiveSessionsAll(): Promise<ActiveSessionInfo[]> {
  const { data, error } = await supabase
    .from('ticket_work_sessions')
    .select('ticket_id, user_id')
    .is('ended_at', null)

  if (error) return []
  const rows = (data ?? []) as { ticket_id: string; user_id: string }[]
  if (rows.length === 0) return []

  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const { data: users } = await supabase
    .from('app_users')
    .select('id, name')
    .in('id', userIds)

  const nameById = new Map(
    (users ?? []).map((u: { id: string; name: string }) => [u.id, u.name]),
  )
  return rows.map((r) => ({
    ticketId: r.ticket_id,
    userName: nameById.get(r.user_id) ?? 'Usuário',
  }))
}

/** Lista sessões para o relatório: agrupadas por demanda e usuário, com dias e horas. */
export async function getWorkSessionsReport(
  ticketIds: string[],
  dataInicio?: string,
  dataFim?: string,
): Promise<WorkSessionReportRow[]> {
  if (ticketIds.length === 0) return []

  let query = supabase
    .from('ticket_work_sessions')
    .select('id, ticket_id, user_id, started_at, ended_at')
    .in('ticket_id', ticketIds)

  if (dataInicio) {
    query = query.gte('started_at', dataInicio + 'T00:00:00.000Z')
  }
  if (dataFim) {
    query = query.lte('started_at', dataFim + 'T23:59:59.999Z')
  }

  const { data: sessions, error } = await query.order('started_at', {
    ascending: true,
  })

  if (error) throw error
  const list = (sessions ?? []) as {
    id: string
    ticket_id: string
    user_id: string
    started_at: string
    ended_at: string | null
  }[]

  const now = new Date().toISOString()
  const userIds = [...new Set(list.map((s) => s.user_id))]
  const ticketIdList = [...new Set(list.map((s) => s.ticket_id))]

  const [usersRes, ticketsRes] = await Promise.all([
    supabase.from('app_users').select('id, name').in('id', userIds),
    supabase.from('tickets').select('id, titulo').in('id', ticketIdList),
  ])

  const usersById = new Map(
    (usersRes.data ?? []).map((u: { id: string; name: string }) => [u.id, u.name]),
  )
  const ticketsById = new Map(
    (ticketsRes.data ?? []).map((t: { id: string; titulo: string }) => [t.id, t.titulo]),
  )

  const byTicketUser = new Map<string, { days: Set<string>; seconds: number }>()

  for (const s of list) {
    const end = s.ended_at ?? now
    const start = new Date(s.started_at).getTime()
    const endMs = new Date(end).getTime()
    const durationSeconds = Math.max(0, (endMs - start) / 1000)

    const key = `${s.ticket_id}:${s.user_id}`
    const cur = byTicketUser.get(key) ?? { days: new Set<string>(), seconds: 0 }
    const dayStr = s.started_at.slice(0, 10)
    cur.days.add(dayStr)
    cur.seconds += durationSeconds
    byTicketUser.set(key, cur)
  }

  const rows: WorkSessionReportRow[] = []
  for (const [key, { days, seconds }] of byTicketUser) {
    const [ticketId, userId] = key.split(':')
    rows.push({
      ticketId,
      ticketTitulo: ticketsById.get(ticketId) ?? ticketId,
      userName: usersById.get(userId) ?? 'Usuário',
      diasTrabalhados: days.size,
      horasTrabalhadas: Math.round((seconds / 3600) * 100) / 100,
    })
  }

  rows.sort((a, b) => a.ticketTitulo.localeCompare(b.ticketTitulo) || a.userName.localeCompare(b.userName))
  return rows
}
