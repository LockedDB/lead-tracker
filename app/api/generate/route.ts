import { NextResponse } from 'next/server'
import { db } from '@/lib/db/bootstrap'
import { createGenerator } from '@/lib/generation/factory'
import { getTemplate } from '@/lib/repos/templates'
import { getLead } from '@/lib/repos/leads'
import { getJob } from '@/lib/repos/jobs'
import { saveGeneration } from '@/lib/repos/generations'
import type { GenerationKind } from '@/lib/generation/types'

export async function POST(req: Request) {
  const { subjectType, subjectId, templateId, extraInstructions } = await req.json()
  const conn = db()

  const template = getTemplate(conn, Number(templateId))
  if (!template) return NextResponse.json({ error: 'plantilla no encontrada' }, { status: 400 })

  const record =
    subjectType === 'lead' ? getLead(conn, Number(subjectId)) : getJob(conn, Number(subjectId))
  if (!record) return NextResponse.json({ error: 'registro no encontrado' }, { status: 404 })

  const generator = createGenerator()
  const result = await generator.generate({
    kind: template.kind as GenerationKind,
    subject: { subjectType, fields: record as Record<string, unknown> },
    template: template.body,
    extraInstructions,
    rules: process.env.STYLE_RULES,
  })

  const id = saveGeneration(conn, {
    subject_type: subjectType,
    subject_id: Number(subjectId),
    kind: template.kind as GenerationKind,
    content: result.content,
    template_used: template.name,
    generator: result.generator,
  })

  return NextResponse.json({ id, content: result.content, generator: result.generator })
}
