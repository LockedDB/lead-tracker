import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { getLead, updateLead, deleteLead } from '@/lib/repos/leads'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = getLead(db(), Number(id))
  if (!lead) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'cuerpo inválido' }, { status: 400 })
  }
  updateLead(db(), Number(id), body)
  return NextResponse.json(getLead(db(), Number(id)))
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  deleteLead(db(), Number(id))
  return NextResponse.json({ ok: true })
}
