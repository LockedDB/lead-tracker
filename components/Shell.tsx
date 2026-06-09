'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/leads', label: 'Clientes' },
  { href: '/jobs', label: 'Curros' },
]

export function Shell({
  children,
  todayCount,
}: {
  children: React.ReactNode
  todayCount?: number
}) {
  const pathname = usePathname()
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-6 flex items-center gap-3">
        <nav className="flex gap-1">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.href)
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  'rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
                  (active ? 'bg-ink text-white' : 'text-neutral-500 hover:text-ink')
                }
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex-1" />
        {todayCount != null && todayCount > 0 && (
          <span className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent">
            ⏰ {todayCount} tocan hoy
          </span>
        )}
      </header>
      {children}
    </div>
  )
}
