/**
 * LRU Cache implementation for ICU formatters
 *
 * Provides memory-bounded caching with least-recently-used eviction.
 *
 * @module sentio/i18n/lru-cache
 */

/**
 * LRU Cache interface
 */
export interface LRUCache<K, V> {
  get: (key: K) => V | undefined
  set: (key: K, value: V) => void
  has: (key: K) => boolean
  delete: (key: K) => boolean
  clear: () => void
  size: () => number
}

/**
 * Create an LRU cache with maximum size
 *
 * When the cache exceeds maxSize, the least recently used entries are evicted.
 *
 * @example
 * ```typescript
 * const cache = createLRUCache<string, IntlMessageFormat>(1000)
 * cache.set('en:message', formatter)
 * cache.get('en:message') // → formatter (moves to front)
 * ```
 */
export function createLRUCache<K, V>(maxSize: number): LRUCache<K, V> {
  // Use Map for O(1) access and insertion order tracking
  const cache = new Map<K, V>()

  function get(key: K): V | undefined {
    const value = cache.get(key)

    if (value !== undefined) {
      // Move to end (most recently used)
      cache.delete(key)
      cache.set(key, value)
    }

    return value
  }

  function set(key: K, value: V): void {
    // If key exists, delete to refresh position
    if (cache.has(key)) {
      cache.delete(key)
    }

    cache.set(key, value)

    // Evict oldest entries if over capacity
    while (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      if (oldestKey !== undefined) {
        cache.delete(oldestKey)
      }
    }
  }

  function has(key: K): boolean {
    return cache.has(key)
  }

  function deleteKey(key: K): boolean {
    return cache.delete(key)
  }

  function clear(): void {
    cache.clear()
  }

  function size(): number {
    return cache.size
  }

  return {
    get,
    set,
    has,
    delete: deleteKey,
    clear,
    size,
  }
}

/**
 * Default cache size for ICU formatters
 * 1000 entries is a good balance between memory and hit rate
 */
export const DEFAULT_CACHE_SIZE = 1000
