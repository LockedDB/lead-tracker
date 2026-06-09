# Lead Tracker — Plan 1: Fundación (backend/datos) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend local que importa los leads existentes desde markdown a SQLite y genera cover letters / outreach emails con un click vía Claude Code, todo detrás de una abstracción intercambiable, sin UI todavía.

**Architecture:** App Next.js (App Router) corriendo en localhost. SQLite (better-sqlite3) como dueño de los datos con 4 tablas (leads, jobs, templates, generations). Repositorios síncronos por entidad. La generación pasa por una interfaz `TextGenerator` con una implementación CLI (`claude -p`) seleccionable por env var. Rutas API exponen CRUD y generación.

**Tech Stack:** Next.js + TypeScript, better-sqlite3, gray-matter (parseo de frontmatter), Vitest (tests), tsx (scripts). Headless UI + Tailwind llegan en el Plan 2.

**Spec de referencia:** `docs/specs/2026-06-09-lead-tracker-design.md`

---

## Estructura de ficheros (se crea a lo largo del plan)

```
lib/
  db/
    connection.ts        # abre la conexión SQLite (singleton server-side)
    schema.sql           # DDL de las 4 tablas
    migrate.ts           # aplica schema.sql (idempotente)
  repos/
    leads.ts             # CRUD de leads
    jobs.ts              # CRUD de jobs
    templates.ts         # CRUD + seed de plantillas
    generations.ts       # guardar/listar generaciones
  templates/
    render.ts            # sustitución de placeholders {{key}}
  generation/
    types.ts             # TextGenerator, GenerationRequest, GenerationResult
    prompt.ts            # buildPrompt() puro
    claude-cli.ts        # ClaudeCliGenerator
    factory.ts           # createGenerator() según GENERATOR env
  import/
    parse-lead.ts        # markdown (frontmatter+body) -> LeadInput
app/
  api/
    leads/route.ts            # GET lista, POST crea
    leads/[id]/route.ts       # GET, PATCH, DELETE
    jobs/route.ts             # GET lista, POST crea
    jobs/[id]/route.ts        # GET, PATCH, DELETE
    templates/route.ts        # GET lista
    generate/route.ts         # POST genera
scripts/
  import-leads.ts        # ejecuta el importador sobre LEADS_DIR
tests/                   # tests Vitest espejo de lib/
```

Cada repositorio tiene una responsabilidad única sobre una tabla. La generación está aislada en `lib/generation/`. El parseo de import está separado del script que lo ejecuta para poder testearlo puro.

---

### Task 1: Scaffold del proyecto

**Files:**
- Create: estructura Next.js completa en `~/code/lead-tracker`
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Crear app Next.js en el repo existente**

Run:
```bash
cd ~/code/lead-tracker
npx create-next-app@latest . --typescript --eslint --app --no-src-dir --import-alias "@/*" --no-tailwind --use-npm
```
Si pregunta por sobreescribir ficheros existentes (`.gitignore`, `docs/`), elige conservar/mergear. `docs/` y `.git` no deben tocarse.
Expected: crea `app/`, `package.json`, `tsconfig.json`, `next.config.*`. (Tailwind se añade en el Plan 2.)

- [ ] **Step 2: Instalar dependencias del backend**

Run:
```bash
cd ~/code/lead-tracker
npm install better-sqlite3 gray-matter
npm install -D vitest @types/better-sqlite3 tsx
```
Expected: instala sin errores. `better-sqlite3` compila binario nativo (normal en Mac).

- [ ] **Step 3: Externalizar better-sqlite3 en Next**

`better-sqlite3` es un módulo nativo; Next intenta bundlearlo y falla. Hay que marcarlo como externo del servidor.

Modify `next.config.ts` (o `.mjs`) para que quede:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
```

- [ ] **Step 4: Configurar Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: Añadir scripts a package.json**

Modify `package.json` — en `"scripts"` añade:
```json
"test": "vitest run",
"test:watch": "vitest",
"import-leads": "tsx scripts/import-leads.ts"
```

- [ ] **Step 6: Smoke test del runner**

Create `tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runner funciona', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 7: Commit**

```bash
cd ~/code/lead-tracker
git add -A
git commit -m "chore: scaffold Next.js + Vitest + deps de backend"
```

---

### Task 2: Conexión SQLite + schema + migración

**Files:**
- Create: `lib/db/schema.sql`
- Create: `lib/db/connection.ts`
- Create: `lib/db/migrate.ts`
- Test: `tests/db/migrate.test.ts`

- [ ] **Step 1: Escribir el schema**

Create `lib/db/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  pipeline_status TEXT NOT NULL DEFAULT 'prospect',
  vertical TEXT,
  channel TEXT,
  priority INTEGER NOT NULL DEFAULT 5,
  starred INTEGER NOT NULL DEFAULT 0,
  first_contact TEXT,
  last_action TEXT,
  next_action TEXT,
  next_action_note TEXT,
  contact_name TEXT,
  contact_role TEXT,
  linkedin_url TEXT,
  app_user_axis TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  location TEXT,
  salary_range TEXT,
  job_url TEXT,
  source TEXT,
  priority INTEGER NOT NULL DEFAULT 5,
  starred INTEGER NOT NULL DEFAULT 0,
  applied_date TEXT,
  last_action TEXT,
  next_action TEXT,
  next_action_note TEXT,
  contact_name TEXT,
  contact_role TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL,
  subject_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  template_used TEXT,
  generator TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: Conexión**

Create `lib/db/connection.ts`:
```ts
import Database from 'better-sqlite3'
import path from 'node:path'

let instance: Database.Database | null = null

export function getDb(dbPath?: string): Database.Database {
  if (dbPath) {
    const db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    return db
  }
  if (!instance) {
    const file = process.env.DB_PATH ?? path.join(process.cwd(), 'lead-tracker.db')
    instance = new Database(file)
    instance.pragma('journal_mode = WAL')
  }
  return instance
}
```

- [ ] **Step 3: Migración**

Create `lib/db/migrate.ts`:
```ts
import fs from 'node:fs'
import path from 'node:path'
import type Database from 'better-sqlite3'

export function migrate(db: Database.Database): void {
  const sql = fs.readFileSync(path.join(process.cwd(), 'lib/db/schema.sql'), 'utf8')
  db.exec(sql)
}
```

- [ ] **Step 4: Escribir el test (falla)**

Create `tests/db/migrate.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'

describe('migrate', () => {
  it('crea las 4 tablas', () => {
    const db = getDb(':memory:')
    migrate(db)
    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[]
    const names = rows.map((r) => r.name)
    expect(names).toContain('leads')
    expect(names).toContain('jobs')
    expect(names).toContain('templates')
    expect(names).toContain('generations')
  })
})
```

Run: `npm test -- tests/db/migrate.test.ts`
Expected: FAIL (de momento pasa si todo el código de los steps previos está; si falla por `@/` alias en Vitest, ver Step 5).

- [ ] **Step 5: Habilitar el alias `@/` en Vitest si el test no resuelve imports**

Si el test falla con "Cannot find module '@/lib/...'", modifica `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
```

- [ ] **Step 6: Run test para verificar PASS**

Run: `npm test -- tests/db/migrate.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: schema SQLite y migración de las 4 tablas"
```

---

### Task 3: Repositorio de leads (CRUD)

**Files:**
- Create: `lib/repos/leads.ts`
- Test: `tests/repos/leads.test.ts`

- [ ] **Step 1: Escribir el test (falla)**

Create `tests/repos/leads.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { createLead, getLead, listLeads, updateLead, deleteLead } from '@/lib/repos/leads'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('leads repo', () => {
  it('crea y lee un lead', () => {
    const id = createLead(db, { company: 'Lyfta', priority: 9, starred: true })
    const lead = getLead(db, id)
    expect(lead?.company).toBe('Lyfta')
    expect(lead?.priority).toBe(9)
    expect(lead?.starred).toBe(true)
    expect(lead?.pipeline_status).toBe('prospect')
  })

  it('lista leads ordenados por prioridad desc', () => {
    createLead(db, { company: 'A', priority: 3 })
    createLead(db, { company: 'B', priority: 8 })
    const all = listLeads(db)
    expect(all.map((l) => l.company)).toEqual(['B', 'A'])
  })

  it('actualiza y borra', () => {
    const id = createLead(db, { company: 'C' })
    updateLead(db, id, { pipeline_status: 'contacted' })
    expect(getLead(db, id)?.pipeline_status).toBe('contacted')
    deleteLead(db, id)
    expect(getLead(db, id)).toBeUndefined()
  })
})
```

Run: `npm test -- tests/repos/leads.test.ts`
Expected: FAIL ("Cannot find module '@/lib/repos/leads'").

- [ ] **Step 2: Implementar el repositorio**

Create `lib/repos/leads.ts`:
```ts
import type Database from 'better-sqlite3'

export type Lead = {
  id: number
  company: string
  pipeline_status: string
  vertical: string | null
  channel: string | null
  priority: number
  starred: boolean
  first_contact: string | null
  last_action: string | null
  next_action: string | null
  next_action_note: string | null
  contact_name: string | null
  contact_role: string | null
  linkedin_url: string | null
  app_user_axis: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type LeadInput = Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>> & {
  company: string
}

const COLUMNS = [
  'company', 'pipeline_status', 'vertical', 'channel', 'priority', 'starred',
  'first_contact', 'last_action', 'next_action', 'next_action_note',
  'contact_name', 'contact_role', 'linkedin_url', 'app_user_axis', 'notes',
] as const

function toRow(input: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const col of COLUMNS) {
    if (col in input) {
      const v = input[col]
      row[col] = typeof v === 'boolean' ? (v ? 1 : 0) : v
    }
  }
  return row
}

function hydrate(row: any): Lead | undefined {
  if (!row) return undefined
  return { ...row, starred: !!row.starred }
}

export function createLead(db: Database.Database, input: LeadInput): number {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  const placeholders = cols.map((c) => `@${c}`).join(', ')
  const stmt = db.prepare(
    `INSERT INTO leads (${cols.join(', ')}) VALUES (${placeholders})`
  )
  const result = stmt.run(row)
  return Number(result.lastInsertRowid)
}

export function getLead(db: Database.Database, id: number): Lead | undefined {
  return hydrate(db.prepare('SELECT * FROM leads WHERE id = ?').get(id))
}

export function listLeads(db: Database.Database): Lead[] {
  const rows = db
    .prepare('SELECT * FROM leads ORDER BY priority DESC, company ASC')
    .all() as any[]
  return rows.map((r) => hydrate(r)!) as Lead[]
}

export function updateLead(
  db: Database.Database,
  id: number,
  input: Partial<LeadInput>
): void {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  if (cols.length === 0) return
  const assignments = cols.map((c) => `${c} = @${c}`).join(', ')
  db.prepare(
    `UPDATE leads SET ${assignments}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...row, id })
}

export function deleteLead(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM leads WHERE id = ?').run(id)
}
```

- [ ] **Step 3: Run test para verificar PASS**

Run: `npm test -- tests/repos/leads.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: repositorio de leads con CRUD"
```

---

### Task 4: Repositorio de jobs (CRUD)

**Files:**
- Create: `lib/repos/jobs.ts`
- Test: `tests/repos/jobs.test.ts`

- [ ] **Step 1: Escribir el test (falla)**

Create `tests/repos/jobs.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { createJob, getJob, listJobs, updateJob, deleteJob } from '@/lib/repos/jobs'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('jobs repo', () => {
  it('crea y lee un job', () => {
    const id = createJob(db, { company: 'Stripe', role: 'iOS Engineer', priority: 8 })
    const job = getJob(db, id)
    expect(job?.company).toBe('Stripe')
    expect(job?.role).toBe('iOS Engineer')
    expect(job?.status).toBe('saved')
  })

  it('actualiza estado y borra', () => {
    const id = createJob(db, { company: 'X' })
    updateJob(db, id, { status: 'applied' })
    expect(getJob(db, id)?.status).toBe('applied')
    deleteJob(db, id)
    expect(getJob(db, id)).toBeUndefined()
  })

  it('lista por prioridad desc', () => {
    createJob(db, { company: 'Low', priority: 2 })
    createJob(db, { company: 'High', priority: 9 })
    expect(listJobs(db).map((j) => j.company)).toEqual(['High', 'Low'])
  })
})
```

Run: `npm test -- tests/repos/jobs.test.ts`
Expected: FAIL ("Cannot find module '@/lib/repos/jobs'").

- [ ] **Step 2: Implementar el repositorio**

Create `lib/repos/jobs.ts`:
```ts
import type Database from 'better-sqlite3'

export type Job = {
  id: number
  company: string
  role: string | null
  status: string
  location: string | null
  salary_range: string | null
  job_url: string | null
  source: string | null
  priority: number
  starred: boolean
  applied_date: string | null
  last_action: string | null
  next_action: string | null
  next_action_note: string | null
  contact_name: string | null
  contact_role: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type JobInput = Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>> & {
  company: string
}

const COLUMNS = [
  'company', 'role', 'status', 'location', 'salary_range', 'job_url', 'source',
  'priority', 'starred', 'applied_date', 'last_action', 'next_action',
  'next_action_note', 'contact_name', 'contact_role', 'notes',
] as const

function toRow(input: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const col of COLUMNS) {
    if (col in input) {
      const v = input[col]
      row[col] = typeof v === 'boolean' ? (v ? 1 : 0) : v
    }
  }
  return row
}

function hydrate(row: any): Job | undefined {
  if (!row) return undefined
  return { ...row, starred: !!row.starred }
}

export function createJob(db: Database.Database, input: JobInput): number {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  const placeholders = cols.map((c) => `@${c}`).join(', ')
  const result = db
    .prepare(`INSERT INTO jobs (${cols.join(', ')}) VALUES (${placeholders})`)
    .run(row)
  return Number(result.lastInsertRowid)
}

export function getJob(db: Database.Database, id: number): Job | undefined {
  return hydrate(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id))
}

export function listJobs(db: Database.Database): Job[] {
  const rows = db
    .prepare('SELECT * FROM jobs ORDER BY priority DESC, company ASC')
    .all() as any[]
  return rows.map((r) => hydrate(r)!) as Job[]
}

export function updateJob(
  db: Database.Database,
  id: number,
  input: Partial<JobInput>
): void {
  const row = toRow(input as Record<string, unknown>)
  const cols = Object.keys(row)
  if (cols.length === 0) return
  const assignments = cols.map((c) => `${c} = @${c}`).join(', ')
  db.prepare(
    `UPDATE jobs SET ${assignments}, updated_at = datetime('now') WHERE id = @id`
  ).run({ ...row, id })
}

export function deleteJob(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id)
}
```

- [ ] **Step 3: Run test para verificar PASS**

Run: `npm test -- tests/repos/jobs.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: repositorio de jobs con CRUD"
```

---

### Task 5: Plantillas — repositorio, seed y renderizado

**Files:**
- Create: `lib/templates/render.ts`
- Create: `lib/repos/templates.ts`
- Test: `tests/templates/render.test.ts`
- Test: `tests/repos/templates.test.ts`

- [ ] **Step 1: Test del renderizado (falla)**

Create `tests/templates/render.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { renderTemplate } from '@/lib/templates/render'

describe('renderTemplate', () => {
  it('sustituye placeholders', () => {
    const out = renderTemplate('Hola {{company}}, rol {{role}}', {
      company: 'Lyfta',
      role: 'iOS',
    })
    expect(out).toBe('Hola Lyfta, rol iOS')
  })

  it('placeholder sin valor queda vacío', () => {
    expect(renderTemplate('X {{missing}} Y', {})).toBe('X  Y')
  })
})
```

Run: `npm test -- tests/templates/render.test.ts`
Expected: FAIL ("Cannot find module '@/lib/templates/render'").

- [ ] **Step 2: Implementar render**

Create `lib/templates/render.ts`:
```ts
export function renderTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key]
    return v === undefined || v === null ? '' : String(v)
  })
}
```

Run: `npm test -- tests/templates/render.test.ts`
Expected: PASS.

- [ ] **Step 3: Test del repositorio de plantillas (falla)**

Create `tests/repos/templates.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { seedTemplates, listTemplates } from '@/lib/repos/templates'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('templates repo', () => {
  it('seed inserta una plantilla de cada kind y es idempotente', () => {
    seedTemplates(db)
    seedTemplates(db)
    const all = listTemplates(db)
    const kinds = all.map((t) => t.kind).sort()
    expect(kinds).toContain('outreach_email')
    expect(kinds).toContain('cover_letter')
    expect(all.length).toBe(2)
  })
})
```

Run: `npm test -- tests/repos/templates.test.ts`
Expected: FAIL ("Cannot find module '@/lib/repos/templates'").

- [ ] **Step 4: Implementar repositorio de plantillas**

Create `lib/repos/templates.ts`:
```ts
import type Database from 'better-sqlite3'

export type Template = {
  id: number
  kind: 'outreach_email' | 'cover_letter'
  name: string
  body: string
  updated_at: string
}

const SEED: Omit<Template, 'id' | 'updated_at'>[] = [
  {
    kind: 'outreach_email',
    name: 'Outreach email — primer toque',
    body: [
      'Escribe el primer mensaje de outreach a {{company}}.',
      'Contacto: {{contact_name}} ({{contact_role}}). Vertical: {{vertical}}.',
      'Empieza por la hipótesis empática sobre el founder, no por presentarme.',
      'La identidad (iOS/React Native dev) va comprimida y al final.',
    ].join('\n'),
  },
  {
    kind: 'cover_letter',
    name: 'Cover letter — base',
    body: [
      'Escribe una cover letter para el puesto {{role}} en {{company}}.',
      'Ubicación: {{location}}. Enlace de la oferta: {{job_url}}.',
      'Tono directo y honesto, sin humo.',
    ].join('\n'),
  },
]

export function seedTemplates(db: Database.Database): void {
  const insert = db.prepare(
    'INSERT INTO templates (kind, name, body) VALUES (@kind, @name, @body)'
  )
  const exists = db.prepare('SELECT 1 FROM templates WHERE kind = ? AND name = ?')
  const tx = db.transaction(() => {
    for (const t of SEED) {
      if (!exists.get(t.kind, t.name)) insert.run(t)
    }
  })
  tx()
}

export function listTemplates(db: Database.Database): Template[] {
  return db.prepare('SELECT * FROM templates ORDER BY kind, name').all() as Template[]
}

export function getTemplate(db: Database.Database, id: number): Template | undefined {
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as
    | Template
    | undefined
}
```

- [ ] **Step 5: Run test para verificar PASS**

Run: `npm test -- tests/repos/templates.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: plantillas con render, seed idempotente y listado"
```

---

### Task 6: Repositorio de generations

**Files:**
- Create: `lib/repos/generations.ts`
- Test: `tests/repos/generations.test.ts`

- [ ] **Step 1: Escribir el test (falla)**

Create `tests/repos/generations.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import type Database from 'better-sqlite3'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { saveGeneration, listGenerations } from '@/lib/repos/generations'

let db: Database.Database
beforeEach(() => {
  db = getDb(':memory:')
  migrate(db)
})

describe('generations repo', () => {
  it('guarda y lista por sujeto, más reciente primero', () => {
    saveGeneration(db, {
      subject_type: 'lead', subject_id: 1, kind: 'outreach_email',
      content: 'primero', template_used: 'X', generator: 'cli',
    })
    saveGeneration(db, {
      subject_type: 'lead', subject_id: 1, kind: 'outreach_email',
      content: 'segundo', template_used: 'X', generator: 'cli',
    })
    saveGeneration(db, {
      subject_type: 'job', subject_id: 1, kind: 'cover_letter',
      content: 'otra', template_used: 'Y', generator: 'cli',
    })
    const forLead = listGenerations(db, 'lead', 1)
    expect(forLead.length).toBe(2)
    expect(forLead[0].content).toBe('segundo')
  })
})
```

Run: `npm test -- tests/repos/generations.test.ts`
Expected: FAIL ("Cannot find module '@/lib/repos/generations'").

- [ ] **Step 2: Implementar el repositorio**

Create `lib/repos/generations.ts`:
```ts
import type Database from 'better-sqlite3'

export type Generation = {
  id: number
  subject_type: 'lead' | 'job'
  subject_id: number
  kind: 'outreach_email' | 'cover_letter'
  content: string
  template_used: string | null
  generator: 'cli' | 'api'
  created_at: string
}

export type GenerationInput = Omit<Generation, 'id' | 'created_at'>

export function saveGeneration(db: Database.Database, input: GenerationInput): number {
  const result = db
    .prepare(
      `INSERT INTO generations
       (subject_type, subject_id, kind, content, template_used, generator)
       VALUES (@subject_type, @subject_id, @kind, @content, @template_used, @generator)`
    )
    .run(input)
  return Number(result.lastInsertRowid)
}

export function listGenerations(
  db: Database.Database,
  subjectType: 'lead' | 'job',
  subjectId: number
): Generation[] {
  return db
    .prepare(
      `SELECT * FROM generations
       WHERE subject_type = ? AND subject_id = ?
       ORDER BY id DESC`
    )
    .all(subjectType, subjectId) as Generation[]
}
```

- [ ] **Step 3: Run test para verificar PASS**

Run: `npm test -- tests/repos/generations.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: repositorio de generations con historial por sujeto"
```

---

### Task 7: Abstracción TextGenerator + generador CLI + factory

**Files:**
- Create: `lib/generation/types.ts`
- Create: `lib/generation/prompt.ts`
- Create: `lib/generation/claude-cli.ts`
- Create: `lib/generation/factory.ts`
- Test: `tests/generation/prompt.test.ts`
- Test: `tests/generation/claude-cli.test.ts`

- [ ] **Step 1: Definir tipos**

Create `lib/generation/types.ts`:
```ts
export type GenerationKind = 'cover_letter' | 'outreach_email'

export type GenerationSubject = {
  subjectType: 'lead' | 'job'
  fields: Record<string, unknown>
}

export type GenerationRequest = {
  kind: GenerationKind
  subject: GenerationSubject
  template: string
  extraInstructions?: string
  rules?: string
}

export type GenerationResult = {
  content: string
  generator: 'cli' | 'api'
}

export interface TextGenerator {
  generate(req: GenerationRequest): Promise<GenerationResult>
}
```

- [ ] **Step 2: Test del prompt builder (falla)**

Create `tests/generation/prompt.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildPrompt } from '@/lib/generation/prompt'

describe('buildPrompt', () => {
  it('incluye plantilla, contexto, instrucciones extra y reglas', () => {
    const prompt = buildPrompt({
      kind: 'outreach_email',
      subject: { subjectType: 'lead', fields: { company: 'Lyfta', priority: 9 } },
      template: 'Escribe a {{company}}',
      extraInstructions: 'más corto',
      rules: 'NO em dashes',
    })
    expect(prompt).toContain('Lyfta')
    expect(prompt).toContain('Escribe a {{company}}')
    expect(prompt).toContain('más corto')
    expect(prompt).toContain('NO em dashes')
  })

  it('omite secciones vacías', () => {
    const prompt = buildPrompt({
      kind: 'cover_letter',
      subject: { subjectType: 'job', fields: { company: 'Stripe' } },
      template: 'X',
    })
    expect(prompt).not.toContain('Instrucciones extra')
    expect(prompt).not.toContain('Reglas de estilo')
  })
})
```

Run: `npm test -- tests/generation/prompt.test.ts`
Expected: FAIL ("Cannot find module '@/lib/generation/prompt'").

- [ ] **Step 3: Implementar el prompt builder**

Create `lib/generation/prompt.ts`:
```ts
import type { GenerationRequest } from './types'

export function buildPrompt(req: GenerationRequest): string {
  const contextLines = Object.entries(req.subject.fields)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  const sections: string[] = [
    `Eres el asistente de redacción de Daniel Benet. Genera un ${req.kind === 'cover_letter' ? 'cover letter' : 'outreach email'} en español de España.`,
    `Contexto del ${req.subject.subjectType === 'lead' ? 'cliente' : 'puesto'}:\n${contextLines}`,
    `Plantilla / instrucciones base:\n${req.template}`,
  ]

  if (req.extraInstructions?.trim()) {
    sections.push(`Instrucciones extra del usuario:\n${req.extraInstructions.trim()}`)
  }
  if (req.rules?.trim()) {
    sections.push(`Reglas de estilo de obligado cumplimiento:\n${req.rules.trim()}`)
  }

  sections.push('Devuelve solo el texto final, sin preámbulos ni explicaciones.')
  return sections.join('\n\n')
}
```

Run: `npm test -- tests/generation/prompt.test.ts`
Expected: PASS.

- [ ] **Step 4: Test del generador CLI con runner inyectado (falla)**

Create `tests/generation/claude-cli.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ClaudeCliGenerator } from '@/lib/generation/claude-cli'

describe('ClaudeCliGenerator', () => {
  it('pasa el prompt al runner y devuelve el contenido', async () => {
    let received = ''
    const gen = new ClaudeCliGenerator(async (prompt) => {
      received = prompt
      return '  texto generado  '
    })
    const result = await gen.generate({
      kind: 'outreach_email',
      subject: { subjectType: 'lead', fields: { company: 'Lyfta' } },
      template: 'Escribe a {{company}}',
    })
    expect(received).toContain('Lyfta')
    expect(result.content).toBe('texto generado')
    expect(result.generator).toBe('cli')
  })
})
```

Run: `npm test -- tests/generation/claude-cli.test.ts`
Expected: FAIL ("Cannot find module '@/lib/generation/claude-cli'").

- [ ] **Step 5: Implementar el generador CLI**

Create `lib/generation/claude-cli.ts`:
```ts
import { spawn } from 'node:child_process'
import type { GenerationRequest, GenerationResult, TextGenerator } from './types'
import { buildPrompt } from './prompt'

export type CliRunner = (prompt: string) => Promise<string>

// Ejecuta `claude -p` pasando el prompt por stdin. -p (--print) corre Claude Code
// en modo no interactivo y escribe la respuesta a stdout.
const defaultRunner: CliRunner = (prompt) =>
  new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (err += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(`claude -p salió con código ${code}: ${err}`))
    })
    child.stdin.write(prompt)
    child.stdin.end()
  })

export class ClaudeCliGenerator implements TextGenerator {
  constructor(private readonly run: CliRunner = defaultRunner) {}

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const prompt = buildPrompt(req)
    const raw = await this.run(prompt)
    return { content: raw.trim(), generator: 'cli' }
  }
}
```

Run: `npm test -- tests/generation/claude-cli.test.ts`
Expected: PASS.

- [ ] **Step 6: Implementar el factory**

Create `lib/generation/factory.ts`:
```ts
import type { TextGenerator } from './types'
import { ClaudeCliGenerator } from './claude-cli'

// Cambiar de proveedor = cambiar la env var GENERATOR. La implementación 'api'
// (AnthropicApiGenerator) se añadirá implementando la misma interfaz TextGenerator.
export function createGenerator(): TextGenerator {
  const kind = process.env.GENERATOR ?? 'cli'
  switch (kind) {
    case 'cli':
      return new ClaudeCliGenerator()
    default:
      throw new Error(`GENERATOR no soportado: ${kind}`)
  }
}
```

- [ ] **Step 7: Run de toda la suite de generation**

Run: `npm test -- tests/generation`
Expected: PASS (prompt + claude-cli).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: abstracción TextGenerator con generador CLI y factory por env"
```

---

### Task 8: Importador de leads desde markdown

**Files:**
- Create: `lib/import/parse-lead.ts`
- Create: `scripts/import-leads.ts`
- Test: `tests/import/parse-lead.test.ts`

- [ ] **Step 1: Test del parser (falla)**

Create `tests/import/parse-lead.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseLeadMarkdown } from '@/lib/import/parse-lead'

const SAMPLE = `---
kind: lead
razon_social: Activate Personal Training Barcelona
pipeline_status: prospect
vertical: fitness
channel: instagram
priority: 7
starred: false
last_action: 2026-05-15
next_action_note: research pendiente
app_user_axis: b2c
tags:
  - lead
  - captacion
---

# Activate Personal Training

Track: greenfield — booking de personal training.
`

describe('parseLeadMarkdown', () => {
  it('mapea frontmatter y body a LeadInput', () => {
    const lead = parseLeadMarkdown(SAMPLE, 'Activate Personal Training.md')
    expect(lead.company).toBe('Activate Personal Training')
    expect(lead.pipeline_status).toBe('prospect')
    expect(lead.vertical).toBe('fitness')
    expect(lead.channel).toBe('instagram')
    expect(lead.priority).toBe(7)
    expect(lead.starred).toBe(false)
    expect(lead.app_user_axis).toBe('b2c')
    expect(lead.notes).toContain('Track: greenfield')
  })

  it('usa el nombre de fichero como company si no hay heading', () => {
    const lead = parseLeadMarkdown('---\nkind: lead\n---\n\nsolo body', 'Drimer.md')
    expect(lead.company).toBe('Drimer')
  })
})
```

Run: `npm test -- tests/import/parse-lead.test.ts`
Expected: FAIL ("Cannot find module '@/lib/import/parse-lead'").

- [ ] **Step 2: Implementar el parser**

Create `lib/import/parse-lead.ts`:
```ts
import matter from 'gray-matter'
import path from 'node:path'
import type { LeadInput } from '@/lib/repos/leads'

export function parseLeadMarkdown(raw: string, filename: string): LeadInput {
  const { data, content } = matter(raw)
  const body = content.trim()

  const headingMatch = body.match(/^#\s+(.+)$/m)
  const fileBase = path.basename(filename, '.md')
  const company = (data.razon_social as string) || headingMatch?.[1]?.trim() || fileBase

  return {
    company,
    pipeline_status: (data.pipeline_status as string) || 'prospect',
    vertical: (data.vertical as string) ?? null,
    channel: (data.channel as string) ?? null,
    priority: typeof data.priority === 'number' ? data.priority : 5,
    starred: data.starred === true,
    first_contact: normalizeDate(data.first_contact),
    last_action: normalizeDate(data.last_action),
    next_action: normalizeDate(data.next_action),
    next_action_note: (data.next_action_note as string) ?? null,
    contact_name: (data.contact_name as string) ?? null,
    contact_role: (data.contact_role as string) ?? null,
    linkedin_url: (data.linkedin_url as string) ?? null,
    app_user_axis: (data.app_user_axis as string) ?? null,
    notes: body || null,
  }
}

function normalizeDate(v: unknown): string | null {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}
```

Run: `npm test -- tests/import/parse-lead.test.ts`
Expected: PASS.

- [ ] **Step 3: Script de importación**

Create `scripts/import-leads.ts`:
```ts
import fs from 'node:fs'
import path from 'node:path'
import { getDb } from '@/lib/db/connection'
import { migrate } from '@/lib/db/migrate'
import { createLead, listLeads } from '@/lib/repos/leads'
import { parseLeadMarkdown } from '@/lib/import/parse-lead'

const LEADS_DIR =
  process.env.LEADS_DIR ??
  '/Users/daniel-benet/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault/Projects/atelier/leads'

function main() {
  const db = getDb()
  migrate(db)

  const files = fs
    .readdirSync(LEADS_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'CLAUDE.md')

  let imported = 0
  for (const file of files) {
    const raw = fs.readFileSync(path.join(LEADS_DIR, file), 'utf8')
    const lead = parseLeadMarkdown(raw, file)
    if (!lead.company.trim()) continue
    createLead(db, lead)
    imported++
  }

  console.log(`Importados ${imported} leads. Total en DB: ${listLeads(db).length}`)
}

main()
```

- [ ] **Step 4: Configurar tsx para resolver el alias `@/`**

Create `tsconfig.scripts.json` (tsx lee `paths` de tsconfig; aseguramos el alias):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "paths": { "@/*": ["./*"] }
  }
}
```
Modify `package.json` script `import-leads` a:
```json
"import-leads": "tsx --tsconfig tsconfig.scripts.json scripts/import-leads.ts"
```

- [ ] **Step 5: Ejecutar el importador (verificación real)**

Run: `npm run import-leads`
Expected: imprime `Importados N leads...` con N ≈ 50 (el número real de ficheros en `leads/`). Crea `lead-tracker.db` en la raíz.

- [ ] **Step 6: Verificar el contenido importado**

Run:
```bash
node -e "const d=require('better-sqlite3')('lead-tracker.db'); console.log(d.prepare('SELECT company, pipeline_status, priority FROM leads ORDER BY priority DESC LIMIT 5').all())"
```
Expected: lista de 5 leads reales con sus prioridades.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: importador de leads markdown -> SQLite"
```

---

### Task 9: Rutas API (leads, jobs, templates, generate)

**Files:**
- Create: `lib/db/bootstrap.ts`
- Create: `app/api/leads/route.ts`
- Create: `app/api/leads/[id]/route.ts`
- Create: `app/api/jobs/route.ts`
- Create: `app/api/jobs/[id]/route.ts`
- Create: `app/api/templates/route.ts`
- Create: `app/api/generate/route.ts`

- [ ] **Step 1: Bootstrap de DB para el runtime de Next**

Create `lib/db/bootstrap.ts`:
```ts
import { getDb } from './connection'
import { migrate } from './migrate'
import { seedTemplates } from '@/lib/repos/templates'

let ready = false

export function db() {
  const d = getDb()
  if (!ready) {
    migrate(d)
    seedTemplates(d)
    ready = true
  }
  return d
}
```

- [ ] **Step 2: Ruta de colección de leads**

Create `app/api/leads/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { listLeads, createLead } from '@/lib/repos/leads'

export async function GET() {
  return NextResponse.json(listLeads(db()))
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.company) {
    return NextResponse.json({ error: 'company es obligatorio' }, { status: 400 })
  }
  const id = createLead(db(), body)
  return NextResponse.json({ id }, { status: 201 })
}
```

- [ ] **Step 3: Ruta de lead individual**

Create `app/api/leads/[id]/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { getLead, updateLead, deleteLead } from '@/lib/repos/leads'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = getLead(db(), Number(id))
  if (!lead) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  updateLead(db(), Number(id), body)
  return NextResponse.json(getLead(db(), Number(id)))
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  deleteLead(db(), Number(id))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Rutas de jobs (colección e individual)**

Create `app/api/jobs/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { listJobs, createJob } from '@/lib/repos/jobs'

export async function GET() {
  return NextResponse.json(listJobs(db()))
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.company) {
    return NextResponse.json({ error: 'company es obligatorio' }, { status: 400 })
  }
  const id = createJob(db(), body)
  return NextResponse.json({ id }, { status: 201 })
}
```

Create `app/api/jobs/[id]/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { getJob, updateJob, deleteJob } from '@/lib/repos/jobs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = getJob(db(), Number(id))
  if (!job) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  updateJob(db(), Number(id), body)
  return NextResponse.json(getJob(db(), Number(id)))
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  deleteJob(db(), Number(id))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Ruta de plantillas**

Create `app/api/templates/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { listTemplates } from '@/lib/repos/templates'

export async function GET() {
  return NextResponse.json(listTemplates(db()))
}
```

- [ ] **Step 6: Ruta de generación**

Create `app/api/generate/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { createGenerator } from '@/lib/generation/factory'
import { getTemplate } from '@/lib/repos/templates'
import { getLead } from '@/lib/repos/leads'
import { getJob } from '@/lib/repos/jobs'
import { saveGeneration } from '@/lib/repos/generations'
import type { GenerationKind } from '@/lib/generation/types'

export async function POST(req: Request) {
  const { subjectType, subjectId, templateId, extraInstructions } = await req.json()
  const conn = db()

  const template = getTemplate(conn, Number(templateId))
  if (!template) return NextResponse.json({ error: 'plantilla no encontrada' }, { status: 400 })

  const record =
    subjectType === 'lead' ? getLead(conn, Number(subjectId)) : getJob(conn, Number(subjectId))
  if (!record) return NextResponse.json({ error: 'registro no encontrado' }, { status: 404 })

  const generator = createGenerator()
  const result = await generator.generate({
    kind: template.kind as GenerationKind,
    subject: { subjectType, fields: record as Record<string, unknown> },
    template: template.body,
    extraInstructions,
    rules: process.env.STYLE_RULES,
  })

  const id = saveGeneration(conn, {
    subject_type: subjectType,
    subject_id: Number(subjectId),
    kind: template.kind as GenerationKind,
    content: result.content,
    template_used: template.name,
    generator: result.generator,
  })

  return NextResponse.json({ id, content: result.content, generator: result.generator })
}
```

- [ ] **Step 7: Verificar las rutas CRUD con el servidor real**

Run (terminal 1): `npm run dev`
Run (terminal 2):
```bash
curl -s localhost:3000/api/leads | head -c 300
curl -s localhost:3000/api/templates
```
Expected: `/api/leads` devuelve un array JSON con los leads importados; `/api/templates` devuelve las 2 plantillas seed.

- [ ] **Step 8: Verificar la generación end-to-end**

Pre-requisito: `claude` instalado y logueado en la máquina.
Run:
```bash
curl -s -X POST localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d '{"subjectType":"lead","subjectId":1,"templateId":1}' | head -c 500
```
Expected: JSON con `content` (texto generado por Claude Code) y `generator: "cli"`. Verifica que la generación quedó guardada:
```bash
node -e "const d=require('better-sqlite3')('lead-tracker.db'); console.log(d.prepare('SELECT id, kind, generator, substr(content,1,60) c FROM generations').all())"
```
Expected: al menos una fila.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: rutas API de leads, jobs, templates y generación"
```

---

## Cierre del Plan 1

Al terminar tienes: DB con tus ~50 leads importados, plantillas seed, generación funcionando vía Claude Code detrás de la abstracción, y una API completa — todo verificable con tests y `curl`. El **Plan 2 (UI)** monta encima de esta API: shell con tabs, tabla con foco en follow-ups, drawer de detalle y el flujo de generación con Headless UI + Tailwind.

## Notas de implementación

- **`STYLE_RULES`:** la generación de outreach debe respetar `references/text-prohibitions.md` del vault. En v1 se inyecta vía la env var `STYLE_RULES` (el contenido de esas reglas como texto). En el Plan 2 / iteración se puede leer del fichero directamente. Documentar en un `.env.local.example`.
- **better-sqlite3 es server-only:** nunca importar `lib/db/*` ni `lib/repos/*` desde componentes cliente. Solo desde rutas API y scripts.
- **`claude -p`:** si el binario no se llama `claude` o necesita flags extra en esta máquina, el único punto a tocar es `defaultRunner` en `lib/generation/claude-cli.ts`.
