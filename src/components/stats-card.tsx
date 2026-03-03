import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: { value: number; label?: string }
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'cyan' | 'rose' | 'slate' | 'emerald' | 'orange'
  className?: string
  onClick?: () => void
}

const COLOR_MAP: Record<string, { border: string; icon: string; trend: string; bg: string }> = {
  blue:    { border: 'border-l-blue-500',    icon: 'text-blue-500',    trend: 'text-blue-600',    bg: 'bg-blue-50/50' },
  green:   { border: 'border-l-green-500',   icon: 'text-green-500',   trend: 'text-green-600',   bg: 'bg-green-50/50' },
  red:     { border: 'border-l-red-500',     icon: 'text-red-500',     trend: 'text-red-600',     bg: 'bg-red-50/50' },
  amber:   { border: 'border-l-amber-500',   icon: 'text-amber-500',   trend: 'text-amber-600',   bg: 'bg-amber-50/50' },
  purple:  { border: 'border-l-purple-500',  icon: 'text-purple-500',  trend: 'text-purple-600',  bg: 'bg-purple-50/50' },
  cyan:    { border: 'border-l-cyan-500',    icon: 'text-cyan-500',    trend: 'text-cyan-600',    bg: 'bg-cyan-50/50' },
  rose:    { border: 'border-l-rose-500',    icon: 'text-rose-500',    trend: 'text-rose-600',    bg: 'bg-rose-50/50' },
  slate:   { border: 'border-l-slate-500',   icon: 'text-slate-500',   trend: 'text-slate-600',   bg: 'bg-slate-50/50' },
  emerald: { border: 'border-l-emerald-500', icon: 'text-emerald-500', trend: 'text-emerald-600', bg: 'bg-emerald-50/50' },
  orange:  { border: 'border-l-orange-500',  icon: 'text-orange-500',  trend: 'text-orange-600',  bg: 'bg-orange-50/50' },
}

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', className, onClick }: StatsCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <Card
      className={cn(
        'border-l-4 transition-all duration-200 animate-fade-in',
        colors.border,
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">{title}</p>
            <p className="text-2xl font-bold leading-none mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
                <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
                {trend.label && <span className="text-muted-foreground font-normal">{trend.label}</span>}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('p-2 rounded-lg flex-shrink-0', colors.bg)}>
              <Icon className={cn('h-5 w-5', colors.icon)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
