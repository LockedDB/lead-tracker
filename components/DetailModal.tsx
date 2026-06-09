'use client'
import { useEffect, useState } from 'react'
import {
  Dialog, DialogPanel, DialogBackdrop,
  Menu, MenuButton, MenuItem, MenuItems,
  Button, Input,
} from '@headlessui/react'
import type { FieldDef } from '@/lib/client/fields'
import { GeneratePanel } from './GeneratePanel'
import { FormField } from './FormField'
import { api, type Lead, type Job } from '@/lib/client/api'

type Subject = (Lead | Job) & { role?: string | null }
type Form = Record<string, string>

function seedForm(record: Subject, fields: FieldDef[]): Form {
  const form: Form = { company: record.company ?? '' }
  for (const f of fields) {
    const v = (record as Record<string, unknown>)[f.key]
    form[f.key] = v == null ? '' : f.type === 'date' ? String(v).slice(0, 10) : String(v)
  }
  return form
}

function blankForm(fields: FieldDef[]): Form {
  const form: Form = { company: '' }
  for (const f of fields) {
    form[f.key] =
      f.type === 'select' && f.required
        ? f.options![0].value
        : f.key === 'priority'
          ? '5'
          : ''
  }
  return form
}

export function DetailModal({
  subjectType,
  subjectId,
  creating,
  fields,
  onClose,
  onChanged,
}: {
  subjectType: 'lead' | 'job'
  subjectId: number | null
  creating: boolean
  fields: FieldDef[]
  onClose: () => void
  onChanged: () => void
}) {
  const open = creating || subjectId != null
  const currentKey = subjectId == null ? null : `${subjectType}:${subjectId}`
  const [record, setRecord] = useState<Subject | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [form, setForm] = useState<Form>({})
  const [initial, setInitial] = useState<Form>({})
  const [starred, setStarred] = useState(false)
  const [initialStarred, setInitialStarred] = useState(false)
  const [saving, setSaving] = useState(false)

  function applyRecord(rec: Subject, key: string) {
    const seeded = seedForm(rec, fields)
    setRecord(rec)
    setForm(seeded)
    setInitial(seeded)
    setStarred(rec.starred)
    setInitialStarred(rec.starred)
    setLoadedKey(key)
  }

  useEffect(() => {
    if (subjectId == null) return
    let cancelled = false
    const key = `${subjectType}:${subjectId}`
    const load =
      subjectType === 'lead' ? api.getLead(subjectId) : api.getJob(subjectId)
    load.then((r) => {
      if (!cancelled) applyRecord(r as Subject, key)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectType, subjectId, fields])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!creating) return
    setForm(blankForm(fields))
    setInitial({})
    setStarred(false)
    setInitialStarred(false)
    setRecord(null)
    setLoadedKey(null)
  }, [creating, fields])
  /* eslint-enable react-hooks/set-state-in-effect */

  const showEdit = record != null && (subjectId == null || loadedKey === currentKey)
  const visible = creating || showEdit
  const typeOf = (key: string) => fields.find((f) => f.key === key)?.type ?? 'text'
  const dirty =
    starred !== initialStarred ||
    Object.keys(form).some((k) => form[k] !== initial[k])
  const companyOk = (form.company?.trim().length ?? 0) > 0
  const canSave = companyOk && !saving && (creating || dirty)

  function formToInput(): Record<string, unknown> {
    const input: Record<string, unknown> = { starred }
    for (const k of Object.keys(form)) {
      const v = form[k]
      if (v === '') continue
      input[k] = typeOf(k) === 'number' ? Number(v) : v
    }
    return input
  }

  function buildPatch(): Record<string, unknown> {
    const patch: Record<string, unknown> = {}
    for (const k of Object.keys(form)) {
      if (form[k] === initial[k]) continue
      patch[k] = form[k] === '' ? null : typeOf(k) === 'number' ? Number(form[k]) : form[k]
    }
    if (starred !== initialStarred) patch.starred = starred
    return patch
  }

  async function save() {
    if (!canSave) return
    setSaving(true)
    try {
      if (creating) {
        const input = formToInput()
        if (subjectType === 'lead') {
          await api.createLead(input as Parameters<typeof api.createLead>[0])
        } else {
          await api.createJob(input as Parameters<typeof api.createJob>[0])
        }
        onChanged()
        onClose()
      } else if (record) {
        const updated =
          subjectType === 'lead'
            ? await api.updateLead(record.id, buildPatch())
            : await api.updateJob(record.id, buildPatch())
        applyRecord(updated as Subject, `${subjectType}:${record.id}`)
        onChanged()
      }
    } finally {
      setSaving(false)
    }
  }

  async function duplicate() {
    const input = formToInput()
    input.company = (form.company?.trim() || 'Sin nombre') + ' (copia)'
    if (subjectType === 'lead') {
      await api.createLead(input as Parameters<typeof api.createLead>[0])
    } else {
      await api.createJob(input as Parameters<typeof api.createJob>[0])
    }
    onChanged()
    onClose()
  }

  async function remove() {
    if (!record) return
    if (!window.confirm(`¿Eliminar "${record.company}"? No se puede deshacer.`)) return
    if (subjectType === 'lead') await api.deleteLead(record.id)
    else await api.deleteJob(record.id)
    onChanged()
    onClose()
  }

  const placeholder =
    subjectType === 'lead' ? 'Nombre del cliente' : 'Nombre del curro'

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition duration-200 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          {visible && (
            <>
              <header className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
                <Input
                  autoFocus={creating}
                  value={form.company ?? ''}
                  placeholder={placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="min-w-0 flex-1 bg-transparent text-xl font-semibold tracking-tight text-white placeholder:text-neutral-600 focus:outline-none"
                />
                <Button
                  onClick={() => setStarred((s) => !s)}
                  aria-label={starred ? 'Quitar estrella' : 'Marcar con estrella'}
                  className={
                    'rounded-md px-1.5 text-lg transition ' +
                    (starred ? 'text-accent' : 'text-neutral-600 hover:text-neutral-400')
                  }
                >
                  ★
                </Button>

                {!creating && record && (
                  <Menu>
                    <MenuButton
                      aria-label="Acciones"
                      className="rounded-md px-2 py-1 text-lg leading-none text-neutral-500 transition hover:bg-white/5 hover:text-white data-[open]:bg-white/5 data-[open]:text-white"
                    >
                      ⋯
                    </MenuButton>
                    <MenuItems
                      anchor="bottom end"
                      transition
                      className="z-[60] min-w-40 rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-xl [--anchor-gap:6px] focus:outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                      <MenuItem>
                        <button
                          onClick={duplicate}
                          className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-neutral-300 data-[focus]:bg-white/10 data-[focus]:text-white"
                        >
                          Duplicar
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          onClick={remove}
                          className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-red-400 data-[focus]:bg-red-500/10 data-[focus]:text-red-300"
                        >
                          Eliminar
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                )}

                <Button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="rounded-md px-1.5 text-neutral-500 transition hover:text-white"
                >
                  ✕
                </Button>
              </header>

              <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
                <aside className="shrink-0 space-y-3 overflow-y-auto border-b border-white/10 px-5 py-5 sm:w-64 sm:border-b-0 sm:border-r">
                  {fields
                    .filter((f) => f.pane !== 'main')
                    .map((f) => (
                      <FormField
                        key={f.key}
                        field={f}
                        value={form[f.key] ?? ''}
                        onChange={(v) => setForm((cur) => ({ ...cur, [f.key]: v }))}
                      />
                    ))}
                </aside>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  {fields
                    .filter((f) => f.pane === 'main')
                    .map((f) => (
                      <FormField
                        key={f.key}
                        field={f}
                        value={form[f.key] ?? ''}
                        onChange={(v) => setForm((cur) => ({ ...cur, [f.key]: v }))}
                      />
                    ))}

                  {!creating && record ? (
                    <GeneratePanel
                      key={record.id}
                      subjectType={subjectType}
                      subjectId={record.id}
                      onSaved={onChanged}
                    />
                  ) : (
                    <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-neutral-500">
                      Guarda el registro para poder generar texto.
                    </p>
                  )}
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
                <Button
                  onClick={onClose}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={save}
                  disabled={!canSave}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 data-[disabled]:opacity-50"
                >
                  {saving ? 'Guardando…' : creating ? 'Crear' : 'Guardar'}
                </Button>
              </footer>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
