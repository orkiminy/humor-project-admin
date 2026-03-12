'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

export default function CaptionRequestsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const [{ data }, { count }] = await Promise.all([
        supabase.from('caption_requests').select('*').order('id', { ascending: false }).limit(500),
        supabase.from('caption_requests').select('*', { count: 'exact', head: true }),
      ])
      if (data === null) {
        // Try alternate table name
        const { data: d2, error: e2 } = await supabase.from('caption_request').select('*').order('id', { ascending: false }).limit(500)
        if (e2) setError(e2.message)
        else setRows(d2 || [])
      } else {
        setRows(data)
        setTotalCount(count ?? 0)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  const cols = rows.length > 0 ? Object.keys(rows[0]) : []
  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Caption Requests</h1>
      <p className="text-gray-400 mb-6">{totalCount} total requests</p>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

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
                <tr key={i} className="hover:bg-gray-50/50">
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
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">Showing {filtered.length} of {totalCount}</p>
      )}
    </div>
  )
}
