import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Minus, Trash2, X, Package } from 'lucide-react'
import { LayoutShell } from '../components/LayoutShell'
import { formatarData } from '../utils/formatters'
import {
  listEstoque,
  createEstoqueItem,
  updateEstoqueItem,
  registrarSaidaEstoque,
  deleteEstoqueItem,
  type ItemEstoque,
  type ItemEstoqueInput,
} from '../services/estoque'

const camposVazios: Partial<ItemEstoque> = {
  nome: '',
  categoria: '',
  quantidade: 0,
  unidade: '',
  quantidadeMinima: 1,
  localizacao: '',
}

export function EstoquePage() {
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [modalItem, setModalItem] = useState<Partial<ItemEstoque> | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [saidaItem, setSaidaItem] = useState<ItemEstoque | null>(null)
  const [qtdSaida, setQtdSaida] = useState(1)
  const [excluirItem, setExcluirItem] = useState<ItemEstoque | null>(null)
  const [salvando, setSalvando] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setItens(await listEstoque())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o estoque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtrados = itens.filter(
    (i) =>
      i.nome.toLowerCase().includes(busca.toLowerCase()) ||
      i.categoria.toLowerCase().includes(busca.toLowerCase()),
  )

  const abrirNovo = () => {
    setEditandoId(null)
    setModalItem({ ...camposVazios })
  }
  const abrirEditar = (item: ItemEstoque) => {
    setEditandoId(item.id)
    setModalItem({ ...item })
  }

  const salvar = async () => {
    if (!modalItem?.nome || !modalItem.categoria || !modalItem.unidade) return
    setSalvando(true)
    try {
      const payload: ItemEstoqueInput = {
        nome: modalItem.nome,
        categoria: modalItem.categoria,
        quantidade: Number(modalItem.quantidade) || 0,
        unidade: modalItem.unidade,
        quantidadeMinima: Number(modalItem.quantidadeMinima) || 0,
        localizacao: modalItem.localizacao ?? null,
      }
      if (editandoId) {
        await updateEstoqueItem(editandoId, payload)
      } else {
        await createEstoqueItem(payload)
      }
      setModalItem(null)
      setEditandoId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar item.')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarSaida = async () => {
    if (!saidaItem || qtdSaida <= 0) return
    setSalvando(true)
    try {
      await registrarSaidaEstoque(saidaItem.id, saidaItem.quantidade, qtdSaida)
      setSaidaItem(null)
      setQtdSaida(1)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar saída.')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExcluir = async () => {
    if (!excluirItem) return
    setSalvando(true)
    try {
      await deleteEstoqueItem(excluirItem.id)
      setExcluirItem(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item.')
    } finally {
      setSalvando(false)
    }
  }

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
      {text}
    </label>
  )

  return (
    <LayoutShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div className="page-header" style={{ margin: 0 }}>
            <h1>Estoque</h1>
            <p>{itens.length} itens cadastrados</p>
          </div>
          <button onClick={abrirNovo} className="btn btn-lime" style={{ gap: '6px', flexShrink: 0 }}>
            <Plus size={14} /> Adicionar item
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="ctp-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-default)' }}>
            <div className="search-wrap" style={{ maxWidth: '320px' }}>
              <Search size={13} />
              <input
                className="ctp-input"
                placeholder="Buscar por nome ou categoria…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ctp-table">
              <thead>
                <tr>
                  {['Nome', 'Categoria', 'Quantidade', 'Unidade', 'Mínimo', 'Localização', 'Atualizado', 'Ações'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: '2.5rem' }}>
                        <p>Carregando estoque…</p>
                      </div>
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: '2.5rem' }}>
                        <Package size={36} />
                        <p>Nenhum item encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((item) => {
                    const baixo = item.quantidade < item.quantidadeMinima
                    return (
                      <tr key={item.id} style={{ background: baixo ? '#FFFBEB' : undefined }}>
                        <td>
                          <p style={{ fontWeight: 600, fontSize: '13px' }}>{item.nome}</p>
                          {baixo && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                              ⚠ Abaixo do mínimo
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.categoria}</td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: item.quantidade === 0 ? '#EF4444' : baixo ? '#F59E0B' : 'var(--text-primary)' }}>
                            {item.quantidade}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.unidade}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.quantidadeMinima}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.localizacao || '—'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatarData(item.ultimaAtualizacao)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => abrirEditar(item)} className="btn btn-ghost btn-sm" style={{ padding: '5px' }} title="Editar">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => { setSaidaItem(item); setQtdSaida(1) }} className="btn btn-ghost btn-sm" style={{ padding: '5px', color: '#F59E0B' }} title="Registrar saída">
                              <Minus size={13} />
                            </button>
                            <button onClick={() => setExcluirItem(item)} className="btn btn-ghost btn-sm" style={{ padding: '5px', color: '#EF4444' }} title="Excluir">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal item */}
        {modalItem && (
          <div className="modal-backdrop">
            <div className="modal-box" style={{ maxWidth: '480px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
                <h3 style={{ fontWeight: 700 }}>{editandoId ? 'Editar item' : 'Novo item'}</h3>
                <button onClick={() => setModalItem(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  {label('Nome *')}
                  <input className="ctp-input" value={modalItem.nome ?? ''} onChange={(e) => setModalItem({ ...modalItem, nome: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    {label('Categoria *')}
                    <input className="ctp-input" value={modalItem.categoria ?? ''} onChange={(e) => setModalItem({ ...modalItem, categoria: e.target.value })} />
                  </div>
                  <div>
                    {label('Unidade *')}
                    <input className="ctp-input" value={modalItem.unidade ?? ''} onChange={(e) => setModalItem({ ...modalItem, unidade: e.target.value })} placeholder="kg, rolo, unidade…" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    {label('Quantidade')}
                    <input type="number" min={0} className="ctp-input" value={modalItem.quantidade ?? 0} onChange={(e) => setModalItem({ ...modalItem, quantidade: Number(e.target.value) })} />
                  </div>
                  <div>
                    {label('Qtd. mínima')}
                    <input type="number" min={0} className="ctp-input" value={modalItem.quantidadeMinima ?? 1} onChange={(e) => setModalItem({ ...modalItem, quantidadeMinima: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  {label('Localização')}
                  <input className="ctp-input" value={modalItem.localizacao ?? ''} onChange={(e) => setModalItem({ ...modalItem, localizacao: e.target.value })} placeholder="Ex: Prateleira A1" />
                </div>
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button onClick={() => setModalItem(null)} className="btn btn-outline btn-sm">Cancelar</button>
                  <button onClick={salvar} disabled={salvando || !modalItem.nome || !modalItem.categoria || !modalItem.unidade} className="btn btn-primary btn-sm">
                    {salvando ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal excluir */}
        {excluirItem && (
          <div className="modal-backdrop">
            <div className="modal-box" style={{ maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
                <h3 style={{ fontWeight: 700, color: '#EF4444' }}>Excluir item</h3>
                <button onClick={() => setExcluirItem(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Tem certeza que deseja excluir <strong style={{ color: 'var(--text-primary)' }}>{excluirItem.nome}</strong>? Esta ação não pode ser desfeita.
                </p>
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setExcluirItem(null)} className="btn btn-outline btn-sm">Cancelar</button>
                  <button onClick={confirmarExcluir} disabled={salvando} className="btn btn-danger btn-sm">Excluir item</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal saída */}
        {saidaItem && (
          <div className="modal-backdrop">
            <div className="modal-box" style={{ maxWidth: '380px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
                <h3 style={{ fontWeight: 700 }}>Registrar saída</h3>
                <button onClick={() => setSaidaItem(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Item: <strong style={{ color: 'var(--text-primary)' }}>{saidaItem.nome}</strong>
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Disponível: <strong style={{ color: 'var(--text-primary)' }}>{saidaItem.quantidade} {saidaItem.unidade}</strong>
                </p>
                <div>
                  {label('Quantidade de saída')}
                  <input type="number" min={1} max={saidaItem.quantidade} className="ctp-input" value={qtdSaida} onChange={(e) => setQtdSaida(Number(e.target.value))} />
                </div>
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setSaidaItem(null)} className="btn btn-outline btn-sm">Cancelar</button>
                  <button onClick={confirmarSaida} disabled={salvando || qtdSaida <= 0 || qtdSaida > saidaItem.quantidade} className="btn btn-danger btn-sm">
                    Confirmar saída
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutShell>
  )
}
