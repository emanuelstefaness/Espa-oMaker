import { X } from 'lucide-react'

interface ConfirmModalProps {
  titulo: string
  mensagem: string
  onConfirmar: () => void
  onCancelar: () => void
  labelConfirmar?: string
  labelCancelar?: string
  tipo?: 'perigo' | 'normal'
  carregando?: boolean
}

export function ConfirmModal({
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  labelConfirmar = 'Confirmar',
  labelCancelar = 'Cancelar',
  tipo = 'normal',
  carregando = false,
}: ConfirmModalProps) {
  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div
        className="modal-box"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{titulo}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onCancelar}>
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{mensagem}</p>
        </div>
        <div className="flex gap-2.5 px-6 pb-5 justify-end">
          <button className="btn btn-outline btn-sm" onClick={onCancelar} disabled={carregando}>
            {labelCancelar}
          </button>
          <button
            className={`btn btn-sm ${tipo === 'perigo' ? 'btn-danger' : 'btn-primary'}`}
            style={tipo === 'perigo' ? { background: '#EF4444', color: '#fff' } : {}}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando ? '...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
