import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  iconBg?: string
  iconColor?: string
  accent?: 'red' | 'yellow' | 'green' | 'blue'
}

const accentStyles = {
  red: { border: '#EF4444', bg: '#FEF2F2' },
  yellow: { border: '#F59E0B', bg: '#FFFBEB' },
  green: { border: '#22C55E', bg: '#F0FDF4' },
  blue: { border: '#3B82F6', bg: '#EFF6FF' },
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg = '#EEF2F7',
  iconColor = 'var(--ctp-navy)',
  accent,
}: MetricCardProps) {
  const a = accent ? accentStyles[accent] : null
  return (
    <div
      className="stat-card"
      style={a ? { borderLeft: `3px solid ${a.border}`, background: a.bg } : {}}
    >
      <div className="stat-icon" style={{ background: iconBg }}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}
