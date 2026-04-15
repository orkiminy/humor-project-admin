'use client'

import { getTotalPages } from '@/utils/pagination'

export default function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading = false,
  itemLabel = 'rows',
}: {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (p: number) => void
  loading?: boolean
  itemLabel?: string
}) {
  const totalPages = getTotalPages(totalCount, pageSize)
  const showingFrom = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, totalCount)

  return (
    <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
      <p className="text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{showingFrom.toLocaleString()}</span>–
        <span className="font-semibold text-gray-700">{showingTo.toLocaleString()}</span> of{' '}
        <span className="font-semibold text-gray-700">{totalCount.toLocaleString()}</span> {itemLabel}
        {' · '}
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || loading}
          data-testid="first-btn"
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          « First
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || loading}
          data-testid="prev-btn"
          className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          data-testid="next-btn"
          className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || loading}
          data-testid="last-btn"
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Last »
        </button>
      </div>
    </div>
  )
}
