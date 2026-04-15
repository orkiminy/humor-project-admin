/**
 * Convert an array of objects to a CSV string.
 * Handles nested objects, null, commas, quotes, and newlines.
 */
export function toCsv(rows: Record<string, any>[], columns?: string[]): string {
  if (rows.length === 0) return ''
  const cols = columns ?? Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  const escape = (v: any): string => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') v = JSON.stringify(v)
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const header = cols.join(',')
  const body = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n')
  return `${header}\n${body}`
}

/**
 * Trigger a browser download of CSV content.
 */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
