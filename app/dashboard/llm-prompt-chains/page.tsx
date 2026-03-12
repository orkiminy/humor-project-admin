'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

export default function LLMPromptChainsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<any>(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const [{ data, error: err }, { count }] = await Promise.all([
        supabase.from('llm_prompt_chains').select('*').order('id').limit(500),
        supabase.from('llm_prompt_chains').select('*', { count: 'exact', head: true }),
      ])
      if (err) setError(err.message)
      else { setRows(data || []); setTotalCount(count ?? 0) }
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  const cols = rows.length > 0 ? Object.keys(rows[0]) : []
  const mainCols = cols.filter(c => !['chain', 'steps', 'config', 'prompts', 'template'].includes(c))
  const longCols = cols.filter(c => ['chain', 'steps', 'config', 'prompts', 'template'].includes(c))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">LLM Prompt Chains</h1>
      <p className="text-gray-400 mb-8">{totalCount} chain{totalCount !== 1 ? 's' : ''}</p>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-400 text-sm">
          No prompt chains found
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === (row.id ?? i) ? null : (row.id ?? i))}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-gray-400 w-8">{row.id ?? i + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{row.name || row.title || `Chain ${i + 1}`}</p>
                    {row.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{row.description}</p>}
                  </div>
                </div>
                <span className="text-gray-400 text-xs">{expandedId === (row.id ?? i) ? '▲' : '▼'}</span>
              </div>
              {expandedId === (row.id ?? i) && (
                <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                  {mainCols.filter(c => c !== 'name' && c !== 'title' && c !== 'description').map(col => (
                    <div key={col} className="flex gap-3">
                      <span className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 capitalize">{col.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-700">
                        {row[col] === null || row[col] === undefined
                          ? <span className="text-gray-300 italic">null</span>
                          : typeof row[col] === 'boolean'
                            ? (row[col] ? 'Yes' : 'No')
                            : String(row[col])}
                      </span>
                    </div>
                  ))}
                  {longCols.map(col => (
                    <div key={col}>
                      <p className="text-xs font-medium text-gray-500 mb-1 capitalize">{col.replace(/_/g, ' ')}</p>
                      <pre className="text-xs text-gray-700 bg-gray-50 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
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
    </div>
  )
}
