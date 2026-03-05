import { createClient } from '@/utils/supabase-server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all counts in parallel
  const [
    { count: totalUsers },
    { count: totalImages },
    { count: totalCaptions },
    { count: publicCaptions },
    { count: totalVotes },
    { count: upvotes },
    { count: downvotes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }).eq('vote_value', 1),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }).eq('vote_value', -1),
  ])

  // Top 5 captions by net votes
  const { data: captions } = await supabase
    .from('captions')
    .select('id, content, images(url)')
    .eq('is_public', true)
    .limit(200)

  const { data: votes } = await supabase
    .from('caption_votes')
    .select('caption_id, vote_value')
    .in('caption_id', (captions || []).map(c => c.id))

  const topCaptions = (captions || [])
    .map(c => {
      const cv = (votes || []).filter(v => v.caption_id === c.id)
      const up = cv.filter(v => v.vote_value === 1).length
      const down = cv.filter(v => v.vote_value === -1).length
      return { ...c, up, down, net: up - down }
    })
    .sort((a, b) => b.net - a.net)
    .slice(0, 5)

  const upvotePct = (totalVotes ?? 0) > 0
    ? Math.round(((upvotes ?? 0) / (totalVotes ?? 1)) * 100)
    : 0
  const publicPct = (totalCaptions ?? 0) > 0
    ? Math.round(((publicCaptions ?? 0) / (totalCaptions ?? 1)) * 100)
    : 0
  const avgVotes = (totalCaptions ?? 0) > 0
    ? ((totalVotes ?? 0) / (totalCaptions ?? 1)).toFixed(1)
    : '0'
  const avgCaptions = (totalImages ?? 0) > 0
    ? ((totalCaptions ?? 0) / (totalImages ?? 1)).toFixed(1)
    : '0'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
        <a href="/dashboard" className="text-sm text-orange-500 hover:text-orange-600 font-medium">↻ Refresh</a>
      </div>
      <p className="text-gray-400 mb-8">Live overview of the Humor Project database</p>

      {/* Big stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: totalUsers ?? 0, color: 'text-blue-600' },
          { label: 'Total Images', value: totalImages ?? 0, color: 'text-purple-600' },
          { label: 'Total Captions', value: totalCaptions ?? 0, color: 'text-orange-500' },
          { label: 'Total Votes', value: totalVotes ?? 0, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-4xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Upvote Rate</p>
          <p className="text-3xl font-bold text-green-600">{upvotePct}%</p>
          <div className="mt-2 bg-gray-100 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full" style={{ width: `${upvotePct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{upvotes ?? 0} up / {downvotes ?? 0} down</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Public Captions</p>
          <p className="text-3xl font-bold text-orange-500">{publicPct}%</p>
          <div className="mt-2 bg-gray-100 rounded-full h-2">
            <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${publicPct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{publicCaptions ?? 0} of {totalCaptions ?? 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Avg Votes / Caption</p>
          <p className="text-4xl font-bold text-blue-600">{avgVotes}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Avg Captions / Image</p>
          <p className="text-4xl font-bold text-purple-600">{avgCaptions}</p>
        </div>
      </div>

      {/* Top captions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Top 5 Captions by Net Score</h2>
        </div>
        {topCaptions.length === 0 ? (
          <p className="px-6 py-8 text-gray-400 text-sm">No voted captions yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {topCaptions.map((c, i) => (
              <div key={c.id} className="px-6 py-4 flex gap-4 items-center">
                <span className="text-2xl font-black text-gray-200 w-6">{i + 1}</span>
                <p className="flex-1 text-sm text-gray-800 line-clamp-2">{c.content}</p>
                <div className="text-right text-xs flex-shrink-0">
                  <span className="text-green-600 font-semibold">+{c.up}</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className="text-red-400 font-semibold">-{c.down}</span>
                  <p className="text-gray-500 font-bold">net {c.net > 0 ? '+' : ''}{c.net}</p>
                </div>
                {(c.images as any)?.url && (
                  <img src={(c.images as any).url} alt="" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
