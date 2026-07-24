import { ReactNode } from 'react'
import { TooltipProps } from 'recharts'
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'

export const chartGradients = {
  primary: {
    id: 'colorApp',
    color: '#6366F1',
    stop1: 'rgba(99, 102, 241, 0.15)',
    stop2: 'rgba(99, 102, 241, 0)',
  },
  success: {
    id: 'colorAppr',
    color: '#22C55E',
    stop1: 'rgba(34, 197, 94, 0.15)',
    stop2: 'rgba(34, 197, 94, 0)',
  },
  accent: {
    id: 'colorAccent',
    color: '#22D3EE',
    stop1: 'rgba(34, 211, 238, 0.15)',
    stop2: 'rgba(34, 211, 238, 0)',
  },
  secondary: {
    id: 'colorSec',
    color: '#8B5CF6',
    stop1: 'rgba(139, 92, 246, 0.15)',
    stop2: 'rgba(139, 92, 246, 0)',
  },
}

export function RenderGradients() {
  return (
    <defs>
      {Object.values(chartGradients).map((g) => (
        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={g.color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={g.color} stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>
  )
}

export const chartGridConfig = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255,255,255,0.05)',
}

export const chartAxisConfig = {
  tick: { fill: '#94A3B8', fontSize: 11 },
  axisLine: false,
  tickLine: false,
}

export function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded-xl border border-white/10 shadow-xl bg-surface/95 backdrop-blur-md">
        <p className="text-xs text-muted mb-1.5 font-medium">{label}</p>
        <div className="space-y-1">
          {payload.map((item, i) => (
            <div key={i} className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || item.stroke }}
                />
                <span className="text-xs text-white/80">{item.name}</span>
              </div>
              <span className="text-xs font-semibold font-mono text-white">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}
