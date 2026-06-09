import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { listJobs, createJob } from '@/lib/repos/jobs'

export async function GET() {
  return NextResponse.json(listJobs(db()))
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!body?.company) {
    return NextResponse.json({ error: 'company es obligatorio' }, { status: 400 })
  }
  const id = createJob(db(), body)
  return NextResponse.json({ id }, { status: 201 })
}
