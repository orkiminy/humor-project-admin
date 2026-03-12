'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

type Provider = {
  id: string | number
  name: string
  description?: string | null
  api_base_url?: string | null
  is_active?: boolean
  [key: string]: any
}

export default function LLMProvidersPage() {
  const supabase = createClient()
  const [providers, setProviders] = useState<Provider[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [editP, setEditP] = useState<Provider | null>(null)
  const [deleteP, setDeleteP] = useState<Provider | null>(null)

  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchProviders() {
    setLoading(true)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('llm_providers').select('*').order('id').limit(500),
      supabase.from('llm_providers').select('*', { count: 'exact', head: true }),
    ])
    setTotalCount(count ?? 0)
    setProviders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProviders() }, [])

  function openAdd() {
    setFormName(''); setFormDesc(''); setFormUrl(''); setFormActive(true); setShowAdd(true)
  }

  function openEdit(p: Provider) {
    setFormName(p.name || ''); setFormDesc(p.description || ''); setFormUrl(p.api_base_url || ''); setFormActive(p.is_active ?? true); setEditP(p)
  }

  function buildPayload() {
    return {
      name: formName.trim(),
      description: formDesc.trim() || null,
      api_base_url: formUrl.trim() || null,
      is_active: formActive,
    }
  }

  async function handleCreate() {
    if (!formName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('llm_providers').insert(buildPayload())
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    await fetchProviders()
  }

  async function handleUpdate() {
    if (!editP || !formName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('llm_providers').update(buildPayload()).eq('id', editP.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditP(null)
    await fetchProviders()
  }

  async function handleDelete() {
    if (!deleteP) return
    setDeleting(true)
    const { error } = await supabase.from('llm_providers').delete().eq('id', deleteP.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteP(null)
    await fetchProviders()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">LLM Providers</h1>
        <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
          + Add Provider
        </button>
      </div>
      <p className="text-gray-400 mb-8">{totalCount} provider{totalCount !== 1 ? 's' : ''}</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {providers.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No LLM providers found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Description</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">API Base URL</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Active</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {providers.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs"><p className="line-clamp-2 text-xs">{p.description || <span className="text-gray-300 italic">—</span>}</p></td>
                    <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px] truncate">{p.api_base_url || <span className="text-gray-300 italic">—</span>}</td>
                    <td className="px-4 py-3 text-center">
                      {p.is_active !== undefined && (p.is_active
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEdit(p)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                        <button onClick={() => setDeleteP(p)} className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(showAdd || editP) && (
        <Modal title={showAdd ? 'Add LLM Provider' : 'Edit LLM Provider'} onClose={() => { setShowAdd(false); setEditP(null) }}>
          <div className="space-y-4">
            <Field label="Name *">
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. OpenAI"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Description">
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} placeholder="Optional description..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <Field label="API Base URL">
              <input type="url" value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://api.example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditP(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={showAdd ? handleCreate : handleUpdate} disabled={saving || !formName.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : showAdd ? 'Add Provider' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteP && (
        <Modal title="Delete Provider" onClose={() => setDeleteP(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Delete provider <strong>"{deleteP.name}"</strong>? This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteP(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
