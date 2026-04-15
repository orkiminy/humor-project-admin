/**
 * Pagination helpers for Supabase .range() queries.
 * Supabase range is inclusive on both ends.
 */
export function getRange(page: number, pageSize: number): { from: number; to: number } {
  const safePage = Math.max(1, Math.floor(page))
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}

export function getTotalPages(totalCount: number, pageSize: number): number {
  if (totalCount <= 0) return 1
  return Math.ceil(totalCount / pageSize)
}
