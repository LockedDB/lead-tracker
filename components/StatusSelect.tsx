'use client'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import type { StatusDef } from '@/lib/client/status'
import { StatusBadge } from './StatusBadge'

export function StatusSelect({
  defs,
  value,
  onChange,
}: {
  defs: StatusDef[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        onClick={(e) => e.stopPropagation()}
        className="rounded-full focus:outline-none"
      >
        <StatusBadge defs={defs} value={value} />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        transition
        // el portal de Headless re-parenta el DOM pero los eventos React siguen
        // burbujeando al <tr onClick>; sin esto, elegir un estado abriría el popup
        onClick={(e) => e.stopPropagation()}
        className="z-[60] min-w-44 rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-xl [--anchor-gap:4px] focus:outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {defs.map((d) => (
          <ListboxOption
            key={d.value}
            value={d.value}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-neutral-300 data-[focus]:bg-white/10 data-[focus]:text-white data-[selected]:text-white"
          >
            {d.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}
