'use client'
import { useEffect, useState } from 'react'
import {
  Listbox, ListboxButton, ListboxOption, ListboxOptions,
  Disclosure, DisclosureButton, DisclosurePanel,
  Button, Input,
} from '@headlessui/react'
import { api, type Template } from '@/lib/client/api'

export function GeneratePanel({
  subjectType,
  subjectId,
  onSaved,
}: {
  subjectType: 'lead' | 'job'
  subjectId: number
  onSaved: () => void
}) {
  const wantedKind = subjectType === 'lead' ? 'outreach_email' : 'cover_letter'
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [extra, setExtra] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listTemplates().then((all) => {
      const filtered = all.filter((t) => t.kind === wantedKind)
      setTemplates(filtered)
      setTemplateId(filtered[0]?.id ?? null)
    })
  }, [wantedKind])

  async function generate() {
    if (templateId == null) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.generate({
        subjectType,
        subjectId,
        templateId,
        extraInstructions: extra.trim() || undefined,
      })
      setResult(res.content)
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const selected = templates.find((t) => t.id === templateId)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Generar con Claude Code
      </div>
      <div className="flex items-center gap-2">
        <Listbox value={templateId} onChange={setTemplateId}>
          <div className="flex-1">
            <ListboxButton className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-neutral-200 transition hover:bg-white/10 data-[open]:border-white/20">
              <span>{selected?.name ?? 'Sin plantilla'}</span>
              <span aria-hidden className="ml-2 text-neutral-500">▾</span>
            </ListboxButton>
            <ListboxOptions
              anchor="bottom start"
              transition
              className="z-[60] w-[var(--button-width)] rounded-lg border border-white/10 bg-neutral-900 p-1 text-sm shadow-xl [--anchor-gap:4px] focus:outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              {templates.map((t) => (
                <ListboxOption
                  key={t.id}
                  value={t.id}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-neutral-300 data-[focus]:bg-white/10 data-[focus]:text-white data-[selected]:text-white"
                >
                  {t.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
        <Button
          onClick={generate}
          disabled={loading || templateId == null}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 data-[disabled]:opacity-50"
        >
          {loading ? 'Generando…' : 'Generar'}
        </Button>
      </div>

      <Disclosure>
        <DisclosureButton className="mt-2 text-xs text-neutral-500 transition hover:text-neutral-300">
          + instrucciones extra
        </DisclosureButton>
        <DisclosurePanel>
          <Input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="p. ej. más corto, menciona su ronda reciente"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none data-[focus]:border-white/20"
          />
        </DisclosurePanel>
      </Disclosure>

      {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

      {result && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-neutral-200">
          <div className="whitespace-pre-wrap">{result}</div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result)
                } catch {
                  /* clipboard no disponible */
                }
              }}
              className="rounded-md border border-white/10 px-3 py-1 text-xs text-neutral-300 transition hover:bg-white/5"
            >
              Copiar
            </Button>
            <Button
              onClick={generate}
              disabled={loading}
              className="rounded-md border border-white/10 px-3 py-1 text-xs text-neutral-300 transition hover:bg-white/5 data-[disabled]:opacity-50"
            >
              Regenerar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
