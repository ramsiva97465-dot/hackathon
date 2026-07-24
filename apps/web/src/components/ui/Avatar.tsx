import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy' | null
}

const sizeStyles = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-lg',
}

const statusColors = {
  online: 'bg-success',
  offline: 'bg-muted',
  busy: 'bg-danger',
}

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function getGradient(name: string) {
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

export function Avatar({ src, name = '?', size = 'md', status, className, ...props }: AvatarProps) {
  const bgGradient = getGradient(name)
  const initials = getInitials(name)

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-display font-extrabold text-white overflow-hidden',
          'ring-1 ring-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.4)]',
          sizeStyles[size]
        )}
        style={{ background: src ? undefined : bgGradient }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="tracking-tighter select-none">{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border border-[#030712]',
            statusColors[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  )
}

// Avatar Group
interface AvatarGroupProps {
  users: { name: string; src?: string | null }[]
  max?: number
  size?: AvatarProps['size']
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = users.slice(0, max)
  const remaining = users.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={i} name={u.name} src={u.src} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center border border-[#030712]',
            'bg-[#111827] text-[#94A3B8] font-bold',
            sizeStyles[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
