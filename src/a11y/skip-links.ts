/**
 * Skip Links
 *
 * Skip link utilities for keyboard navigation:
 * - Skip to main content
 * - Skip to navigation
 * - Multiple skip targets
 *
 * @module sentio/a11y/skip-links
 */

/**
 * Skip link target
 */
export interface SkipLinkTarget {
  /** Target ID (without #) */
  id: string
  /** Link label */
  label: string
}

/**
 * Skip links configuration
 */
export interface SkipLinksConfig {
  /** Skip link targets */
  targets: SkipLinkTarget[]
  /** Container element or selector */
  container?: Element | string
  /** CSS class for skip link container */
  containerClass?: string
  /** CSS class for individual links */
  linkClass?: string
  /** Custom styles for visually hidden (shows on focus) */
  styles?: Partial<CSSStyleDeclaration>
}

/**
 * Skip links controller
 */
export interface SkipLinks {
  /** Create and insert skip links */
  create: () => void
  /** Remove skip links */
  destroy: () => void
  /** Update targets */
  updateTargets: (targets: SkipLinkTarget[]) => void
}

/**
 * Default skip link styles
 */
const DEFAULT_STYLES: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  left: '-9999px',
  zIndex: '9999',
  padding: '8px 16px',
  background: '#000',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 'bold',
}

const FOCUS_STYLES: Partial<CSSStyleDeclaration> = {
  left: '8px',
  top: '8px',
}

/**
 * Create skip links
 *
 * Creates visually hidden skip links that appear on focus,
 * allowing keyboard users to bypass repetitive content.
 *
 * @example
 * ```typescript
 * const skipLinks = createSkipLinks({
 *   targets: [
 *     { id: 'main-content', label: 'Skip to main content' },
 *     { id: 'navigation', label: 'Skip to navigation' },
 *   ],
 * })
 *
 * skipLinks.create()
 * ```
 */
export function createSkipLinks(config: SkipLinksConfig): SkipLinks {
  let container: HTMLElement | null = null
  let targets = [...config.targets]

  function create(): void {
    if (typeof document === 'undefined') return

    // Create container
    container = document.createElement('nav')
    container.setAttribute('aria-label', 'Skip links')

    if (config.containerClass) {
      container.className = config.containerClass
    }

    // Create links
    targets.forEach((target) => {
      const link = document.createElement('a')
      link.href = `#${target.id}`
      link.textContent = target.label

      if (config.linkClass) {
        link.className = config.linkClass
      }

      // Apply default styles
      const styles = { ...DEFAULT_STYLES, ...config.styles }
      Object.assign(link.style, styles)

      // Show on focus
      link.addEventListener('focus', () => {
        Object.assign(link.style, FOCUS_STYLES)
      })

      link.addEventListener('blur', () => {
        Object.assign(link.style, DEFAULT_STYLES, config.styles)
      })

      // Handle click - focus target element
      link.addEventListener('click', (e) => {
        const targetElement = document.getElementById(target.id)
        if (targetElement) {
          e.preventDefault()
          targetElement.setAttribute('tabindex', '-1')
          targetElement.focus()
          targetElement.scrollIntoView({ behavior: 'smooth' })
        }
      })

      container?.appendChild(link)
    })

    // Insert at beginning of body or specified container
    const parentContainer =
      typeof config.container === 'string'
        ? document.querySelector(config.container)
        : (config.container ?? document.body)

    if (parentContainer?.firstChild) {
      parentContainer.insertBefore(container, parentContainer.firstChild)
    } else {
      parentContainer?.appendChild(container)
    }
  }

  function destroy(): void {
    container?.remove()
    container = null
  }

  function updateTargets(newTargets: SkipLinkTarget[]): void {
    targets = [...newTargets]
    destroy()
    create()
  }

  return {
    create,
    destroy,
    updateTargets,
  }
}
