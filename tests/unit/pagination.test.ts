import { describe, it, expect } from 'vitest'
import { getRange, getTotalPages } from '@/utils/pagination'

describe('pagination helpers', () => {
  it('page 1, size 25 → range 0..24', () => {
    expect(getRange(1, 25)).toEqual({ from: 0, to: 24 })
  })
  it('page 2, size 25 → range 25..49', () => {
    expect(getRange(2, 25)).toEqual({ from: 25, to: 49 })
  })
  it('page 3, size 10 → range 20..29', () => {
    expect(getRange(3, 10)).toEqual({ from: 20, to: 29 })
  })
  it('totalPages rounds up', () => {
    expect(getTotalPages(101, 25)).toBe(5)
    expect(getTotalPages(100, 25)).toBe(4)
    expect(getTotalPages(0, 25)).toBe(1)
  })
})
