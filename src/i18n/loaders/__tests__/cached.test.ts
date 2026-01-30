import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CacheStorage, LocaleMessages, MessageLoader } from '../../types'
import { createCachedLoader } from '../cached'

// Mock localStorage
interface MockLocalStorage {
  getItem: ReturnType<typeof vi.fn>
  setItem: ReturnType<typeof vi.fn>
  removeItem: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
  key: ReturnType<typeof vi.fn>
  length: number
  keys: () => string[]
  [Symbol.iterator]: () => IterableIterator<string>
}

const createMockLocalStorage = (): MockLocalStorage => {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((index: number) => [...store.keys()][index] ?? null),
    get length(): number {
      return store.size
    },
    keys: (): string[] => [...store.keys()],
    [Symbol.iterator]: (): IterableIterator<string> => store.keys(),
  }
}

// Mock source loader
const createMockSourceLoader = (messages: Record<string, LocaleMessages>): MessageLoader => ({
  load: vi.fn(async (locale: string) => {
    const msgs = messages[locale]
    if (!msgs) throw new Error(`Locale not found: ${locale}`)
    return msgs
  }),
  hasLocale: vi.fn((locale: string) => locale in messages),
  getAvailableLocales: vi.fn(() => Object.keys(messages)),
})

// Custom in-memory cache storage for testing
const createMockStorage = (): CacheStorage & { store: Map<string, LocaleMessages> } => {
  const store = new Map<string, LocaleMessages>()
  return {
    store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: LocaleMessages) => {
      store.set(key, value)
    }),
    remove: vi.fn(async (key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(async () => store.clear()),
  }
}

describe('createCachedLoader', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage()
    vi.stubGlobal('localStorage', mockLocalStorage)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('with custom storage', () => {
    beforeEach(() => {
      // Unstub localStorage for custom storage tests
      vi.unstubAllGlobals()
    })

    it('caches messages after first load', async () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { storage })

      await cached.load('en')
      await cached.load('en')

      expect(source.load).toHaveBeenCalledTimes(1)
      expect(storage.set).toHaveBeenCalledWith('en', { hello: 'Hello' })
    })

    it('returns cached messages on subsequent loads', async () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { storage })

      const first = await cached.load('en')
      const second = await cached.load('en')

      expect(first).toEqual(second)
      expect(source.load).toHaveBeenCalledTimes(1)
    })

    it('falls back to stale cache on source error', async () => {
      const storage = createMockStorage()
      storage.store.set('en', { hello: 'Cached Hello' })

      const source: MessageLoader = {
        load: vi.fn().mockRejectedValue(new Error('Network error')),
        hasLocale: () => true,
        getAvailableLocales: () => ['en'],
      }

      const cached = createCachedLoader(source, { storage })
      const result = await cached.load('en')

      expect(result).toEqual({ hello: 'Cached Hello' })
    })

    it('throws error if source fails and no cache', async () => {
      const storage = createMockStorage()
      const source: MessageLoader = {
        load: vi.fn().mockRejectedValue(new Error('Network error')),
        hasLocale: () => false,
        getAvailableLocales: () => [],
      }

      const cached = createCachedLoader(source, { storage })

      await expect(cached.load('en')).rejects.toThrow('Network error')
    })

    it('clearCache removes all cached entries', async () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { storage })

      await cached.load('en')
      await cached.clearCache()

      expect(storage.clear).toHaveBeenCalled()
    })
  })

  describe('hasLocale', () => {
    it('returns true for loaded locales', async () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { storage })

      await cached.load('en')

      expect(cached.hasLocale('en')).toBe(true)
    })

    it('delegates to source for unloaded locales', () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' }, tr: { hello: 'Merhaba' } })
      const cached = createCachedLoader(source, { storage })

      expect(cached.hasLocale('tr')).toBe(true)
      expect(cached.hasLocale('fr')).toBe(false)
    })
  })

  describe('getAvailableLocales', () => {
    it('combines loaded and source locales', async () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' }, tr: { hello: 'Merhaba' } })
      const cached = createCachedLoader(source, { storage })

      await cached.load('en')

      const locales = cached.getAvailableLocales()
      expect(locales).toContain('en')
      expect(locales).toContain('tr')
    })

    it('deduplicates locales', async () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { storage })

      await cached.load('en')

      const locales = cached.getAvailableLocales()
      expect(locales.filter((l) => l === 'en')).toHaveLength(1)
    })
  })

  describe('with localStorage', () => {
    it('stores entries with timestamp', async () => {
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { prefix: 'test' })

      vi.setSystemTime(new Date('2026-01-30T12:00:00Z'))
      await cached.load('en')

      expect(mockLocalStorage.setItem).toHaveBeenCalled()
      const stored = mockLocalStorage.getItem('test:en') as string | null
      expect(stored).not.toBeNull()

      if (stored === null) throw new Error('stored should not be null')
      const entry = JSON.parse(stored)
      expect(entry.messages).toEqual({ hello: 'Hello' })
      expect(entry.timestamp).toBe(new Date('2026-01-30T12:00:00Z').getTime())
    })

    it('respects TTL expiry', async () => {
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const TTL = 60 * 1000 // 1 minute
      const cached = createCachedLoader(source, { prefix: 'test', ttl: TTL })

      // First load
      vi.setSystemTime(new Date('2026-01-30T12:00:00Z'))
      await cached.load('en')
      expect(source.load).toHaveBeenCalledTimes(1)

      // Within TTL - should use cache
      vi.setSystemTime(new Date('2026-01-30T12:00:30Z'))
      await cached.load('en')
      expect(source.load).toHaveBeenCalledTimes(1)

      // After TTL - should refetch
      vi.setSystemTime(new Date('2026-01-30T12:02:00Z'))
      await cached.load('en')
      expect(source.load).toHaveBeenCalledTimes(2)
    })

    it('handles corrupted cache entries', async () => {
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { prefix: 'test' })

      // Set corrupted cache
      mockLocalStorage.setItem('test:en', 'not valid json')

      await cached.load('en')

      // Should fetch from source despite corrupted cache
      expect(source.load).toHaveBeenCalled()
    })

    it('uses default prefix', async () => {
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source)

      await cached.load('en')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sentio-i18n:en', expect.any(String))
    })
  })

  describe('without localStorage (SSR)', () => {
    beforeEach(() => {
      vi.unstubAllGlobals()
    })

    it('falls back to source without localStorage', async () => {
      const storage = createMockStorage()
      const source = createMockSourceLoader({ en: { hello: 'Hello' } })
      const cached = createCachedLoader(source, { storage })

      const result = await cached.load('en')

      expect(result).toEqual({ hello: 'Hello' })
    })
  })
})
