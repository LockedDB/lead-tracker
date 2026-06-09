# Lead Tracker — Diseño

Fecha: 2026-06-09
Estado: aprobado para plan de implementación

## Contexto y objetivo

Daniel lleva la captación freelance ("Built by Benet") y, en paralelo, la posibilidad de aplicar a ofertas de trabajo (runway autoimpuesto hasta finales de junio 2026). Hoy trackea leads en un Excel y en notas markdown de Obsidian con frontmatter, sobre las que opera una pipeline de subagentes de Claude Code. Obsidian se le queda corto para esto.

El objetivo es una **app local** que unifique dos pipelines —clientes (outreach) y curros (aplicaciones)— en un tracker cuidado, y que genere cover letters y emails con **un click**, lanzando Claude Code por debajo.

Restricción clave no negociable: para disparar Claude Code, la app corre en la Mac de Daniel. Es local (localhost), no hosteada.

## Scope

### En v1
- Dos entidades con pipeline propio: `leads` (clientes) y `jobs` (curros).
- Tabla como vista principal de cada pipeline, con foco en "qué toca hoy".
- Panel de detalle (drawer) minimalista con generación inline.
- Generación de texto (cover letter / outreach email) con un click vía Claude Code CLI.
- Plantillas editables y campo de instrucciones extra por generación.
- Historial de generaciones por registro.
- Importador único de los ~50 leads existentes desde `leads/*.md`.

### Fuera de v1 (YAGNI)
- Board kanban (se añade como toggle más adelante; la tabla es la vista por defecto).
- Tabla de actividad/eventos separada (el campo `notes` markdown basta).
- Tabla de tags, multiusuario, hosting, auth.
- Envío automático de mensajes (siempre revisa y manda Daniel a mano).

## Decisiones tomadas

1. **Datos:** SQLite local, la app es dueña de los datos (no markdown como fuente de verdad). Consecuencia asumida: los subagentes actuales (`lead-hunter`, `lead-researcher`, `lead-fit-analyzer`, `outreach-drafter`) operan sobre `leads/*.md` y quedan desconectados de la app; se rehacen/reconectan más adelante si hace falta.
2. **Generación:** shell-out al CLI de Claude Code (`claude -p`), coste cero sobre el plan actual. Detrás de una abstracción para poder cambiar a la API de Anthropic sin tocar UI ni datos.
3. **Dos pipelines** en la misma app: clientes y curros, entidades distintas.
4. **Vista principal:** tabla con foco en follow-ups (no kanban en v1).
5. **Densidad UI:** mínima a primera vista; lo secundario plegado (progressive disclosure).
6. **Ubicación:** repo nuevo en `~/code/lead-tracker`, fuera del vault.

## Arquitectura

App Next.js única (frontend + API en el mismo proceso) corriendo en localhost.

```
Browser (localhost:3000)
  React + Radix Themes
  Board clientes · Board curros
        │ fetch
Next.js API routes
  /api/leads, /api/jobs   → CRUD sobre SQLite
  /api/generate           → TextGenerator
        │                        │
   SQLite (better-sqlite3)   TextGenerator (interface)
                              ├─ ClaudeCliGenerator  (v1, claude -p)
                              └─ AnthropicApiGenerator (futuro)
```

### Abstracción del generador

Toda generación pasa por una interfaz, nunca por `claude` directamente:

```ts
interface TextGenerator {
  generate(input: GenerationRequest): Promise<GenerationResult>
}

type GenerationRequest = {
  kind: 'cover_letter' | 'outreach_email'
  record: LeadRecord | JobRecord
  template: string
  extraInstructions?: string
}
```

- `ClaudeCliGenerator`: construye el prompt (inyectando el contexto del registro, la plantilla, las instrucciones extra y las reglas de `references/text-prohibitions.md` + paso de humanizer) y ejecuta `claude -p`.
- `AnthropicApiGenerator`: misma interfaz, implementación con la API.
- Un factory elige la implementación según una env var (`GENERATOR=cli|api`). Cambiar de proveedor = una línea.

## Modelo de datos (SQLite)

### `leads` (clientes)
`id` · `company` · `pipeline_status` (prospect → contacted → replied → in_conversation → call_scheduled → proposal_sent → closed_won / closed_lost / ghosted) · `vertical` · `channel` (linkedin/email/intro/instagram/other) · `priority` (1-10) · `starred` (bool) · `first_contact` · `last_action` · `next_action` · `next_action_note` · `contact_name` · `contact_role` · `linkedin_url` · `app_user_axis` (b2c/internal/product/unclear) · `notes` (markdown) · `created_at` · `updated_at`

### `jobs` (curros)
`id` · `company` · `role` · `status` (saved → applied → screening → interview → offer → rejected / accepted / withdrawn) · `location` · `salary_range` · `job_url` · `source` (linkedin/infojobs/web/referral/other) · `priority` (1-10) · `starred` (bool) · `applied_date` · `last_action` · `next_action` · `next_action_note` · `contact_name` · `contact_role` · `notes` (markdown) · `created_at` · `updated_at`

### `templates`
`id` · `kind` ('outreach_email' | 'cover_letter') · `name` · `body` (con placeholders `{{company}}`, `{{role}}`, ...) · `updated_at`

Seed inicial: una plantilla de outreach email + una de cover letter.

### `generations`
`id` · `subject_type` ('lead' | 'job') · `subject_id` · `kind` · `content` · `template_used` · `generator` ('cli' | 'api') · `created_at`

Cada registro guarda su historial de textos generados, con trazabilidad del generador usado.

## UI / UX

### Vista principal (por pipeline)
Tabla con foco en follow-ups. Columnas a la vista: empresa, estado, prioridad, próxima acción ("hoy" destacado en naranja). Lo secundario, plegado o en el detalle. Tabs arriba para cambiar entre Clientes y Curros. Indicador de "X tocan hoy".

### Panel de detalle (drawer)
Densidad mínima. A primera vista, 4 cosas: nombre, estado, qué toca hoy, y botón Generar. Plegados en links discretos: datos del contacto, notas, historial de generaciones.

### Flujo de generación
1. Elegir plantilla (+ opcional desplegar "instrucciones extra").
2. **Generar** lanza `claude -p` con el contexto.
3. El texto aparece inline en segundos.
4. Acciones sobre el resultado: Guardar en el registro (entra en `generations`), Editar, Copiar, Regenerar.
5. Nada se envía solo. Daniel revisa y manda a mano.

La generación de outreach respeta las reglas de `references/text-prohibitions.md` (sin em dashes, sin rule of three, sin vocabulario AI) y pasa el humanizer, para salir ya con su voz.

## Migración
Importador de una sola vez: lee `leads/*.md`, parsea frontmatter + body (el body va a `notes`), inserta en la tabla `leads`. Los ~50 leads aparecen desde el minuto uno. La tabla `jobs` empieza vacía.

## Stack
- Next.js (App Router), React.
- Radix Themes para UI.
- better-sqlite3.
- Generación: `claude -p` vía child process, tras la abstracción `TextGenerator`.

## Riesgo conocido
El riesgo no es construir la app, es el scope creep. Encaje correcto: herramienta interna mínima que ahorra clicks. Señal de alarma: convertirla en producto. Mantener v1 acotado a lo de arriba.
