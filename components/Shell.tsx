'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', label: 'Hoy' },
  { href: '/leads', label: 'Clientes' },
  { href: '/jobs', label: 'Curros' },
]

export function Shell({
  children,
  todayCount,
  onNew,
}: {
  children: React.ReactNode
  todayCount?: number
  onNew?: () => void
}) {
  const pathname = usePathname()
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8 flex items-center gap-4">
        <span className="text-sm font-semibold tracking-tight">Lead Tracker</span>
        <nav className="bg-muted/50 flex gap-1 rounded-full border p-1">
          {TABS.map((t) => {
            const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex-1" />
        {todayCount != null && todayCount > 0 && (
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {todayCount} tocan hoy
          </Badge>
        )}
        {onNew && (
          <Button onClick={onNew} className="rounded-full">
            <Plus />
            Nuevo
          </Button>
        )}
      </header>
      {children}
    </div>
  )
}
