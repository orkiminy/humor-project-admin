'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

type LLMModel = {
  id: string | number
  name: string
  model_identifier?: string | null
  provider_id?: string | number | null
  description?: string | null
  is_active?: boolean
  [key: string]: any
}

export default function LLMModelsPage() {
  const supabase = createClient()
  const [models, setModels] = useState<LLMModel[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [editM, setEditM] = useState<LLMModel | null>(null)
  const [deleteM, setDeleteM] = useState<LLMModel | null>(null)

  const [formName, setFormName] = useState('')
  const [formModelId, setFormModelId] = useState('')
  const [formProviderId, setFormProviderId] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchModels() {
    setLoading(true)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('llm_models').select('*').order('id').limit(500),
      supabase.from('llm_models').select('*', { count: 'exact', head: true }),
    ])
    setTotalCount(count ?? 0)
    setModels(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchModels() }, [])

  function openAdd() {
    setFormName(''); setFormModelId(''); setFormProviderId(''); setFormDesc(''); setFormActive(true); setShowAdd(true)
  }

  function openEdit(m: LLMModel) {
    setFormName(m.name || ''); setFormModelId(m.model_identifier || ''); setFormProviderId(m.provider_id ? String(m.provider_id) : ''); setFormDesc(m.description || ''); setFormActive(m.is_active ?? true); setEditM(m)
  }

  function buildPayload() {
    return {
      name: formName.trim(),
      model_identifier: formModelId.trim() || null,
      provider_id: formProviderId.trim() ? (Number(formProviderId) || formProviderId.trim()) : null,
      description: formDesc.trim() || null,
      is_active: formActive,
    }
  }

  async function handleCreate() {
    if (!formName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('llm_models').insert(buildPayload())
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    await fetchModels()
  }

  async function handleUpdate() {
    if (!editM || !formName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('llm_models').update(buildPayload()).eq('id', editM.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditM(null)
    await fetchModels()
  }

  async function handleDelete() {
    if (!deleteM) return
    setDeleting(true)
    const { error } = await supabase.from('llm_models').delete().eq('id', deleteM.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteM(null)
    await fetchModels()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">LLM Models</h1>
        <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
          + Add Model
        </button>
      </div>
      <p className="text-gray-400 mb-8">{totalCount} model{totalCount !== 1 ? 's' : ''}</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {models.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No LLM models found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Model ID</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Provider</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Active</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {models.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{m.model_identifier || <span className="text-gray-300 italic">—</span>}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{m.provider_id || <span className="text-gray-300 italic">—</span>}</td>
                    <td className="px-4 py-3 text-center">
                      {m.is_active !== undefined && (m.is_active
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEdit(m)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                        <button onClick={() => setDeleteM(m)} className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(showAdd || editM) && (
        <Modal title={showAdd ? 'Add LLM Model' : 'Edit LLM Model'} onClose={() => { setShowAdd(false); setEditM(null) }}>
          <div className="space-y-4">
            <Field label="Name *">
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. GPT-4o"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Model Identifier">
              <input type="text" value={formModelId} onChange={e => setFormModelId(e.target.value)} placeholder="e.g. gpt-4o"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Provider ID">
              <input type="text" value={formProviderId} onChange={e => setFormProviderId(e.target.value)} placeholder="e.g. 1"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Description">
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} placeholder="Optional description..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditM(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={showAdd ? handleCreate : handleUpdate} disabled={saving || !formName.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : showAdd ? 'Add Model' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteM && (
        <Modal title="Delete LLM Model" onClose={() => setDeleteM(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Delete model <strong>"{deleteM.name}"</strong>? This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteM(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
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
