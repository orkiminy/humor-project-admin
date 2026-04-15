'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'
import Pagination from '../_components/Pagination'
import ExportCsvButton from '../_components/ExportCsvButton'
import { getRange } from '@/utils/pagination'

const PAGE_SIZE = 24

type Image = {
  id: string
  url: string
  image_description: string | null
  caption_count?: number
}

export default function ImagesPage() {
  const supabase = createClient()
  const [images, setImages] = useState<Image[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Modal state
  const [showAdd, setShowAdd] = useState(false)
  const [editImage, setEditImage] = useState<Image | null>(null)
  const [deleteImage, setDeleteImage] = useState<Image | null>(null)
  const [previewImage, setPreviewImage] = useState<Image | null>(null)

  // Form state
  const [formUrl, setFormUrl] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchImages() {
    setLoading(true)
    const { from, to } = getRange(page, PAGE_SIZE)
    const [{ data }, { count }] = await Promise.all([
      supabase.from('images').select('id, url, image_description').order('created_datetime_utc', { ascending: false, nullsFirst: false }).range(from, to),
      supabase.from('images').select('*', { count: 'exact', head: true }),
    ])
    setTotalCount(count ?? 0)
    const ids = (data || []).map(i => i.id)
    const { data: capData } = ids.length
      ? await supabase.from('captions').select('image_id').in('image_id', ids)
      : { data: [] }
    const countMap = new Map<string, number>()
    for (const c of capData || []) {
      countMap.set(c.image_id, (countMap.get(c.image_id) || 0) + 1)
    }
    setImages((data || []).map(img => ({ ...img, caption_count: countMap.get(img.id) || 0 })))
    setLoading(false)
  }

  useEffect(() => { fetchImages() }, [page])

  const openAdd = () => {
    setFormUrl(''); setFormDesc(''); setUploadStatus(null)
    setPendingFile(null); setPreviewUrl(null); setShowAdd(true)
  }

  function handleFileSelect(file: File) {
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setFormUrl('') // clear URL field when file is chosen
  }

  const openEdit = (img: Image) => { setFormUrl(img.url); setFormDesc(img.image_description || ''); setEditImage(img) }

  async function handleCreate() {
    if (!formUrl.trim() && !pendingFile) return
    setSaving(true)
    try {
      // If a file was selected, upload it first
      if (pendingFile) {
        const BASE_URL = 'https://api.almostcrackd.ai'
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error('Not authenticated')

        setUploadStatus('Getting upload URL...')
        const presignRes = await fetch(`${BASE_URL}/pipeline/generate-presigned-url`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: pendingFile.type }),
        })
        if (!presignRes.ok) {
          const body = await presignRes.text()
          throw new Error(`Presign failed (${presignRes.status}): ${body}`)
        }
        const { presignedUrl, cdnUrl } = await presignRes.json()

        setUploadStatus('Uploading image...')
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': pendingFile.type },
          body: pendingFile,
        })
        if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`)

        // Insert directly to Supabase so we own the row and can set the description
        setUploadStatus('Saving...')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        let profileId = user.id
        const { data: p2 } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (p2) profileId = p2.id
        const now = new Date().toISOString()
        const { error: insertError } = await supabase.from('images').insert({
          url: cdnUrl,
          image_description: formDesc.trim() || null,
          profile_id: profileId,
          is_public: true,
          is_common_use: true,
          created_datetime_utc: now,
          modified_datetime_utc: now,
        })
        if (insertError) throw new Error(insertError.message)
      } else {
        // URL-based add
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        let profileId = user.id
        const { data: p2 } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (p2) profileId = p2.id
        const now = new Date().toISOString()
        const { error } = await supabase.from('images').insert({
          url: formUrl.trim(),
          image_description: formDesc.trim() || null,
          profile_id: profileId,
          is_public: true,
          is_common_use: true,
          created_datetime_utc: now,
          modified_datetime_utc: now,
        })
        if (error) throw new Error(error.message)
      }

      setUploadStatus(null)
      setPendingFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowAdd(false)
      await fetchImages()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
      setUploadStatus(null)
    }
  }

  async function handleUpdate() {
    if (!editImage || !formUrl.trim()) return
    setSaving(true)
    const { error } = await supabase.from('images').update({
      url: formUrl.trim(),
      image_description: formDesc.trim() || null,
      modified_datetime_utc: new Date().toISOString(),
    }).eq('id', editImage.id)
    setSaving(false)
    if (error) { alert('Error: ' + error.message); return }
    setEditImage(null)
    await fetchImages()
  }

  async function handleDelete() {
    if (!deleteImage) return
    setDeleting(true)
    const { error } = await supabase.from('images').delete().eq('id', deleteImage.id)
    setDeleting(false)
    if (error) { alert('Error: ' + error.message); return }
    setDeleteImage(null)
    await fetchImages()
  }

  const filtered = images.filter(img =>
    !search ||
    img.url.toLowerCase().includes(search.toLowerCase()) ||
    (img.image_description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Images</h1>
          <p className="text-gray-400 mt-1">{totalCount} total images</p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            table="images"
            filename="images"
            columns={['id', 'url', 'image_description', 'is_public', 'created_datetime_utc']}
            filterBuilder={q => q.order('created_datetime_utc', { ascending: false, nullsFirst: false })}
          />
          <button onClick={openAdd} className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm">
            + Add Image
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search by URL or description..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {loading ? (
        <p className="text-gray-400">Loading images...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="col-span-full text-gray-400 text-center py-16">No images found</p>
          ) : filtered.map(img => (
            <div key={img.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <img
                src={img.url}
                alt=""
                className="w-full aspect-video object-cover bg-gray-100 cursor-zoom-in"
                onClick={() => setPreviewImage(img)}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x225?text=No+Image' }}
              />
              <div className="p-4">
                <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]">
                  {img.image_description || <span className="text-gray-400 italic">No description</span>}
                </p>
                <p className="text-xs text-gray-400 mt-2">{img.caption_count} caption{img.caption_count !== 1 ? 's' : ''}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(img)} className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => setDeleteImage(img)} className="flex-1 text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        loading={loading}
        itemLabel="images"
      />

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Image" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!uploadStatus}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors disabled:opacity-50"
            >
              {uploadStatus ? `⏳ ${uploadStatus}` : '📁 Choose file from computer'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or paste a URL</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Field label="Image URL">
              <input type="url" value={formUrl} onChange={e => setFormUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            {(previewUrl || formUrl) && (
              <img src={previewUrl || formUrl} alt="" className="w-full aspect-video object-cover rounded-xl bg-gray-100" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
            {pendingFile && (
              <p className="text-xs text-green-600 font-medium">✓ {pendingFile.name} selected</p>
            )}
            <Field label="Description">
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)}
                placeholder="Optional description..." rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving || (!formUrl.trim() && !pendingFile)} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {uploadStatus || (saving ? 'Saving...' : 'Add Image')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editImage && (
        <Modal title="Edit Image" onClose={() => setEditImage(null)}>
          <div className="space-y-4">
            <Field label="Image URL *">
              <input type="url" value={formUrl} onChange={e => setFormUrl(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </Field>
            {formUrl && <img src={formUrl} alt="" className="w-full aspect-video object-cover rounded-xl bg-gray-100" onError={e => (e.currentTarget.style.display = 'none')} />}
            <Field label="Description">
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditImage(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdate} disabled={saving || !formUrl.trim()} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
          data-testid="image-preview-modal"
        >
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={previewImage.url}
              alt=""
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x450?text=No+Image' }}
            />
            <div className="mt-4 bg-white rounded-xl px-5 py-3 shadow-lg max-w-2xl">
              <p className="text-sm text-gray-800">
                {previewImage.image_description || <span className="text-gray-400 italic">No description</span>}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="font-mono truncate max-w-[300px]">{previewImage.id}</span>
                <span>·</span>
                <span>{previewImage.caption_count ?? 0} caption{previewImage.caption_count !== 1 ? 's' : ''}</span>
                <span>·</span>
                <a href={previewImage.url} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">open original</a>
              </div>
            </div>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteImage && (
        <Modal title="Delete Image" onClose={() => setDeleteImage(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Are you sure? This will also delete all captions for this image. This cannot be undone.
            </div>
            <img src={deleteImage.url} alt="" className="w-full aspect-video object-cover rounded-xl bg-gray-100" />
            <div className="flex gap-3">
              <button onClick={() => setDeleteImage(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
