import fs from 'node:fs'
import path from 'node:path'
import type Database from 'better-sqlite3'

export function migrate(db: Database.Database): void {
  const sql = fs.readFileSync(path.join(process.cwd(), 'lib/db/schema.sql'), 'utf8')
  db.exec(sql)
  ensureSortOrder(db, 'leads')
  ensureSortOrder(db, 'jobs')
  dropColumn(db, 'leads', 'priority')
  dropColumn(db, 'jobs', 'priority')
  addColumnIfMissing(db, 'leads', 'about', 'TEXT')
  addColumnIfMissing(db, 'jobs', 'about', 'TEXT')
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return cols.some((c) => c.name === column)
}

// schema.sql es CREATE TABLE IF NOT EXISTS, así que no añade columnas a tablas ya
// creadas. Para DBs preexistentes metemos sort_order a mano y la sembramos con el
// orden alfabético para que el reparto inicial sea estable.
function ensureSortOrder(db: Database.Database, table: string): void {
  if (hasColumn(db, table, 'sort_order')) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`)
  const rows = db
    .prepare(`SELECT id FROM ${table} ORDER BY company ASC`)
    .all() as { id: number }[]
  const upd = db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`)
  const seed = db.transaction((list: { id: number }[]) => {
    list.forEach((r, i) => upd.run(i, r.id))
  })
  seed(rows)
}

function dropColumn(db: Database.Database, table: string, column: string): void {
  if (!hasColumn(db, table, column)) return
  db.exec(`ALTER TABLE ${table} DROP COLUMN ${column}`)
}

// schema.sql es CREATE TABLE IF NOT EXISTS: no añade columnas a tablas ya creadas.
// Para DBs preexistentes hay que añadir las nuevas columnas a mano.
function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  type: string
): void {
  if (hasColumn(db, table, column)) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
}
