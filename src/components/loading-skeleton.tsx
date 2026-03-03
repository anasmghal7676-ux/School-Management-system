import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface LoadingSkeletonProps {
  rows?: number
  type?: 'table' | 'cards' | 'spinner' | 'page'
  message?: string
}

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground animate-fade-in">
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
      <p className="text-sm animate-pulse-soft">{message}</p>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4 border-b animate-pulse">
      <div className="skeleton h-9 w-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
      <div className="skeleton h-8 w-20 rounded" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 space-y-2">
            <div className="skeleton h-8 w-1/2 rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function LoadingSkeleton({ rows = 5, type = 'table', message }: LoadingSkeletonProps) {
  if (type === 'spinner') return <LoadingSpinner message={message} />

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (type === 'page') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64 rounded" />
          <div className="skeleton h-4 w-96 rounded" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="space-y-1">
          {[...Array(rows)].map((_,i) => <div key={i} className="skeleton h-14 rounded-lg" />)}
        </div>
      </div>
    )
  }

  // Table type (default)
  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
      </CardContent>
    </Card>
  )
}
