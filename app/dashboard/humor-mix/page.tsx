'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

export default function HumorMixPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<any | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function fetchRows() {
    setLoading(true)
    const { data, error: err } = await supabase.from('humor_flavor_mix').select('*').order('id')
    if (err) setError(err.message)
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRows() }, [])

  const cols = rows.length > 0 ? Object.keys(rows[0]) : []
  const editableCols = cols.filter(c => c !== 'id' && !c.includes('created') && !c.includes('profile_id'))

  function openEdit(row: any) {
    setEditRow(row)
    const vals: Record<string, string> = {}
    editableCols.forEach(c => { vals[c] = row[c] === null || row[c] === undefined ? '' : String(row[c]) })
    setEditValues(vals)
  }

  async function handleUpdate() {
    if (!editRow) return
    setSaving(true)
    const updates: Record<string, any> = {}
    editableCols.forEach(c => {
      const v = editValues[c]
      if (v === '') updates[c] = null
      else if (v === 'true') updates[c] = true
      else if (v === 'false') updates[c] = false
      else if (!isNaN(Number(v)) && v !== '') updates[c] = Number(v)
      else updates[c] = v
    })
    const { error: err } = await supabase.from('humor_flavor_mix').update(updates).eq('id', editRow.id)
    setSaving(false)
    if (err) { alert('Error: ' + err.message); return }
    setEditRow(null)
    await fetchRows()
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Humor Mix</h1>
      <p className="text-gray-400 mb-8">{rows.length} row{rows.length !== 1 ? 's' : ''}</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-gray-400 text-center text-sm">No humor mix data found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {cols.map(col => (
                  <th key={col} className="text-left px-5 py-3 font-semibold text-gray-600 capitalize whitespace-nowrap">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="px-5 py-3 text-gray-600 font-semibold">Actions</th>
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
                  <td className="px-5 py-3">
                    <button onClick={() => openEdit(row)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Edit Humor Mix (ID: {editRow.id})</h3>
              <button onClick={() => setEditRow(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {editableCols.map(col => (
                <div key={col}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{col.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    value={editValues[col] || ''}
                    onChange={e => setEditValues(v => ({ ...v, [col]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditRow(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpdate} disabled={saving} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
