/**
 * API message loader
 *
 * Fetches messages from a backend endpoint.
 * Supports custom headers, fetch function, and response transformation.
 *
 * @module sentio/i18n/loaders/api
 */

import type { ApiLoaderConfig, LocaleMessages, MessageLoader } from '../types.js'

/**
 * Create an API message loader
 *
 * @example
 * ```typescript
 * const loader = createApiLoader({
 *   baseUrl: '/api/i18n',
 *   headers: { 'Authorization': 'Bearer token' },
 * })
 *
 * // Fetches from /api/i18n/tr.json
 * await loader.load('tr')
 * ```
 */
export function createApiLoader(config: ApiLoaderConfig): MessageLoader {
  const { baseUrl, headers = {}, transform } = config
  const fetchFn = config.fetch ?? globalThis.fetch

  // Track available locales (discovered on first load or pre-configured)
  const knownLocales = new Set<string>()

  return {
    async load(locale: string): Promise<LocaleMessages> {
      const url = `${baseUrl}/${locale}.json`

      const response = await fetchFn(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Locale not found: ${locale}`)
        }
        throw new Error(`Failed to load locale ${locale}: ${response.status}`)
      }

      const data: unknown = await response.json()

      // Track discovered locale
      knownLocales.add(locale)

      if (transform) {
        return transform(data)
      }

      return data as LocaleMessages
    },

    hasLocale(locale: string): boolean {
      // Only returns true for known/loaded locales
      return knownLocales.has(locale)
    },

    getAvailableLocales(): string[] {
      return [...knownLocales]
    },
  }
}
