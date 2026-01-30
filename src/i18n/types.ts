/**
 * Shared types for i18n module
 *
 * @module sentio/i18n/types
 */

/**
 * Message dictionary for a single locale
 */
export type LocaleMessages = Record<string, string>

/**
 * Message dictionaries keyed by locale
 */
export type Messages = Record<string, LocaleMessages>

/**
 * Message loader interface
 *
 * Implementations provide different message sources:
 * - InMemoryLoader: Static object (sync)
 * - JsonFileLoader: Local JSON files
 * - ApiLoader: Backend API fetch
 * - CachedLoader: Decorator with cache layer
 */
export interface MessageLoader {
  /**
   * Load messages for a locale
   * @param locale - Locale code (e.g., 'tr', 'en-US')
   * @returns Promise resolving to message dictionary
   * @throws Error if locale not available
   */
  load(locale: string): Promise<LocaleMessages>

  /**
   * Check if a locale is available
   */
  hasLocale(locale: string): boolean

  /**
   * Get list of available locales
   */
  getAvailableLocales(): string[]
}

/**
 * Cache storage interface for CachedLoader
 */
export interface CacheStorage {
  get(key: string): Promise<LocaleMessages | null>
  set(key: string, value: LocaleMessages): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}

/**
 * API loader configuration
 */
export interface ApiLoaderConfig {
  /** Base URL for API endpoint */
  baseUrl: string
  /** Custom fetch function (for testing/SSR) */
  fetch?: typeof fetch
  /** Request headers */
  headers?: Record<string, string>
  /** Transform response before returning */
  transform?: (response: unknown) => LocaleMessages
}

/**
 * Cached loader configuration
 */
export interface CachedLoaderConfig {
  /** Storage key prefix */
  prefix?: string
  /** Cache TTL in milliseconds (default: 24h) */
  ttl?: number
  /** Custom storage implementation */
  storage?: CacheStorage
}
