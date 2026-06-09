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
