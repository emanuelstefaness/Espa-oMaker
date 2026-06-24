import { useEffect, useState } from 'react'
import { Plus, Building2, Phone, Mail, X, MapPin, Trash2, Pencil } from 'lucide-react'
import { LayoutShell } from '../components/LayoutShell'
import { formatarData } from '../utils/formatters'
import {
  listPrefeitura,
  createRegistroPrefeitura,
  updateRegistroPrefeitura,
  deleteRegistroPrefeitura,
  type RegistroPrefeitura,
  type RegistroPrefeituraInput,
  type PrefeituraStatus,
} from '../services/prefeitura'

const statusConfig: Record<PrefeituraStatus, { label: string; bg: string; color: string }> = {
  ativo: { label: 'Ativo', bg: '#DCFCE7', color: '#15803D' },
  em_negociacao: { label: 'Em negociação', bg: '#FFFBEB', color: '#92400E' },
  concluido: { label: 'Concluído', bg: '#EFF6FF', color: '#1E40AF' },
  cancelado: { label: 'Cancelado', bg: '#F1F5F9', color: '#475569' },
}

const formVazio: Partial<RegistroPrefeitura> = {
  municipio: '',
  contato: '',
  telefone: '',
  email: '',
  numProcesso: '',
  descricao: '',
  status: 'em_negociacao',
}

export function PrefeituraPage() {
  const [registros, setRegistros] = useState<RegistroPrefeitura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<Partial<RegistroPrefeitura> | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState<RegistroPrefeitura | null>(null)
  const [salvando, setSalvando] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setRegistros(await listPrefeitura())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar parcerias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const abrirNovo = () => {
    setEditandoId(null)
    setModal({ ...formVazio })
  }
  const abrirEditar = (r: RegistroPrefeitura) => {
    setEditandoId(r.id)
    setModal({ ...r })
  }

  const salvar = async () => {
    if (!modal?.municipio || !modal.contato || !modal.email) return
    setSalvando(true)
    try {
      const payload: RegistroPrefeituraInput = {
        municipio: modal.municipio,
        contato: modal.contato,
        telefone: modal.telefone ?? null,
        email: modal.email,
        numProcesso: modal.numProcesso ?? null,
        descricao: modal.descricao ?? null,
        status: (modal.status as PrefeituraStatus) ?? 'em_negociacao',
      }
      if (editandoId) {
        await updateRegistroPrefeitura(editandoId, payload)
      } else {
        await createRegistroPrefeitura(payload)
      }
      setModal(null)
      setEditandoId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar parceria.')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExcluir = async () => {
    if (!excluindo) return
    setSalvando(true)
    try {
      await deleteRegistroPrefeitura(excluindo.id)
      setExcluindo(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir parceria.')
    } finally {
      setSalvando(false)
    }
  }

  const lbl = (text: string) => (
    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
      {text}
    </label>
  )

  return (
    <LayoutShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div className="page-header" style={{ margin: 0 }}>
            <h1>Prefeitura</h1>
            <p>Parcerias com municípios — {registros.length} {registros.length === 1 ? 'registro' : 'registros'}</p>
          </div>
          <button onClick={abrirNovo} className="btn btn-lime" style={{ gap: '6px', flexShrink: 0 }}>
            <Plus size={14} /> Nova parceria
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="ctp-card">
            <div className="empty-state" style={{ padding: '3rem' }}>
              <p>Carregando parcerias…</p>
            </div>
          </div>
        ) : registros.length === 0 ? (
          <div className="ctp-card">
            <div className="empty-state" style={{ padding: '3.5rem' }}>
              <Building2 size={40} />
              <p>Nenhuma parceria cadastrada</p>
              <p>Adicione um município parceiro para começar.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.875rem' }}>
            {registros.map((r) => {
              const st = statusConfig[r.status]
              return (
                <div key={r.id} className="ctp-card" style={{ padding: '1.125rem 1.375rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: '15px' }}>{r.municipio}</h3>
                      <span className="badge" style={{ background: st.bg, color: st.color, marginTop: '5px' }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => abrirEditar(r)} className="btn btn-ghost btn-sm" style={{ padding: '5px' }} title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setExcluindo(r)} className="btn btn-ghost btn-sm" style={{ padding: '5px', color: '#EF4444' }} title="Excluir">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {r.descricao && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.55 }}>{r.descricao}</p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '0.75rem' }}>
                    {[
                      { icon: Building2, text: r.contato },
                      ...(r.telefone ? [{ icon: Phone, text: r.telefone }] : []),
                      { icon: Mail, text: r.email },
                      ...(r.numProcesso ? [{ icon: MapPin, text: `Processo: ${r.numProcesso}` }] : []),
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Icon size={12} color="var(--text-muted)" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-disabled)', marginTop: '0.625rem' }}>
                    Cadastrado em {formatarData(r.criadoEm)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal excluir */}
        {excluindo && (
          <div className="modal-backdrop">
            <div className="modal-box" style={{ maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
                <h3 style={{ fontWeight: 700, color: '#EF4444' }}>Excluir parceria</h3>
                <button onClick={() => setExcluindo(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Tem certeza que deseja excluir a parceria com <strong style={{ color: 'var(--text-primary)' }}>{excluindo.municipio}</strong>?
                </p>
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setExcluindo(null)} className="btn btn-outline btn-sm">Cancelar</button>
                  <button onClick={confirmarExcluir} disabled={salvando} className="btn btn-danger btn-sm">Excluir parceria</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal criar/editar */}
        {modal && (
          <div className="modal-backdrop">
            <div className="modal-box" style={{ maxWidth: '520px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-default)' }}>
                <h3 style={{ fontWeight: 700 }}>{editandoId ? 'Editar parceria' : 'Nova parceria'}</h3>
                <button onClick={() => setModal(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', overflowY: 'auto', maxHeight: '70vh' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    {lbl('Município *')}
                    <input className="ctp-input" value={modal.municipio ?? ''} onChange={(e) => setModal({ ...modal, municipio: e.target.value })} />
                  </div>
                  <div>
                    {lbl('Status')}
                    <select className="ctp-input" value={modal.status ?? 'em_negociacao'} onChange={(e) => setModal({ ...modal, status: e.target.value as PrefeituraStatus })}>
                      <option value="em_negociacao">Em negociação</option>
                      <option value="ativo">Ativo</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div>
                  {lbl('Contato *')}
                  <input className="ctp-input" value={modal.contato ?? ''} onChange={(e) => setModal({ ...modal, contato: e.target.value })} placeholder="Nome do responsável" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    {lbl('Telefone')}
                    <input className="ctp-input" value={modal.telefone ?? ''} onChange={(e) => setModal({ ...modal, telefone: e.target.value })} />
                  </div>
                  <div>
                    {lbl('E-mail *')}
                    <input type="email" className="ctp-input" value={modal.email ?? ''} onChange={(e) => setModal({ ...modal, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  {lbl('Nº do processo')}
                  <input className="ctp-input" value={modal.numProcesso ?? ''} onChange={(e) => setModal({ ...modal, numProcesso: e.target.value })} />
                </div>
                <div>
                  {lbl('Descrição')}
                  <textarea className="ctp-input" rows={3} value={modal.descricao ?? ''} onChange={(e) => setModal({ ...modal, descricao: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button onClick={() => setModal(null)} className="btn btn-outline btn-sm">Cancelar</button>
                  <button onClick={salvar} disabled={salvando || !modal.municipio || !modal.contato || !modal.email} className="btn btn-primary btn-sm">
                    {salvando ? 'Salvando…' : 'Salvar'}
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
