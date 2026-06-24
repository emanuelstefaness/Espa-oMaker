import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import logoCtp from '../assets/logo-ctp.svg'

const HEX_POSITIONS = [
  { x: 10, y: 6, size: 48, opacity: 0.06 },
  { x: 58, y: 2, size: 64, opacity: 0.05 },
  { x: 82, y: 14, size: 36, opacity: 0.08 },
  { x: 28, y: 22, size: 80, opacity: 0.04 },
  { x: 68, y: 32, size: 52, opacity: 0.06 },
  { x: 90, y: 48, size: 44, opacity: 0.07 },
  { x: 4, y: 52, size: 60, opacity: 0.04 },
  { x: 44, y: 58, size: 36, opacity: 0.06 },
  { x: 18, y: 76, size: 56, opacity: 0.05 },
  { x: 72, y: 68, size: 70, opacity: 0.04 },
  { x: 50, y: 82, size: 42, opacity: 0.06 },
  { x: 88, y: 84, size: 32, opacity: 0.08 },
]

function Hexagon({ x, y, size, opacity }: { x: number; y: number; size: number; opacity: number }) {
  const h = size * 0.866
  const pts = [
    [size / 2, 0],
    [size, h / 4],
    [size, (3 * h) / 4],
    [size / 2, h],
    [0, (3 * h) / 4],
    [0, h / 4],
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(' ')

  return (
    <svg
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size * 0.866,
        opacity,
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${size} ${size * 0.866}`}
    >
      <polygon points={pts} fill="none" stroke="#A1F01F" strokeWidth="1.5" />
    </svg>
  )
}

export function LoginPage() {
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [focusEmail, setFocusEmail] = useState(false)
  const [focusSenha, setFocusSenha] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.'
      setError(message)
    }
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    fontFamily: 'inherit',
    border: `1.5px solid ${focused ? '#063A70' : '#E2E8F0'}`,
    borderRadius: '10px',
    outline: 'none',
    background: focused ? '#F8FAFF' : '#FAFAFA',
    color: '#0F172A',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px rgba(6,58,112,0.08)' : 'none',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif" }}>
      {/* ═══ PAINEL ESQUERDO ═══ */}
      <div
        style={{
          width: '45%',
          background: '#063A70',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem',
        }}
        className="hidden lg:flex"
      >
        {HEX_POSITIONS.map((h, i) => (
          <Hexagon key={i} {...h} />
        ))}

        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(161,240,31,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '3px',
            height: '100%',
            background: 'linear-gradient(to bottom, #A1F01F 0%, transparent 60%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <img
            src={logoCtp}
            alt="Cilla Tech Park"
            style={{ height: '32px', width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
          <div
            style={{
              marginTop: '6px',
              fontSize: '9px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            O Celeiro de Inovação
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(161,240,31,0.12)',
              border: '1px solid rgba(161,240,31,0.25)',
              borderRadius: '100px',
              padding: '6px 14px',
              marginBottom: '24px',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A1F01F' }} />
            <span style={{ fontSize: '11.5px', color: '#A1F01F', fontWeight: 600, letterSpacing: '0.4px' }}>
              Sistema ativo
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              letterSpacing: '-0.04em',
              marginBottom: '16px',
            }}
          >
            Gerenciamento
            <br />
            <span style={{ color: '#A1F01F' }}>Espaço Maker</span>
            <br />
            CTP
          </h1>

          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: '320px' }}>
            Controle completo das demandas, produção, estoque e orçamentos do Celeiro de Inovação.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '28px' }}>
            {['Demandas', 'Orçamentos', 'Estoque', 'Financeiro', 'Agenda'].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.55)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '2rem' }}>
          {[
            { value: '100%', label: 'Rastreabilidade' },
            { value: '12', label: 'Módulos ativos' },
            { value: 'Web', label: 'Acesso' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#A1F01F', letterSpacing: '-0.03em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ PAINEL DIREITO ═══ */}
      <div
        style={{
          flex: 1,
          background: '#F1F5FB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(6,58,112,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '420px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 8px 40px rgba(6,58,112,0.1), 0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #063A70, #A1F01F)' }} />

          <div style={{ padding: '2.25rem 2.25rem 2rem' }}>
            <div
              className="lg:hidden"
              style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  background: '#063A70',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src={logoCtp}
                  alt="CTP"
                  style={{ height: '18px', width: 'auto', filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#063A70' }}>Cilla Tech Park</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Espaço Maker</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.035em',
                  marginBottom: '6px',
                }}
              >
                Bem-vindo de volta
              </h2>
              <p style={{ fontSize: '13.5px', color: '#94A3B8', fontWeight: 400 }}>
                Acesse o sistema com suas credenciais
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '7px',
                    letterSpacing: '0.01em',
                  }}
                >
                  E-mail institucional
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusEmail(true)}
                  onBlur={() => setFocusEmail(false)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  style={inputStyle(focusEmail)}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '7px',
                    letterSpacing: '0.01em',
                  }}
                >
                  Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusSenha(true)}
                    onBlur={() => setFocusSenha(false)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    style={{ ...inputStyle(focusSenha), paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#94A3B8',
                      fontSize: '13px',
                      lineHeight: 1,
                    }}
                    tabIndex={-1}
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#991B1B',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
                    <path d="M12 7v5m0 4h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  marginTop: '4px',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading ? '#94A3B8' : '#063A70',
                  color: '#fff',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '-0.01em',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(6,58,112,0.3)',
                }}
              >
                {loading ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    >
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Entrando…
                  </>
                ) : (
                  'Entrar no sistema'
                )}
              </button>
            </form>

            <p style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '1.5rem', textAlign: 'center' }}>
              Acesso à equipe do Espaço Maker. Usuários são criados no Supabase.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
