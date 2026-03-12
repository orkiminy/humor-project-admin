'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

type CaptionExample = {
  id: string | number
  content: string
  image_id?: string | null
  humor_flavor_id?: string | number | null
  is_active?: boolean
  [key: string]: any
}

export default function CaptionExamplesPage() {
  const supabase = createClient()
  const [examples, setExamples] = useState<CaptionExample[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [editEx, setEditEx] = useState<CaptionExample | null>(null)
  const [deleteEx, setDeleteEx] = useState<CaptionExample | null>(null)

  const [formContent, setFormContent] = useState('')
  const [formImageId, setFormImageId] = useState('')
  const [formFlavorId, setFormFlavorId] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchExamples() {
    setLoading(true)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('caption_examples').select('*').order('id', { ascending: false }).limit(500),
      supabase.from('caption_examples').select('*', { count: 'exact', head: true }),
    ])
    setTotalCount(count ?? 0)
    setExamples(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchExamples() }, [])

  function openAdd() {
    setFormContent(''); setFormImageId(''); setFormFlavorId(''); setFormActive(true); setShowAdd(true)
  }

  function openEdit(ex: CaptionExample) {
    setFormContent(ex.content || ''); setFormImageId(ex.image_id || ''); setFormFlavorId(ex.humor_flavor_id ? String(ex.humor_flavor_id) : ''); setFormActive(ex.is_active ?? true); setEditEx(ex)
  }

  function buildPayload() {
    return {
      content: formContent.trim(),
      ...(formImageId.trim() ? { image_id: formImageId.trim() } : { image_id: null }),
      ...(formFlavorId.trim() ? { humor_flavor_id: Number(formFlavorId) || formFlavorId.trim() } : {}),
      is_active: formActive,
    }
  }

  async function handleCreate() {
    if (!formContent.trim()) return
    setSaving(true)
    const { error } = await supabase.from('caption_examples').insert(buildPayload())
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    await fetchExamples()
  }

  async function handleUpdate() {
    if (!editEx || !formContent.trim()) return
    setSaving(true)
    const { error } = await supabase.from('caption_examples').update(buildPayload()).eq('id', editEx.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditEx(null)
    await fetchExamples()
  }

  async function handleDelete() {
    if (!deleteEx) return
    setDeleting(true)
    const { error } = await supabase.from('caption_examples').delete().eq('id', deleteEx.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteEx(null)
    await fetchExamples()
  }

  const filtered = examples.filter(ex =>
    !search || ex.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Caption Examples</h1>
        <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
          + Add Example
        </button>
      </div>
      <p className="text-gray-400 mb-6">{totalCount} total examples</p>

      <input
        type="text"
        placeholder="Search by content..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No caption examples found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Content</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Image ID</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Active</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-800 max-w-xs">
                      <p className="line-clamp-2">{ex.content}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[120px] truncate">
                      {ex.image_id || <span className="text-gray-300 italic">none</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ex.is_active !== undefined && (ex.is_active
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEdit(ex)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                        <button onClick={() => setDeleteEx(ex)} className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(showAdd || editEx) && (
        <Modal title={showAdd ? 'Add Caption Example' : 'Edit Caption Example'} onClose={() => { setShowAdd(false); setEditEx(null) }}>
          <div className="space-y-4">
            <Field label="Content *">
              <textarea value={formContent} onChange={e => setFormContent(e.target.value)} rows={4} placeholder="Example caption text..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <Field label="Image ID (optional)">
              <input type="text" value={formImageId} onChange={e => setFormImageId(e.target.value)} placeholder="UUID of the image"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Humor Flavor ID (optional)">
              <input type="text" value={formFlavorId} onChange={e => setFormFlavorId(e.target.value)} placeholder="e.g. 1"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditEx(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={showAdd ? handleCreate : handleUpdate} disabled={saving || !formContent.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : showAdd ? 'Add Example' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteEx && (
        <Modal title="Delete Caption Example" onClose={() => setDeleteEx(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Delete this caption example? This cannot be undone.
            </div>
            <p className="text-sm text-gray-700 italic">"{deleteEx.content}"</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEx(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
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
