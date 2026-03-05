'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'

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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')
  const [sortBy, setSortBy] = useState<'net' | 'upvotes' | 'content'>('net')

  useEffect(() => {
    async function fetchCaptions() {
      setLoading(true)

      const [{ data: capData }, { count }] = await Promise.all([
        supabase.from('captions').select('id, content, is_public, image_id, profile_id').limit(500),
        supabase.from('captions').select('*', { count: 'exact', head: true }),
      ])
      setTotalCount(count ?? 0)

      const ids = (capData || []).map(c => c.id)
      const { data: voteData } = ids.length
        ? await supabase.from('caption_votes').select('caption_id, vote_value').in('caption_id', ids)
        : { data: [] }

      const result: Caption[] = (capData || []).map(c => {
        const votes = (voteData || []).filter(v => v.caption_id === c.id)
        const upvotes = votes.filter(v => v.vote_value === 1).length
        const downvotes = votes.filter(v => v.vote_value === -1).length
        return { ...c, upvotes, downvotes, net: upvotes - downvotes }
      })

      setCaptions(result)
      setLoading(false)
    }
    fetchCaptions()
  }, [])

  const filtered = captions
    .filter(c => {
      if (filter === 'public') return c.is_public
      if (filter === 'private') return !c.is_public
      return true
    })
    .filter(c =>
      !search || c.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'net') return b.net - a.net
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes
      return a.content.localeCompare(b.content)
    })

  const publicCount = captions.filter(c => c.is_public).length
  const privateCount = captions.filter(c => !c.is_public).length
  const totalVotes = captions.reduce((sum, c) => sum + c.upvotes + c.downvotes, 0)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Captions</h1>
        <p className="text-gray-400 mt-1">{totalCount} total captions</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Public</p>
          <p className="text-3xl font-bold text-green-600">{publicCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Private</p>
          <p className="text-3xl font-bold text-gray-400">{privateCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Votes Cast</p>
          <p className="text-3xl font-bold text-orange-500">{totalVotes}</p>
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
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="net">Sort: Net Score</option>
          <option value="upvotes">Sort: Most Upvotes</option>
          <option value="content">Sort: Alphabetical</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading captions...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-gray-400 text-center text-sm">No captions found</p>
          ) : (
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
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
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
          )}
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">Showing {filtered.length} of {totalCount} captions</p>
      )}
    </div>
  )
}
