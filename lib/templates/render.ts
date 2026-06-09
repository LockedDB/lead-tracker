export function renderTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = vars[key]
    return v === undefined || v === null ? '' : String(v)
  })
}
