import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { reorderJobs } from '@/lib/repos/jobs'

export async function POST(req: Request) {
  const body = await req.json()
  if (!Array.isArray(body?.ids) || body.ids.some((x: unknown) => typeof x !== 'number')) {
    return NextResponse.json({ error: 'ids debe ser number[]' }, { status: 400 })
  }
  reorderJobs(db(), body.ids)
  return NextResponse.json({ ok: true })
}
