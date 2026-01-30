/**
 * sentio/i18n
 *
 * Headless internationalization runtime for deterministic UI platforms.
 * Provides ICU Message Format support with native Intl API integration.
 *
 * @module sentio/i18n
 */

import { interpolate } from './interpolate.js'
import { resolveMessage, type Messages } from './resolve.js'

/**
 * Configuration for i18n instance
 */
export interface I18nConfig {
  /** Current locale (e.g., 'tr', 'en-US') */
  locale: string
  /** Fallback locale when key not found */
  fallback: string
  /** Message dictionaries keyed by locale */
  messages: Messages
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
  /** Get current locale */
  getLocale: () => string
  /** Set current locale */
  setLocale: (locale: string) => void
  /** Get fallback locale */
  getFallback: () => string
}

/**
 * Create an i18n instance
 *
 * @example
 * ```typescript
 * const i18n = createI18n({
 *   locale: 'tr',
 *   fallback: 'en',
 *   messages: {
 *     en: { greeting: 'Hello {name}!' },
 *     tr: { greeting: 'Merhaba {name}!' },
 *   },
 * })
 *
 * i18n.t('greeting', { name: 'Volta' }) // "Merhaba Volta!"
 * ```
 */
export function createI18n(config: I18nConfig): I18n {
  let currentLocale = config.locale
  const fallbackLocale = config.fallback
  const messages = config.messages
  const onMissingKey = config.onMissingKey

  function t(key: string, params?: Record<string, unknown>): string {
    const message = resolveMessage(key, currentLocale, fallbackLocale, messages)

    if (message === undefined) {
      onMissingKey?.(key, currentLocale)
      // Return key as fallback for missing translations
      return key
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
      // Derive currency from locale (simplified)
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

  return {
    t,
    formatDate,
    formatNumber,
    getLocale,
    setLocale,
    getFallback,
  }
}

// Re-export types and utilities
export { interpolate } from './interpolate.js'
export { buildFallbackChain, resolveMessage } from './resolve.js'
export type { Messages } from './resolve.js'
