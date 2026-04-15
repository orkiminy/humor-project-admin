'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase-browser'
import { getRange, getTotalPages } from '@/utils/pagination'

const PAGE_SIZE = 25

type Chain = {
  id: number
  caption_request_id: number | null
  created_datetime_utc: string
}

type ModelResponse = {
  id: string
  llm_prompt_chain_id: number
  llm_model_id: number | null
  llm_system_prompt: string | null
  llm_user_prompt: string | null
  llm_model_response: string | null
  processing_time_seconds: number | null
  created_datetime_utc: string
}

type CaptionRow = {
  id: number
  llm_prompt_chain_id: number
  content?: string | null
  caption?: string | null
  created_datetime_utc?: string
  [k: string]: any
}

type ChainUsage = {
  chain: Chain
  stepsCount: number
  captionsCount: number
  steps: ModelResponse[]
  captions: CaptionRow[]
}

export default function LLMPromptChainsPage() {
  const supabase = createClient()
  const [page, setPage] = useState(1)
  const [usage, setUsage] = useState<ChainUsage[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Aggregate statistics for the header cards (computed once across all chains)
  const [stats, setStats] = useState<{
    totalChains: number
    totalSteps: number
    totalCaptions: number
    avgStepsPerChain: number
  } | null>(null)

  useEffect(() => { fetchPage(page) }, [page])
  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const [chainsRes, stepsRes, captionsRes] = await Promise.all([
      supabase.from('llm_prompt_chains').select('*', { count: 'exact', head: true }),
      supabase.from('llm_model_responses').select('*', { count: 'exact', head: true }),
      supabase.from('captions').select('*', { count: 'exact', head: true }).not('llm_prompt_chain_id', 'is', null),
    ])
    const totalChains = chainsRes.count ?? 0
    const totalSteps = stepsRes.count ?? 0
    const totalCaptions = captionsRes.count ?? 0
    setStats({
      totalChains,
      totalSteps,
      totalCaptions,
      avgStepsPerChain: totalChains > 0 ? Math.round((totalSteps / totalChains) * 10) / 10 : 0,
    })
  }

  async function fetchPage(p: number) {
    setLoading(true)
    setError(null)

    const { from, to } = getRange(p, PAGE_SIZE)

    // 1. Fetch current page of chains + total count
    const [chainsRes, countRes] = await Promise.all([
      supabase
        .from('llm_prompt_chains')
        .select('id, caption_request_id, created_datetime_utc')
        .order('id', { ascending: false })
        .range(from, to),
      supabase.from('llm_prompt_chains').select('*', { count: 'exact', head: true }),
    ])

    if (chainsRes.error) {
      setError(chainsRes.error.message)
      setLoading(false)
      return
    }

    const chains = (chainsRes.data || []) as Chain[]
    setTotalCount(countRes.count ?? 0)

    if (chains.length === 0) {
      setUsage([])
      setLoading(false)
      return
    }

    const chainIds = chains.map(c => c.id)

    // 2. Fetch every model_response and caption belonging to these chain ids (one round-trip each)
    const [stepsRes, captionsRes] = await Promise.all([
      supabase
        .from('llm_model_responses')
        .select('id, llm_prompt_chain_id, llm_model_id, llm_system_prompt, llm_user_prompt, llm_model_response, processing_time_seconds, created_datetime_utc')
        .in('llm_prompt_chain_id', chainIds)
        .order('created_datetime_utc', { ascending: true }),
      supabase
        .from('captions')
        .select('*')
        .in('llm_prompt_chain_id', chainIds),
    ])

    const steps = (stepsRes.data || []) as ModelResponse[]
    const captions = (captionsRes.data || []) as CaptionRow[]

    // 3. Group by chain id
    const stepsByChain = new Map<number, ModelResponse[]>()
    for (const s of steps) {
      const list = stepsByChain.get(s.llm_prompt_chain_id) || []
      list.push(s)
      stepsByChain.set(s.llm_prompt_chain_id, list)
    }
    const captionsByChain = new Map<number, CaptionRow[]>()
    for (const c of captions) {
      if (c.llm_prompt_chain_id == null) continue
      const list = captionsByChain.get(c.llm_prompt_chain_id) || []
      list.push(c)
      captionsByChain.set(c.llm_prompt_chain_id, list)
    }

    const merged: ChainUsage[] = chains.map(chain => ({
      chain,
      steps: stepsByChain.get(chain.id) || [],
      captions: captionsByChain.get(chain.id) || [],
      stepsCount: (stepsByChain.get(chain.id) || []).length,
      captionsCount: (captionsByChain.get(chain.id) || []).length,
    }))

    setUsage(merged)
    setLoading(false)
  }

  const totalPages = getTotalPages(totalCount, PAGE_SIZE)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">LLM Prompt Chains</h1>
      <p className="text-gray-400 mb-6">
        A prompt chain represents one AI invocation for a caption request. Each chain has multiple model response
        steps and produces one or more captions.
      </p>

      {/* Usage statistics cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Chains" value={stats.totalChains} color="orange" />
          <StatCard label="Total Model Responses" value={stats.totalSteps} color="blue" />
          <StatCard label="Captions Produced" value={stats.totalCaptions} color="green" />
          <StatCard label="Avg Steps / Chain" value={stats.avgStepsPerChain} color="purple" />
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-sm">Error: {error}</div>
      ) : usage.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-400 text-sm">
          No prompt chains found
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {usage.map(({ chain, stepsCount, captionsCount, steps, captions }) => {
              const isExpanded = expandedId === chain.id
              return (
                <div
                  key={chain.id}
                  data-testid="chain-row"
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : chain.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-xs text-gray-400 w-12 flex-shrink-0">#{chain.id}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">
                          Caption Request{' '}
                          <span className="font-mono text-orange-600">
                            #{chain.caption_request_id ?? '—'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(chain.created_datetime_utc).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <UsagePill label="steps" count={stepsCount} color="blue" />
                      <UsagePill label="captions" count={captionsCount} color="green" />
                      <span className="text-gray-400 text-xs w-4">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 space-y-4">
                      {/* Steps */}
                      <section>
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Model Response Steps ({stepsCount})
                        </h3>
                        {steps.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No model responses recorded.</p>
                        ) : (
                          <div className="space-y-2">
                            {steps.map((s, idx) => (
                              <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-3 text-xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-mono text-gray-400">
                                    Step {idx + 1} · model #{s.llm_model_id ?? '—'}
                                  </span>
                                  <span className="text-gray-400">
                                    {s.processing_time_seconds != null ? `${s.processing_time_seconds}s` : ''}
                                  </span>
                                </div>
                                {s.llm_user_prompt && (
                                  <details className="mb-1">
                                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                      User prompt
                                    </summary>
                                    <pre className="mt-1 whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-2">
                                      {s.llm_user_prompt}
                                    </pre>
                                  </details>
                                )}
                                {s.llm_model_response && (
                                  <details>
                                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                      Model response
                                    </summary>
                                    <pre className="mt-1 whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-2">
                                      {s.llm_model_response}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* Captions produced */}
                      <section>
                        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Captions Produced ({captionsCount})
                        </h3>
                        {captions.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No captions linked to this chain.</p>
                        ) : (
                          <ul className="space-y-1">
                            {captions.map(c => {
                              const text = c.content ?? c.caption ?? c.text ?? JSON.stringify(c)
                              return (
                                <li key={c.id} className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-700">
                                  <span className="font-mono text-gray-400 mr-2">#{c.id}</span>
                                  {text}
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </section>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} · {totalCount} total chains
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                data-testid="prev-btn"
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                data-testid="next-btn"
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'orange' | 'blue' | 'green' | 'purple' }) {
  const colorMap = {
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  }
  return (
    <div className={`rounded-2xl border px-4 py-3 ${colorMap[color]}`} data-testid="stat-card">
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  )
}

function UsagePill({ label, count, color }: { label: string; count: number; color: 'blue' | 'green' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[color]}`}>
      <span className="font-semibold">{count}</span>
      <span className="opacity-70">{label}</span>
    </span>
  )
}
