/**
 * ICU Message Format parser
 *
 * Parses and formats ICU MessageFormat strings with support for:
 * - Pluralization: {count, plural, one {# item} other {# items}}
 * - Select: {gender, select, male {He} female {She} other {They}}
 * - Nested messages and placeholders
 *
 * @module sentio/i18n/parser
 */

import IntlMessageFormat from 'intl-messageformat'

/**
 * Pattern to detect ICU syntax
 * Matches: {name, plural|select|selectordinal, ...}
 */
const ICU_PATTERN = /\{[^}]+,\s*(plural|select|selectordinal)\s*,/

/**
 * Check if a message contains ICU syntax
 */
export function isICUMessage(message: string): boolean {
  return ICU_PATTERN.test(message)
}

/**
 * ICU Parser instance for scoped caching
 */
export interface ICUParser {
  format: (message: string, locale: string, params?: Record<string, unknown>) => string
  clearCache: () => void
}

/**
 * Create an ICU parser instance with scoped cache
 *
 * This factory function creates a parser with instance-scoped cache,
 * avoiding global state and memory leaks.
 *
 * @example
 * ```typescript
 * const parser = createICUParser()
 *
 * parser.format('{count, plural, one {# item} other {# items}}', 'en', { count: 5 })
 * // Returns: '5 items'
 *
 * parser.clearCache() // Clear when locale changes or on cleanup
 * ```
 */
export function createICUParser(): ICUParser {
  // Instance-scoped cache - no global state
  const cache = new Map<string, IntlMessageFormat>()

  function getFormatter(message: string, locale: string): IntlMessageFormat {
    const cacheKey = `${locale}:${message}`

    let formatter = cache.get(cacheKey)
    if (!formatter) {
      formatter = new IntlMessageFormat(message, locale)
      cache.set(cacheKey, formatter)
    }

    return formatter
  }

  function format(message: string, locale: string, params: Record<string, unknown> = {}): string {
    try {
      const formatter = getFormatter(message, locale)
      const result = formatter.format(params)

      // IntlMessageFormat can return string or array of parts
      if (Array.isArray(result)) {
        return result.map(String).join('')
      }

      return String(result)
    } catch {
      // On parse error, return original message
      // This prevents crashes from malformed ICU strings
      return message
    }
  }

  function clearCache(): void {
    cache.clear()
  }

  return {
    format,
    clearCache,
  }
}

// --- Legacy API (for backward compatibility) ---
// These functions create a lazily-initialized singleton parser
// Consider using createICUParser() for better control

let defaultParser: ICUParser | null = null

function getDefaultParser(): ICUParser {
  if (!defaultParser) {
    defaultParser = createICUParser()
  }
  return defaultParser
}

/**
 * Format an ICU message with parameters (uses default parser)
 * @deprecated Use createICUParser().format() for memory-safe usage
 */
export function formatICU(
  message: string,
  locale: string,
  params: Record<string, unknown> = {}
): string {
  return getDefaultParser().format(message, locale, params)
}

/**
 * Clear the default parser's cache
 * @deprecated Use createICUParser().clearCache() for scoped control
 */
export function clearMessageCache(): void {
  defaultParser?.clearCache()
}
