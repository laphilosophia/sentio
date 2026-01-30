/**
 * Interpolate placeholders in a template string
 *
 * @param template - Template string with {placeholder} syntax
 * @param params - Key-value pairs for replacement
 * @returns Interpolated string
 *
 * @example
 * ```typescript
 * interpolate('Hello {name}!', { name: 'Volta' })
 * // Returns: 'Hello Volta!'
 * ```
 */
export function interpolate(template: string, params: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key]
      return value === null || value === undefined ? '' : String(value)
    }
    // Return placeholder as-is if param not found
    return match
  })
}
