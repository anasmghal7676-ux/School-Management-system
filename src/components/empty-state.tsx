import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
  compact?: boolean
}

export default function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  const ActionIcon = action?.icon

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-16')}>
        <div className="animate-bounce-subtle">
          {Icon && <Icon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />}
        </div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
        {action && (
          <Button size="sm" onClick={action.onClick} className="mt-2 animate-fade-in">
            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
