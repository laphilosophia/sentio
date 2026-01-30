import { beforeEach, describe, expect, it } from 'vitest'
import { clearMessageCache, formatICU, isICUMessage } from '../parser'

describe('isICUMessage', () => {
  it('detects plural syntax', () => {
    expect(isICUMessage('{count, plural, one {# item} other {# items}}')).toBe(true)
  })

  it('detects select syntax', () => {
    expect(isICUMessage('{gender, select, male {He} female {She}}')).toBe(true)
  })

  it('detects selectordinal syntax', () => {
    expect(isICUMessage('{n, selectordinal, one {#st} two {#nd} other {#th}}')).toBe(true)
  })

  it('returns false for simple placeholders', () => {
    expect(isICUMessage('{name}')).toBe(false)
    expect(isICUMessage('Hello {name}!')).toBe(false)
  })

  it('returns false for plain text', () => {
    expect(isICUMessage('Hello World')).toBe(false)
  })
})

describe('formatICU', () => {
  beforeEach(() => {
    clearMessageCache()
  })

  describe('pluralization', () => {
    const message = '{count, plural, one {# item} other {# items}}'

    it('formats singular (one)', () => {
      expect(formatICU(message, 'en', { count: 1 })).toBe('1 item')
    })

    it('formats plural (other)', () => {
      expect(formatICU(message, 'en', { count: 5 })).toBe('5 items')
    })

    it('formats zero as plural', () => {
      expect(formatICU(message, 'en', { count: 0 })).toBe('0 items')
    })
  })

  describe('select', () => {
    const message = '{gender, select, male {He} female {She} other {They}}'

    it('formats male', () => {
      expect(formatICU(message, 'en', { gender: 'male' })).toBe('He')
    })

    it('formats female', () => {
      expect(formatICU(message, 'en', { gender: 'female' })).toBe('She')
    })

    it('formats other', () => {
      expect(formatICU(message, 'en', { gender: 'nonbinary' })).toBe('They')
    })
  })

  describe('nested messages', () => {
    it('formats nested placeholders', () => {
      const message = '{count, plural, one {You have # {type}} other {You have # {type}s}}'

      expect(formatICU(message, 'en', { count: 1, type: 'apple' })).toBe('You have 1 apple')
      expect(formatICU(message, 'en', { count: 5, type: 'apple' })).toBe('You have 5 apples')
    })
  })

  describe('Turkish locale', () => {
    it('handles Turkish pluralization', () => {
      const message = '{count, plural, one {# öğe} other {# öğe}}'

      expect(formatICU(message, 'tr', { count: 1 })).toBe('1 öğe')
      expect(formatICU(message, 'tr', { count: 5 })).toBe('5 öğe')
    })
  })

  describe('error handling', () => {
    it('returns original message on parse error', () => {
      const malformed = '{count, plural, one {unclosed'

      expect(formatICU(malformed, 'en', { count: 1 })).toBe(malformed)
    })
  })

  describe('caching', () => {
    it('caches compiled formatters', () => {
      const message = '{count, plural, one {# item} other {# items}}'

      // First call compiles
      formatICU(message, 'en', { count: 1 })

      // Second call should use cache (we can't directly test this, but no errors means it works)
      expect(formatICU(message, 'en', { count: 5 })).toBe('5 items')
    })
  })
})
