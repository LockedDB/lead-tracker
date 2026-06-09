import fs from 'node:fs'
import path from 'node:path'
import type Database from 'better-sqlite3'

export function migrate(db: Database.Database): void {
  const sql = fs.readFileSync(path.join(process.cwd(), 'lib/db/schema.sql'), 'utf8')
  db.exec(sql)
}
