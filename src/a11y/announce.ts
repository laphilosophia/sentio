/**
 * Live Region Announcements
 *
 * Screen reader announcement utilities:
 * - Polite announcements (queue)
 * - Assertive announcements (interrupt)
 * - Status updates
 *
 * @module sentio/a11y/announce
 */

/**
 * Announcement priority
 */
export type AnnouncePriority = 'polite' | 'assertive'

/**
 * Announcer configuration
 */
export interface AnnouncerConfig {
  /** Default priority */
  defaultPriority?: AnnouncePriority
  /** Delay between announcements (ms) */
  debounceMs?: number
  /** Container element for live regions */
  container?: Element
}

/**
 * Announcer instance
 */
export interface Announcer {
  /** Announce a message */
  announce: (message: string, priority?: AnnouncePriority) => void
  /** Clear pending announcements */
  clear: () => void
  /** Cleanup live regions */
  destroy: () => void
}

/**
 * Create a screen reader announcer
 *
 * Creates visually hidden live regions for screen reader announcements.
 * Uses aria-live with polite or assertive priority.
 *
 * @example
 * ```typescript
 * const announcer = createAnnouncer()
 *
 * // Polite announcement (queued)
 * announcer.announce('Item added to cart')
 *
 * // Assertive announcement (interrupts)
 * announcer.announce('Error: Invalid input', 'assertive')
 * ```
 */
export function createAnnouncer(config: AnnouncerConfig = {}): Announcer {
  const { defaultPriority = 'polite', debounceMs = 100 } = config

  let politeRegion: HTMLElement | null = null
  let assertiveRegion: HTMLElement | null = null
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null

  function createLiveRegion(priority: AnnouncePriority): HTMLElement {
    const region = document.createElement('div')

    // Visually hidden but accessible to screen readers
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    })

    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', priority)
    region.setAttribute('aria-atomic', 'true')

    const container = config.container ?? document.body
    container.appendChild(region)

    return region
  }

  function ensureRegions(): void {
    if (!politeRegion) {
      politeRegion = createLiveRegion('polite')
    }
    if (!assertiveRegion) {
      assertiveRegion = createLiveRegion('assertive')
    }
  }

  function announce(message: string, priority: AnnouncePriority = defaultPriority): void {
    ensureRegions()

    const region = priority === 'assertive' ? assertiveRegion : politeRegion
    if (!region) return

    // Clear pending to debounce rapid announcements
    if (pendingTimeout) {
      clearTimeout(pendingTimeout)
    }

    // Clear region first to ensure change is detected
    region.textContent = ''

    pendingTimeout = setTimeout(() => {
      region.textContent = message
      pendingTimeout = null
    }, debounceMs)
  }

  function clear(): void {
    if (pendingTimeout) {
      clearTimeout(pendingTimeout)
      pendingTimeout = null
    }
    if (politeRegion) politeRegion.textContent = ''
    if (assertiveRegion) assertiveRegion.textContent = ''
  }

  function destroy(): void {
    clear()
    politeRegion?.remove()
    assertiveRegion?.remove()
    politeRegion = null
    assertiveRegion = null
  }

  return {
    announce,
    clear,
    destroy,
  }
}

/**
 * Status announcer for form validation
 */
export interface FormAnnouncerConfig {
  /** Announcer instance (creates new if not provided) */
  announcer?: Announcer
  /** Error message template */
  errorTemplate?: (fieldName: string, error: string) => string
  /** Success message template */
  successTemplate?: (fieldName: string) => string
}

/**
 * Form status announcer
 */
export interface FormAnnouncer {
  /** Announce field error */
  announceError: (fieldName: string, error: string) => void
  /** Announce field success */
  announceSuccess: (fieldName: string) => void
  /** Announce form submission result */
  announceSubmit: (success: boolean, message?: string) => void
  /** Cleanup */
  destroy: () => void
}

/**
 * Create a form status announcer
 *
 * Specialized announcer for form validation feedback.
 *
 * @example
 * ```typescript
 * const formAnnouncer = createFormAnnouncer()
 *
 * // On validation error
 * formAnnouncer.announceError('Email', 'Invalid email format')
 *
 * // On form submit
 * formAnnouncer.announceSubmit(true, 'Form submitted successfully')
 * ```
 */
export function createFormAnnouncer(config: FormAnnouncerConfig = {}): FormAnnouncer {
  const ownAnnouncer = !config.announcer
  const announcer = config.announcer ?? createAnnouncer()

  const errorTemplate =
    config.errorTemplate ?? ((field: string, error: string): string => `${field}: ${error}`)
  const successTemplate = config.successTemplate ?? ((field: string): string => `${field} is valid`)

  function announceError(fieldName: string, error: string): void {
    announcer.announce(errorTemplate(fieldName, error), 'assertive')
  }

  function announceSuccess(fieldName: string): void {
    announcer.announce(successTemplate(fieldName), 'polite')
  }

  function announceSubmit(success: boolean, message?: string): void {
    const defaultMessage = success ? 'Form submitted successfully' : 'Form submission failed'
    announcer.announce(message ?? defaultMessage, success ? 'polite' : 'assertive')
  }

  function destroy(): void {
    if (ownAnnouncer) {
      announcer.destroy()
    }
  }

  return {
    announceError,
    announceSuccess,
    announceSubmit,
    destroy,
  }
}
