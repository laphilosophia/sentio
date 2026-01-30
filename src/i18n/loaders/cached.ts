/**
 * Cached message loader (decorator)
 *
 * Wraps any MessageLoader with a cache layer for offline-first support.
 * Uses localStorage by default, supports custom storage implementations.
 *
 * @module sentio/i18n/loaders/cached
 */

import type { CachedLoaderConfig, CacheStorage, LocaleMessages, MessageLoader } from '../types.js'

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  messages: LocaleMessages
  timestamp: number
}

/**
 * Default localStorage-based cache storage
 */
function createLocalStorageCache(prefix: string): CacheStorage {
  return {
    async get(key: string): Promise<LocaleMessages | null> {
      if (typeof localStorage === 'undefined') {
        return null
      }
      const raw = localStorage.getItem(`${prefix}:${key}`)
      if (!raw) return null

      try {
        const entry = JSON.parse(raw) as CacheEntry
        return entry.messages
      } catch {
        return null
      }
    },

    async set(key: string, value: LocaleMessages): Promise<void> {
      if (typeof localStorage === 'undefined') {
        return
      }
      const entry: CacheEntry = {
        messages: value,
        timestamp: Date.now(),
      }
      localStorage.setItem(`${prefix}:${key}`, JSON.stringify(entry))
    },

    async remove(key: string): Promise<void> {
      if (typeof localStorage === 'undefined') {
        return
      }
      localStorage.removeItem(`${prefix}:${key}`)
    },

    async clear(): Promise<void> {
      if (typeof localStorage === 'undefined') {
        return
      }
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${prefix}:`))
      keys.forEach((k) => localStorage.removeItem(k))
    },
  }
}

/**
 * Check if cache entry is expired
 */
function isExpired(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp > ttl
}

/**
 * Create a cached message loader
 *
 * Offline-first strategy:
 * 1. Check cache
 * 2. If hit and not expired → return cached
 * 3. If miss or expired → fetch from source
 * 4. Store in cache
 * 5. If offline + miss → throw error
 *
 * @example
 * ```typescript
 * const apiLoader = createApiLoader({ baseUrl: '/api/i18n' })
 * const cachedLoader = createCachedLoader(apiLoader, {
 *   prefix: 'i18n',
 *   ttl: 24 * 60 * 60 * 1000, // 24 hours
 * })
 *
 * await cachedLoader.load('tr') // Fetches and caches
 * await cachedLoader.load('tr') // Returns cached
 * ```
 */
export function createCachedLoader(
  source: MessageLoader,
  config: CachedLoaderConfig = {}
): MessageLoader & { clearCache: () => Promise<void> } {
  const prefix = config.prefix ?? 'sentio-i18n'
  const ttl = config.ttl ?? 24 * 60 * 60 * 1000 // 24 hours
  const storage = config.storage ?? createLocalStorageCache(prefix)

  // Track loaded locales
  const loadedLocales = new Set<string>()

  return {
    async load(locale: string): Promise<LocaleMessages> {
      // 1. Check cache
      const cached = await storage.get(locale)

      // 2. Check if cache entry exists and get timestamp
      if (cached) {
        // For localStorage, we need to check expiry from the raw entry
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(`${prefix}:${locale}`)
          if (raw) {
            try {
              const entry = JSON.parse(raw) as CacheEntry
              if (!isExpired(entry.timestamp, ttl)) {
                loadedLocales.add(locale)
                return cached
              }
            } catch {
              // Corrupted cache, proceed to fetch
            }
          }
        } else {
          // Non-localStorage storage, assume valid
          loadedLocales.add(locale)
          return cached
        }
      }

      // 3. Fetch from source
      try {
        const messages = await source.load(locale)

        // 4. Store in cache
        await storage.set(locale, messages)
        loadedLocales.add(locale)

        return messages
      } catch (error) {
        // 5. If offline and we have stale cache, return it
        if (cached) {
          loadedLocales.add(locale)
          return cached
        }
        throw error
      }
    },

    hasLocale(locale: string): boolean {
      return loadedLocales.has(locale) || source.hasLocale(locale)
    },

    getAvailableLocales(): string[] {
      const sourceLocales = source.getAvailableLocales()
      return [...new Set([...loadedLocales, ...sourceLocales])]
    },

    async clearCache(): Promise<void> {
      await storage.clear()
      loadedLocales.clear()
    },
  }
}
