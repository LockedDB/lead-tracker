import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { reorderLeads } from '@/lib/repos/leads'

export async function POST(req: Request) {
  const body = await req.json()
  if (!Array.isArray(body?.ids) || body.ids.some((x: unknown) => typeof x !== 'number')) {
    return NextResponse.json({ error: 'ids debe ser number[]' }, { status: 400 })
  }
  reorderLeads(db(), body.ids)
  return NextResponse.json({ ok: true })
}
