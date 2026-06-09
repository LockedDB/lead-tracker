export type GenerationKind = 'cover_letter' | 'outreach_email'

export type GenerationSubject = {
  subjectType: 'lead' | 'job'
  fields: Record<string, unknown>
}

export type GenerationRequest = {
  kind: GenerationKind
  subject: GenerationSubject
  template: string
  extraInstructions?: string
  rules?: string
}

export type GenerationResult = {
  content: string
  generator: 'cli' | 'api'
}

export interface TextGenerator {
  generate(req: GenerationRequest): Promise<GenerationResult>
}
