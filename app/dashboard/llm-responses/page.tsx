'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

export default function LLMResponsesPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const [{ data, error: err }, { count }] = await Promise.all([
        supabase.from('llm_model_responses').select('*').order('id', { ascending: false }).range(from, to),
        supabase.from('llm_model_responses').select('*', { count: 'exact', head: true }),
      ])
      if (err) setError(err.message)
      else { setRows(data || []); setTotalCount(count ?? 0) }
      setLoading(false)
    }
    fetch()
  }, [page])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  const cols = rows.length > 0 ? Object.keys(rows[0]) : []
  const summaryCols = cols.filter(c => !['input', 'output', 'prompt', 'response', 'completion', 'content', 'text'].includes(c))
  const contentCols = cols.filter(c => ['input', 'output', 'prompt', 'response', 'completion', 'content', 'text'].includes(c))

  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">LLM Responses</h1>
      <p className="text-gray-400 mb-6">{totalCount} total responses</p>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-400 text-sm">
          No LLM responses found
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === (row.id ?? i) ? null : (row.id ?? i))}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <span className="font-mono text-xs text-gray-400 flex-shrink-0">{row.id ?? i + 1 + page * PAGE_SIZE}</span>
                  <div className="flex flex-wrap gap-3 overflow-hidden">
                    {summaryCols.slice(0, 4).filter(c => c !== 'id').map(col => (
                      <span key={col} className="text-xs text-gray-500">
                        <span className="font-medium">{col.replace(/_/g, ' ')}: </span>
                        {row[col] === null ? '—' : typeof row[col] === 'boolean' ? (row[col] ? 'Yes' : 'No') : String(row[col]).slice(0, 40)}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-gray-400 text-xs flex-shrink-0 ml-2">{expandedId === (row.id ?? i) ? '▲' : '▼'}</span>
              </div>
              {expandedId === (row.id ?? i) && (
                <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                  {summaryCols.filter(c => c !== 'id').map(col => (
                    <div key={col} className="flex gap-3">
                      <span className="text-xs font-medium text-gray-500 w-36 flex-shrink-0 capitalize">{col.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-700">
                        {row[col] === null || row[col] === undefined ? <span className="text-gray-300 italic">null</span> : String(row[col])}
                      </span>
                    </div>
                  ))}
                  {contentCols.map(col => (
                    <div key={col}>
                      <p className="text-xs font-medium text-gray-500 mb-1 capitalize">{col.replace(/_/g, ' ')}</p>
                      <pre className="text-xs text-gray-700 bg-gray-50 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-48">
                        {typeof row[col] === 'object' ? JSON.stringify(row[col], null, 2) : String(row[col] ?? '')}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            ← Previous
          </button>
          <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= totalCount}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
