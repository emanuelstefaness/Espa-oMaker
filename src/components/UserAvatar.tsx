interface UserAvatarProps {
  avatarUrl?: string | null
  name?: string | null
  /** Tamanho: sm (8), md (10), lg (12) */
  size?: 'sm' | 'md' | 'lg'
  /** Se true, mostra o nome ao lado do avatar */
  showName?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function UserAvatar({
  avatarUrl,
  name,
  size = 'md',
  showName = false,
  className = '',
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size]

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={`${sizeClass} shrink-0 rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-medium text-slate-600`}
        >
          {name?.charAt(0)?.toUpperCase() ?? '?'}
        </span>
      )}
      {showName && name && (
        <span className="truncate text-slate-700">{name}</span>
      )}
    </span>
  )
}
