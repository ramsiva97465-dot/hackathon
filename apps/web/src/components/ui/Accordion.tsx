import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface AccordionItem {
  id: string
  question: string
  answer: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  className?: string
  type?: 'single' | 'multiple'
}

export function Accordion({ items, className, type = 'single' }: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      type={type as 'single'}
      collapsible={type === 'single' ? true : undefined}
      className={cn('flex flex-col gap-2', className)}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.id}
          value={item.id}
          className="glass-card overflow-hidden"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger
              className={cn(
                'group flex w-full items-center justify-between px-6 py-4',
                'text-left font-medium text-white hover:text-white/90',
                'transition-all duration-200',
                '[&[data-state=open]]:border-b [&[data-state=open]]:border-white/5'
              )}
            >
              <span className="text-sm md:text-base">{item.question}</span>
              <ChevronDown
                size={18}
                className={cn(
                  'shrink-0 text-muted transition-transform duration-300',
                  'group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary'
                )}
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content
            className={cn(
              'overflow-hidden text-sm text-muted',
              'data-[state=closed]:animate-[collapsible-up_0.2s_ease]',
              'data-[state=open]:animate-[collapsible-down_0.2s_ease]'
            )}
          >
            <div className="px-6 py-4 leading-relaxed">{item.answer}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}
