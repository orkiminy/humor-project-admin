'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'
import Pagination from '../_components/Pagination'
import ExportCsvButton from '../_components/ExportCsvButton'
import { getRange } from '@/utils/pagination'

const PAGE_SIZE = 25

type Caption = {
  id: string
  content: string
  is_public: boolean
  image_id: string
  profile_id: string
  upvotes: number
  downvotes: number
  net: number
}

export default function CaptionsPage() {
  const supabase = createClient()
  const [captions, setCaptions] = useState<Caption[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [publicCount, setPublicCount] = useState(0)
  const [privateCount, setPrivateCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState(1)

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1) }, [filter, search])

  useEffect(() => {
    let cancelled = false
    async function fetchCaptions() {
      setLoading(true)
      const { from, to } = getRange(page, PAGE_SIZE)

      // Build data query
      let q = supabase
        .from('captions')
        .select('id, content, is_public, image_id, profile_id, created_datetime_utc')
        .order('created_datetime_utc', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })

      // Build SEPARATE count query with matching filters — don't trust inline count header
      let countQ = supabase
        .from('captions')
        .select('*', { count: 'exact', head: true })

      if (filter === 'public') { q = q.eq('is_public', true); countQ = countQ.eq('is_public', true) }
      if (filter === 'private') { q = q.eq('is_public', false); countQ = countQ.eq('is_public', false) }
      if (search.trim()) { q = q.ilike('content', `%${search.trim()}%`); countQ = countQ.ilike('content', `%${search.trim()}%`) }

      const [pageRes, countRes] = await Promise.all([
        q.range(from, to),
        countQ,
      ])
      if (cancelled) return

      // eslint-disable-next-line no-console
      console.log('[captions-debug]', {
        page,
        from,
        to,
        reportedCount: countRes.count,
        returnedRows: pageRes.data?.length ?? 0,
        error: pageRes.error || countRes.error,
      })

      // Also grab overall public/private counts for the summary cards
      const [pubRes, privRes] = await Promise.all([
        supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', true),
        supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', false),
      ])
      if (cancelled) return

      // Compute total from whichever source is most trustworthy for the current filter.
      // When filter is 'all', public+private is consistent across SQL/PostgREST; use it.
      // When filtered, use the matching count directly.
      const pub = pubRes.count ?? 0
      const priv = privRes.count ?? 0
      let effectiveTotal: number
      if (filter === 'public') effectiveTotal = pub
      else if (filter === 'private') effectiveTotal = priv
      else if (search.trim()) effectiveTotal = countRes.count ?? 0
      else effectiveTotal = pub + priv  // trusted sum for 'all'
      setTotalCount(effectiveTotal)
      setPublicCount(pubRes.count ?? 0)
      setPrivateCount(privRes.count ?? 0)

      // Fetch votes only for captions on this page
      const capRows = pageRes.data || []
      const ids = capRows.map(c => c.id)
      const { data: voteData } = ids.length
        ? await supabase.from('caption_votes').select('caption_id, vote_value').in('caption_id', ids)
        : { data: [] }
      if (cancelled) return

      const result: Caption[] = capRows.map(c => {
        const votes = (voteData || []).filter(v => v.caption_id === c.id)
        const upvotes = votes.filter(v => v.vote_value === 1).length
        const downvotes = votes.filter(v => v.vote_value === -1).length
        return { ...c, upvotes, downvotes, net: upvotes - downvotes }
      })

      setCaptions(result)
      setLoading(false)
    }
    fetchCaptions()
    return () => { cancelled = true }
  }, [page, filter, search])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Captions</h1>
          <p className="text-gray-400 mt-1">{totalCount.toLocaleString()} matching captions</p>
        </div>
        <ExportCsvButton
          table="captions"
          filename="captions"
          columns={['id', 'content', 'is_public', 'image_id', 'profile_id', 'created_datetime_utc']}
          filterBuilder={q => {
            let out = q.order('created_datetime_utc', { ascending: false, nullsFirst: false }).order('id', { ascending: false })
            if (filter === 'public') out = out.eq('is_public', true)
            if (filter === 'private') out = out.eq('is_public', false)
            if (search.trim()) out = out.ilike('content', `%${search.trim()}%`)
            return out
          }}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100" data-testid="stat-card">
          <p className="text-sm text-gray-500">Public</p>
          <p className="text-3xl font-bold text-green-600">{publicCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100" data-testid="stat-card">
          <p className="text-sm text-gray-500">Private</p>
          <p className="text-3xl font-bold text-gray-400">{privateCount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100" data-testid="stat-card">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-bold text-orange-500">{(publicCount + privateCount).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search captions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {(['all', 'public', 'private'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 capitalize transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading captions...</p>
      ) : captions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-sm">
          {page > 1 ? (
            <div>
              <p className="text-gray-500 mb-3">No more results on this page.</p>
              <button
                onClick={() => setPage(1)}
                className="text-orange-500 hover:text-orange-600 font-semibold"
              >
                ← Jump back to page 1
              </button>
            </div>
          ) : (
            <p className="text-gray-400">No captions found</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Caption</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 w-20">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 w-16">Up</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 w-16">Down</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 w-20">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {captions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50" data-testid="caption-row">
                  <td className="px-6 py-3 text-gray-800 max-w-xs">
                    <p className="line-clamp-2">{c.content}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.is_public ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Public</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Private</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-green-600">+{c.upvotes}</td>
                  <td className="px-4 py-3 text-center font-semibold text-red-400">-{c.downvotes}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">
                    {c.net > 0 ? '+' : ''}{c.net}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
        onPageChange={setPage}
        loading={loading}
        itemLabel="captions"
      />
    </div>
  )
}
