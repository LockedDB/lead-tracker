import matter from 'gray-matter'
import path from 'node:path'
import type { LeadInput } from '@/lib/repos/leads'

export function parseLeadMarkdown(raw: string, filename: string): LeadInput {
  const { data, content } = matter(raw)
  const body = content.trim()

  const headingMatch = body.match(/^#\s+(.+)$/m)
  const fileBase = path.basename(filename, '.md')
  const company =
    headingMatch?.[1]?.trim() || (data.razon_social as string) || fileBase

  return {
    company,
    pipeline_status: (data.pipeline_status as string) || 'prospect',
    vertical: (data.vertical as string) ?? null,
    channel: (data.channel as string) ?? null,
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
