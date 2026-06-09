'use client'
import { useEffect, useState } from 'react'
import {
  Listbox, ListboxButton, ListboxOption, ListboxOptions,
  Disclosure, DisclosureButton, DisclosurePanel,
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
    <div className="rounded-xl bg-neutral-50 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        ⚡ Generar con Claude Code
      </div>
      <div className="flex items-center gap-2">
        <Listbox value={templateId} onChange={setTemplateId}>
          <div className="relative flex-1">
            <ListboxButton className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm">
              {selected?.name ?? 'Sin plantilla'}
            </ListboxButton>
            <ListboxOptions className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg">
              {templates.map((t) => (
                <ListboxOption
                  key={t.id}
                  value={t.id}
                  className="cursor-pointer px-3 py-2 data-[focus]:bg-neutral-100"
                >
                  {t.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
        <button
          onClick={generate}
          disabled={loading || templateId == null}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Generando…' : 'Generar'}
        </button>
      </div>

      <Disclosure>
        <DisclosureButton className="mt-2 text-xs text-neutral-400 hover:text-neutral-600">
          + instrucciones extra
        </DisclosureButton>
        <DisclosurePanel>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="p. ej. más corto, menciona su ronda reciente"
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </DisclosurePanel>
      </Disclosure>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {result && (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3 text-sm leading-relaxed text-neutral-800">
          <div className="whitespace-pre-wrap">{result}</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(result)}
              className="rounded-md border border-neutral-200 px-3 py-1 text-xs"
            >
              Copiar
            </button>
            <button
              onClick={generate}
              className="rounded-md border border-neutral-200 px-3 py-1 text-xs"
            >
              Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
