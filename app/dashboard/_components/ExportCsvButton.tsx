'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase-browser'
import { toCsv, downloadCsv } from '@/utils/csv'

/**
 * Reusable "Export CSV" button that fetches ALL rows from a Supabase table
 * (paginated in 1000-row chunks) and downloads a CSV.
 */
export default function ExportCsvButton({
  table,
  filename,
  columns,
  filterBuilder,
  maxRows = 10000,
}: {
  table: string
  filename: string
  columns?: string[]
  filterBuilder?: (q: any) => any
  maxRows?: number
}) {
  const supabase = createClient()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  async function handleExport() {
    setBusy(true)
    setProgress('Fetching…')
    try {
      const chunkSize = 1000
      const allRows: any[] = []
      let from = 0
      while (allRows.length < maxRows) {
        const to = Math.min(from + chunkSize - 1, maxRows - 1)
        let q = supabase.from(table).select(columns ? columns.join(',') : '*')
        if (filterBuilder) q = filterBuilder(q)
        const { data, error } = await q.range(from, to)
        if (error) throw new Error(error.message)
        if (!data || data.length === 0) break
        allRows.push(...data)
        setProgress(`Fetched ${allRows.length.toLocaleString()}…`)
        if (data.length < chunkSize) break
        from += chunkSize
      }
      setProgress('Generating CSV…')
      const csv = toCsv(allRows, columns)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(`${filename}-${stamp}.csv`, csv)
    } catch (err: any) {
      alert('Export failed: ' + err.message)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      data-testid="export-csv-btn"
      className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      title="Download results as CSV"
    >
      <span>⬇</span>
      <span>{busy ? progress || 'Exporting…' : 'Export CSV'}</span>
    </button>
  )
}
