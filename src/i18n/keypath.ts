/**
 * Key-path resolution utility
 *
 * Provides nested object access using dot-notation paths.
 * e.g., getByPath(obj, 'common.buttons.submit') → obj.common.buttons.submit
 *
 * @module sentio/i18n/keypath
 */

/**
 * Get a nested value from an object using dot-notation path
 *
 * @example
 * ```typescript
 * const obj = { common: { buttons: { submit: 'Submit' } } }
 * getByPath(obj, 'common.buttons.submit') // → 'Submit'
 * getByPath(obj, 'common.missing') // → undefined
 * ```
 */
export function getByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const segments = path.split('.')
  let current: unknown = obj

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  // Only return if we got a string value
  if (typeof current === 'string') {
    return current
  }

  return undefined
}

/**
 * Check if an object has a nested key at the given path
 */
export function hasPath(obj: Record<string, unknown>, path: string): boolean {
  return getByPath(obj, path) !== undefined
}

/**
 * Flatten a nested object into dot-notation keys
 *
 * @example
 * ```typescript
 * flatten({ a: { b: 'value' } }) // → { 'a.b': 'value' }
 * ```
 */
export function flattenMessages(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'string') {
      result[fullKey] = value
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenMessages(value as Record<string, unknown>, fullKey))
    }
  }

  return result
}
