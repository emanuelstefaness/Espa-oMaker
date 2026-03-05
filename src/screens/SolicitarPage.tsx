import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { TicketCategoria } from '../types/ticket'
import { createTicket, uploadTicketFilePublic } from '../services/tickets'
import { CategorySelect } from '../components/CategorySelect'
import { MaterialSelect } from '../components/MaterialSelect'

const MAX_IMAGENS = 5

export function SolicitarPage() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [solicitanteNome, setSolicitanteNome] = useState('')
  const [solicitanteTelefone, setSolicitanteTelefone] = useState('')
  const [categoria, setCategoria] = useState<TicketCategoria>('servicos_3d')
  const [valor, setValor] = useState<number | ''>('')
  const [material, setMaterial] = useState<string>('PLA')
  const [cor, setCor] = useState('')
  const [quantidadePecas, setQuantidadePecas] = useState<number | ''>('')
  const [fotos, setFotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFotos = (files: FileList | null) => {
    if (!files?.length) return
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    setFotos((prev) => {
      const next = [...prev, ...list].slice(0, MAX_IMAGENS)
      return next
    })
  }

  const removeFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      setLoading(true)
      const ticket = await createTicket({
        titulo,
        descricao: descricao || undefined,
        tipo: 'externa',
        origem: 'formulario',
        solicitante_nome: solicitanteNome,
        solicitante_telefone: solicitanteTelefone || undefined,
        categoria,
        prioridade: 'media',
        valor_demanda: valor !== '' ? Number(valor) : undefined,
        material_impressao:
          categoria === 'servicos_3d' ? material : undefined,
        cor: categoria === 'servicos_3d' && cor ? cor : undefined,
        quantidade_pecas:
          categoria === 'servicos_3d' && quantidadePecas
            ? Number(quantidadePecas)
            : undefined,
      })
      for (const file of fotos) {
        try {
          await uploadTicketFilePublic(ticket.id, file)
        } catch {
          // continua com as demais; a demanda já foi criada
        }
      }
      setEnviado(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao enviar solicitação.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  if (enviado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Solicitação enviada</h1>
          <p className="mt-2 text-sm text-slate-600">
            Entraremos em contato em breve pelo telefone informado.
          </p>
          <Link
            to="/solicitar"
            className="mt-6 inline-block rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Enviar outra
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white font-semibold">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Cilla Tech Park</p>
              <p className="text-xs text-slate-500">Espaço Maker · Solicitar serviço</p>
            </div>
          </div>
          <Link
            to="/login"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Acesso interno
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 p-4 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">
            Solicitar serviço (link WhatsApp)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Preencha os dados. Nossa equipe analisará e retornará em breve.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={labelClass}>Título da solicitação *</label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={inputClass}
                placeholder="Ex: Impressão 3D - peça de suporte"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Seu nome *</label>
                <input
                  required
                  value={solicitanteNome}
                  onChange={(e) => setSolicitanteNome(e.target.value)}
                  className={inputClass}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className={labelClass}>Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={solicitanteTelefone}
                  onChange={(e) => setSolicitanteTelefone(e.target.value)}
                  className={inputClass}
                  placeholder="(xx) xxxxx-xxxx"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <CategorySelect
                value={categoria}
                onChange={setCategoria}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Valor estimado (R$) — opcional</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={valor === '' ? '' : valor}
                onChange={(e) =>
                  setValor(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className={inputClass}
                placeholder="Ex: 50,00"
              />
            </div>

            {categoria === 'servicos_3d' && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Material (opcional)</label>
                  <MaterialSelect
                    value={material}
                    onChange={setMaterial}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cor (opcional)</label>
                  <input
                    type="text"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className={inputClass}
                    placeholder="Ex: preto, branco"
                  />
                </div>
                <div>
                  <label className={labelClass}>Quantidade de peças (opcional)</label>
                  <input
                    type="number"
                    min={1}
                    value={quantidadePecas}
                    onChange={(e) =>
                      setQuantidadePecas(
                        e.target.value === '' ? '' : parseInt(e.target.value, 10),
                      )
                    }
                    className={inputClass}
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Descreva o que precisa (material, quantidade, prazo desejado, etc.)"
              />
            </div>

            <div>
              <label className={labelClass}>Fotos (até {MAX_IMAGENS} imagens)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFotos(e.target.files)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={fotos.length >= MAX_IMAGENS}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {fotos.length >= MAX_IMAGENS
                  ? `Máximo ${MAX_IMAGENS} imagens`
                  : 'Adicionar imagens'}
              </button>
              {fotos.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {fotos.length} imagem(ns) — máx. 10 MB cada
                </p>
              )}
              {fotos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {fotos.map((file, i) => (
                    <div
                      key={i}
                      className="relative inline-block rounded-lg border border-slate-200 bg-slate-50 p-1"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="h-20 w-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeFoto(i)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs hover:bg-rose-600"
                        aria-label="Remover"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Enviar solicitação'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
