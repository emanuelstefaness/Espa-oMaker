import { supabase } from '../lib/supabaseClient'

export type PrefeituraStatus = 'ativo' | 'em_negociacao' | 'concluido' | 'cancelado'

export interface RegistroPrefeitura {
  id: string
  municipio: string
  contato: string
  telefone: string | null
  email: string
  numProcesso: string | null
  descricao: string | null
  status: PrefeituraStatus
  criadoEm: string
}

interface PrefeituraRow {
  id: string
  municipio: string
  contato: string
  telefone: string | null
  email: string
  num_processo: string | null
  descricao: string | null
  status: PrefeituraStatus
  created_at: string
}

function mapRow(r: PrefeituraRow): RegistroPrefeitura {
  return {
    id: r.id,
    municipio: r.municipio,
    contato: r.contato,
    telefone: r.telefone,
    email: r.email,
    numProcesso: r.num_processo,
    descricao: r.descricao,
    status: r.status,
    criadoEm: r.created_at,
  }
}

export type RegistroPrefeituraInput = Omit<RegistroPrefeitura, 'id' | 'criadoEm'>

export async function listPrefeitura(): Promise<RegistroPrefeitura[]> {
  const { data, error } = await supabase
    .from('prefeitura_registros')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as PrefeituraRow[]).map(mapRow)
}

function toPatch(dados: Partial<RegistroPrefeituraInput>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  if (dados.municipio !== undefined) patch.municipio = dados.municipio
  if (dados.contato !== undefined) patch.contato = dados.contato
  if (dados.telefone !== undefined) patch.telefone = dados.telefone || null
  if (dados.email !== undefined) patch.email = dados.email
  if (dados.numProcesso !== undefined) patch.num_processo = dados.numProcesso || null
  if (dados.descricao !== undefined) patch.descricao = dados.descricao || null
  if (dados.status !== undefined) patch.status = dados.status
  return patch
}

export async function createRegistroPrefeitura(
  registro: RegistroPrefeituraInput,
): Promise<RegistroPrefeitura> {
  const { data, error } = await supabase
    .from('prefeitura_registros')
    .insert(toPatch(registro))
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data as PrefeituraRow)
}

export async function updateRegistroPrefeitura(
  id: string,
  dados: Partial<RegistroPrefeituraInput>,
): Promise<RegistroPrefeitura> {
  const { data, error } = await supabase
    .from('prefeitura_registros')
    .update(toPatch(dados))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data as PrefeituraRow)
}

export async function deleteRegistroPrefeitura(id: string): Promise<void> {
  const { error } = await supabase.from('prefeitura_registros').delete().eq('id', id)
  if (error) throw error
}
