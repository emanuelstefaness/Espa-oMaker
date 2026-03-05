import { supabase } from '../lib/supabaseClient'

export type AppUserRole = 'felipe' | 'executor' | 'admin'

export interface AppUserOption {
  id: string
  name: string
}

export interface AppUserProfile {
  id: string
  name: string
  role: AppUserRole
  avatar_url: string | null
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

/** Perfil do usuário a partir de app_users (nome, role, avatar). */
export async function getAppUserProfile(
  userId: string,
): Promise<AppUserProfile | null> {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, name, role, avatar_url')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    role: data.role as AppUserRole,
    avatar_url: data.avatar_url ?? null,
  }
}

/** Upload de avatar: envia arquivo para storage e atualiza app_users.avatar_url. */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = `${publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('app_users')
    .update({ avatar_url: url })
    .eq('id', userId)

  if (updateError) throw updateError

  return url
}
