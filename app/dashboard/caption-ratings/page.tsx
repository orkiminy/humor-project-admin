import { createClient } from '@/utils/supabase-server'
import RatingCharts, { RatingChartData } from './_components/RatingCharts'

export const dynamic = 'force-dynamic'

export default async function CaptionRatingsPage() {
  const supabase = await createClient()

  const now = new Date()
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // ─── Headline counts ──────────────────────────────────────────────────────
  const [
    { count: totalVotes },
    { count: upvotes },
    { count: downvotes },
    { count: totalCaptions },
    { count: votesLast30 },
  ] = await Promise.all([
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }).eq('vote_value', 1),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }).eq('vote_value', -1),
    supabase.from('captions').select('*', { count: 'exact', head: true }),
    supabase.from('caption_votes').select('*', { count: 'exact', head: true }).gte('created_datetime_utc', since),
  ])

  // ─── Pull all vote rows for aggregation ───────────────────────────────────
  // Supabase caps a single query at 1000 rows regardless of .limit(), so we
  // paginate with .range() until we've seen everything (or hit a safety cap).
  const PAGE_SIZE = 1000
  const MAX_ROWS = 200000
  const votes: {
    caption_id: any
    vote_value: number | null
    profile_id: any
    created_datetime_utc: string | null
  }[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('caption_votes')
      .select('caption_id, vote_value, profile_id, created_datetime_utc')
      .order('created_datetime_utc', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error || !data || data.length === 0) break
    votes.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  // Votes per caption
  const perCaption = new Map<string, { up: number; down: number }>()
  // Unique voters
  const voterSet = new Set<string>()
  // Votes per voter
  const voterCounts = new Map<string, number>()
  // Rating activity by day (last 30 days)
  const byDay = new Map<string, { up: number; down: number }>()

  for (const v of votes) {
    const id = String(v.caption_id)
    const bucket = perCaption.get(id) || { up: 0, down: 0 }
    if (v.vote_value === 1) bucket.up++
    else if (v.vote_value === -1) bucket.down++
    perCaption.set(id, bucket)

    if (v.profile_id) {
      voterSet.add(String(v.profile_id))
      voterCounts.set(String(v.profile_id), (voterCounts.get(String(v.profile_id)) || 0) + 1)
    }

    if (v.created_datetime_utc && v.created_datetime_utc >= since) {
      const d = v.created_datetime_utc.slice(5, 10)
      const db = byDay.get(d) || { up: 0, down: 0 }
      if (v.vote_value === 1) db.up++
      else if (v.vote_value === -1) db.down++
      byDay.set(d, db)
    }
  }

  const ratedCaptionIds = Array.from(perCaption.keys())
  const ratedCaptionsCount = ratedCaptionIds.length
  const unratedCount = Math.max(0, (totalCaptions ?? 0) - ratedCaptionsCount)
  const uniqueVoters = voterSet.size
  // Use the HEAD-count totals for headline math — they're always authoritative
  // (HEAD counts aren't subject to the 1000-row cap that affects row fetches).
  const totalVotesAbs = totalVotes ?? 0
  const avgVotesPerRated = ratedCaptionsCount > 0 ? (totalVotesAbs / ratedCaptionsCount).toFixed(1) : '0'
  const avgVotesPerCaption = (totalCaptions ?? 0) > 0 ? (totalVotesAbs / (totalCaptions ?? 1)).toFixed(2) : '0'
  const upvotePct = totalVotesAbs > 0 ? Math.round(((upvotes ?? 0) / totalVotesAbs) * 100) : 0

  // Ranking helpers
  type Ranked = { id: string; up: number; down: number; total: number; net: number }
  const ranked: Ranked[] = Array.from(perCaption.entries()).map(([id, v]) => ({
    id,
    up: v.up,
    down: v.down,
    total: v.up + v.down,
    net: v.up - v.down,
  }))

  const topByVolume = [...ranked].sort((a, b) => b.total - a.total).slice(0, 10)
  const topByNet = [...ranked].sort((a, b) => b.net - a.net).slice(0, 10)
  const mostControversial = [...ranked]
    .filter(r => r.total >= 4)
    .sort((a, b) => {
      const balanceA = Math.abs(a.up - a.down) / a.total
      const balanceB = Math.abs(b.up - b.down) / b.total
      if (balanceA !== balanceB) return balanceA - balanceB
      return b.total - a.total
    })
    .slice(0, 10)

  // Fetch caption content + flavor for all captions that appear in any top list
  const topIds = Array.from(new Set([...topByVolume, ...topByNet, ...mostControversial].map(r => r.id)))
  const { data: topCaptionRows } = topIds.length
    ? await supabase.from('captions').select('id, content, humor_flavor_id').in('id', topIds)
    : { data: [] }
  const captionMap = new Map<string, { content: string; humor_flavor_id: number | null }>()
  for (const c of topCaptionRows || []) {
    captionMap.set(String(c.id), { content: c.content, humor_flavor_id: c.humor_flavor_id ?? null })
  }

  // Top voters — fetch emails for the top 10
  const topVoterEntries = Array.from(voterCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const topVoterIds = topVoterEntries.map(([id]) => id)
  const { data: voterProfiles } = topVoterIds.length
    ? await supabase.from('profiles').select('id, email').in('id', topVoterIds)
    : { data: [] }
  const voterEmailMap = new Map<string, string>()
  for (const p of voterProfiles || []) voterEmailMap.set(String(p.id), p.email || 'unknown')
  const topVoters = topVoterEntries.map(([id, count]) => ({
    id,
    email: voterEmailMap.get(id) || '(no email)',
    count,
  }))

  // ─── Ratings by humor flavor ──────────────────────────────────────────────
  const { data: flavorRows } = await supabase.from('humor_flavors').select('id, slug').limit(100)
  const flavorMap = new Map<number, string>()
  for (const f of flavorRows || []) flavorMap.set(f.id, f.slug || `flavor-${f.id}`)

  // Build caption_id → flavor_id map for ALL rated captions (batch)
  const flavorByCaption = new Map<string, number | null>()
  // Chunk the IN query to stay under Supabase's default URL limits
  const CHUNK = 500
  for (let i = 0; i < ratedCaptionIds.length; i += CHUNK) {
    const slice = ratedCaptionIds.slice(i, i + CHUNK)
    const { data: capRows } = await supabase
      .from('captions')
      .select('id, humor_flavor_id')
      .in('id', slice)
    for (const c of capRows || []) flavorByCaption.set(String(c.id), c.humor_flavor_id ?? null)
  }

  const flavorStats = new Map<number, { up: number; down: number }>()
  for (const [capId, counts] of perCaption.entries()) {
    const fid = flavorByCaption.get(capId)
    if (fid == null) continue
    const b = flavorStats.get(fid) || { up: 0, down: 0 }
    b.up += counts.up
    b.down += counts.down
    flavorStats.set(fid, b)
  }
  const ratingsByFlavor = Array.from(flavorStats.entries())
    .map(([fid, v]) => ({ flavor: flavorMap.get(fid) || `flavor-${fid}`, up: v.up, down: v.down, total: v.up + v.down }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // ─── Chart data ───────────────────────────────────────────────────────────
  const votesByDay = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, up: v.up, down: v.down }))

  const upDownSplit = [
    { name: 'Upvotes', value: upvotes ?? 0 },
    { name: 'Downvotes', value: downvotes ?? 0 },
  ]

  // Rated vs unrated captions
  const ratedVsUnrated = [
    { name: 'Rated', value: ratedCaptionsCount },
    { name: 'Unrated', value: unratedCount },
  ]

  const chartData: RatingChartData = {
    votesByDay,
    upDownSplit,
    ratingsByFlavor,
    ratedVsUnrated,
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-gray-900">Caption Ratings</h1>
        <a href="/dashboard/caption-ratings" className="text-sm text-orange-500 hover:text-orange-600 font-medium">↻ Refresh</a>
      </div>
      <p className="text-gray-400 mb-8">How users are rating captions across the platform</p>

      {/* Headline stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Ratings" value={totalVotes ?? 0} color="text-orange-500" />
        <StatCard label="Upvotes" value={upvotes ?? 0} color="text-green-600" />
        <StatCard label="Downvotes" value={downvotes ?? 0} color="text-red-500" />
        <StatCard label="Unique Voters" value={uniqueVoters} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Upvote Rate" value={`${upvotePct}%`} bar={upvotePct} barColor="bg-green-400" hint={`${(upvotes ?? 0).toLocaleString()} up / ${(downvotes ?? 0).toLocaleString()} down`} />
        <SmallCard label="Rated Captions" value={ratedCaptionsCount} hint={`of ${(totalCaptions ?? 0).toLocaleString()} total`} color="text-purple-600" />
        <SmallCard label="Avg Votes / Rated Caption" value={avgVotesPerRated} hint={`${avgVotesPerCaption} per caption overall`} color="text-indigo-600" />
        <SmallCard label="Votes (Last 30d)" value={(votesLast30 ?? 0).toLocaleString()} hint="Recent rating activity" color="text-teal-600" />
      </div>

      {/* Charts */}
      <RatingCharts data={chartData} />

      {/* Tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Most rated */}
        <RankCard
          title="🔥 Most Rated Captions"
          subtitle="Captions with the most total votes"
          rows={topByVolume}
          captionMap={captionMap}
          flavorMap={flavorMap}
          primaryKey="total"
          primaryLabel="votes"
        />

        {/* Highest net */}
        <RankCard
          title="🏆 Highest Rated Captions"
          subtitle="Captions ranked by net score (upvotes - downvotes)"
          rows={topByNet}
          captionMap={captionMap}
          flavorMap={flavorMap}
          primaryKey="net"
          primaryLabel="net"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most controversial */}
        <RankCard
          title="⚖️ Most Controversial"
          subtitle="Captions with the most balanced up/down split (min 4 votes)"
          rows={mostControversial}
          captionMap={captionMap}
          flavorMap={flavorMap}
          primaryKey="total"
          primaryLabel="votes"
        />

        {/* Top voters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">🙋 Top Voters</h2>
            <p className="text-xs text-gray-400">Users who have rated the most captions</p>
          </div>
          {topVoters.length === 0 ? (
            <p className="px-6 py-8 text-gray-400 text-sm">No voters yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {topVoters.map((v, i) => (
                <div key={v.id} className="px-6 py-3 flex items-center gap-3 text-xs">
                  <span className="text-xl font-black text-gray-200 w-6 flex-shrink-0">{i + 1}</span>
                  <p className="flex-1 text-gray-800 truncate">{v.email}</p>
                  <span className="text-orange-500 font-bold flex-shrink-0">{v.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
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

function SmallCard({ label, value, hint, color }: { label: string; value: string | number; hint: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  )
}

type RankRow = { id: string; up: number; down: number; total: number; net: number }
function RankCard({
  title,
  subtitle,
  rows,
  captionMap,
  flavorMap,
  primaryKey,
  primaryLabel,
}: {
  title: string
  subtitle: string
  rows: RankRow[]
  captionMap: Map<string, { content: string; humor_flavor_id: number | null }>
  flavorMap: Map<number, string>
  primaryKey: 'total' | 'net'
  primaryLabel: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-gray-400 text-sm">Not enough data yet.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {rows.map((r, i) => {
            const cap = captionMap.get(r.id)
            const flavor = cap?.humor_flavor_id != null ? flavorMap.get(cap.humor_flavor_id) : null
            const primary = r[primaryKey]
            return (
              <div key={r.id} className="px-6 py-3 flex items-start gap-3">
                <span className="text-xl font-black text-gray-200 w-6 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 line-clamp-2">{cap?.content || <span className="italic text-gray-400">Caption #{r.id.slice(0, 8)}</span>}</p>
                  <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                    <span className="text-green-600 font-semibold">+{r.up}</span>
                    <span>/</span>
                    <span className="text-red-400 font-semibold">-{r.down}</span>
                    {flavor && <span className="ml-2 inline-flex px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">{flavor}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-700">{primary > 0 && primaryKey === 'net' ? '+' : ''}{primary}</p>
                  <p className="text-[10px] text-gray-400">{primaryLabel}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
