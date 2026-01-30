/**
 * Focus Management
 *
 * Utilities for managing focus in complex UI:
 * - Focus trap for modals/dialogs
 * - Focus restoration
 * - Roving tabindex for composite widgets
 *
 * @module sentio/a11y/focus
 */

/**
 * Focusable element selectors
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: Element): HTMLElement[] {
  const elements = container.querySelectorAll(FOCUSABLE_SELECTORS)
  return Array.from(elements) as HTMLElement[]
}

/**
 * Focus trap configuration
 */
export interface FocusTrapConfig {
  /** Container element or selector */
  container: Element | string
  /** Initial element to focus (or 'first' | 'last') */
  initialFocus?: Element | 'first' | 'last'
  /** Element to restore focus to on deactivate */
  returnFocus?: Element | null
  /** Allow escape key to deactivate */
  escapeDeactivates?: boolean
  /** Callback when escape is pressed */
  onEscape?: () => void
  /** Callback when focus leaves trap boundary */
  onFocusLeave?: () => void
}

/**
 * Focus trap controller
 */
export interface FocusTrap {
  /** Activate the focus trap */
  activate: () => void
  /** Deactivate the focus trap */
  deactivate: () => void
  /** Check if trap is active */
  isActive: () => boolean
  /** Update focusable elements (call after DOM changes) */
  updateElements: () => void
}

/**
 * Create a focus trap
 *
 * Traps keyboard focus within a container element,
 * wrapping from last to first element and vice versa.
 *
 * @example
 * ```typescript
 * const trap = createFocusTrap({
 *   container: modalElement,
 *   initialFocus: 'first',
 *   escapeDeactivates: true,
 *   onEscape: () => closeModal(),
 * })
 *
 * trap.activate()
 * // ... modal is open
 * trap.deactivate()
 * ```
 */
export function createFocusTrap(config: FocusTrapConfig): FocusTrap {
  const resolvedContainer =
    typeof config.container === 'string'
      ? document.querySelector(config.container)
      : config.container

  if (!resolvedContainer) {
    throw new Error('Focus trap container not found')
  }

  // Store in const to satisfy TypeScript narrowing in closures
  const container: Element = resolvedContainer

  let active = false
  let focusableElements: HTMLElement[] = []
  let returnFocusElement: Element | null = config.returnFocus ?? null

  function updateElements(): void {
    focusableElements = getFocusableElements(container)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!active) return

    if (event.key === 'Escape' && config.escapeDeactivates) {
      event.preventDefault()
      config.onEscape?.()
      return
    }

    if (event.key !== 'Tab') return

    updateElements()

    if (focusableElements.length === 0) {
      event.preventDefault()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  function handleFocusIn(event: FocusEvent): void {
    if (!active) return

    const target = event.target as Element

    // If focus moved outside container, pull it back
    if (!container.contains(target)) {
      event.preventDefault()
      config.onFocusLeave?.()

      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }
  }

  function activate(): void {
    if (active) return

    active = true
    returnFocusElement = config.returnFocus ?? document.activeElement
    updateElements()

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    // Set initial focus
    if (focusableElements.length > 0) {
      if (config.initialFocus === 'last') {
        focusableElements[focusableElements.length - 1].focus()
      } else if (config.initialFocus instanceof Element) {
        ;(config.initialFocus as HTMLElement).focus()
      } else {
        focusableElements[0].focus()
      }
    }
  }

  function deactivate(): void {
    if (!active) return

    active = false

    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('focusin', handleFocusIn)

    // Restore focus
    if (returnFocusElement && returnFocusElement instanceof HTMLElement) {
      returnFocusElement.focus()
    }
  }

  function isActive(): boolean {
    return active
  }

  return {
    activate,
    deactivate,
    isActive,
    updateElements,
  }
}

/**
 * Roving tabindex configuration
 */
export interface RovingTabindexConfig {
  /** Container element */
  container: Element
  /** Selector for navigable items */
  itemSelector: string
  /** Navigation orientation */
  orientation?: 'horizontal' | 'vertical' | 'both'
  /** Wrap navigation at boundaries */
  wrap?: boolean
  /** Callback when active item changes */
  onActiveChange?: (element: HTMLElement, index: number) => void
}

/**
 * Roving tabindex controller
 */
export interface RovingTabindex {
  /** Initialize roving tabindex */
  init: () => void
  /** Cleanup event listeners */
  destroy: () => void
  /** Set active item by index */
  setActiveIndex: (index: number) => void
  /** Get current active index */
  getActiveIndex: () => number
  /** Update items (call after DOM changes) */
  updateItems: () => void
}

/**
 * Create a roving tabindex controller
 *
 * Implements the roving tabindex pattern for composite widgets
 * like toolbars, menus, and listboxes.
 *
 * @example
 * ```typescript
 * const roving = createRovingTabindex({
 *   container: toolbarElement,
 *   itemSelector: 'button',
 *   orientation: 'horizontal',
 *   wrap: true,
 * })
 *
 * roving.init()
 * ```
 */
export function createRovingTabindex(config: RovingTabindexConfig): RovingTabindex {
  const { container, itemSelector, orientation = 'horizontal', wrap = true } = config

  let items: HTMLElement[] = []
  let activeIndex = 0

  function updateItems(): void {
    items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[]

    // Set tabindex: -1 for all except active
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1')
    })
  }

  function setActiveIndex(index: number): void {
    if (index < 0 || index >= items.length) return

    // Update tabindex
    items[activeIndex]?.setAttribute('tabindex', '-1')
    items[index]?.setAttribute('tabindex', '0')
    items[index]?.focus()

    activeIndex = index
    config.onActiveChange?.(items[index], index)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    const currentIndex = items.indexOf(target)
    if (currentIndex === -1) return

    let nextIndex = currentIndex

    const isHorizontal = orientation === 'horizontal' || orientation === 'both'
    const isVertical = orientation === 'vertical' || orientation === 'both'

    switch (event.key) {
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault()
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault()
          nextIndex = currentIndex - 1
        }
        break
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault()
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault()
          nextIndex = currentIndex - 1
        }
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = items.length - 1
        break
      default:
        return
    }

    // Handle wrapping
    if (wrap) {
      if (nextIndex < 0) nextIndex = items.length - 1
      if (nextIndex >= items.length) nextIndex = 0
    } else {
      nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex))
    }

    if (nextIndex !== currentIndex) {
      setActiveIndex(nextIndex)
    }
  }

  function init(): void {
    updateItems()
    container.addEventListener('keydown', handleKeyDown as EventListener)
  }

  function destroy(): void {
    container.removeEventListener('keydown', handleKeyDown as EventListener)
  }

  function getActiveIndex(): number {
    return activeIndex
  }

  return {
    init,
    destroy,
    setActiveIndex,
    getActiveIndex,
    updateItems,
  }
}
