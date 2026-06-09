import type { TextGenerator } from './types'
import { ClaudeCliGenerator } from './claude-cli'

// Cambiar de proveedor = cambiar la env var GENERATOR. La implementación 'api'
// (AnthropicApiGenerator) se añadirá implementando la misma interfaz TextGenerator.
export function createGenerator(): TextGenerator {
  const kind = process.env.GENERATOR ?? 'cli'
  switch (kind) {
    case 'cli':
      return new ClaudeCliGenerator()
    default:
      throw new Error(`GENERATOR no soportado: ${kind}`)
  }
}
