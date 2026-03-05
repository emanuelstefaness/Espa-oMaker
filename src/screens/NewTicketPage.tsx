import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutShell } from '../components/LayoutShell'
import type {
  TicketCategoria,
  TicketPrioridade,
  TicketTipo,
} from '../types/ticket'
import { createTicket, uploadTicketFile } from '../services/tickets'
import { CATEGORIAS, MATERIAIS_IMPRESSAO } from '../constants/ticketOptions'

type AnexoKind = 'foto' | 'arquivo'

interface AnexoItem {
  file: File
  kind: AnexoKind
  id: string
}

export function NewTicketPage() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<TicketTipo>('externa')
  const [solicitanteNome, setSolicitanteNome] = useState('')
  const [solicitanteTelefone, setSolicitanteTelefone] = useState('')
  const [categoria, setCategoria] = useState<TicketCategoria>('servicos_3d')
  const [prioridade, setPrioridade] = useState<TicketPrioridade>('media')
  const [dataEntrega, setDataEntrega] = useState('')

  const [material, setMaterial] = useState('PLA')
  const [cor, setCor] = useState('')
  const [quantidadePecas, setQuantidadePecas] = useState<number | ''>('')
  const [tamanhoEscala, setTamanhoEscala] = useState('')
  const [observacoesTecnicas, setObservacoesTecnicas] = useState('')

  const [anexos, setAnexos] = useState<AnexoItem[]>([])
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const arquivoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const addAnexo = (file: File, kind: AnexoKind) => {
    setAnexos((prev) => [
      ...prev,
      { file, kind, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
    ])
  }

  const removeAnexo = (id: string) => {
    setAnexos((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (tipo === 'externa' && !solicitanteTelefone) {
      setError('Telefone do solicitante é obrigatório para demandas externas.')
      return
    }

    try {
      setLoading(true)
      const ticket = await createTicket({
        titulo,
        descricao,
        tipo,
        solicitante_nome: solicitanteNome,
        solicitante_telefone: solicitanteTelefone || undefined,
        categoria,
        prioridade,
        data_entrega: dataEntrega || undefined,
        material_impressao:
          categoria === 'servicos_3d' ? material : undefined,
        cor: categoria === 'servicos_3d' ? cor || undefined : undefined,
        quantidade_pecas:
          categoria === 'servicos_3d' && quantidadePecas
            ? Number(quantidadePecas)
            : undefined,
        tamanho_escala:
          categoria === 'servicos_3d' ? tamanhoEscala || undefined : undefined,
        observacoes_tecnicas:
          categoria === 'servicos_3d'
            ? observacoesTecnicas || undefined
            : undefined,
      })

      for (const a of anexos) {
        try {
          await uploadTicketFile(ticket.id, a.file, a.kind)
        } catch {
          // continua com os demais anexos
        }
      }

      navigate('/demandas')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar demanda.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  return (
    <LayoutShell>
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-800">
            Nova demanda
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Preencha os dados. A triagem e o responsável são definidos depois.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Título</label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={inputClass}
                placeholder="Ex: Impressão 3D - suporte para sensor"
              />
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TicketTipo)}
                className={inputClass}
              >
                <option value="interna">Interna</option>
                <option value="externa">Externa</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Solicitante</label>
              <input
                required
                value={solicitanteNome}
                onChange={(e) => setSolicitanteNome(e.target.value)}
                className={inputClass}
                placeholder="Pessoa / equipe / empresa"
              />
            </div>
            <div>
              <label className={labelClass}>
                Telefone {tipo === 'externa' && '(obrigatório)'}
              </label>
              <input
                value={solicitanteTelefone}
                onChange={(e) => setSolicitanteTelefone(e.target.value)}
                className={inputClass}
                placeholder="(xx) xxxxx-xxxx"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Detalhe o que deve ser feito."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={categoria}
                onChange={(e) =>
                  setCategoria(e.target.value as TicketCategoria)
                }
                className={inputClass}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {CATEGORIAS.find((c) => c.value === categoria)?.descricao && (
                <p className="mt-1 text-xs text-slate-500">
                  {CATEGORIAS.find((c) => c.value === categoria)?.descricao}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) =>
                  setPrioridade(e.target.value as TicketPrioridade)
                }
                className={inputClass}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Prazo de entrega</label>
              <input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {categoria === 'servicos_3d' && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Serviços 3D
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Material</label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className={inputClass}
                  >
                    {MATERIAIS_IMPRESSAO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {MATERIAIS_IMPRESSAO.find((m) => m.value === material)
                    ?.descricao && (
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        MATERIAIS_IMPRESSAO.find((m) => m.value === material)
                          ?.descricao
                      }
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Cor</label>
                  <input
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className={inputClass}
                    placeholder="Ex: preto, branco"
                  />
                </div>
                <div>
                  <label className={labelClass}>Quantidade de peças</label>
                  <input
                    type="number"
                    min={1}
                    value={quantidadePecas}
                    onChange={(e) =>
                      setQuantidadePecas(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Tamanho / escala</label>
                  <input
                    value={tamanhoEscala}
                    onChange={(e) => setTamanhoEscala(e.target.value)}
                    className={inputClass}
                    placeholder="Ex: 1:1, ~10 cm"
                  />
                </div>
                <div>
                  <label className={labelClass}>Observações técnicas</label>
                  <input
                    value={observacoesTecnicas}
                    onChange={(e) => setObservacoesTecnicas(e.target.value)}
                    className={inputClass}
                    placeholder="Direção de camada, etc."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Fotos e arquivos
            </h3>
            <p className="text-xs text-slate-500">
              Adicione fotos (referência) ou arquivos (STL, OBJ, PDF, etc.). Serão enviados junto com a demanda.
            </p>
            <div className="flex flex-wrap gap-3">
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) addAnexo(f, 'foto')
                  e.target.value = ''
                }}
              />
              <input
                ref={arquivoInputRef}
                type="file"
                accept=".stl,.obj,.3mf,.pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) addAnexo(f, 'arquivo')
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Foto
              </button>
              <button
                type="button"
                onClick={() => arquivoInputRef.current?.click()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + Arquivo (STL, PDF…)
              </button>
            </div>
            {anexos.length > 0 && (
              <ul className="mt-3 space-y-2">
                {anexos.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span>
                      {a.file.name}
                      <span className="ml-2 text-xs text-slate-400">
                        {a.kind === 'foto' ? 'Foto' : 'Arquivo'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAnexo(a.id)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar demanda'}
            </button>
          </div>
        </form>
      </section>
    </LayoutShell>
  )
}
