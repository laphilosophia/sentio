/**
 * In-memory message loader
 *
 * Synchronous loader for static message dictionaries.
 * Ideal for testing, SSR, and bundled translations.
 *
 * @module sentio/i18n/loaders/in-memory
 */

import type { LocaleMessages, MessageLoader, Messages } from '../types.js'

/**
 * Create an in-memory message loader
 *
 * @example
 * ```typescript
 * const loader = createInMemoryLoader({
 *   en: { greeting: 'Hello' },
 *   tr: { greeting: 'Merhaba' },
 * })
 *
 * await loader.load('tr') // { greeting: 'Merhaba' }
 * ```
 */
export function createInMemoryLoader(messages: Messages): MessageLoader {
  const locales = Object.keys(messages)

  return {
    async load(locale: string): Promise<LocaleMessages> {
      const dict = messages[locale]
      if (!dict) {
        throw new Error(`Locale not found: ${locale}`)
      }
      return dict
    },

    hasLocale(locale: string): boolean {
      return Object.prototype.hasOwnProperty.call(messages, locale)
    },

    getAvailableLocales(): string[] {
      return [...locales]
    },
  }
}
