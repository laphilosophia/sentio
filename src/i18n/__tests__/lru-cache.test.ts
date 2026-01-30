import { describe, expect, it } from 'vitest'
import { createLRUCache, DEFAULT_CACHE_SIZE } from '../lru-cache'

describe('createLRUCache', () => {
  it('stores and retrieves values', () => {
    const cache = createLRUCache<string, number>(10)

    cache.set('a', 1)
    cache.set('b', 2)

    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
  })

  it('returns undefined for missing keys', () => {
    const cache = createLRUCache<string, number>(10)

    expect(cache.get('missing')).toBeUndefined()
  })

  it('evicts least recently used when over capacity', () => {
    const cache = createLRUCache<string, number>(3)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.set('d', 4) // Should evict 'a'

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
    expect(cache.size()).toBe(3)
  })

  it('accessing a key moves it to front', () => {
    const cache = createLRUCache<string, number>(3)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    // Access 'a' to move it to front
    cache.get('a')

    // Add new item, should evict 'b' (now oldest)
    cache.set('d', 4)

    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
  })

  it('updates existing key and moves to front', () => {
    const cache = createLRUCache<string, number>(3)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)

    // Update 'a'
    cache.set('a', 10)

    // Add new item, should evict 'b'
    cache.set('d', 4)

    expect(cache.get('a')).toBe(10)
    expect(cache.get('b')).toBeUndefined()
  })

  it('has() checks existence', () => {
    const cache = createLRUCache<string, number>(10)

    cache.set('a', 1)

    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(false)
  })

  it('delete() removes entries', () => {
    const cache = createLRUCache<string, number>(10)

    cache.set('a', 1)
    expect(cache.delete('a')).toBe(true)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.delete('a')).toBe(false)
  })

  it('clear() removes all entries', () => {
    const cache = createLRUCache<string, number>(10)

    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()

    expect(cache.size()).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })

  it('size() returns current count', () => {
    const cache = createLRUCache<string, number>(10)

    expect(cache.size()).toBe(0)
    cache.set('a', 1)
    expect(cache.size()).toBe(1)
    cache.set('b', 2)
    expect(cache.size()).toBe(2)
  })
})

describe('DEFAULT_CACHE_SIZE', () => {
  it('is 1000', () => {
    expect(DEFAULT_CACHE_SIZE).toBe(1000)
  })
})
