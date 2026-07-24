import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { RenderGradients, chartGridConfig, chartAxisConfig, CustomTooltip } from './Chart'
import { cn } from '@/lib/utils'

interface ChartProps {
  data: any[]
  height?: number
  className?: string
}

// 1. AREA CHART
interface AreaChartProps extends ChartProps {
  categories: string[]
  index: string
  colors?: ('primary' | 'success' | 'accent' | 'secondary')[]
}

const colorMap = {
  primary: '#6366F1',
  success: '#22C55E',
  accent: '#22D3EE',
  secondary: '#8B5CF6',
}

const gradientUrlMap = {
  primary: 'url(#colorApp)',
  success: 'url(#colorAppr)',
  accent: 'url(#colorAccent)',
  secondary: 'url(#colorSec)',
}

export function AreaChartComponent({ data, categories, index, colors = ['primary'], height = 300, className }: AreaChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <RenderGradients />
          <CartesianGrid {...chartGridConfig} />
          <XAxis dataKey={index} {...chartAxisConfig} />
          <YAxis {...chartAxisConfig} />
          <Tooltip content={<CustomTooltip />} />
          {categories.map((cat, i) => {
            const colorKey = colors[i % colors.length]
            return (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={colorMap[colorKey]}
                strokeWidth={2}
                fill={gradientUrlMap[colorKey]}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// 2. BAR CHART
interface BarChartProps extends ChartProps {
  categories: string[]
  index: string
  colors?: ('primary' | 'success' | 'accent' | 'secondary')[]
}

export function BarChartComponent({ data, categories, index, colors = ['primary'], height = 300, className }: BarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid {...chartGridConfig} />
          <XAxis dataKey={index} {...chartAxisConfig} />
          <YAxis {...chartAxisConfig} />
          <Tooltip content={<CustomTooltip />} />
          {categories.map((cat, i) => {
            const colorKey = colors[i % colors.length]
            return (
              <Bar
                key={cat}
                dataKey={cat}
                fill={colorMap[colorKey]}
                radius={[4, 4, 0, 0]}
              />
            )
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 3. LINE CHART
interface LineChartProps extends ChartProps {
  categories: string[]
  index: string
  colors?: ('primary' | 'success' | 'accent' | 'secondary')[]
}

export function LineChartComponent({ data, categories, index, colors = ['primary'], height = 300, className }: LineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid {...chartGridConfig} />
          <XAxis dataKey={index} {...chartAxisConfig} />
          <YAxis {...chartAxisConfig} />
          <Tooltip content={<CustomTooltip />} />
          {categories.map((cat, i) => {
            const colorKey = colors[i % colors.length]
            return (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={colorMap[colorKey]}
                strokeWidth={2}
                dot={{ stroke: colorMap[colorKey], strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// 4. PIE CHART
interface PieChartProps {
  data: { name: string; value: number }[]
  colors?: string[]
  height?: number
  className?: string
}

const defaultPieColors = ['#4F46E5', '#06B6D4', '#8B5CF6', '#22C55E']

export function PieChartComponent({ data, colors = defaultPieColors, height = 300, className }: PieChartProps) {
  return (
    <div className={cn('w-full flex items-center justify-center', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// 5. RADAR CHART
interface RadarChartProps extends ChartProps {
  index: string
  dataKey: string
  color?: 'primary' | 'success' | 'accent' | 'secondary'
}

export function RadarChartComponent({ data, index, dataKey, color = 'primary', height = 300, className }: RadarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis dataKey={index} tick={{ fill: '#94A3B8', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name={dataKey}
            dataKey={dataKey}
            stroke={colorMap[color]}
            fill={colorMap[color]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
