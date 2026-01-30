/**
 * Message dictionary type
 */
export type Messages = Record<string, Record<string, string>>

/**
 * Parse locale into base and region parts
 *
 * @example
 * parseLocale('tr-TR') // { base: 'tr', region: 'TR' }
 * parseLocale('en')    // { base: 'en', region: undefined }
 */
function parseLocale(locale: string): { base: string; region?: string } {
  const parts = locale.split('-')
  return {
    base: parts[0],
    region: parts[1],
  }
}

/**
 * Build fallback chain for a locale
 *
 * @example
 * buildFallbackChain('tr-TR', 'en') // ['tr-TR', 'tr', 'en']
 * buildFallbackChain('en', 'en')    // ['en']
 */
export function buildFallbackChain(locale: string, fallback: string): string[] {
  const chain: string[] = []
  const { base, region } = parseLocale(locale)

  // Add full locale if it has region
  if (region) {
    chain.push(locale)
  }

  // Add base locale
  if (!chain.includes(base)) {
    chain.push(base)
  }

  // Add fallback if different from base
  if (fallback !== base && !chain.includes(fallback)) {
    chain.push(fallback)
  }

  return chain
}

/**
 * Resolve a message key using fallback chain
 *
 * @param key - Translation key (supports dot notation)
 * @param locale - Current locale
 * @param fallback - Fallback locale
 * @param messages - Message dictionaries
 * @returns Resolved message or undefined
 */
export function resolveMessage(
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
