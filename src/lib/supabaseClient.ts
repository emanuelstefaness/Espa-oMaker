import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? ''

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ex.: no .env.local ou nas variáveis do Vercel).',
  )
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

