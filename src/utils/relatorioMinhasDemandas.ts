import type { Ticket, TicketPrioridade } from '../types/ticket'
import { STATUS_LABELS } from '../components/TicketStatusPill'
import { CATEGORIA_LABELS } from '../components/Badges'

const PRIORIDADE_LABELS: Record<TicketPrioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

const COLUNAS = [
  'Código',
  'Demanda',
  'Solicitante',
  'Categoria',
  'Prioridade',
  'Status',
  'Meu papel',
  'Criada em',
  'Prazo',
  'Situação do prazo',
] as const

export interface RelatorioMinhasDemandasInfo {
  usuarioNome: string
  /** Descrição dos filtros aplicados (ex.: "Status: Em produção"). */
  filtros: string
}

function dataBR(valor?: string | null): string {
  if (!valor) return '—'
  const d = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor)
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString('pt-BR')
}

function situacaoPrazo(t: Ticket): string {
  if (t.status === 'entregue') return 'Entregue'
  if (t.status === 'cancelada') return 'Cancelada'
  if (!t.data_entrega) return 'Sem prazo'
  const hoje = new Date().toISOString().slice(0, 10)
  if (t.data_entrega < hoje) return 'Atrasada'
  if (t.data_entrega === hoje) return 'Vence hoje'
  return 'No prazo'
}

function meuPapel(t: Ticket, userId: string): string {
  const resp = t.responsavel_id === userId
  const colab = t.colaborador_id === userId
  if (resp && colab) return 'Responsável e colaborador'
  return resp ? 'Responsável' : 'Colaborador'
}

function linha(t: Ticket, userId: string): string[] {
  return [
    t.codigo ?? '—',
    t.titulo,
    t.solicitante_nome ?? '—',
    CATEGORIA_LABELS[t.categoria] ?? t.categoria,
    PRIORIDADE_LABELS[t.prioridade] ?? t.prioridade,
    STATUS_LABELS[t.status] ?? t.status,
    meuPapel(t, userId),
    dataBR(t.data_criacao),
    dataBR(t.data_entrega),
    situacaoPrazo(t),
  ]
}

function resumo(tickets: Ticket[]) {
  const entregues = tickets.filter((t) => t.status === 'entregue').length
  const atrasadas = tickets.filter((t) => situacaoPrazo(t) === 'Atrasada').length
  const emAndamento = tickets.filter(
    (t) => t.status !== 'entregue' && t.status !== 'cancelada',
  ).length
  return { total: tickets.length, emAndamento, entregues, atrasadas }
}

function nomeArquivo(extensao: string): string {
  return `minhas-demandas-${new Date().toISOString().slice(0, 10)}.${extensao}`
}

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function exportarMinhasDemandasXLSX(
  tickets: Ticket[],
  userId: string,
  info: RelatorioMinhasDemandasInfo,
) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Espaço Maker'
  wb.created = new Date()

  const ws = wb.addWorksheet('Minhas demandas', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 6 }],
  })
  ws.columns = [
    { width: 12 }, { width: 38 }, { width: 24 }, { width: 18 }, { width: 12 },
    { width: 26 }, { width: 24 }, { width: 12 }, { width: 12 }, { width: 18 },
  ]
  const ultima = String.fromCharCode(64 + COLUNAS.length)

  ws.mergeCells(`A1:${ultima}1`)
  const titulo = ws.getCell('A1')
  titulo.value = 'RELATÓRIO DE DEMANDAS'
  titulo.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  titulo.alignment = { horizontal: 'center', vertical: 'middle' }
  titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF063A70' } }
  ws.getRow(1).height = 26

  ws.mergeCells(`A2:${ultima}2`)
  const sub = ws.getCell('A2')
  sub.value = `${info.usuarioNome} · gerado em ${new Date().toLocaleDateString('pt-BR')}`
  sub.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } }
  sub.alignment = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells(`A3:${ultima}3`)
  const fil = ws.getCell('A3')
  fil.value = `Filtros: ${info.filtros}`
  fil.font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } }
  fil.alignment = { horizontal: 'center', vertical: 'middle' }

  const r = resumo(tickets)
  ws.mergeCells(`A4:${ultima}4`)
  const res = ws.getCell('A4')
  res.value =
    `Total: ${r.total}   ·   Em andamento: ${r.emAndamento}   ·   ` +
    `Entregues: ${r.entregues}   ·   Atrasadas: ${r.atrasadas}`
  res.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF063A70' } }
  res.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(4).height = 22

  const cab = ws.getRow(6)
  COLUNAS.forEach((nome, i) => {
    const c = cab.getCell(i + 1)
    c.value = nome
    c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    c.alignment = { horizontal: 'left', vertical: 'middle' }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E5A99' } }
  })
  cab.height = 20

  tickets.forEach((t, idx) => {
    const row = ws.getRow(7 + idx)
    linha(t, userId).forEach((valor, i) => {
      const c = row.getCell(i + 1)
      c.value = valor
      c.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } }
      c.alignment = { horizontal: 'left', vertical: 'middle', wrapText: i === 1 }
      if (idx % 2 === 1) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
      }
    })
    if (situacaoPrazo(t) === 'Atrasada') {
      row.getCell(COLUNAS.length).font = {
        name: 'Arial', size: 10, bold: true, color: { argb: 'FFB91C1C' },
      }
    }
  })

  if (tickets.length === 0) {
    ws.mergeCells(`A7:${ultima}7`)
    const vazio = ws.getCell('A7')
    vazio.value = 'Nenhuma demanda encontrada para os filtros selecionados.'
    vazio.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } }
    vazio.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo('xlsx')
  a.click()
  URL.revokeObjectURL(url)
}

export function exportarMinhasDemandasPDF(
  tickets: Ticket[],
  userId: string,
  info: RelatorioMinhasDemandasInfo,
) {
  const r = resumo(tickets)
  const cab = COLUNAS.map((c) => `<th>${c}</th>`).join('')
  const corpo = tickets.length
    ? tickets
        .map(
          (t) =>
            `<tr>${linha(t, userId)
              .map((c) => `<td>${escapeHtml(c)}</td>`)
              .join('')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="${COLUNAS.length}" style="text-align:center">Nenhuma demanda encontrada.</td></tr>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Minhas demandas - ${new Date().toISOString().slice(0, 10)}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: system-ui, sans-serif; font-size: 11px; color: #1e293b; }
      h1 { font-size: 18px; margin: 0; color: #063a70; }
      .meta { color: #64748b; margin: 4px 0 2px; }
      .resumo { margin: 8px 0 12px; font-weight: 600; color: #063a70; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 5px 7px; text-align: left; }
      th { background: #063a70; color: #fff; }
      tr:nth-child(even) td { background: #f1f5f9; }
    </style></head><body>
    <h1>Relatório de demandas</h1>
    <p class="meta">${escapeHtml(info.usuarioNome)} · gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
    <p class="meta">Filtros: ${escapeHtml(info.filtros)}</p>
    <p class="resumo">Total: ${r.total} · Em andamento: ${r.emAndamento} · Entregues: ${r.entregues} · Atrasadas: ${r.atrasadas}</p>
    <table><thead><tr>${cab}</tr></thead><tbody>${corpo}</tbody></table>
    </body></html>`)
  win.document.close()
  win.focus()
  win.print()
}
