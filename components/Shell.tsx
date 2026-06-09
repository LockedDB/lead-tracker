'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@headlessui/react'

const TABS = [
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
        <span className="text-sm font-semibold tracking-tight text-white">
          Lead Tracker
        </span>
        <nav className="flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  'rounded-full px-4 py-1.5 text-sm font-medium transition ' +
                  (active
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white')
                }
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex-1" />
        {todayCount != null && todayCount > 0 && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
            {todayCount} tocan hoy
          </span>
        )}
        {onNew && (
          <Button
            onClick={onNew}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            + Nuevo
          </Button>
        )}
      </header>
      {children}
    </div>
  )
}
