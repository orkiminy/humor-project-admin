import { createClient } from '@/utils/supabase-server'
import DashboardCharts, { ChartData } from './_components/DashboardCharts'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // ─── Counts (cheap HEAD requests) ─────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: totalImages },
    { count: totalCaptions },
    { count: publicCaptions },
    { count: privateCaptions },
    { count: totalVotes },
    { count: upvotes },
    { count: downvotes },
    { count: totalRequests },
    { count: totalChains },
    { count: totalResponses },
    { count: totalTerms },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', true),
    supabase.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', false),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }).eq('vote_value', 1),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }).eq('vote_value', -1),
    supabase.from('caption_requests').select('*', { count: 'exact', head: true }),
    supabase.from('llm_prompt_chains').select('*', { count: 'exact', head: true }),
    supabase.from('llm_model_responses').select('*', { count: 'exact', head: true }),
    supabase.from('terms').select('*', { count: 'exact', head: true }),
  ])

  // ─── Chart data ───────────────────────────────────────────────────────────
  const now = new Date()
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Captions per day (last 30 days)
  const { data: recentCaptions } = await supabase
    .from('captions')
    .select('created_datetime_utc')
    .gte('created_datetime_utc', since)
    .limit(20000)

  const capByDay = new Map<string, number>()
  for (const row of recentCaptions || []) {
    const d = row.created_datetime_utc ? row.created_datetime_utc.slice(5, 10) : null
    if (d) capByDay.set(d, (capByDay.get(d) || 0) + 1)
  }
  const captionsPerDay = Array.from(capByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Votes per day (last 30 days)
  const { data: recentVotes } = await supabase
    .from('caption_votes')
    .select('vote_value, created_datetime_utc')
    .gte('created_datetime_utc', since)
    .limit(50000)

  const votesByDayMap = new Map<string, { up: number; down: number }>()
  for (const v of recentVotes || []) {
    const d = v.created_datetime_utc?.slice(5, 10)
    if (!d) continue
    const bucket = votesByDayMap.get(d) || { up: 0, down: 0 }
    if (v.vote_value === 1) bucket.up++
    else if (v.vote_value === -1) bucket.down++
    votesByDayMap.set(d, bucket)
  }
  const votesByDay = Array.from(votesByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, up: v.up, down: v.down }))

  // Captions by humor flavor (top 8)
  const { data: flavorRows } = await supabase.from('humor_flavors').select('id, slug').limit(100)
  const flavorMap = new Map<number, string>()
  for (const f of flavorRows || []) flavorMap.set(f.id, f.slug || `flavor-${f.id}`)

  const flavorCounts: { flavor: string; count: number }[] = []
  if (flavorRows && flavorRows.length > 0) {
    const results = await Promise.all(
      flavorRows.slice(0, 15).map(async f => {
        const { count } = await supabase
          .from('captions')
          .select('*', { count: 'exact', head: true })
          .eq('humor_flavor_id', f.id)
        return { flavor: f.slug || `flavor-${f.id}`, count: count ?? 0 }
      })
    )
    flavorCounts.push(...results.filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 8))
  }

  const publicVsPrivate = [
    { name: 'Public', value: publicCaptions ?? 0 },
    { name: 'Private', value: privateCaptions ?? 0 },
  ]

  const chartData: ChartData = {
    captionsPerDay,
    captionsByFlavor: flavorCounts,
    publicVsPrivate,
    votesByDay,
  }

  // ─── Top 5 captions by net votes ──────────────────────────────────────────
  const { data: captionsForRank } = await supabase
    .from('captions')
    .select('id, content, images(url)')
    .eq('is_public', true)
    .order('created_datetime_utc', { ascending: false })
    .limit(300)

  const ids = (captionsForRank || []).map(c => c.id)
  const { data: votesForRank } = ids.length
    ? await supabase.from('caption_votes').select('caption_id, vote_value').in('caption_id', ids)
    : { data: [] }

  const topCaptions = (captionsForRank || [])
    .map(c => {
      const cv = (votesForRank || []).filter(v => v.caption_id === c.id)
      const up = cv.filter(v => v.vote_value === 1).length
      const down = cv.filter(v => v.vote_value === -1).length
      return { ...c, up, down, net: up - down }
    })
    .sort((a, b) => b.net - a.net)
    .slice(0, 5)

  // ─── Recent caption requests ──────────────────────────────────────────────
  const { data: recentRequests } = await supabase
    .from('caption_requests')
    .select('*')
    .order('id', { ascending: false })
    .limit(5)

  // ─── Derived percentages ──────────────────────────────────────────────────
  const upvotePct = (totalVotes ?? 0) > 0 ? Math.round(((upvotes ?? 0) / (totalVotes ?? 1)) * 100) : 0
  const publicPct = (totalCaptions ?? 0) > 0 ? Math.round(((publicCaptions ?? 0) / (totalCaptions ?? 1)) * 100) : 0
  const avgVotes = (totalCaptions ?? 0) > 0 ? ((totalVotes ?? 0) / (totalCaptions ?? 1)).toFixed(1) : '0'
  const avgCaptions = (totalImages ?? 0) > 0 ? ((totalCaptions ?? 0) / (totalImages ?? 1)).toFixed(1) : '0'

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <a href="/dashboard" className="text-sm text-orange-500 hover:text-orange-600 font-medium">↻ Refresh</a>
      </div>
      <p className="text-gray-400 mb-8">Live overview of the Humor Project database</p>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Users" value={totalUsers ?? 0} color="text-blue-600" testid="stat-users" />
        <StatCard label="Total Images" value={totalImages ?? 0} color="text-purple-600" testid="stat-images" />
        <StatCard label="Total Captions" value={totalCaptions ?? 0} color="text-orange-500" testid="stat-captions" />
        <StatCard label="Total Votes" value={totalVotes ?? 0} color="text-green-600" testid="stat-votes" />
      </div>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Caption Requests" value={totalRequests ?? 0} color="text-indigo-600" testid="stat-requests" />
        <StatCard label="Prompt Chains" value={totalChains ?? 0} color="text-pink-600" testid="stat-chains" />
        <StatCard label="LLM Responses" value={totalResponses ?? 0} color="text-teal-600" testid="stat-responses" />
        <StatCard label="Glossary Terms" value={totalTerms ?? 0} color="text-amber-600" testid="stat-terms" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Upvote Rate" value={`${upvotePct}%`} bar={upvotePct} barColor="bg-green-400" hint={`${(upvotes ?? 0).toLocaleString()} up / ${(downvotes ?? 0).toLocaleString()} down`} />
        <MetricCard label="Public Captions" value={`${publicPct}%`} bar={publicPct} barColor="bg-orange-400" hint={`${(publicCaptions ?? 0).toLocaleString()} of ${(totalCaptions ?? 0).toLocaleString()}`} />
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Avg Votes / Caption</p>
          <p className="text-4xl font-bold text-blue-600">{avgVotes}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Avg Captions / Image</p>
          <p className="text-4xl font-bold text-purple-600">{avgCaptions}</p>
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts data={chartData} />

      {/* Tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top captions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">🏆 Top Captions by Net Score</h2>
            <p className="text-xs text-gray-400">From the latest 300 public captions</p>
          </div>
          {topCaptions.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-sm">No voted captions yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {topCaptions.map((c, i) => (
                <div key={c.id} className="px-6 py-3 flex gap-3 items-center">
                  <span className="text-xl font-black text-gray-200 w-6">{i + 1}</span>
                  <p className="flex-1 text-xs text-gray-800 line-clamp-2">{c.content}</p>
                  <div className="text-right text-xs flex-shrink-0">
                    <span className="text-green-600 font-semibold">+{c.up}</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-red-400 font-semibold">-{c.down}</span>
                    <p className="text-gray-500 font-bold">net {c.net > 0 ? '+' : ''}{c.net}</p>
                  </div>
                  {(c.images as any)?.url && (
                    <img src={(c.images as any).url} alt="" className="w-10 h-8 object-cover rounded-lg flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent caption requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">📥 Recent Caption Requests</h2>
            <p className="text-xs text-gray-400">Latest 5 submitted requests</p>
          </div>
          {(!recentRequests || recentRequests.length === 0) ? (
            <p className="px-6 py-8 text-gray-400 text-sm">No requests yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentRequests.map((r: any) => (
                <div key={r.id} className="px-6 py-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-gray-400">#{r.id}</span>
                    {r.status && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        String(r.status) === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        String(r.status) === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'}`}>{String(r.status)}</span>
                    )}
                  </div>
                  {r.created_datetime_utc && (
                    <p className="text-gray-400">{new Date(r.created_datetime_utc).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, testid }: { label: string; value: number; color: string; testid?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100" data-testid={testid || 'stat-card'}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
    </div>
  )
}

function MetricCard({ label, value, bar, barColor, hint }: { label: string; value: string; bar: number; barColor: string; hint: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <div className="mt-2 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${Math.min(100, bar)}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  )
}
