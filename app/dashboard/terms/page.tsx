'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'
import ExportCsvButton from '../_components/ExportCsvButton'

type Term = {
  id: number
  term: string
  definition: string | null
  example: string | null
  priority: number | null
  term_type_id: number | null
  created_datetime_utc?: string
  modified_datetime_utc?: string
}

type TermType = {
  id: number
  name: string
}

export default function TermsPage() {
  const supabase = createClient()
  const [terms, setTerms] = useState<Term[]>([])
  const [termTypes, setTermTypes] = useState<TermType[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [editTerm, setEditTerm] = useState<Term | null>(null)
  const [deleteTerm, setDeleteTerm] = useState<Term | null>(null)

  const [formTerm, setFormTerm] = useState('')
  const [formDefinition, setFormDefinition] = useState('')
  const [formExample, setFormExample] = useState('')
  const [formPriority, setFormPriority] = useState<string>('50')
  const [formTypeId, setFormTypeId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchAll() {
    setLoading(true)
    const [termsRes, countRes, typesRes] = await Promise.all([
      supabase.from('terms').select('*').order('priority', { ascending: false }).order('id', { ascending: false }).limit(500),
      supabase.from('terms').select('*', { count: 'exact', head: true }),
      supabase.from('term_types').select('id, name').order('name'),
    ])
    setTerms(termsRes.data || [])
    setTotalCount(countRes.count ?? 0)
    setTermTypes(typesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const typeNameById = (id: number | null | undefined) =>
    termTypes.find(t => t.id === id)?.name ?? '—'

  function openAdd() {
    setFormTerm('')
    setFormDefinition('')
    setFormExample('')
    setFormPriority('50')
    setFormTypeId(termTypes[0]?.id?.toString() ?? '')
    setShowAdd(true)
  }

  function openEdit(t: Term) {
    setFormTerm(t.term || '')
    setFormDefinition(t.definition || '')
    setFormExample(t.example || '')
    setFormPriority(t.priority?.toString() ?? '50')
    setFormTypeId(t.term_type_id?.toString() ?? '')
    setEditTerm(t)
  }

  function buildPayload() {
    return {
      term: formTerm.trim(),
      definition: formDefinition.trim() || null,
      example: formExample.trim() || null,
      priority: formPriority ? Number(formPriority) : null,
      term_type_id: formTypeId ? Number(formTypeId) : null,
    }
  }

  async function handleCreate() {
    if (!formTerm.trim()) return
    setSaving(true)
    const { error } = await supabase.from('terms').insert(buildPayload())
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    await fetchAll()
  }

  async function handleUpdate() {
    if (!editTerm || !formTerm.trim()) return
    setSaving(true)
    const { error } = await supabase.from('terms').update(buildPayload()).eq('id', editTerm.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditTerm(null)
    await fetchAll()
  }

  async function handleDelete() {
    if (!deleteTerm) return
    setDeleting(true)
    const { error } = await supabase.from('terms').delete().eq('id', deleteTerm.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteTerm(null)
    await fetchAll()
  }

  const filtered = terms.filter(t =>
    !search ||
    t.term?.toLowerCase().includes(search.toLowerCase()) ||
    t.definition?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Terms</h1>
        <div className="flex gap-2">
          <ExportCsvButton
            table="terms"
            filename="terms"
            columns={['id', 'term', 'definition', 'example', 'priority', 'term_type_id', 'created_datetime_utc']}
            filterBuilder={q => q.order('priority', { ascending: false }).order('id', { ascending: false })}
          />
          <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
            + Add Term
          </button>
        </div>
      </div>
      <p className="text-gray-400 mb-6">{totalCount} term{totalCount !== 1 ? 's' : ''}</p>

      <input
        type="text"
        placeholder="Search term or definition..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No terms found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Term</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Definition</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Example</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Priority</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50" data-testid="term-row">
                    <td className="px-5 py-3 font-semibold text-gray-900">{t.term}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-sm">
                      <p className="line-clamp-2 text-xs">{t.definition || <span className="text-gray-300 italic">none</span>}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-sm">
                      <p className="line-clamp-2 text-xs italic">{t.example || <span className="text-gray-300 not-italic">none</span>}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                        {typeNameById(t.term_type_id)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{t.priority ?? '—'}</td>
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
            <Field label="Term *">
              <input type="text" value={formTerm} onChange={e => setFormTerm(e.target.value)} placeholder="e.g. rizz"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            <Field label="Definition">
              <textarea value={formDefinition} onChange={e => setFormDefinition(e.target.value)} rows={3} placeholder="What does it mean?"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <Field label="Example">
              <textarea value={formExample} onChange={e => setFormExample(e.target.value)} rows={2} placeholder="Used in a sentence..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={formTypeId} onChange={e => setFormTypeId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
                  <option value="">—</option>
                  {termTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                </select>
              </Field>
              <Field label="Priority (0-100)">
                <input type="number" min={0} max={100} value={formPriority} onChange={e => setFormPriority(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAdd(false); setEditTerm(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={showAdd ? handleCreate : handleUpdate} disabled={saving || !formTerm.trim()}
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
              Delete <strong>"{deleteTerm.term}"</strong>? This cannot be undone.
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
