'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Copy, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
    try {
      const res = await api.generate({
        subjectType,
        subjectId,
        templateId,
        extraInstructions: extra.trim() || undefined,
      })
      setResult(res.content)
      onSaved()
      toast.success('Texto generado')
    } catch (e) {
      toast.error('No se pudo generar', { description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      toast.success('Copiado al portapapeles')
    } catch {
      toast.error('El portapapeles no está disponible')
    }
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
          <Sparkles className="size-3.5" />
          Generar con Claude Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center gap-2">
          <Select
            value={templateId == null ? '' : String(templateId)}
            onValueChange={(v) => setTemplateId(Number(v))}
          >
            <SelectTrigger className="w-full flex-1">
              <SelectValue placeholder="Sin plantilla" />
            </SelectTrigger>
            <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
              {templates.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={loading || templateId == null}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? 'Generando…' : 'Generar'}
          </Button>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="text-muted-foreground hover:text-foreground text-xs transition-colors">
            + instrucciones extra
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="p. ej. más corto, menciona su ronda reciente"
              className="mt-2"
            />
          </CollapsibleContent>
        </Collapsible>

        {result && (
          <div className="bg-muted/40 rounded-lg border p-3 text-sm leading-relaxed">
            <div className="whitespace-pre-wrap">{result}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy />
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
                <RefreshCw className={loading ? 'animate-spin' : undefined} />
                Regenerar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
