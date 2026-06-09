@AGENTS.md

# CLAUDE.md

Guía para agentes que trabajen en este repo.

## Qué es

App **local de un solo usuario** para trackear dos pipelines en paralelo: **leads** (clientes potenciales del freelance "Built by Benet") y **jobs**/curros (ofertas de empleo). Sirve para gestionar el estado de cada uno y **generar texto de outreach** (DMs, follow-ups, cover letters) con `claude -p`.

Corre en local, no se despliega. La base de datos es un fichero SQLite en la raíz (`lead-tracker.db`), **gitignored** — nunca lo commitees ni lo subas.

Idioma del producto y de los comentarios: **español (España)**. El tono de cualquier texto generado es directo, sin humo.

## Relación con el Obsidian vault (importante)

Los leads originales viven como notas markdown en un Obsidian vault **fuera de este repo**. `scripts/import-leads.ts` (comando `npm run import-leads`) los lee y los vuelca en SQLite. Esa relación es **read-only de una sola dirección**: este repo importa del vault, nunca escribe en él. La ruta del vault está hardcodeada en `scripts/import-leads.ts:10` (override con env `LEADS_DIR` si se parametriza en el futuro).

## Acceso a Outlook (correo)

Hay un MCP **`outlook`** (solo lectura) conectado a la cuenta personal del dueño del repo: da acceso a correo, calendario y contactos vía Microsoft Graph. Útil para **alimentar la pipeline de `jobs`** desde los emails de confirmación de candidaturas (buscar, leer asuntos/cuerpos y volcar empresa/rol/estado a la tabla). No escribe correo (no envía ni borra). No metas aquí credenciales ni datos personales: este repo es público.

## Stack

- **Next.js 16** (App Router, React 19, Server + Client Components). Ojo: Next 16 tiene breaking changes respecto a versiones anteriores — ver `AGENTS.md` y `node_modules/next/dist/docs/`.
- **SQLite** vía `better-sqlite3` (síncrono, solo server-side).
- **Tailwind CSS v4** — CSS-first (`@import "tailwindcss"` + `@theme {}` en `app/globals.css`), **sin** fichero de config.
- **Headless UI v2** (`@headlessui/react`) para todos los controles interactivos.
- **Vitest** (unit) + **Playwright** (e2e: API + UI).

## Comandos

```bash
npm run dev            # servidor de desarrollo (localhost:3000)
npm run build          # build de producción
npm run lint           # eslint
npm run test           # vitest (unit) — corre en CI mental antes de dar nada por bueno
npm run e2e            # playwright (la generación con claude -p va gated)
npm run e2e:generate   # e2e incluyendo el test de generación real (RUN_GENERATE=1)
npm run import-leads   # importa leads del vault a SQLite
```

## Variables de entorno

- `DB_PATH` — ruta del fichero SQLite (default: `./lead-tracker.db`).
- `GENERATOR` — proveedor de generación de texto (default `cli` → `claude -p`). La factory en `lib/generation/factory.ts` está pensada para enchufar un `AnthropicApiGenerator` detrás de la misma interfaz `TextGenerator` sin tocar UI ni datos.
- `RUN_GENERATE=1` — activa el e2e que de verdad llama a `claude -p`.

## Arquitectura por capas

```
app/api/*          ← route handlers (REST sobre leads/jobs/templates/generate)
app/{leads,jobs}/  ← páginas (client components) que consumen lib/client/api.ts
components/         ← UI (Headless UI v2 + Tailwind)
lib/client/        ← código de navegador: api.ts (fetch), status.ts, fields.ts, dates.ts
lib/repos/         ← acceso a datos por tabla (leads, jobs, templates, generations)
lib/db/            ← connection (singleton better-sqlite3), bootstrap (migrate+seed), schema.sql
lib/generation/    ← TextGenerator: factory → claude-cli → prompt
lib/import/        ← parseo de notas markdown del vault
```

`lib/db/bootstrap.ts` expone `db()`: en la primera llamada hace `migrate()` + `seedTemplates()` y cachea la conexión. Las route handlers usan ese `db()`.

## Las dos pipelines son simétricas

`leads` y `jobs` comparten estructura casi idéntica (status, priority 1-10, starred, next_action, contact, notes…). Las diferencias clave:

- La columna de estado es `pipeline_status` en leads y `status` en jobs.
- Estados definidos en `lib/client/status.ts` (`LEAD_STATUSES` / `JOB_STATUSES`), con `tone` para el color del badge.
- Campos del formulario en `lib/client/fields.ts` (`LEAD_FIELDS` / `JOB_FIELDS`), con `pane: 'side' | 'main'` que decide en qué columna del popup se renderiza cada campo.

Cuando toques una pipeline, comprueba si el cambio aplica también a la otra para mantenerlas en paridad.

## Convenciones de datos (no romper)

- **Whitelist de columnas**: cada repo (`lib/repos/*.ts`) tiene un array `COLUMNS`; solo esas columnas se escriben. Añadir un campo = tocar `schema.sql` + el tipo + `COLUMNS` + (probablemente) `fields.ts`.
- **Booleanos como INTEGER 0/1** en SQLite; `hydrate()` los convierte a `boolean` al leer y `toRow()` al escribir. No metas `true`/`false` crudos.
- **Solo `company` es obligatorio**. El resto sale de DB defaults (`pipeline_status`/`status`, `priority` 5, `starred` 0). El modo "crear" del popup siembra esos defaults para que coincidan.
- Fechas como `TEXT` ISO. En el form se cortan a `YYYY-MM-DD` (slice 10).

## Notas de UI / Headless UI

- Todo control interactivo usa primitivas de Headless UI v2 (`Dialog`, `Listbox`, `Menu`, `Field`, `Input`, `Button`) con la prop `transition` + variantes `data-[closed]`/`data-[enter]`/`data-[leave]`. No metas `<select>`/`<input>` nativos: rompen el tema dark.
- **Gotcha de portales** (`StatusSelect.tsx`): los `ListboxOptions`/`MenuItems` con `anchor` se renderizan en un portal, pero **los eventos de React siguen burbujeando por el árbol de componentes, no por el DOM**. Sin `stopPropagation` en el contenedor portaleado, un click dentro abre el `<tr onClick>` de la fila. Mantén ese `stopPropagation`.
- Tema dark: negro puro de fondo, paneles translúcidos (`white/5`, bordes `white/10`), acento naranja (`--color-accent: #ff6b35`) usado con cuentagotas.

## Testing

- Unit (Vitest) para `lib/` (repos, generation, import, client helpers). Usan DB en memoria/temporal vía `getDb(dbPath)`.
- E2E (Playwright): `e2e/api.spec.ts` (REST), `e2e/ui.spec.ts` (navegador), `e2e/generate.spec.ts` (gated por `RUN_GENERATE`).
- Los specs de Playwright **no limpian** lo que crean: si corres e2e contra la DB real, después borra los registros de prueba (han contaminado la tabla `jobs` antes).
- Antes de dar trabajo por terminado: `npm run test` + `npm run lint` en verde.

## Estilo de código

- Comentarios: nada en código autoexplicativo; **sí** comentar fixes no obvios (con el porqué) y APIs raras. Ver los comentarios existentes en `StatusSelect.tsx` y `claude-cli.ts` como modelo.
- Nombres descriptivos antes que comentar nombres cortos.

## Qué no hacer

- No commitear `lead-tracker.db` ni `.db-*` (ya gitignored).
- No escribir en el Obsidian vault — la importación es read-only.
- No meter datos reales de leads ni keys en código/tests (el repo es **público**).
- No reintroducir controles nativos donde Headless UI ya cubre el caso.

## Pendientes

Ver `TODO.md` para el backlog (historial de generaciones, `STYLE_RULES`/humanizer en la generación, vista kanban).
