import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { listTemplates } from '@/lib/repos/templates'

export async function GET() {
  return NextResponse.json(listTemplates(db()))
}
