'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'
import Pagination from '../_components/Pagination'
import ExportCsvButton from '../_components/ExportCsvButton'
import { getRange } from '@/utils/pagination'

const PAGE_SIZE = 25

export default function LLMResponsesPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      setError(null)
      const { from, to } = getRange(page, PAGE_SIZE)
      const { data, error, count } = await supabase
        .from('llm_model_responses')
        .select('*', { count: 'exact' })
        .order('id', { ascending: false })
        .range(from, to)
      if (cancelled) return
      if (error) setError(error.message)
      else {
        setRows(data || [])
        setTotalCount(count ?? 0)
      }
      setLoading(false)
    }
    fetch()
    return () => { cancelled = true }
  }, [page])

  const cols = rows.length > 0 ? Object.keys(rows[0]) : []
  const summaryCols = cols.filter(c => !['input', 'output', 'prompt', 'response', 'completion', 'content', 'text', 'llm_system_prompt', 'llm_user_prompt', 'llm_model_response'].includes(c))
  const contentCols = cols.filter(c => ['input', 'output', 'prompt', 'response', 'completion', 'content', 'text', 'llm_system_prompt', 'llm_user_prompt', 'llm_model_response'].includes(c))

  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">LLM Responses</h1>
          <p className="text-gray-400 mt-1">{totalCount.toLocaleString()} total responses</p>
        </div>
        <ExportCsvButton
          table="llm_model_responses"
          filename="llm-responses"
          columns={['id', 'caption_request_id', 'llm_model_id', 'llm_prompt_chain_id', 'humor_flavor_id', 'processing_time_seconds', 'created_datetime_utc']}
          filterBuilder={q => q.order('created_datetime_utc', { ascending: false })}
          maxRows={5000}
        />
      </div>

      <input
        type="text"
        placeholder="Search within this page..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-sm">Error: {error}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-400 text-sm">
          No LLM responses found
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row, i) => {
            const key = row.id ?? i
            const isExpanded = expandedId === key
            return (
              <div key={key} data-testid="response-row" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div
                  className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : key)}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <span className="font-mono text-xs text-gray-400 flex-shrink-0 truncate max-w-[100px]">{String(row.id ?? '').slice(0, 8)}</span>
                    <div className="flex flex-wrap gap-3 overflow-hidden">
                      {summaryCols.slice(0, 4).filter(c => c !== 'id').map(col => (
                        <span key={col} className="text-xs text-gray-500">
                          <span className="font-medium">{col.replace(/_/g, ' ')}: </span>
                          {row[col] === null ? '—' : typeof row[col] === 'boolean' ? (row[col] ? 'Yes' : 'No') : String(row[col]).slice(0, 40)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs flex-shrink-0 ml-2">{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && (
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
                        <pre className="text-xs text-gray-700 bg-gray-50 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-60">
                          {typeof row[col] === 'object' ? JSON.stringify(row[col], null, 2) : String(row[col] ?? '')}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        loading={loading}
        itemLabel="responses"
      />
    </div>
  )
}
