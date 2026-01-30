import { describe, expect, it } from 'vitest'
import { buildFallbackChain, resolveMessage } from '../resolve'

describe('buildFallbackChain', () => {
  it('returns base locale when no region', () => {
    expect(buildFallbackChain('en', 'en')).toEqual(['en'])
  })

  it('builds chain with region and fallback', () => {
    expect(buildFallbackChain('tr-TR', 'en')).toEqual(['tr-TR', 'tr', 'en'])
  })

  it('excludes fallback when same as base', () => {
    expect(buildFallbackChain('en-US', 'en')).toEqual(['en-US', 'en'])
  })

  it('handles different fallback locale', () => {
    expect(buildFallbackChain('de', 'en')).toEqual(['de', 'en'])
  })
})

describe('resolveMessage', () => {
  const messages = {
    en: { greeting: 'Hello', common: 'Shared' },
    tr: { greeting: 'Merhaba' },
    'tr-TR': { specific: 'Türkiye specific' },
  }

  it('resolves from exact locale match', () => {
    expect(resolveMessage('greeting', 'tr', 'en', messages)).toBe('Merhaba')
  })

  it('falls back to base locale', () => {
    expect(resolveMessage('greeting', 'tr-TR', 'en', messages)).toBe('Merhaba')
  })

  it('falls back to fallback locale', () => {
    expect(resolveMessage('common', 'tr', 'en', messages)).toBe('Shared')
  })

  it('resolves region-specific key', () => {
    expect(resolveMessage('specific', 'tr-TR', 'en', messages)).toBe('Türkiye specific')
  })

  it('returns undefined for missing key', () => {
    expect(resolveMessage('nonexistent', 'tr', 'en', messages)).toBeUndefined()
  })
})
