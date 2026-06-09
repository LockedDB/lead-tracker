'use client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FieldDef } from '@/lib/client/fields'

// Radix Select reserva el value vacío; usamos un centinela para la opción "—"
const NONE = '__none__'

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
    <div className="grid gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">{field.label}</Label>
      {field.type === 'textarea' ? (
        <Textarea
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="resize-y font-sans"
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
        />
      )}
    </div>
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
    : [{ value: NONE, label: '—' }, ...field.options!]
  const current = value === '' && !field.required ? NONE : value
  return (
    <Select value={current} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
