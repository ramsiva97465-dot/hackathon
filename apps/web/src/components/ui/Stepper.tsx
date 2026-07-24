import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  title: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number // 1-indexed
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-center md:gap-6', className)}>
      {steps.map((step, index) => {
        const stepNum = index + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep

        return (
          <div key={index} className="flex-1 flex flex-col md:flex-row md:items-center gap-3 relative">
            <div className="flex items-center gap-3">
              {/* Circle number or check mark */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-200 shrink-0 select-none',
                  isCompleted && 'bg-success border-success text-white',
                  isActive && 'bg-primary border-primary text-white shadow-[0_0_12px_rgba(79,70,229,0.3)]',
                  !isActive && !isCompleted && 'bg-surface-3/50 border-white/10 text-muted'
                )}
              >
                {isCompleted ? <Check size={14} className="stroke-[3px]" /> : stepNum}
              </div>

              {/* Text metadata */}
              <div className="text-left">
                <span
                  className={cn(
                    'text-xs font-semibold block leading-none',
                    isActive ? 'text-white' : 'text-muted'
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-[10px] text-muted/60 block mt-1 leading-none">{step.description}</span>
                )}
              </div>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'hidden md:block h-0.5 flex-1 mx-3 rounded-full',
                  isCompleted ? 'bg-success/50' : 'bg-white/5'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
