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
  let skipped = 0
  for (const file of files) {
    const raw = fs.readFileSync(path.join(LEADS_DIR, file), 'utf8')
    let lead
    try {
      lead = parseLeadMarkdown(raw, file)
    } catch (err) {
      skipped++
      console.warn(`Saltado ${file}: ${(err as Error).message.split('\n')[0]}`)
      continue
    }
    if (!lead.company.trim()) continue
    createLead(db, lead)
    imported++
  }

  const suffix = skipped > 0 ? ` (${skipped} saltados por frontmatter inválido)` : ''
  console.log(
    `Importados ${imported} leads. Total en DB: ${listLeads(db).length}${suffix}`
  )
}

main()
