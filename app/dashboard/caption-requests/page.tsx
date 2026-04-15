'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'
import Pagination from '../_components/Pagination'
import ExportCsvButton from '../_components/ExportCsvButton'
import { getRange } from '@/utils/pagination'

const PAGE_SIZE = 25

export default function CaptionRequestsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        .from('caption_requests')
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
  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caption Requests</h1>
          <p className="text-gray-400 mt-1">{totalCount.toLocaleString()} total requests</p>
        </div>
        <ExportCsvButton
          table="caption_requests"
          filename="caption-requests"
          filterBuilder={q => q.order('id', { ascending: false })}
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No caption requests found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {cols.map(col => (
                    <th key={col} className="text-left px-5 py-3 font-semibold text-gray-600 capitalize whitespace-nowrap">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row, i) => (
                  <tr key={row.id ?? i} className="hover:bg-gray-50/50" data-testid="request-row">
                    {cols.map(col => (
                      <td key={col} className="px-5 py-3 text-gray-700 max-w-xs">
                        <span className="line-clamp-2">
                          {row[col] === null || row[col] === undefined
                            ? <span className="text-gray-300 italic">null</span>
                            : col === 'status'
                              ? <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  String(row[col]) === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  String(row[col]) === 'completed' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-500'}`}>{String(row[col])}</span>
                              : typeof row[col] === 'boolean'
                                ? <span className={row[col] ? 'text-green-600' : 'text-gray-400'}>{row[col] ? 'Yes' : 'No'}</span>
                                : typeof row[col] === 'object'
                                  ? JSON.stringify(row[col])
                                  : String(row[col])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        loading={loading}
        itemLabel="requests"
      />
    </div>
  )
}
