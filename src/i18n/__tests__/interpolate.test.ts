import { describe, expect, it } from 'vitest'
import { interpolate } from '../interpolate'

describe('interpolate', () => {
  it('returns template unchanged when no params provided', () => {
    expect(interpolate('Hello World!', {})).toBe('Hello World!')
  })

  it('replaces single placeholder', () => {
    expect(interpolate('Hello {name}!', { name: 'Volta' })).toBe('Hello Volta!')
  })

  it('replaces multiple placeholders', () => {
    expect(interpolate('{greeting} {name}!', { greeting: 'Merhaba', name: 'Volta' })).toBe(
      'Merhaba Volta!'
    )
  })

  it('handles numeric values', () => {
    expect(interpolate('You have {count} items', { count: 5 })).toBe('You have 5 items')
  })

  it('handles zero value', () => {
    expect(interpolate('Count: {count}', { count: 0 })).toBe('Count: 0')
  })

  it('replaces null/undefined with empty string', () => {
    expect(interpolate('Hello {name}!', { name: null })).toBe('Hello !')
    expect(interpolate('Hello {name}!', { name: undefined })).toBe('Hello !')
  })

  it('keeps placeholder when param not found', () => {
    expect(interpolate('Hello {name}!', { other: 'value' })).toBe('Hello {name}!')
  })

  it('handles template with no placeholders', () => {
    expect(interpolate('Hello World!', { name: 'unused' })).toBe('Hello World!')
  })

  it('handles same placeholder multiple times', () => {
    expect(interpolate('{name} said hello to {name}', { name: 'Volta' })).toBe(
      'Volta said hello to Volta'
    )
  })
})
