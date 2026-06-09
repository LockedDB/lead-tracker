# Lead Tracker — Plan 2: UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Interfaz local sobre el backend del Plan 1: tabla de leads/curros con foco en follow-ups, drawer de detalle minimalista, y generación de cover letters / outreach emails con un click.

**Architecture:** Componentes cliente de Next.js que consumen las rutas API ya existentes (`/api/leads`, `/api/jobs`, `/api/templates`, `/api/generate`). Estado y fetching con hooks ligeros (fetch + React state, sin librería extra). UI con Headless UI (Tab, Dialog, Transition, Listbox, Disclosure) + Tailwind v4. Diseño sobrio sobre paleta de marca.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, @headlessui/react, next/font (Inter). Playwright para E2E de navegador.

**Specs de referencia:** `docs/specs/2026-06-09-lead-tracker-design.md`. Mockups aprobados en brainstorming: vista TABLA (no kanban) con indicador "tocan hoy"; drawer minimalista que a primera vista muestra solo nombre, estado, "qué toca hoy" y botón Generar, con contacto/notas/historial plegados; campo "instrucciones extra" plegado junto a Generar.

**Paleta:** negro `#111111`, naranja acento `#FF6B35`, tipografía Inter. Naranja reservado para lo accionable y para "toca hoy".

---

## Estructura de ficheros

```
app/
  globals.css              # @import tailwindcss + @theme con paleta de marca
  layout.tsx               # root: fuente Inter, shell
  page.tsx                 # redirect a /leads
  leads/page.tsx           # vista de clientes (client component)
  jobs/page.tsx            # vista de curros (client component)
components/
  Shell.tsx                # top bar + tabs Clientes/Curros + slot
  EntityTable.tsx          # tabla genérica (sirve a leads y jobs vía props)
  StatusBadge.tsx          # badge de estado con color
  NextActionCell.tsx       # celda "próxima acción" con resaltado "hoy"
  DetailDrawer.tsx         # Dialog lateral minimalista con secciones plegables
  GeneratePanel.tsx        # plantilla + instrucciones extra + generar + resultado
  CollapsibleSection.tsx   # Disclosure reutilizable (contacto, notas, historial)
lib/client/
  api.ts                   # wrappers tipados de fetch a las rutas API
  dates.ts                 # helpers: isToday, isOverdue, formato corto
  status.ts                # mapas de estado->label/color para leads y jobs
e2e/
  ui.spec.ts               # E2E de navegador con screenshots
```

Tipos `Lead`/`Job` se importan con `import type` desde `lib/repos/*` (se borran en compilación; no arrastran `better-sqlite3` al bundle cliente).

---

### Task 1: Tailwind v4 + tema de marca + fuente Inter

**Files:**
- Create: `postcss.config.mjs`
- Create: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `package.json` (deps)

- [ ] **Step 1: Instalar Tailwind v4 y Headless UI**

Run:
```bash
cd ~/code/lead-tracker
npm install -D tailwindcss @tailwindcss/postcss postcss
npm install @headlessui/react
```
Expected: instala sin errores.

- [ ] **Step 2: Configurar PostCSS**

Create `postcss.config.mjs`:
```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

- [ ] **Step 3: globals.css con tema de marca**

Create `app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-ink: #111111;
  --color-accent: #ff6b35;
  --color-accent-soft: #ffede4;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

html, body {
  background: #fafafa;
  color: var(--color-ink);
}
```

- [ ] **Step 4: Cargar Inter y globals en el root layout**

Modify `app/layout.tsx` para que quede:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Lead Tracker',
  description: 'Tracker de clientes y curros',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Verificación visual mínima**

Replace `app/page.tsx` con un placeholder temporal estilado:
```tsx
export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold text-ink">Lead Tracker</h1>
      <button className="mt-4 rounded-lg bg-accent px-4 py-2 font-semibold text-white">
        Botón de prueba
      </button>
    </main>
  )
}
```

Run (background): `npm run dev > /tmp/lt-dev.log 2>&1 &` ; esperar a que compile; `curl -s localhost:3000 | grep -o 'Lead Tracker'`.
Expected: imprime `Lead Tracker`. Matar el server después (`kill <pid>`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): Tailwind v4 + tema de marca + fuente Inter"
```

---

### Task 2: Cliente API tipado + helpers de fecha/estado

**Files:**
- Create: `lib/client/api.ts`
- Create: `lib/client/dates.ts`
- Create: `lib/client/status.ts`
- Test: `tests/client/dates.test.ts`
- Test: `tests/client/status.test.ts`

- [ ] **Step 1: Test de helpers de fecha (falla)**

Create `tests/client/dates.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isToday, isOverdue } from '@/lib/client/dates'

describe('dates', () => {
  const today = '2026-06-09'
  it('isToday', () => {
    expect(isToday('2026-06-09', today)).toBe(true)
    expect(isToday('2026-06-10', today)).toBe(false)
    expect(isToday(null, today)).toBe(false)
  })
  it('isOverdue', () => {
    expect(isOverdue('2026-06-08', today)).toBe(true)
    expect(isOverdue('2026-06-09', today)).toBe(false)
    expect(isOverdue('2026-06-10', today)).toBe(false)
    expect(isOverdue(null, today)).toBe(false)
  })
})
```

Run: `npm test -- tests/client/dates.test.ts`
Expected: FAIL (módulo no encontrado).

- [ ] **Step 2: Implementar helpers de fecha**

Create `lib/client/dates.ts`:
```ts
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isToday(date: string | null | undefined, today = todayISO()): boolean {
  return !!date && date.slice(0, 10) === today
}

export function isOverdue(date: string | null | undefined, today = todayISO()): boolean {
  return !!date && date.slice(0, 10) < today
}
```

Run: `npm test -- tests/client/dates.test.ts`
Expected: PASS.

- [ ] **Step 3: Test de mapas de estado (falla)**

Create `tests/client/status.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { LEAD_STATUSES, JOB_STATUSES, statusLabel } from '@/lib/client/status'

describe('status maps', () => {
  it('lead statuses incluyen el flujo completo', () => {
    expect(LEAD_STATUSES.map((s) => s.value)).toContain('proposal_sent')
    expect(LEAD_STATUSES.map((s) => s.value)).toContain('closed_won')
  })
  it('job statuses incluyen interview y offer', () => {
    expect(JOB_STATUSES.map((s) => s.value)).toContain('interview')
    expect(JOB_STATUSES.map((s) => s.value)).toContain('offer')
  })
  it('statusLabel devuelve el label legible', () => {
    expect(statusLabel(LEAD_STATUSES, 'replied')).toBe('Respondió')
  })
})
```

Run: `npm test -- tests/client/status.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementar mapas de estado**

Create `lib/client/status.ts`:
```ts
export type StatusDef = { value: string; label: string; tone: 'neutral' | 'active' | 'won' | 'lost' }

export const LEAD_STATUSES: StatusDef[] = [
  { value: 'prospect', label: 'Prospecto', tone: 'neutral' },
  { value: 'contacted', label: 'Contactado', tone: 'active' },
  { value: 'replied', label: 'Respondió', tone: 'active' },
  { value: 'in_conversation', label: 'En conversación', tone: 'active' },
  { value: 'call_scheduled', label: 'Call agendada', tone: 'active' },
  { value: 'proposal_sent', label: 'Propuesta enviada', tone: 'active' },
  { value: 'closed_won', label: 'Ganado', tone: 'won' },
  { value: 'closed_lost', label: 'Perdido', tone: 'lost' },
  { value: 'ghosted', label: 'Ghosteado', tone: 'lost' },
]

export const JOB_STATUSES: StatusDef[] = [
  { value: 'saved', label: 'Guardado', tone: 'neutral' },
  { value: 'applied', label: 'Aplicado', tone: 'active' },
  { value: 'screening', label: 'Screening', tone: 'active' },
  { value: 'interview', label: 'Entrevista', tone: 'active' },
  { value: 'offer', label: 'Oferta', tone: 'won' },
  { value: 'rejected', label: 'Rechazado', tone: 'lost' },
  { value: 'accepted', label: 'Aceptado', tone: 'won' },
  { value: 'withdrawn', label: 'Retirado', tone: 'lost' },
]

export function statusLabel(defs: StatusDef[], value: string): string {
  return defs.find((d) => d.value === value)?.label ?? value
}
```

Run: `npm test -- tests/client/status.test.ts`
Expected: PASS.

- [ ] **Step 5: Cliente API tipado**

Create `lib/client/api.ts`:
```ts
import type { Lead, LeadInput } from '@/lib/repos/leads'
import type { Job, JobInput } from '@/lib/repos/jobs'
import type { Template } from '@/lib/repos/templates'
import type { Generation } from '@/lib/repos/generations'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

export const api = {
  listLeads: () => fetch('/api/leads').then(json<Lead[]>),
  getLead: (id: number) => fetch(`/api/leads/${id}`).then(json<Lead>),
  updateLead: (id: number, patch: Partial<LeadInput>) =>
    fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(json<Lead>),
  createLead: (input: LeadInput) =>
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }).then(json<{ id: number }>),

  listJobs: () => fetch('/api/jobs').then(json<Job[]>),
  getJob: (id: number) => fetch(`/api/jobs/${id}`).then(json<Job>),
  updateJob: (id: number, patch: Partial<JobInput>) =>
    fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(json<Job>),
  createJob: (input: JobInput) =>
    fetch('/api/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }).then(json<{ id: number }>),

  listTemplates: () => fetch('/api/templates').then(json<Template[]>),

  generate: (body: {
    subjectType: 'lead' | 'job'
    subjectId: number
    templateId: number
    extraInstructions?: string
  }) =>
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then(json<{ id: number; content: string; generator: string }>),
}

export type { Lead, Job, Template, Generation }
```

- [ ] **Step 6: Run de toda la suite + tsc**

Run: `npm test` (debe seguir verde, ahora +2 ficheros) y `npx tsc --noEmit` (limpio).
Expected: todos los tests pasan; tsc sin errores.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ui): cliente API tipado y helpers de fecha/estado"
```

---

### Task 3: Shell con tabs Clientes/Curros

**Files:**
- Create: `components/Shell.tsx`
- Modify: `app/page.tsx` (redirect a /leads)
- Create: `app/leads/page.tsx` (placeholder que usa Shell)
- Create: `app/jobs/page.tsx` (placeholder que usa Shell)

- [ ] **Step 1: Componente Shell**

Create `components/Shell.tsx`:
```tsx
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
```

- [ ] **Step 2: Redirect de la home**

Replace `app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/leads')
}
```

- [ ] **Step 3: Placeholders de páginas (se rellenan en Tasks 4/7)**

Create `app/leads/page.tsx`:
```tsx
'use client'
import { Shell } from '@/components/Shell'

export default function LeadsPage() {
  return (
    <Shell>
      <p className="text-sm text-neutral-500">Tabla de clientes (pendiente)</p>
    </Shell>
  )
}
```

Create `app/jobs/page.tsx`:
```tsx
'use client'
import { Shell } from '@/components/Shell'

export default function JobsPage() {
  return (
    <Shell>
      <p className="text-sm text-neutral-500">Tabla de curros (pendiente)</p>
    </Shell>
  )
}
```

- [ ] **Step 4: Verificar navegación**

Run dev server en background; `curl -s localhost:3000/leads | grep -o 'Clientes'` y `curl -s localhost:3000/jobs | grep -o 'Curros'`.
Expected: ambos imprimen su tab. Matar el server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): shell con tabs Clientes/Curros y contador de hoy"
```

---

### Task 4: Tabla de leads con foco en follow-ups

**Files:**
- Create: `components/StatusBadge.tsx`
- Create: `components/NextActionCell.tsx`
- Create: `components/EntityTable.tsx`
- Modify: `app/leads/page.tsx`

- [ ] **Step 1: StatusBadge**

Create `components/StatusBadge.tsx`:
```tsx
import type { StatusDef } from '@/lib/client/status'
import { statusLabel } from '@/lib/client/status'

const TONE: Record<StatusDef['tone'], string> = {
  neutral: 'bg-neutral-100 text-neutral-600',
  active: 'bg-accent-soft text-accent',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-neutral-100 text-neutral-400 line-through',
}

export function StatusBadge({ defs, value }: { defs: StatusDef[]; value: string }) {
  const tone = defs.find((d) => d.value === value)?.tone ?? 'neutral'
  return (
    <span className={'rounded-full px-2.5 py-0.5 text-xs font-medium ' + TONE[tone]}>
      {statusLabel(defs, value)}
    </span>
  )
}
```

- [ ] **Step 2: NextActionCell**

Create `components/NextActionCell.tsx`:
```tsx
import { isToday, isOverdue } from '@/lib/client/dates'

export function NextActionCell({
  date,
  note,
}: {
  date: string | null
  note: string | null
}) {
  const today = isToday(date)
  const overdue = isOverdue(date)
  const text = note || (date ? date : '—')
  const cls = today || overdue ? 'text-accent font-semibold' : 'text-neutral-500'
  const prefix = today ? 'hoy · ' : overdue ? 'atrasado · ' : ''
  return <span className={cls}>{text === '—' ? '—' : prefix + text}</span>
}
```

- [ ] **Step 3: EntityTable genérica**

Create `components/EntityTable.tsx`:
```tsx
'use client'
import type { StatusDef } from '@/lib/client/status'
import { StatusBadge } from './StatusBadge'
import { NextActionCell } from './NextActionCell'

export type TableRow = {
  id: number
  company: string
  secondary: string | null // role (jobs) o vertical (leads)
  status: string
  priority: number
  starred: boolean
  next_action: string | null
  next_action_note: string | null
}

export function EntityTable({
  rows,
  statusDefs,
  onSelect,
}: {
  rows: TableRow[]
  statusDefs: StatusDef[]
  onSelect: (id: number) => void
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-neutral-400">
          <th className="px-3 py-2 font-medium">Empresa</th>
          <th className="px-3 py-2 font-medium">Estado</th>
          <th className="px-3 py-2 font-medium">Prioridad</th>
          <th className="px-3 py-2 font-medium">Próxima acción</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50"
          >
            <td className="px-3 py-2.5 font-medium">
              {r.starred && <span className="mr-1 text-accent">★</span>}
              {r.company}
              {r.secondary && (
                <span className="ml-2 text-xs text-neutral-400">{r.secondary}</span>
              )}
            </td>
            <td className="px-3 py-2.5">
              <StatusBadge defs={statusDefs} value={r.status} />
            </td>
            <td className="px-3 py-2.5 tabular-nums text-neutral-600">{r.priority}</td>
            <td className="px-3 py-2.5">
              <NextActionCell date={r.next_action} note={r.next_action_note} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 4: Página de leads con datos reales**

Replace `app/leads/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { EntityTable, type TableRow } from '@/components/EntityTable'
import { DetailDrawer } from '@/components/DetailDrawer'
import { LEAD_STATUSES } from '@/lib/client/status'
import { isToday } from '@/lib/client/dates'
import { api, type Lead } from '@/lib/client/api'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  async function reload() {
    setLeads(await api.listLeads())
  }
  useEffect(() => {
    reload()
  }, [])

  const rows: TableRow[] = leads.map((l) => ({
    id: l.id,
    company: l.company,
    secondary: l.vertical,
    status: l.pipeline_status,
    priority: l.priority,
    starred: l.starred,
    next_action: l.next_action,
    next_action_note: l.next_action_note,
  }))
  const todayCount = leads.filter((l) => isToday(l.next_action)).length

  return (
    <Shell todayCount={todayCount}>
      <EntityTable rows={rows} statusDefs={LEAD_STATUSES} onSelect={setSelectedId} />
      <DetailDrawer
        subjectType="lead"
        subjectId={selectedId}
        statusDefs={LEAD_STATUSES}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </Shell>
  )
}
```
Nota: `DetailDrawer` se crea en la Task 5; hasta entonces este import fallará al compilar. Implementar Task 5 antes de verificar esta página en navegador.

- [ ] **Step 5: tsc + commit**

Run: `npx tsc --noEmit` — habrá error por `DetailDrawer` aún inexistente; eso es esperado y se resuelve en la Task 5. NO comitear roto: implementar primero el StatusBadge/NextActionCell/EntityTable y dejar la página de leads conectada en la Task 5 junto al drawer.

Para esta task, commitea solo los 3 componentes de tabla (no la página):
```bash
git add components/StatusBadge.tsx components/NextActionCell.tsx components/EntityTable.tsx
git commit -m "feat(ui): componentes de tabla (badge, próxima acción, tabla genérica)"
```
Deja `app/leads/page.tsx` modificado en el working tree para commitear en la Task 5.

---

### Task 5: Drawer de detalle minimalista

**Files:**
- Create: `components/CollapsibleSection.tsx`
- Create: `components/DetailDrawer.tsx`
- Modify/commit: `app/leads/page.tsx` (de la Task 4)

- [ ] **Step 1: CollapsibleSection (Headless UI Disclosure)**

Create `components/CollapsibleSection.tsx`:
```tsx
'use client'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'

export function CollapsibleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Disclosure>
      <DisclosureButton className="w-full border-t border-neutral-100 py-2.5 text-left text-xs font-medium text-neutral-400 hover:text-neutral-600">
        {title}
      </DisclosureButton>
      <DisclosurePanel className="pb-3 text-sm text-neutral-700">
        {children}
      </DisclosurePanel>
    </Disclosure>
  )
}
```

- [ ] **Step 2: DetailDrawer (Dialog + Transition)**

Create `components/DetailDrawer.tsx`. A primera vista muestra solo: nombre (+★), estado, "qué toca hoy" y el panel de generar. Contacto/notas/historial van en `CollapsibleSection`. Carga el registro al abrir.

```tsx
'use client'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import type { StatusDef } from '@/lib/client/status'
import { statusLabel } from '@/lib/client/status'
import { NextActionCell } from './NextActionCell'
import { CollapsibleSection } from './CollapsibleSection'
import { GeneratePanel } from './GeneratePanel'
import { api, type Lead, type Job } from '@/lib/client/api'

type Subject = (Lead | Job) & { role?: string | null }

export function DetailDrawer({
  subjectType,
  subjectId,
  statusDefs,
  onClose,
  onChanged,
}: {
  subjectType: 'lead' | 'job'
  subjectId: number | null
  statusDefs: StatusDef[]
  onClose: () => void
  onChanged: () => void
}) {
  const open = subjectId != null
  const [record, setRecord] = useState<Subject | null>(null)

  useEffect(() => {
    if (subjectId == null) {
      setRecord(null)
      return
    }
    const load =
      subjectType === 'lead' ? api.getLead(subjectId) : api.getJob(subjectId)
    load.then((r) => setRecord(r as Subject))
  }, [subjectType, subjectId])

  const statusValue =
    record && ('pipeline_status' in record ? record.pipeline_status : record.status)

  return (
    <Transition show={open} appear>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/20" />
        </TransitionChild>
        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <TransitionChild
            enter="transform transition ease-out duration-200" enterFrom="translate-x-full" enterTo="translate-x-0"
            leave="transform transition ease-in duration-150" leaveFrom="translate-x-0" leaveTo="translate-x-full"
          >
            <DialogPanel className="h-full w-screen max-w-md overflow-y-auto bg-white p-6 shadow-xl">
              {record && (
                <div>
                  <div className="text-xl font-bold">
                    {record.company}
                    {record.starred && <span className="ml-1 text-accent">★</span>}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {statusLabel(statusDefs, statusValue as string)} · prioridad{' '}
                    {record.priority}
                  </div>
                  <div className="mt-4 text-sm">
                    <NextActionCell
                      date={record.next_action}
                      note={record.next_action_note}
                    />
                  </div>

                  <div className="mt-6">
                    <GeneratePanel
                      subjectType={subjectType}
                      subjectId={record.id}
                      onSaved={onChanged}
                    />
                  </div>

                  <div className="mt-6">
                    <CollapsibleSection title="Datos del contacto">
                      <div className="space-y-1">
                        <div>{record.contact_name ?? '—'}</div>
                        <div className="text-neutral-500">
                          {record.contact_role ?? ''}
                        </div>
                      </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Notas">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700">
                        {record.notes ?? '—'}
                      </pre>
                    </CollapsibleSection>
                  </div>
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
```
Nota: importa `GeneratePanel` (Task 6). Implementar Task 6 antes de compilar/commitear.

- [ ] **Step 3: Commit conjunto de drawer + página de leads + componentes de tabla pendientes**

Tras implementar también la Task 6 (GeneratePanel), `npx tsc --noEmit` debe quedar limpio. Entonces:
```bash
git add components/CollapsibleSection.tsx components/DetailDrawer.tsx app/leads/page.tsx
git commit -m "feat(ui): drawer de detalle minimalista con secciones plegables"
```

---

### Task 6: Panel de generación

**Files:**
- Create: `components/GeneratePanel.tsx`

- [ ] **Step 1: GeneratePanel**

Create `components/GeneratePanel.tsx`. Selector de plantilla (Headless UI Listbox), "instrucciones extra" plegado (Disclosure), botón Generar (naranja), resultado inline con Copiar/Regenerar. El guardado lo hace la propia ruta `/api/generate` (persiste en `generations`); este panel muestra el resultado y permite copiar.

```tsx
'use client'
import { useEffect, useState } from 'react'
import {
  Listbox, ListboxButton, ListboxOption, ListboxOptions,
  Disclosure, DisclosureButton, DisclosurePanel,
} from '@headlessui/react'
import { api, type Template } from '@/lib/client/api'

export function GeneratePanel({
  subjectType,
  subjectId,
  onSaved,
}: {
  subjectType: 'lead' | 'job'
  subjectId: number
  onSaved: () => void
}) {
  const wantedKind = subjectType === 'lead' ? 'outreach_email' : 'cover_letter'
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [extra, setExtra] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listTemplates().then((all) => {
      const filtered = all.filter((t) => t.kind === wantedKind)
      setTemplates(filtered)
      setTemplateId(filtered[0]?.id ?? null)
    })
  }, [wantedKind])

  async function generate() {
    if (templateId == null) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.generate({
        subjectType,
        subjectId,
        templateId,
        extraInstructions: extra.trim() || undefined,
      })
      setResult(res.content)
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const selected = templates.find((t) => t.id === templateId)

  return (
    <div className="rounded-xl bg-neutral-50 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        ⚡ Generar con Claude Code
      </div>
      <div className="flex items-center gap-2">
        <Listbox value={templateId} onChange={setTemplateId}>
          <div className="relative flex-1">
            <ListboxButton className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm">
              {selected?.name ?? 'Sin plantilla'}
            </ListboxButton>
            <ListboxOptions className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg">
              {templates.map((t) => (
                <ListboxOption
                  key={t.id}
                  value={t.id}
                  className="cursor-pointer px-3 py-2 data-[focus]:bg-neutral-100"
                >
                  {t.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
        <button
          onClick={generate}
          disabled={loading || templateId == null}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Generando…' : 'Generar'}
        </button>
      </div>

      <Disclosure>
        <DisclosureButton className="mt-2 text-xs text-neutral-400 hover:text-neutral-600">
          + instrucciones extra
        </DisclosureButton>
        <DisclosurePanel>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="p. ej. más corto, menciona su ronda reciente"
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </DisclosurePanel>
      </Disclosure>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {result && (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3 text-sm leading-relaxed text-neutral-800">
          <div className="whitespace-pre-wrap">{result}</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="rounded-md border border-neutral-200 px-3 py-1 text-xs"
            >
              Copiar
            </button>
            <button
              onClick={generate}
              className="rounded-md border border-neutral-200 px-3 py-1 text-xs"
            >
              Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: tsc limpio y commit**

Run: `npx tsc --noEmit`
Expected: limpio (ya existen GeneratePanel, DetailDrawer, página de leads).
```bash
git add components/GeneratePanel.tsx
git commit -m "feat(ui): panel de generación con plantilla, instrucciones extra y resultado"
```

- [ ] **Step 3: Verificación de navegador (manual rápida)**

Run dev server en background. `curl -s localhost:3000/leads | grep -o 'tocan hoy\|Empresa'` para confirmar que la tabla renderiza. Matar server. (La verificación visual completa con Playwright es la Task 8.)

---

### Task 7: Tabla y drawer de curros

**Files:**
- Modify: `app/jobs/page.tsx`

- [ ] **Step 1: Página de curros (reutiliza EntityTable + DetailDrawer)**

Replace `app/jobs/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/Shell'
import { EntityTable, type TableRow } from '@/components/EntityTable'
import { DetailDrawer } from '@/components/DetailDrawer'
import { JOB_STATUSES } from '@/lib/client/status'
import { isToday } from '@/lib/client/dates'
import { api, type Job } from '@/lib/client/api'

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  async function reload() {
    setJobs(await api.listJobs())
  }
  useEffect(() => {
    reload()
  }, [])

  const rows: TableRow[] = jobs.map((j) => ({
    id: j.id,
    company: j.company,
    secondary: j.role,
    status: j.status,
    priority: j.priority,
    starred: j.starred,
    next_action: j.next_action,
    next_action_note: j.next_action_note,
  }))
  const todayCount = jobs.filter((j) => isToday(j.next_action)).length

  return (
    <Shell todayCount={todayCount}>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aún no hay curros. Se añaden desde la API o se sembrarán más adelante.
        </p>
      ) : (
        <EntityTable rows={rows} statusDefs={JOB_STATUSES} onSelect={setSelectedId} />
      )}
      <DetailDrawer
        subjectType="job"
        subjectId={selectedId}
        statusDefs={JOB_STATUSES}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </Shell>
  )
}
```

- [ ] **Step 2: Sembrar un curro de ejemplo para poder verlo**

Para que la pestaña Curros no esté vacía en la demo, crea uno vía API con el dev server levantado:
```bash
curl -s -X POST localhost:3000/api/jobs -H 'content-type: application/json' \
  -d '{"company":"Ejemplo Remote","role":"Senior iOS Engineer","status":"applied","priority":7,"next_action_note":"seguir en 1 semana"}'
```
Expected: `{"id":...}`. (Es dato local en `lead-tracker.db`, no se commitea.)

- [ ] **Step 3: tsc + commit**

Run: `npx tsc --noEmit` (limpio) y `npm test` (los 14+ tests siguen verdes).
```bash
git add app/jobs/page.tsx
git commit -m "feat(ui): tabla y drawer de curros reutilizando componentes"
```

---

### Task 8: E2E de navegador con Playwright + screenshots

**Files:**
- Create: `e2e/ui.spec.ts`
- Modify: `playwright.config.ts` (añadir proyecto de navegador)

- [ ] **Step 1: Instalar el navegador de Playwright**

Run: `npx playwright install chromium`
Expected: descarga Chromium.

- [ ] **Step 2: Añadir proyecto de navegador a la config**

Modify `playwright.config.ts`: añade un segundo proyecto que use Chromium (manteniendo el proyecto `api` existente). Importa `devices` de `@playwright/test` y añade:
```ts
{ name: 'ui', use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' } },
```
Asegúrate de que `e2e/ui.spec.ts` corre bajo el proyecto `ui` y `e2e/api.spec.ts` bajo `api` (usa `testMatch` por proyecto o `grep`/carpetas). Mantén el `webServer` compartido.

- [ ] **Step 3: Test de UI con screenshots**

Create `e2e/ui.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('la home redirige a leads y muestra la tabla', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/leads/)
  await expect(page.getByText('Empresa')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  await page.screenshot({ path: 'test-results/leads-table.png', fullPage: true })
})

test('cambiar a la pestaña Curros', async ({ page }) => {
  await page.goto('/leads')
  await page.getByRole('link', { name: 'Curros' }).click()
  await expect(page).toHaveURL(/\/jobs/)
  await page.screenshot({ path: 'test-results/jobs-table.png', fullPage: true })
})

test('abrir el drawer de un lead muestra el botón Generar', async ({ page }) => {
  await page.goto('/leads')
  // primera fila de la tabla
  await page.locator('tbody tr').first().click()
  await expect(page.getByText('Generar')).toBeVisible()
  await expect(page.getByText('Generar con Claude Code')).toBeVisible()
  await page.screenshot({ path: 'test-results/lead-drawer.png' })
})
```

- [ ] **Step 4: Correr el E2E de UI**

Run: `npx playwright test --project=ui`
Expected: 3 tests PASS. Genera screenshots en `test-results/`.

- [ ] **Step 5: Verificación de regresión total**

Run: `npm test` (unit verdes) y `npx playwright test --project=api` (API verdes, generate skip).
Expected: todo verde.

- [ ] **Step 6: Commit**

```bash
git add e2e/ui.spec.ts playwright.config.ts
git commit -m "test(ui): E2E de navegador con screenshots"
```

---

## Cierre del Plan 2

Al terminar: app local navegable — tabla de clientes con foco en follow-ups, tabla de curros, drawer de detalle minimalista y generación de cover letters / outreach emails con un click, todo sobre la paleta de marca. Verificado con unit (Vitest), API (Playwright) y UI de navegador (Playwright + screenshots).

## Pendientes conocidos (post-Plan 2)
- Edición inline de campos del lead/curro (cambiar estado, fechas) desde el drawer — ahora el drawer es de lectura + generación. Añadir en una iteración.
- Crear lead/curro desde la UI (botón "+ Nuevo") — ahora se hace por API.
- Cablear el humanizer en la generación (hoy solo `STYLE_RULES` por env).
- Historial de generaciones en el drawer (la tabla `generations` ya lo guarda; falta una `CollapsibleSection` que lo liste vía un endpoint `GET /api/generations`).
