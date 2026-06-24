import { supabase } from '../lib/supabaseClient'

export interface Material {
  id: string
  nome: string
  precoPorKg: number
}

export interface Impressora {
  id: string
  nome: string
  manutH: number
  potW: number
}

interface MaterialRow {
  id: string
  nome: string
  preco_por_kg: number
}

interface ImpressoraRow {
  id: string
  nome: string
  manut_h: number
  pot_w: number
}

/* ===== MATERIAIS ===== */
export async function listMateriais(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('calculadora_materiais')
    .select('*')
    .order('nome', { ascending: true })
  if (error) throw error
  return (data as MaterialRow[]).map((r) => ({
    id: r.id,
    nome: r.nome,
    precoPorKg: Number(r.preco_por_kg),
  }))
}

export async function createMaterial(m: Omit<Material, 'id'>): Promise<Material> {
  const { data, error } = await supabase
    .from('calculadora_materiais')
    .insert({ nome: m.nome, preco_por_kg: m.precoPorKg })
    .select('*')
    .single()
  if (error) throw error
  const r = data as MaterialRow
  return { id: r.id, nome: r.nome, precoPorKg: Number(r.preco_por_kg) }
}

export async function updateMaterial(
  id: string,
  dados: Partial<Omit<Material, 'id'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (dados.nome !== undefined) patch.nome = dados.nome
  if (dados.precoPorKg !== undefined) patch.preco_por_kg = dados.precoPorKg
  const { error } = await supabase.from('calculadora_materiais').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('calculadora_materiais').delete().eq('id', id)
  if (error) throw error
}

/* ===== IMPRESSORAS ===== */
export async function listImpressoras(): Promise<Impressora[]> {
  const { data, error } = await supabase
    .from('calculadora_impressoras')
    .select('*')
    .order('nome', { ascending: true })
  if (error) throw error
  return (data as ImpressoraRow[]).map((r) => ({
    id: r.id,
    nome: r.nome,
    manutH: Number(r.manut_h),
    potW: Number(r.pot_w),
  }))
}

export async function createImpressora(i: Omit<Impressora, 'id'>): Promise<Impressora> {
  const { data, error } = await supabase
    .from('calculadora_impressoras')
    .insert({ nome: i.nome, manut_h: i.manutH, pot_w: i.potW })
    .select('*')
    .single()
  if (error) throw error
  const r = data as ImpressoraRow
  return { id: r.id, nome: r.nome, manutH: Number(r.manut_h), potW: Number(r.pot_w) }
}

export async function updateImpressora(
  id: string,
  dados: Partial<Omit<Impressora, 'id'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (dados.nome !== undefined) patch.nome = dados.nome
  if (dados.manutH !== undefined) patch.manut_h = dados.manutH
  if (dados.potW !== undefined) patch.pot_w = dados.potW
  const { error } = await supabase.from('calculadora_impressoras').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteImpressora(id: string): Promise<void> {
  const { error } = await supabase.from('calculadora_impressoras').delete().eq('id', id)
  if (error) throw error
}
