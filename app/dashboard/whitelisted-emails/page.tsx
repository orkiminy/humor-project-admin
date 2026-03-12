'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

type WhitelistedEmail = {
  id: string | number
  email_address: string
  created_datetime_utc?: string
  [key: string]: any
}

const TABLE_NAME = 'whitelist_email_addresses'

export default function WhitelistedEmailsPage() {
  const supabase = createClient()
  const [emails, setEmails] = useState<WhitelistedEmail[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableName] = useState(TABLE_NAME)
  const [search, setSearch] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [editE, setEditE] = useState<WhitelistedEmail | null>(null)
  const [deleteE, setDeleteE] = useState<WhitelistedEmail | null>(null)

  const [formEmail, setFormEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchEmails(tbl = tableName) {
    setLoading(true)
    const { data, error: err, count } = await supabase.from(tbl).select('*', { count: 'exact' }).order('email_address').limit(500)
    if (err) {
      setError(err.message)
    } else {
      setEmails(data || [])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchEmails() }, [])

  function openAdd() { setFormEmail(''); setShowAdd(true) }
  function openEdit(e: WhitelistedEmail) { setFormEmail(e.email_address || ''); setEditE(e) }

  async function handleCreate() {
    if (!formEmail.trim()) return
    setSaving(true)
    const { error } = await supabase.from(tableName).insert({ email_address: formEmail.trim().toLowerCase() })
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    await fetchEmails()
  }

  async function handleUpdate() {
    if (!editE || !formEmail.trim()) return
    setSaving(true)
    const { error } = await supabase.from(tableName).update({ email_address: formEmail.trim().toLowerCase() }).eq('id', editE.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditE(null)
    await fetchEmails()
  }

  async function handleDelete() {
    if (!deleteE) return
    setDeleting(true)
    const { error } = await supabase.from(tableName).delete().eq('id', deleteE.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteE(null)
    await fetchEmails()
  }

  const filtered = emails.filter(e => !search || (e.email_address || '').toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Whitelisted Emails</h1>
        <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
          + Add Email
        </button>
      </div>
      <p className="text-gray-400 mb-6">{totalCount} whitelisted email{totalCount !== 1 ? 's' : ''}</p>

      <input
        type="text"
        placeholder="Search emails..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-gray-400 text-center text-sm">No whitelisted emails found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Added</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-mono text-sm text-gray-800">{e.email_address}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {e.created_datetime_utc ? new Date(e.created_datetime_utc).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openEdit(e)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                      <button onClick={() => setDeleteE(e)} className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {filtered.length !== emails.length && (
        <p className="text-xs text-gray-400 mt-3 text-right">Showing {filtered.length} of {totalCount}</p>
      )}

      {(showAdd || editE) && (
        <Modal title={showAdd ? 'Add Whitelisted Email' : 'Edit Email'} onClose={() => { setShowAdd(false); setEditE(null) }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 font-mono"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditE(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={showAdd ? handleCreate : handleUpdate} disabled={saving || !formEmail.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : showAdd ? 'Add Email' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteE && (
        <Modal title="Remove Email" onClose={() => setDeleteE(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Remove <strong className="font-mono">{deleteE.email}</strong> from the whitelist? This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteE(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
