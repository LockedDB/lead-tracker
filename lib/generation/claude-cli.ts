import { spawn } from 'node:child_process'
import type { GenerationRequest, GenerationResult, TextGenerator } from './types'
import { buildPrompt } from './prompt'

export type CliRunner = (prompt: string) => Promise<string>

// Ejecuta `claude -p` pasando el prompt por stdin. -p (--print) corre Claude Code
// en modo no interactivo y escribe la respuesta a stdout.
const defaultRunner: CliRunner = (prompt) =>
  new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (err += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(`claude -p salió con código ${code}: ${err}`))
    })
    child.stdin.write(prompt)
    child.stdin.end()
  })

export class ClaudeCliGenerator implements TextGenerator {
  constructor(private readonly run: CliRunner = defaultRunner) {}

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const prompt = buildPrompt(req)
    const raw = await this.run(prompt)
    return { content: raw.trim(), generator: 'cli' }
  }
}
