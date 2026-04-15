import { describe, it, expect } from 'vitest'
import { toCsv } from '@/utils/csv'

describe('toCsv', () => {
  it('produces a header and row for plain objects', () => {
    const csv = toCsv([{ a: 1, b: 'hello' }])
    expect(csv).toBe('a,b\n1,hello')
  })

  it('escapes commas, quotes, and newlines', () => {
    const csv = toCsv([{ a: 'he,llo', b: 'she said "hi"', c: 'line\nbreak' }])
    expect(csv).toBe('a,b,c\n"he,llo","she said ""hi""","line\nbreak"')
  })

  it('renders null/undefined as empty', () => {
    const csv = toCsv([{ a: null, b: undefined, c: 0 }])
    expect(csv).toBe('a,b,c\n,,0')
  })

  it('stringifies nested objects', () => {
    const csv = toCsv([{ a: { x: 1 } }])
    expect(csv).toBe('a\n"{""x"":1}"')
  })

  it('uses custom column order when provided', () => {
    const csv = toCsv([{ a: 1, b: 2 }], ['b', 'a'])
    expect(csv).toBe('b,a\n2,1')
  })

  it('returns empty string for empty input', () => {
    expect(toCsv([])).toBe('')
  })
})
