import { supabase } from '../lib/supabaseClient'

export interface ItemEstoque {
  id: string
  nome: string
  categoria: string
  quantidade: number
  unidade: string
  quantidadeMinima: number
  localizacao: string | null
  ultimaAtualizacao: string
}

interface EstoqueRow {
  id: string
  nome: string
  categoria: string
  quantidade: number
  unidade: string
  quantidade_minima: number
  localizacao: string | null
  updated_at: string
}

function mapRow(r: EstoqueRow): ItemEstoque {
  return {
    id: r.id,
    nome: r.nome,
    categoria: r.categoria,
    quantidade: Number(r.quantidade),
    unidade: r.unidade,
    quantidadeMinima: Number(r.quantidade_minima),
    localizacao: r.localizacao,
    ultimaAtualizacao: r.updated_at,
  }
}

export type ItemEstoqueInput = Omit<ItemEstoque, 'id' | 'ultimaAtualizacao'>

export async function listEstoque(): Promise<ItemEstoque[]> {
  const { data, error } = await supabase
    .from('estoque_itens')
    .select('*')
    .order('nome', { ascending: true })
  if (error) throw error
  return (data as EstoqueRow[]).map(mapRow)
}

export async function createEstoqueItem(item: ItemEstoqueInput): Promise<ItemEstoque> {
  const { data, error } = await supabase
    .from('estoque_itens')
    .insert({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: item.quantidade,
      unidade: item.unidade,
      quantidade_minima: item.quantidadeMinima,
      localizacao: item.localizacao || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data as EstoqueRow)
}

export async function updateEstoqueItem(
  id: string,
  dados: Partial<ItemEstoqueInput>,
): Promise<ItemEstoque> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (dados.nome !== undefined) patch.nome = dados.nome
  if (dados.categoria !== undefined) patch.categoria = dados.categoria
  if (dados.quantidade !== undefined) patch.quantidade = dados.quantidade
  if (dados.unidade !== undefined) patch.unidade = dados.unidade
  if (dados.quantidadeMinima !== undefined) patch.quantidade_minima = dados.quantidadeMinima
  if (dados.localizacao !== undefined) patch.localizacao = dados.localizacao || null

  const { data, error } = await supabase
    .from('estoque_itens')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapRow(data as EstoqueRow)
}

export async function registrarSaidaEstoque(
  id: string,
  quantidadeAtual: number,
  quantidadeSaida: number,
): Promise<ItemEstoque> {
  const novaQtd = Math.max(0, quantidadeAtual - quantidadeSaida)
  return updateEstoqueItem(id, { quantidade: novaQtd })
}

export async function deleteEstoqueItem(id: string): Promise<void> {
  const { error } = await supabase.from('estoque_itens').delete().eq('id', id)
  if (error) throw error
}
