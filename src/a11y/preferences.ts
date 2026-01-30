/**
 * Media Query Preferences
 *
 * Utilities for respecting user accessibility preferences:
 * - Reduced motion
 * - High contrast
 * - Color scheme
 *
 * @module sentio/a11y/preferences
 */

/**
 * User preferences state
 */
export interface A11yPreferences {
  /** User prefers reduced motion */
  reducedMotion: boolean
  /** User prefers high contrast */
  highContrast: boolean
  /** User's preferred color scheme */
  colorScheme: 'light' | 'dark' | 'no-preference'
  /** User prefers reduced transparency */
  reducedTransparency: boolean
}

/**
 * Preferences observer
 */
export interface PreferencesObserver {
  /** Get current preferences */
  get: () => A11yPreferences
  /** Subscribe to preference changes */
  subscribe: (callback: (prefs: A11yPreferences) => void) => () => void
  /** Cleanup media query listeners */
  destroy: () => void
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if high contrast is preferred
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  // -ms-high-contrast for older browsers, forced-colors for modern
  return (
    window.matchMedia('(forced-colors: active)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  )
}

/**
 * Get preferred color scheme
 */
export function prefersColorScheme(): 'light' | 'dark' | 'no-preference' {
  if (typeof window === 'undefined') return 'no-preference'

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'no-preference'
}

/**
 * Check if reduced transparency is preferred
 */
export function prefersReducedTransparency(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-transparency: reduce)').matches
}

/**
 * Get all current preferences
 */
export function getPreferences(): A11yPreferences {
  return {
    reducedMotion: prefersReducedMotion(),
    highContrast: prefersHighContrast(),
    colorScheme: prefersColorScheme(),
    reducedTransparency: prefersReducedTransparency(),
  }
}

/**
 * Create a preferences observer
 *
 * Observes changes to user accessibility preferences
 * and notifies subscribers.
 *
 * @example
 * ```typescript
 * const observer = createPreferencesObserver()
 *
 * const unsubscribe = observer.subscribe((prefs) => {
 *   if (prefs.reducedMotion) {
 *     disableAnimations()
 *   }
 * })
 *
 * // Later
 * unsubscribe()
 * observer.destroy()
 * ```
 */
export function createPreferencesObserver(): PreferencesObserver {
  if (typeof window === 'undefined') {
    // SSR fallback - return no-op implementation
    const noop = (): void => {
      // Intentionally empty for SSR
    }
    return {
      get: getPreferences,
      subscribe: (): (() => void) => noop,
      destroy: noop,
    }
  }

  const subscribers = new Set<(prefs: A11yPreferences) => void>()
  const mediaQueries: { query: MediaQueryList; handler: (e: MediaQueryListEvent) => void }[] = []

  function notify(): void {
    const prefs = getPreferences()
    subscribers.forEach((cb) => cb(prefs))
  }

  function setupQuery(query: string): void {
    const mq = window.matchMedia(query)
    const handler = (): void => notify()

    // Modern browsers
    if (mq.addEventListener) {
      mq.addEventListener('change', handler)
    }

    mediaQueries.push({ query: mq, handler })
  }

  // Setup all preference queries
  setupQuery('(prefers-reduced-motion: reduce)')
  setupQuery('(prefers-color-scheme: dark)')
  setupQuery('(prefers-color-scheme: light)')
  setupQuery('(forced-colors: active)')
  setupQuery('(prefers-reduced-transparency: reduce)')

  function subscribe(callback: (prefs: A11yPreferences) => void): () => void {
    subscribers.add(callback)

    // Immediately call with current preferences
    callback(getPreferences())

    return () => {
      subscribers.delete(callback)
    }
  }

  function destroy(): void {
    subscribers.clear()
    mediaQueries.forEach(({ query, handler }) => {
      if (query.removeEventListener) {
        query.removeEventListener('change', handler)
      }
    })
    mediaQueries.length = 0
  }

  return {
    get: getPreferences,
    subscribe,
    destroy,
  }
}

/**
 * Conditional animation helper
 *
 * Returns animation value only if user hasn't requested reduced motion.
 *
 * @example
 * ```typescript
 * const transition = withReducedMotion('transform 0.3s ease', 'none')
 * // Returns 'none' if user prefers reduced motion
 * ```
 */
export function withReducedMotion<T>(value: T, fallback: T): T {
  return prefersReducedMotion() ? fallback : value
}

/**
 * Animation duration helper
 *
 * Returns 0 duration if reduced motion is preferred.
 */
export function getAnimationDuration(durationMs: number): number {
  return prefersReducedMotion() ? 0 : durationMs
}
