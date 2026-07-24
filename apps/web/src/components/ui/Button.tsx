import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'glass'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  glow?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-white border border-primary/20
    hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]
    active:bg-primary/80
  `,
  secondary: `
    bg-secondary/10 text-secondary border border-secondary/20
    hover:bg-secondary/20 hover:border-secondary/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]
  `,
  ghost: `
    bg-transparent text-white border border-transparent
    hover:bg-white/5 hover:border-white/10
  `,
  outline: `
    bg-transparent text-white border border-white/15
    hover:bg-white/5 hover:border-white/30
  `,
  danger: `
    bg-danger/10 text-danger border border-danger/20
    hover:bg-danger/20 hover:border-danger/40
  `,
  success: `
    bg-success/10 text-success border border-success/20
    hover:bg-success/20 hover:border-success/40
  `,
  glass: `
    glass text-white
    hover:bg-white/10 hover:border-white/20
  `,
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-3 text-xs gap-1.5',
  sm: 'h-8 px-4 text-sm gap-2',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
  xl: 'h-14 px-10 text-lg gap-3',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      glow = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          'relative inline-flex items-center justify-center',
          'font-medium rounded-xl cursor-pointer',
          'transition-all duration-200',
          'select-none focus-visible:ring-2 focus-visible:ring-primary/50 outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          glow && variant === 'primary' && 'shadow-[0_0_30px_rgba(79,70,229,0.3)]',
          className
        )}
        disabled={isDisabled}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {/* Shimmer on hover */}
        <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
        </span>

        {loading ? (
          <Loader2 className="animate-spin" size={size === 'xs' || size === 'sm' ? 14 : 16} />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}

        {children && <span>{children}</span>}

        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
