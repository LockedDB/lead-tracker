'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
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
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        onClick={(e) => e.stopPropagation()}
        className="h-auto w-fit cursor-pointer gap-0 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 [&>svg]:hidden"
      >
        <StatusBadge defs={defs} value={value} />
      </SelectTrigger>
      {/* el contenido va en un portal; stopPropagation evita que el click llegue al <tr onClick> */}
      <SelectContent position="popper" onClick={(e) => e.stopPropagation()}>
        {defs.map((d) => (
          <SelectItem key={d.value} value={d.value}>
            {d.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
