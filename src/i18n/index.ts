/**
 * sentio/i18n
 *
 * Headless internationalization runtime for deterministic UI platforms.
 * Provides ICU Message Format support with native Intl API integration.
 *
 * @module sentio/i18n
 */

import { interpolate } from './interpolate.js'
import { createICUParser, isICUMessage } from './parser.js'
import { buildFallbackChain } from './resolve.js'
import type { MessageLoader, Messages } from './types.js'

/**
 * Configuration for i18n instance
 */
export interface I18nConfig {
  /** Current locale (e.g., 'tr', 'en-US') */
  locale: string
  /** Fallback locale when key not found */
  fallback: string
  /** Message dictionaries keyed by locale (for static usage) */
  messages?: Messages
  /** Message loader for async/dynamic loading */
  loader?: MessageLoader
  /** Called when a translation key is missing */
  onMissingKey?: (key: string, locale: string) => void
}

/**
 * i18n instance interface
 */
export interface I18n {
  /** Translate a key with optional parameters */
  t: (key: string, params?: Record<string, unknown>) => string
  /** Format a date according to current locale */
  formatDate: (date: Date, style?: 'short' | 'medium' | 'long' | 'full') => string
  /** Format a number according to current locale */
  formatNumber: (value: number, style?: 'decimal' | 'currency' | 'percent') => string
  /** Format a list according to current locale */
  formatList: (items: string[], style?: 'conjunction' | 'disjunction' | 'unit') => string
  /** Get current locale */
  getLocale: () => string
  /** Set current locale (does not load messages) */
  setLocale: (locale: string) => void
  /** Get fallback locale */
  getFallback: () => string
  /** Load messages for a locale (async) */
  loadLocale: (locale: string) => Promise<void>
  /** Check if a locale is loaded */
  isLoaded: (locale: string) => boolean
  /** Get all loaded messages */
  getMessages: () => Messages
}

/**
 * Resolve a message from loaded messages using fallback chain
 */
function resolveMessageFromLoaded(
  key: string,
  locale: string,
  fallback: string,
  messages: Messages
): string | undefined {
  const chain = buildFallbackChain(locale, fallback)

  for (const loc of chain) {
    const dict = messages[loc]
    if (dict && Object.prototype.hasOwnProperty.call(dict, key)) {
      return dict[key]
    }
  }

  return undefined
}

/**
 * Create an i18n instance
 *
 * @example
 * ```typescript
 * // Static usage (in-memory)
 * const i18n = createI18n({
 *   locale: 'tr',
 *   fallback: 'en',
 *   messages: {
 *     en: { greeting: 'Hello {name}!' },
 *     tr: { greeting: 'Merhaba {name}!' },
 *   },
 * })
 *
 * // Dynamic usage (with loader)
 * const i18n = createI18n({
 *   locale: 'tr',
 *   fallback: 'en',
 *   loader: createApiLoader({ baseUrl: '/api/i18n' }),
 * })
 * await i18n.loadLocale('tr')
 * i18n.t('greeting', { name: 'Volta' })
 * ```
 */
export function createI18n(config: I18nConfig): I18n {
  let currentLocale = config.locale
  const fallbackLocale = config.fallback
  const loader = config.loader
  const onMissingKey = config.onMissingKey

  // Instance-scoped ICU parser (no global state)
  const icuParser = createICUParser()

  // Internal mutable messages store
  const loadedMessages: Messages = config.messages ? { ...config.messages } : {}

  function t(key: string, params?: Record<string, unknown>): string {
    const message = resolveMessageFromLoaded(key, currentLocale, fallbackLocale, loadedMessages)

    if (message === undefined) {
      onMissingKey?.(key, currentLocale)
      // Return key as fallback for missing translations
      return key
    }

    // Check if message contains ICU syntax
    if (params && isICUMessage(message)) {
      return icuParser.format(message, currentLocale, params)
    }

    if (params) {
      return interpolate(message, params)
    }

    return message
  }

  function formatDate(date: Date, style: 'short' | 'medium' | 'long' | 'full' = 'medium'): string {
    const styleMap: Record<'short' | 'medium' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
      short: { dateStyle: 'short' },
      medium: { dateStyle: 'medium' },
      long: { dateStyle: 'long' },
      full: { dateStyle: 'full' },
    }

    return new Intl.DateTimeFormat(currentLocale, styleMap[style]).format(date)
  }

  function formatNumber(
    value: number,
    style: 'decimal' | 'currency' | 'percent' = 'decimal'
  ): string {
    const options: Intl.NumberFormatOptions = { style }

    if (style === 'currency') {
      const currencyMap: Record<string, string> = {
        tr: 'TRY',
        en: 'USD',
        'en-US': 'USD',
        'en-GB': 'GBP',
        de: 'EUR',
        fr: 'EUR',
      }
      options.currency = currencyMap[currentLocale] ?? 'USD'
    }

    return new Intl.NumberFormat(currentLocale, options).format(value)
  }

  function getLocale(): string {
    return currentLocale
  }

  function setLocale(locale: string): void {
    currentLocale = locale
  }

  function getFallback(): string {
    return fallbackLocale
  }

  async function loadLocale(locale: string): Promise<void> {
    // If already loaded, skip
    if (loadedMessages[locale]) {
      return
    }

    if (!loader) {
      throw new Error(`No loader configured and locale "${locale}" not in static messages`)
    }

    const messages = await loader.load(locale)
    loadedMessages[locale] = messages
  }

  function isLoaded(locale: string): boolean {
    return Object.prototype.hasOwnProperty.call(loadedMessages, locale)
  }

  function getMessages(): Messages {
    return { ...loadedMessages }
  }

  function formatList(
    items: string[],
    style: 'conjunction' | 'disjunction' | 'unit' = 'conjunction'
  ): string {
    const formatter = new Intl.ListFormat(currentLocale, { style: 'long', type: style })
    return formatter.format(items)
  }

  return {
    t,
    formatDate,
    formatNumber,
    formatList,
    getLocale,
    setLocale,
    getFallback,
    loadLocale,
    isLoaded,
    getMessages,
  }
}

// Re-export types and utilities
export { interpolate } from './interpolate.js'
export { buildFallbackChain, resolveMessage } from './resolve.js'
export type { Messages } from './resolve.js'
export type {
  ApiLoaderConfig,
  CachedLoaderConfig,
  CacheStorage,
  LocaleMessages,
  MessageLoader,
} from './types.js'

// Re-export loaders
export { createApiLoader, createCachedLoader, createInMemoryLoader } from './loaders/index.js'
