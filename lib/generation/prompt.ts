import type { GenerationRequest } from './types'

export function buildPrompt(req: GenerationRequest): string {
  const contextLines = Object.entries(req.subject.fields)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  const sections: string[] = [
    `Eres el asistente de redacción de Daniel Benet. Genera un ${req.kind === 'cover_letter' ? 'cover letter' : 'outreach email'} en español de España.`,
    `Contexto del ${req.subject.subjectType === 'lead' ? 'cliente' : 'puesto'}:\n${contextLines}`,
    `Plantilla / instrucciones base:\n${req.template}`,
  ]

  if (req.extraInstructions?.trim()) {
    sections.push(`Instrucciones extra del usuario:\n${req.extraInstructions.trim()}`)
  }
  if (req.rules?.trim()) {
    sections.push(`Reglas de estilo de obligado cumplimiento:\n${req.rules.trim()}`)
  }

  sections.push('Devuelve solo el texto final, sin preámbulos ni explicaciones.')
  return sections.join('\n\n')
}
