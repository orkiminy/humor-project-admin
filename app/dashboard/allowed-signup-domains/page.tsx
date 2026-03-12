'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

type Domain = {
  id: string | number
  domain: string
  created_at?: string
  [key: string]: any
}

export default function AllowedSignupDomainsPage() {
  const supabase = createClient()
  const [domains, setDomains] = useState<Domain[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [editD, setEditD] = useState<Domain | null>(null)
  const [deleteD, setDeleteD] = useState<Domain | null>(null)

  const [formDomain, setFormDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchDomains() {
    setLoading(true)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('allowed_signup_domains').select('*').order('domain').limit(500),
      supabase.from('allowed_signup_domains').select('*', { count: 'exact', head: true }),
    ])
    setTotalCount(count ?? 0)
    setDomains(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDomains() }, [])

  function openAdd() { setFormDomain(''); setShowAdd(true) }
  function openEdit(d: Domain) { setFormDomain(d.domain || ''); setEditD(d) }

  async function handleCreate() {
    if (!formDomain.trim()) return
    setSaving(true)
    const { error } = await supabase.from('allowed_signup_domains').insert({ domain: formDomain.trim().toLowerCase() })
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    await fetchDomains()
  }

  async function handleUpdate() {
    if (!editD || !formDomain.trim()) return
    setSaving(true)
    const { error } = await supabase.from('allowed_signup_domains').update({ domain: formDomain.trim().toLowerCase() }).eq('id', editD.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditD(null)
    await fetchDomains()
  }

  async function handleDelete() {
    if (!deleteD) return
    setDeleting(true)
    const { error } = await supabase.from('allowed_signup_domains').delete().eq('id', deleteD.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteD(null)
    await fetchDomains()
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Allowed Signup Domains</h1>
        <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
          + Add Domain
        </button>
      </div>
      <p className="text-gray-400 mb-8">{totalCount} domain{totalCount !== 1 ? 's' : ''} allowed</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {domains.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No domains configured — all domains allowed</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Domain</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Added</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {domains.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-mono text-sm text-gray-800">{d.domain}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEdit(d)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                        <button onClick={() => setDeleteD(d)} className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(showAdd || editD) && (
        <Modal title={showAdd ? 'Add Allowed Domain' : 'Edit Domain'} onClose={() => { setShowAdd(false); setEditD(null) }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
              <input
                type="text"
                value={formDomain}
                onChange={e => setFormDomain(e.target.value)}
                placeholder="e.g. columbia.edu"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Enter the domain without @ symbol</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditD(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={showAdd ? handleCreate : handleUpdate} disabled={saving || !formDomain.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : showAdd ? 'Add Domain' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteD && (
        <Modal title="Remove Domain" onClose={() => setDeleteD(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Remove <strong className="font-mono">{deleteD.domain}</strong> from allowed domains? This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteD(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
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
