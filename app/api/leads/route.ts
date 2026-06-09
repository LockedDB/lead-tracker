import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { listLeads, createLead } from '@/lib/repos/leads'

export async function GET() {
  return NextResponse.json(listLeads(db()))
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.company) {
    return NextResponse.json({ error: 'company es obligatorio' }, { status: 400 })
  }
  const id = createLead(db(), body)
  return NextResponse.json({ id }, { status: 201 })
}
