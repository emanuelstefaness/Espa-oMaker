import { supabase } from '../lib/supabaseClient'

export interface AppUserOption {
  id: string
  name: string
}

export async function listAppUsers(): Promise<AppUserOption[]> {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, name')
    .order('name')

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }))
}
