'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

type Term = {
  id: string | number
  title: string
  content: string
  version?: string
  is_active?: boolean
  created_at?: string
  [key: string]: any
}

export default function TermsPage() {
  const supabase = createClient()
  const [terms, setTerms] = useState<Term[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [editTerm, setEditTerm] = useState<Term | null>(null)
  const [deleteTerm, setDeleteTerm] = useState<Term | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formVersion, setFormVersion] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchTerms() {
    setLoading(true)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('terms').select('*').order('id', { ascending: false }).limit(500),
      supabase.from('terms').select('*', { count: 'exact', head: true }),
    ])
    setTotalCount(count ?? 0)
    setTerms(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTerms() }, [])

  function openAdd() {
    setFormTitle(''); setFormContent(''); setFormVersion(''); setFormActive(true); setShowAdd(true)
  }

  function openEdit(t: Term) {
    setFormTitle(t.title || ''); setFormContent(t.content || ''); setFormVersion(t.version || ''); setFormActive(t.is_active ?? true); setEditTerm(t)
  }

  async function handleCreate() {
    if (!formTitle.trim()) return
    setSaving(true)
    const { error } = await supabase.from('terms').insert({
      title: formTitle.trim(),
      content: formContent.trim(),
      ...(formVersion.trim() ? { version: formVersion.trim() } : {}),
      is_active: formActive,
    })
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    await fetchTerms()
  }

  async function handleUpdate() {
    if (!editTerm || !formTitle.trim()) return
    setSaving(true)
    const { error } = await supabase.from('terms').update({
      title: formTitle.trim(),
      content: formContent.trim(),
      ...(formVersion.trim() ? { version: formVersion.trim() } : {}),
      is_active: formActive,
    }).eq('id', editTerm.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditTerm(null)
    await fetchTerms()
  }

  async function handleDelete() {
    if (!deleteTerm) return
    setDeleting(true)
    const { error } = await supabase.from('terms').delete().eq('id', deleteTerm.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteTerm(null)
    await fetchTerms()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Terms</h1>
        <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
          + Add Term
        </button>
      </div>
      <p className="text-gray-400 mb-8">{totalCount} term{totalCount !== 1 ? 's' : ''}</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {terms.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No terms found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Content</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Active</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {terms.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800 max-w-[200px]">
                      <p className="line-clamp-2">{t.title}</p>
                      {t.version && <p className="text-xs text-gray-400">v{t.version}</p>}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs">
                      <p className="line-clamp-2 text-xs">{t.content}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.is_active
                        ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEdit(t)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                        <button onClick={() => setDeleteTerm(t)} className="text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(showAdd || editTerm) && (
        <Modal title={showAdd ? 'Add Term' : 'Edit Term'} onClose={() => { setShowAdd(false); setEditTerm(null) }}>
          <div className="space-y-4">
            <Field label="Title *">
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Terms of Service"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Version">
              <input type="text" value={formVersion} onChange={e => setFormVersion(e.target.value)} placeholder="e.g. 1.0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Content">
              <textarea value={formContent} onChange={e => setFormContent(e.target.value)} rows={6} placeholder="Term content..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditTerm(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={showAdd ? handleCreate : handleUpdate} disabled={saving || !formTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : showAdd ? 'Add Term' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTerm && (
        <Modal title="Delete Term" onClose={() => setDeleteTerm(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Delete <strong>"{deleteTerm.title}"</strong>? This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTerm(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
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
