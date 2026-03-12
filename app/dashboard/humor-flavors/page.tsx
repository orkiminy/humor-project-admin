'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

export default function HumorFlavorsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('humor_flavors').select('*').order('id').then(({ data, error: err }) => {
      if (err) setError(err.message)
      else setRows(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  const cols = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Humor Flavors</h1>
      <p className="text-gray-400 mb-8">{rows.length} flavor{rows.length !== 1 ? 's' : ''}</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-gray-400 text-center text-sm">No humor flavors found</p>
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
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  {cols.map(col => (
                    <td key={col} className="px-5 py-3 text-gray-700 max-w-xs">
                      <span className="line-clamp-2">
                        {row[col] === null || row[col] === undefined
                          ? <span className="text-gray-300 italic">null</span>
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
    </div>
  )
}
