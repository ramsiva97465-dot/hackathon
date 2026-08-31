import { cn } from '@/lib/utils'

type LogoTone = 'light' | 'dark'

interface LogoProps {
  className?: string
  tone?: LogoTone
  title?: string
}

/** Official SnapServe mark (snapserve.ai) */
export function SnapServeMark({ className, title = 'SnapServe' }: LogoProps) {
  return (
    <img
      src="/logos/Snaplogo.png.png"
      alt={title}
      className={cn('object-contain shrink-0', className)}
      draggable={false}
    />
  )
}

/** Official SnapServe wordmark — best on light surfaces */
export function SnapServeWordmark({ className, title = 'SnapServe' }: LogoProps) {
  return (
    <img
      src="/logos/snapserve-full-light.jpg"
      alt={title}
      className={cn('object-contain object-left', className)}
      draggable={false}
    />
  )
}

/** Official Vobiz mark (vobiz.ai) */
export function VobizMark({ className, title = 'Vobiz' }: LogoProps) {
  return (
    <img
      src="/logos/vobiz-mark.svg"
      alt={title}
      className={cn('object-contain', className)}
      draggable={false}
    />
  )
}

/** Official Vobiz lockup (mark + wordmark), cropped tight — aspect ratio 400:111 */
export function VobizLockup({ className, title = 'Vobiz' }: LogoProps) {
  return (
    <img
      src="/logos/vobiz-full.png"
      alt={title}
      className={cn('object-contain object-left shrink-0', className)}
      draggable={false}
    />
  )
}

/** Official Vobiz wordmark */
export function VobizWordmark({ className, tone = 'dark', title = 'Vobiz' }: LogoProps) {
  return (
    <img
      src={tone === 'light' ? '/logos/vobiz-wordmark-white.svg' : '/logos/vobiz-wordmark.svg'}
      alt={title}
      className={cn('object-contain object-left', className)}
      draggable={false}
    />
  )
}

/** SnapServe × Vobiz partnership lockup */
export function BrandPair({
  className,
  size = 'md',
  tone = 'dark',
  showNames = true,
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: LogoTone
  showNames?: boolean
}) {
  const mark =
    size === 'sm' ? 'h-8 w-8 sm:h-9 sm:w-9' : size === 'lg' ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-11 w-11'
  const box =
    size === 'sm'
      ? 'px-3 py-2.5 gap-1.5'
      : size === 'lg'
        ? 'px-5 py-4 gap-2.5'
        : 'px-4 py-3 gap-2'
  const label = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-[11px]'
  const onDark = tone === 'dark'

  return (
    <div className={cn('flex items-center justify-center gap-2.5 sm:gap-3.5', className)}>
      <div
        className={cn(
          'flex flex-col items-center rounded-2xl border backdrop-blur-md',
          box,
          onDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
        )}
      >
        <SnapServeMark className={cn(mark, 'drop-shadow-sm')} />
        {showNames && (
          <span
            className={cn(
              'font-semibold tracking-tight',
              label,
              onDark ? 'text-white' : 'text-slate-900',
            )}
          >
            SnapServe
          </span>
        )}
      </div>

      <span className={cn('font-light', onDark ? 'text-white/25' : 'text-slate-300', size === 'lg' ? 'text-2xl' : 'text-lg')}>
        ✕
      </span>

      <div
        className={cn(
          'flex flex-col items-center rounded-2xl border backdrop-blur-md',
          box,
          onDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
        )}
      >
        <VobizMark className={cn(mark, 'drop-shadow-sm')} />
        {showNames && (
          <span
            className={cn(
              'font-semibold tracking-tight',
              label,
              onDark ? 'text-white' : 'text-slate-900',
            )}
          >
            Vobiz
          </span>
        )}
      </div>
    </div>
  )
}

/** Compact horizontal lockup for headers / sidebars */
export function BrandLockup({
  className,
  collapsed = false,
  tone = 'dark',
}: {
  className?: string
  collapsed?: boolean
  tone?: LogoTone
}) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <SnapServeMark className="h-7 w-7 shrink-0" />
      {!collapsed && (
        <>
          <span className={cn('text-[10px] font-light', tone === 'dark' ? 'text-white/30' : 'text-slate-300')}>✕</span>
          <VobizMark className="h-6 w-8 shrink-0" />
        </>
      )}
    </div>
  )
}
