export type TicketTipo = 'interna' | 'externa'

export type TicketOrigem = 'interno' | 'formulario'

export type TicketCategoria =
  | 'servicos_3d'
  | 'reparos'
  | 'engenharia'
  | 'workshop'
  | 'sublimacao'
  | 'saude'
  | 'servicos_gerais'
  | 'outros'

export type TicketPrioridade = 'baixa' | 'media' | 'alta' | 'urgente'

export type NivelDificuldade = 'baixa' | 'media' | 'alta'

export type TicketStatus =
  | 'recebida'
  | 'em_analise'
  | 'orcamento_em_criacao'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'em_producao'
  | 'pos_processo'
  | 'pronta'
  | 'entregue'
  | 'cancelada'

export type OrcamentoStatus = 'aguardando_aprovacao' | 'aprovado' | 'reprovado'

export interface TicketOrcamento {
  preco_por_peca: number
  quantidade: number
  total: number
  desconto?: number | null
  observacoes?: string | null
  status: OrcamentoStatus
  sem_cobranca: boolean
}

export interface TicketImpressao3D {
  material: 'PLA' | 'TPU' | 'PETG' | 'ABS' | 'TRITAN' | 'RESINA' | 'OUTROS'
  cor?: string | null
  quantidade_pecas?: number | null
  tamanho_escala?: string | null
  observacoes_tecnicas?: string | null
}

export interface Ticket {
  id: string
  codigo?: string | null
  titulo: string
  descricao?: string | null
  tipo: TicketTipo
  origem: TicketOrigem
  solicitante_nome: string
  solicitante_telefone?: string | null
  categoria: TicketCategoria
  prioridade: TicketPrioridade
  status: TicketStatus
  responsavel_id: string | null
  responsavel_nome?: string | null
  responsavel_avatar_url?: string | null
  colaborador_id?: string | null
  colaborador_nome?: string | null
  data_criacao: string
  data_entrega?: string | null
  atraso?: boolean
  valor_demanda?: number | null
  nivel_dificuldade?: NivelDificuldade | null
  impressao3d?: TicketImpressao3D | null
  orcamento?: TicketOrcamento | null
}

