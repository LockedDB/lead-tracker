'use client'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import type { StatusDef } from '@/lib/client/status'
import { statusLabel } from '@/lib/client/status'
import { NextActionCell } from './NextActionCell'
import { CollapsibleSection } from './CollapsibleSection'
import { GeneratePanel } from './GeneratePanel'
import { api, type Lead, type Job } from '@/lib/client/api'

type Subject = (Lead | Job) & { role?: string | null }

export function DetailDrawer({
  subjectType,
  subjectId,
  statusDefs,
  onClose,
  onChanged,
}: {
  subjectType: 'lead' | 'job'
  subjectId: number | null
  statusDefs: StatusDef[]
  onClose: () => void
  onChanged: () => void
}) {
  const open = subjectId != null
  const [record, setRecord] = useState<Subject | null>(null)

  useEffect(() => {
    if (subjectId == null) {
      setRecord(null)
      return
    }
    let cancelled = false
    setRecord(null)
    const load =
      subjectType === 'lead' ? api.getLead(subjectId) : api.getJob(subjectId)
    load.then((r) => {
      if (!cancelled) setRecord(r as Subject)
    })
    return () => {
      cancelled = true
    }
  }, [subjectType, subjectId])

  const statusValue =
    record && ('pipeline_status' in record ? record.pipeline_status : record.status)

  return (
    <Transition show={open} appear>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/20" />
        </TransitionChild>
        <div className="fixed inset-y-0 right-0 flex max-w-full">
          <TransitionChild
            enter="transform transition ease-out duration-200" enterFrom="translate-x-full" enterTo="translate-x-0"
            leave="transform transition ease-in duration-150" leaveFrom="translate-x-0" leaveTo="translate-x-full"
          >
            <DialogPanel className="h-full w-screen max-w-md overflow-y-auto bg-white p-6 shadow-xl">
              {record && (
                <div>
                  <div className="text-xl font-bold">
                    {record.company}
                    {record.starred && <span className="ml-1 text-accent">★</span>}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {statusLabel(statusDefs, statusValue as string)} · prioridad{' '}
                    {record.priority}
                  </div>
                  <div className="mt-4 text-sm">
                    <NextActionCell
                      date={record.next_action}
                      note={record.next_action_note}
                    />
                  </div>

                  <div className="mt-6">
                    <GeneratePanel
                      key={record.id}
                      subjectType={subjectType}
                      subjectId={record.id}
                      onSaved={onChanged}
                    />
                  </div>

                  <div className="mt-6">
                    <CollapsibleSection title="Datos del contacto">
                      <div className="space-y-1">
                        <div>{record.contact_name ?? '—'}</div>
                        <div className="text-neutral-500">
                          {record.contact_role ?? ''}
                        </div>
                      </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Notas">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700">
                        {record.notes ?? '—'}
                      </pre>
                    </CollapsibleSection>
                  </div>
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
