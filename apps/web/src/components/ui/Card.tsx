import { HTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: 'primary' | 'accent' | 'secondary' | false
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'glass' | 'surface' | 'outline'
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

const variantStyles = {
  default: 'glass-card',
  glass: 'glass',
  surface: 'bg-surface border border-[--border]',
  outline: 'bg-transparent border border-white/10',
}

const glowStyles = {
  primary: 'hover:border-primary/30 hover:shadow-[0_8px_48px_rgba(0,0,0,0.6),0_0_30px_rgba(79,70,229,0.15)]',
  accent: 'hover:border-accent/30 hover:shadow-[0_8px_48px_rgba(0,0,0,0.6),0_0_30px_rgba(6,182,212,0.15)]',
  secondary: 'hover:border-secondary/30 hover:shadow-[0_8px_48px_rgba(0,0,0,0.6),0_0_30px_rgba(139,92,246,0.15)]',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, glow = false, padding = 'md', variant = 'default', className, children, ...props }, ref) => {
    if (hover) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'rounded-2xl transition-all duration-300',
            variantStyles[variant],
            paddingStyles[padding],
            'cursor-pointer',
            glow && glowStyles[glow],
            className
          )}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300',
          variantStyles[variant],
          paddingStyles[padding],
          glow && glowStyles[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-display text-xl font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-[--border] flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
}
