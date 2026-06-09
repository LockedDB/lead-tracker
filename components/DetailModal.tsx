'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Star, MoreHorizontal, X, Files, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
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
    form[f.key] = f.type === 'select' && f.required ? f.options![0].value : ''
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
  const [confirmOpen, setConfirmOpen] = useState(false)

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
        toast.success('Creado')
      } else if (record) {
        const updated =
          subjectType === 'lead'
            ? await api.updateLead(record.id, buildPatch())
            : await api.updateJob(record.id, buildPatch())
        applyRecord(updated as Subject, `${subjectType}:${record.id}`)
        onChanged()
        toast.success('Cambios guardados')
      }
    } catch (e) {
      toast.error('No se pudo guardar', { description: String(e) })
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
    toast.success('Duplicado')
  }

  async function remove() {
    if (!record) return
    if (subjectType === 'lead') await api.deleteLead(record.id)
    else await api.deleteJob(record.id)
    onChanged()
    onClose()
    toast.success(`"${record.company}" eliminado`)
  }

  const placeholder =
    subjectType === 'lead' ? 'Nombre del cliente' : 'Nombre del curro'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">
          {creating ? placeholder : (form.company || 'Detalle')}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Editar los datos y generar texto con Claude Code.
        </DialogDescription>
        {visible && (
            <>
              <header className="flex items-center gap-1 border-b px-6 py-4">
                <Input
                  autoFocus={creating}
                  value={form.company ?? ''}
                  placeholder={placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="mr-1 min-w-0 flex-1 border-0 bg-transparent px-0 text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setStarred((s) => !s)}
                      aria-label={starred ? 'Quitar estrella' : 'Marcar con estrella'}
                      className={starred ? 'text-primary hover:text-primary' : 'text-muted-foreground'}
                    >
                      <Star className={cn('size-4', starred && 'fill-current')} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{starred ? 'Quitar estrella' : 'Destacar'}</TooltipContent>
                </Tooltip>

                {!creating && record && (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Acciones" className="text-muted-foreground">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Acciones</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="min-w-40">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={duplicate}>
                        <Files className="size-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                        <Trash2 className="size-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      aria-label="Cerrar"
                      className="text-muted-foreground"
                    >
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cerrar</TooltipContent>
                </Tooltip>
              </header>

              <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
                <aside className="shrink-0 space-y-3 overflow-y-auto border-b px-5 py-5 sm:w-64 sm:border-b-0 sm:border-r">
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
                    <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
                      Guarda el registro para poder generar texto.
                    </p>
                  )}
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t px-6 py-4">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={save} disabled={!canSave}>
                  {saving ? 'Guardando…' : creating ? 'Crear' : 'Guardar'}
                </Button>
              </footer>
            </>
          )}
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{record?.company}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
