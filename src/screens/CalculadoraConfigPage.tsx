import { useEffect, useState } from 'react'
import { Plus, Trash2, SlidersHorizontal, Pencil, Check, X } from 'lucide-react'
import { LayoutShell } from '../components/LayoutShell'
import {
  listMateriais, createMaterial, updateMaterial, deleteMaterial,
  listImpressoras, createImpressora, updateImpressora, deleteImpressora,
  type Material, type Impressora,
} from '../services/calculadora'

type Tab = 'materiais' | 'impressoras'

export function CalculadoraConfigPage() {
  const [tab, setTab] = useState<Tab>('materiais')
  const [materiais, setMateriais] = useState<Material[]>([])
  const [impressoras, setImpressoras] = useState<Impressora[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setError(null)
      const [m, i] = await Promise.all([listMateriais(), listImpressoras()])
      setMateriais(m)
      setImpressoras(i)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  // ── Materiais ──
  const [editMat, setEditMat] = useState<string | null>(null)
  const [editMatData, setEditMatData] = useState<Partial<Material>>({})
  const [novoMat, setNovoMat] = useState(false)
  const [novoMatData, setNovoMatData] = useState({ nome: '', precoPorKg: '' })

  const iniciarEdicaoMat = (m: Material) => {
    setEditMat(m.id)
    setEditMatData({ nome: m.nome, precoPorKg: m.precoPorKg })
  }
  const salvarEdicaoMat = async (id: string) => {
    const preco = parseFloat(String(editMatData.precoPorKg))
    if (!editMatData.nome || isNaN(preco)) return
    await updateMaterial(id, { nome: editMatData.nome, precoPorKg: preco })
    setEditMat(null)
    await load()
  }
  const salvarNovoMat = async () => {
    const preco = parseFloat(novoMatData.precoPorKg)
    if (!novoMatData.nome || isNaN(preco) || preco <= 0) return
    await createMaterial({ nome: novoMatData.nome, precoPorKg: preco })
    setNovoMat(false)
    setNovoMatData({ nome: '', precoPorKg: '' })
    await load()
  }
  const removerMat = async (id: string) => {
    await deleteMaterial(id)
    await load()
  }

  // ── Impressoras ──
  const [editImp, setEditImp] = useState<string | null>(null)
  const [editImpData, setEditImpData] = useState<Partial<Impressora>>({})
  const [novaImp, setNovaImp] = useState(false)
  const [novaImpData, setNovaImpData] = useState({ nome: '', manutH: '', potW: '' })

  const iniciarEdicaoImp = (i: Impressora) => {
    setEditImp(i.id)
    setEditImpData({ nome: i.nome, manutH: i.manutH, potW: i.potW })
  }
  const salvarEdicaoImp = async (id: string) => {
    const mH = parseFloat(String(editImpData.manutH))
    const pW = parseFloat(String(editImpData.potW))
    if (!editImpData.nome || isNaN(mH) || isNaN(pW)) return
    await updateImpressora(id, { nome: editImpData.nome, manutH: mH, potW: pW })
    setEditImp(null)
    await load()
  }
  const salvarNovaImp = async () => {
    const mH = parseFloat(novaImpData.manutH)
    const pW = parseFloat(novaImpData.potW)
    if (!novaImpData.nome || isNaN(mH) || isNaN(pW)) return
    await createImpressora({ nome: novaImpData.nome, manutH: mH, potW: pW })
    setNovaImp(false)
    setNovaImpData({ nome: '', manutH: '', potW: '' })
    await load()
  }
  const removerImp = async (id: string) => {
    await deleteImpressora(id)
    await load()
  }

  const inp = (placeholder: string, value: string | number | undefined, onChange: (v: string) => void, type = 'text') => (
    <input
      type={type}
      className="ctp-input"
      style={{ fontSize: '13px', padding: '6px 10px' }}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )

  const lbl = (text: string, unit?: string) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {text}{unit && <span style={{ fontWeight: 400, textTransform: 'none' }}> ({unit})</span>}
    </label>
  )

  return (
    <LayoutShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="page-header">
          <h1>Configurações da Calculadora</h1>
          <p>Gerencie materiais e impressoras usados na calculadora de orçamentos</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="tab-nav">
          {([['materiais', 'Materiais', materiais.length], ['impressoras', 'Impressoras / Máquinas', impressoras.length]] as const).map(([key, label, count]) => (
            <button key={key} className={`tab-item${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              {label}
              <span className="tab-badge">{count}</span>
            </button>
          ))}
        </div>

        {/* ── Materiais ── */}
        {tab === 'materiais' && (
          <div className="ctp-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={14} color="var(--text-muted)" />
                <h3 style={{ fontSize: '0.875rem' }}>Tabela de materiais</h3>
              </div>
              {!novoMat && (
                <button onClick={() => setNovoMat(true)} className="btn btn-lime btn-sm" style={{ gap: '5px' }}>
                  <Plus size={13} /> Adicionar material
                </button>
              )}
            </div>

            <table className="ctp-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Preço por kg (R$)</th>
                  <th>Preço por grama</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {materiais.map((m) => (
                  <tr key={m.id}>
                    {editMat === m.id ? (
                      <>
                        <td>{inp('Nome', editMatData.nome, (v) => setEditMatData((d) => ({ ...d, nome: v })))}</td>
                        <td>{inp('R$/kg', editMatData.precoPorKg, (v) => setEditMatData((d) => ({ ...d, precoPorKg: parseFloat(v) || 0 })), 'number')}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          R$ {((Number(editMatData.precoPorKg) || 0) / 1000).toFixed(3)}/g
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => salvarEdicaoMat(m.id)} className="btn btn-lime btn-sm" style={{ padding: '5px 8px' }}><Check size={12} /></button>
                            <button onClick={() => setEditMat(null)} className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }}><X size={12} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 600, fontSize: '13px' }}>{m.nome}</td>
                        <td style={{ fontSize: '13px' }}>R$ {m.precoPorKg.toFixed(2)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>R$ {(m.precoPorKg / 1000).toFixed(3)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => iniciarEdicaoMat(m)} className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: 'var(--ctp-navy)' }}><Pencil size={12} /></button>
                            <button onClick={() => removerMat(m.id)} className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: '#EF4444' }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {novoMat && (
                  <tr style={{ background: 'rgba(161,240,31,0.05)' }}>
                    <td>
                      {lbl('Nome do material')}
                      {inp('ex: PETG', novoMatData.nome, (v) => setNovoMatData((d) => ({ ...d, nome: v })))}
                    </td>
                    <td>
                      {lbl('Preço', 'R$/kg')}
                      {inp('ex: 180', novoMatData.precoPorKg, (v) => setNovoMatData((d) => ({ ...d, precoPorKg: v })), 'number')}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', verticalAlign: 'bottom', paddingBottom: '8px' }}>
                      {novoMatData.precoPorKg ? `R$ ${(parseFloat(novoMatData.precoPorKg) / 1000).toFixed(3)}/g` : '—'}
                    </td>
                    <td style={{ verticalAlign: 'bottom', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={salvarNovoMat} className="btn btn-lime btn-sm" style={{ padding: '5px 8px' }}><Check size={12} /></button>
                        <button onClick={() => { setNovoMat(false); setNovoMatData({ nome: '', precoPorKg: '' }) }} className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }}><X size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--border-default)', background: 'rgba(6,58,112,0.03)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Os valores são usados automaticamente na calculadora de orçamentos.
              </p>
            </div>
          </div>
        )}

        {/* ── Impressoras ── */}
        {tab === 'impressoras' && (
          <div className="ctp-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={14} color="var(--text-muted)" />
                <h3 style={{ fontSize: '0.875rem' }}>Impressoras e máquinas</h3>
              </div>
              {!novaImp && (
                <button onClick={() => setNovaImp(true)} className="btn btn-lime btn-sm" style={{ gap: '5px' }}>
                  <Plus size={13} /> Adicionar máquina
                </button>
              )}
            </div>

            <table className="ctp-table">
              <thead>
                <tr>
                  <th>Máquina / Impressora</th>
                  <th>Manutenção (R$/h)</th>
                  <th>Potência (W)</th>
                  <th style={{ width: '100px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {impressoras.map((i) => (
                  <tr key={i.id}>
                    {editImp === i.id ? (
                      <>
                        <td>{inp('Nome', editImpData.nome, (v) => setEditImpData((d) => ({ ...d, nome: v })))}</td>
                        <td>{inp('R$/h', editImpData.manutH, (v) => setEditImpData((d) => ({ ...d, manutH: parseFloat(v) || 0 })), 'number')}</td>
                        <td>{inp('W', editImpData.potW, (v) => setEditImpData((d) => ({ ...d, potW: parseFloat(v) || 0 })), 'number')}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => salvarEdicaoImp(i.id)} className="btn btn-lime btn-sm" style={{ padding: '5px 8px' }}><Check size={12} /></button>
                            <button onClick={() => setEditImp(null)} className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }}><X size={12} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 600, fontSize: '13px' }}>{i.nome}</td>
                        <td style={{ fontSize: '13px' }}>R$ {i.manutH.toFixed(2)}</td>
                        <td style={{ fontSize: '13px' }}>{i.potW} W</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => iniciarEdicaoImp(i)} className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: 'var(--ctp-navy)' }}><Pencil size={12} /></button>
                            <button onClick={() => removerImp(i.id)} className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: '#EF4444' }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                {novaImp && (
                  <tr style={{ background: 'rgba(161,240,31,0.05)' }}>
                    <td>
                      {lbl('Nome da máquina')}
                      {inp('ex: Due Flow', novaImpData.nome, (v) => setNovaImpData((d) => ({ ...d, nome: v })))}
                    </td>
                    <td>
                      {lbl('Manutenção', 'R$/h')}
                      {inp('ex: 1.11', novaImpData.manutH, (v) => setNovaImpData((d) => ({ ...d, manutH: v })), 'number')}
                    </td>
                    <td>
                      {lbl('Potência', 'W')}
                      {inp('ex: 150', novaImpData.potW, (v) => setNovaImpData((d) => ({ ...d, potW: v })), 'number')}
                    </td>
                    <td style={{ verticalAlign: 'bottom', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={salvarNovaImp} className="btn btn-lime btn-sm" style={{ padding: '5px 8px' }}><Check size={12} /></button>
                        <button onClick={() => { setNovaImp(false); setNovaImpData({ nome: '', manutH: '', potW: '' }) }} className="btn btn-outline btn-sm" style={{ padding: '5px 8px' }}><X size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--border-default)', background: 'rgba(6,58,112,0.03)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Custo de energia é calculado automaticamente: Potência (W) × tempo (h) × custo kWh.
              </p>
            </div>
          </div>
        )}
      </div>
    </LayoutShell>
  )
}
