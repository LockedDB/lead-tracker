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
