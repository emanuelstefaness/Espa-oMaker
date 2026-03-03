import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import type {
  TicketCategoria,
  TicketPrioridade,
  TicketTipo,
} from '../types/ticket'
import { createTicket } from '../services/tickets'

export function NewTicketPage() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<TicketTipo>('externa')
  const [solicitanteNome, setSolicitanteNome] = useState('')
  const [solicitanteTelefone, setSolicitanteTelefone] = useState('')
  const [categoria, setCategoria] = useState<TicketCategoria>('impressao_3d')
  const [prioridade, setPrioridade] = useState<TicketPrioridade>('media')
  const [dataEntrega, setDataEntrega] = useState('')

  const [material, setMaterial] = useState('PLA')
  const [cor, setCor] = useState('')
  const [quantidadePecas, setQuantidadePecas] = useState<number | ''>('')
  const [tamanhoEscala, setTamanhoEscala] = useState('')
  const [observacoesTecnicas, setObservacoesTecnicas] = useState('')

  const [precoPorPeca, setPrecoPorPeca] = useState<number | ''>('')
  const [quantidadeOrcamento, setQuantidadeOrcamento] = useState<number | ''>('')
  const [desconto, setDesconto] = useState<number | ''>('')
  const [observacoesOrcamento, setObservacoesOrcamento] = useState('')
  const [statusOrcamento, setStatusOrcamento] =
    useState<'aguardando_aprovacao' | 'aprovado' | 'reprovado'>(
      'aguardando_aprovacao',
    )
  const [semCobranca, setSemCobranca] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const total =
    typeof precoPorPeca === 'number' && typeof quantidadeOrcamento === 'number'
      ? precoPorPeca * quantidadeOrcamento
      : 0

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (tipo === 'externa' && !solicitanteTelefone) {
      setError('Telefone do solicitante é obrigatório para demandas externas.')
      return
    }

    try {
      setLoading(true)
      await createTicket({
        titulo,
        descricao,
        tipo,
        solicitante_nome: solicitanteNome,
        solicitante_telefone: solicitanteTelefone || undefined,
        categoria,
        prioridade,
        data_entrega: dataEntrega || undefined,
        material_impressao:
          categoria === 'impressao_3d' ? material : undefined,
        cor: categoria === 'impressao_3d' ? cor || undefined : undefined,
        quantidade_pecas:
          categoria === 'impressao_3d' && quantidadePecas
            ? Number(quantidadePecas)
            : undefined,
        tamanho_escala:
          categoria === 'impressao_3d' ? tamanhoEscala || undefined : undefined,
        observacoes_tecnicas:
          categoria === 'impressao_3d'
            ? observacoesTecnicas || undefined
            : undefined,
        preco_por_peca:
          typeof precoPorPeca === 'number' ? precoPorPeca : undefined,
        quantidade_orcamento:
          typeof quantidadeOrcamento === 'number'
            ? quantidadeOrcamento
            : undefined,
        desconto: typeof desconto === 'number' ? desconto : undefined,
        observacoes_orcamento: observacoesOrcamento || undefined,
        status_orcamento:
          tipo === 'externa' ? statusOrcamento : undefined,
        sem_cobranca: tipo === 'interna' ? semCobranca : false,
      })

      navigate('/demandas')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar demanda.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LayoutShell>
      <section className="space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Nova demanda
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
              Cadastrar demanda no Espaço Maker
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Preencha os campos principais. A triagem e distribuição ficam com
              o Felipe.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs md:p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-200">
                Título / Nome da demanda
              </label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="Ex: Impressão 3D - suporte para sensor"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-200">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TicketTipo)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="interna">Interna</option>
                <option value="externa">Externa</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-200">
                Solicitante - nome
              </label>
              <input
                required
                value={solicitanteNome}
                onChange={(e) => setSolicitanteNome(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="Pessoa / equipe / empresa"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-200">
                Telefone (obrigatório para externas)
              </label>
              <input
                value={solicitanteTelefone}
                onChange={(e) => setSolicitanteTelefone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="(xx) xxxxx-xxxx"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-200">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Detalhe o que deve ser feito, anexos podem ser adicionados depois."
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-200">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) =>
                  setCategoria(e.target.value as TicketCategoria)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="impressao_3d">Impressão 3D</option>
                <option value="modelagem_3d">Modelagem 3D</option>
                <option value="reparo">Reparo</option>
                <option value="laser">Laser</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-200">
                Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) =>
                  setPrioridade(e.target.value as TicketPrioridade)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-200">
                Prazo de entrega (dia)
              </label>
              <input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {categoria === 'impressao_3d' && (
            <div className="space-y-3 rounded-xl border border-cyan-700/60 bg-cyan-950/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Impressão 3D
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-200">
                    Material
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="RESINA">Resina</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-200">
                    Cor
                  </label>
                  <input
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Ex: preto, branco, azul..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-200">
                    Quantidade de peças
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantidadePecas}
                    onChange={(e) =>
                      setQuantidadePecas(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-200">
                    Tamanho / escala
                  </label>
                  <input
                    value={tamanhoEscala}
                    onChange={(e) => setTamanhoEscala(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Ex: escala 1:1, ~10 cm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-200">
                    Observações técnicas
                  </label>
                  <input
                    value={observacoesTecnicas}
                    onChange={(e) => setObservacoesTecnicas(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="Direção de camada, resistência, etc."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-emerald-700/60 bg-emerald-950/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Orçamento
              </p>
              {tipo === 'interna' && (
                <label className="flex items-center gap-2 text-[11px] text-emerald-100">
                  <input
                    type="checkbox"
                    checked={semCobranca}
                    onChange={(e) => setSemCobranca(e.target.checked)}
                    className="h-3 w-3 rounded border border-emerald-500 bg-transparent text-emerald-500"
                  />
                  Sem cobrança
                </label>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-200">
                  Preço por peça (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={precoPorPeca}
                  onChange={(e) =>
                    setPrecoPorPeca(
                      e.target.value ? Number(e.target.value) : '',
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-200">
                  Quantidade
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantidadeOrcamento}
                  onChange={(e) =>
                    setQuantidadeOrcamento(
                      e.target.value ? Number(e.target.value) : '',
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-200">
                  Total automático (R$)
                </label>
                <input
                  disabled
                  value={total.toFixed(2)}
                  className="w-full rounded-lg border border-emerald-600 bg-emerald-900/40 px-3 py-2 text-xs text-emerald-50"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-200">
                  Desconto (R$ opcional)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={desconto}
                  onChange={(e) =>
                    setDesconto(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-slate-200">
                  Observações do orçamento
                </label>
                <input
                  value={observacoesOrcamento}
                  onChange={(e) => setObservacoesOrcamento(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Condições, prazo de validade, etc."
                />
              </div>
            </div>

            {tipo === 'externa' && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-200">
                  Status do orçamento
                </label>
                <select
                  value={statusOrcamento}
                  onChange={(e) =>
                    setStatusOrcamento(
                      e.target.value as
                        | 'aguardando_aprovacao'
                        | 'aprovado'
                        | 'reprovado',
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="aguardando_aprovacao">
                    Aguardando aprovação
                  </option>
                  <option value="aprovado">Aprovado</option>
                  <option value="reprovado">Reprovado</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-600/70 bg-rose-950/50 px-3 py-2 text-[11px] text-rose-50">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Salvar demanda'}
            </button>
          </div>
        </form>
      </section>
    </LayoutShell>
  )
}

