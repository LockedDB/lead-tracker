import type { Lead } from '@/lib/repos/leads'
import { todayISO } from '@/lib/client/dates'

// Estados que cuentan como "ya contactado" → susceptibles de follow-up.
// `prospect` es primer contacto (no follow-up) y los cerrados quedan fuera.
export const FOLLOWUP_STATUSES = [
  'contacted',
  'replied',
  'in_conversation',
  'call_scheduled',
  'proposal_sent',
  'ghosted',
] as const

// Warmth = cercanía al cierre. No deriva de `statusRank` porque `ghosted` va último
// en el embudo pero es frío, no caliente: necesita su propio peso bajo.
const WARMTH: Record<string, number> = {
  proposal_sent: 100,
  call_scheduled: 95,
  in_conversation: 85,
  replied: 80,
  contacted: 50,
  ghosted: 20,
}

// Días desde la última acción antes de que toque el siguiente toque.
// Consenso outbound B2B: más apretado cuanto más caliente; `ghosted` = un único
// intento de revival tardío.
const CADENCE_DAYS: Record<string, number> = {
  replied: 1,
  in_conversation: 2,
  call_scheduled: 2,
  proposal_sent: 2,
  contacted: 3,
  ghosted: 30,
}

const STARRED_BONUS = 15
const NEXT_ACTION_BONUS = 10
const MAX_OVERDUE_BONUS_DAYS = 14

export type FollowupItem = {
  lead: Lead
  due: boolean
  needsDate: boolean
  daysSince: number | null
  nextDue: string | null
  score: number
  reason: string
}

export type FollowupQueue = {
  due: FollowupItem[]
  upcoming: FollowupItem[]
  needsDate: FollowupItem[]
}

function diffDays(fromISO: string, toISO: string): number {
  const a = Date.parse(fromISO.slice(0, 10) + 'T00:00:00Z')
  const b = Date.parse(toISO.slice(0, 10) + 'T00:00:00Z')
  return Math.round((b - a) / 86400000)
}

function addDays(iso: string, days: number): string {
  const t = Date.parse(iso.slice(0, 10) + 'T00:00:00Z') + days * 86400000
  return new Date(t).toISOString().slice(0, 10)
}

export function scoreFollowup(lead: Lead, today = todayISO()): FollowupItem {
  const status = lead.pipeline_status
  const warmth = WARMTH[status] ?? 0
  const cadence = CADENCE_DAYS[status] ?? 7
  const lastTouch = lead.last_action || lead.first_contact || null
  const daysSince = lastTouch ? diffDays(lastTouch, today) : null

  const nextAction = lead.next_action ? lead.next_action.slice(0, 10) : null
  const nextActionDue = nextAction != null && nextAction <= today

  // Sin ninguna fecha (ni último toque, ni primer contacto, ni próxima acción) no hay
  // señal temporal: no es urgente, es un registro incompleto. No se rankea con los
  // vencidos; va a su propio bucket de higiene de datos.
  if (!lastTouch && !nextAction) {
    return {
      lead,
      due: false,
      needsDate: true,
      daysSince: null,
      nextDue: null,
      score: 0,
      reason: 'Falta fecha — anota el último toque o programa una próxima acción',
    }
  }

  let due: boolean
  let nextDue: string | null
  let reason: string

  if (nextActionDue) {
    due = true
    nextDue = nextAction
    const note = lead.next_action_note?.trim()
    reason = note
      ? `Acción pendiente: ${note}`
      : nextAction === today
        ? 'Acción programada para hoy'
        : 'Acción vencida'
  } else if (lastTouch && daysSince != null) {
    due = daysSince >= cadence
    nextDue = addDays(lastTouch, cadence)
    reason =
      status === 'ghosted'
        ? due
          ? `Ghosteado hace ${daysSince}d — intento de revival`
          : `Ghosteado hace ${daysSince}d`
        : due
          ? `${daysSince}d sin tocar (cadencia ${cadence}d)`
          : `Tocado hace ${daysSince}d`
  } else {
    // sin último toque pero con próxima acción futura: programado, no vencido
    due = false
    nextDue = nextAction
    reason = `Programado para ${nextAction}`
  }

  let score = warmth
  if (lead.starred) score += STARRED_BONUS
  if (due) {
    if (nextActionDue && nextAction != null) {
      score += NEXT_ACTION_BONUS + Math.min(diffDays(nextAction, today), MAX_OVERDUE_BONUS_DAYS) * 2
    } else if (daysSince != null) {
      const overdue = Math.max(0, daysSince - cadence)
      score += Math.min(overdue, MAX_OVERDUE_BONUS_DAYS) * 2
    }
  }

  return { lead, due, needsDate: false, daysSince, nextDue, score, reason }
}

export function buildFollowupQueue(leads: Lead[], today = todayISO()): FollowupQueue {
  const statuses = FOLLOWUP_STATUSES as readonly string[]
  const items = leads
    .filter((l) => statuses.includes(l.pipeline_status))
    .map((l) => scoreFollowup(l, today))

  const due = items.filter((i) => i.due).sort((a, b) => b.score - a.score)
  const needsDate = items.filter((i) => i.needsDate)
  const upcoming = items
    .filter((i) => !i.due && !i.needsDate)
    .sort((a, b) => (a.nextDue ?? '9999').localeCompare(b.nextDue ?? '9999'))

  return { due, upcoming, needsDate }
}
