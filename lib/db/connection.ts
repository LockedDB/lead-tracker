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
