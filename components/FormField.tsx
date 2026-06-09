'use client'
import {
  Field, Label, Input, Textarea,
  Listbox, ListboxButton, ListboxOptions, ListboxOption,
} from '@headlessui/react'
import type { FieldDef } from '@/lib/client/fields'

const controlClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none data-[focus]:border-white/20'

export function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <Label className="mb-1 block text-xs font-medium text-neutral-500">
        {field.label}
      </Label>
      {field.type === 'textarea' ? (
        <Textarea
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={controlClass + ' resize-y font-sans'}
        />
      ) : field.type === 'select' ? (
        <SelectControl field={field} value={value} onChange={onChange} />
      ) : (
        <Input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          min={field.type === 'number' ? 1 : undefined}
          max={field.type === 'number' ? 10 : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={controlClass + ' [color-scheme:dark]'}
        />
      )}
    </Field>
  )
}

function SelectControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string
  onChange: (value: string) => void
}) {
  const options = field.required
    ? field.options!
    : [{ value: '', label: '—' }, ...field.options!]
  const selected = options.find((o) => o.value === value) ?? options[0]
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        className={controlClass + ' flex items-center justify-between text-left data-[open]:border-white/20'}
      >
        <span className={selected.value === '' ? 'text-neutral-500' : ''}>
          {selected.label}
        </span>
        <span aria-hidden className="ml-2 text-neutral-500">▾</span>
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        transition
        className="z-[60] w-[var(--button-width)] rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-xl [--anchor-gap:4px] focus:outline-none transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {options.map((o) => (
          <ListboxOption
            key={o.value}
            value={o.value}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-neutral-300 data-[focus]:bg-white/10 data-[focus]:text-white data-[selected]:text-white"
          >
            {o.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}
