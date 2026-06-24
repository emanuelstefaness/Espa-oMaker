export function formatarData(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

export function formatarMoeda(valor: number): string {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function diasDesde(iso: string): number {
  const agora = new Date()
  const data = new Date(iso)
  return Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24))
}
