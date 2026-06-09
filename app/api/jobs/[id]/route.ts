import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { getJob, updateJob, deleteJob } from '@/lib/repos/jobs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = getJob(db(), Number(id))
  if (!job) return NextResponse.json({ error: 'no encontrado' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  updateJob(db(), Number(id), body)
  return NextResponse.json(getJob(db(), Number(id)))
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  deleteJob(db(), Number(id))
  return NextResponse.json({ ok: true })
}
