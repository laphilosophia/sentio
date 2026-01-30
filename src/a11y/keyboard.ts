/**
 * Keyboard Navigation Patterns
 *
 * Common keyboard interaction patterns:
 * - Arrow key navigation
 * - Grid navigation
 * - Type-ahead selection
 *
 * @module sentio/a11y/keyboard
 */

/**
 * Keyboard navigation options
 */
export interface KeyboardNavigationConfig {
  /** Container element */
  container: Element
  /** Item selector */
  itemSelector: string
  /** Navigation orientation */
  orientation?: 'horizontal' | 'vertical' | 'grid'
  /** Grid columns (required for grid orientation) */
  columns?: number
  /** Enable type-ahead */
  typeAhead?: boolean
  /** Type-ahead timeout (ms) */
  typeAheadTimeout?: number
  /** Callback on item activation (Enter/Space) */
  onActivate?: (element: HTMLElement, index: number) => void
  /** Callback on selection change */
  onSelectionChange?: (element: HTMLElement, index: number) => void
}

/**
 * Keyboard navigation controller
 */
export interface KeyboardNavigation {
  /** Initialize keyboard navigation */
  init: () => void
  /** Cleanup event listeners */
  destroy: () => void
  /** Get current focused index */
  getFocusedIndex: () => number
  /** Set focused item */
  setFocusedIndex: (index: number) => void
}

/**
 * Create keyboard navigation controller
 *
 * Implements ARIA keyboard navigation patterns for widgets.
 *
 * @example
 * ```typescript
 * const nav = createKeyboardNavigation({
 *   container: listbox,
 *   itemSelector: '[role="option"]',
 *   orientation: 'vertical',
 *   onActivate: (el, index) => selectOption(index),
 * })
 *
 * nav.init()
 * ```
 */
export function createKeyboardNavigation(config: KeyboardNavigationConfig): KeyboardNavigation {
  const {
    container,
    itemSelector,
    orientation = 'vertical',
    columns = 1,
    typeAhead = false,
    typeAheadTimeout = 500,
    onActivate,
    onSelectionChange,
  } = config

  let items: HTMLElement[] = []
  let focusedIndex = 0
  let typeAheadBuffer = ''
  let typeAheadTimer: ReturnType<typeof setTimeout> | null = null

  function updateItems(): void {
    items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[]
  }

  function focusItem(index: number): void {
    if (index < 0 || index >= items.length) return

    const item = items[index]
    item.focus()
    focusedIndex = index
    onSelectionChange?.(item, index)
  }

  function handleArrowNavigation(event: KeyboardEvent, direction: number): void {
    event.preventDefault()

    let nextIndex = focusedIndex

    if (orientation === 'grid') {
      switch (event.key) {
        case 'ArrowRight':
          nextIndex = focusedIndex + 1
          break
        case 'ArrowLeft':
          nextIndex = focusedIndex - 1
          break
        case 'ArrowDown':
          nextIndex = focusedIndex + columns
          break
        case 'ArrowUp':
          nextIndex = focusedIndex - columns
          break
      }
    } else {
      nextIndex = focusedIndex + direction
    }

    // Clamp to valid range
    nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex))
    focusItem(nextIndex)
  }

  function handleTypeAhead(char: string): void {
    if (!typeAhead) return

    // Clear previous timer
    if (typeAheadTimer) {
      clearTimeout(typeAheadTimer)
    }

    typeAheadBuffer += char.toLowerCase()

    // Find matching item
    const matchIndex = items.findIndex((item) => {
      const text = item.textContent?.toLowerCase() ?? ''
      return text.startsWith(typeAheadBuffer)
    })

    if (matchIndex !== -1) {
      focusItem(matchIndex)
    }

    // Reset buffer after timeout
    typeAheadTimer = setTimeout(() => {
      typeAheadBuffer = ''
    }, typeAheadTimeout)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement
    if (!items.includes(target)) return

    focusedIndex = items.indexOf(target)

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          handleArrowNavigation(event, orientation === 'grid' ? 0 : 1)
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          handleArrowNavigation(event, orientation === 'grid' ? 0 : -1)
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          handleArrowNavigation(event, 1)
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          handleArrowNavigation(event, -1)
        }
        break
      case 'Home':
        event.preventDefault()
        focusItem(0)
        break
      case 'End':
        event.preventDefault()
        focusItem(items.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onActivate?.(items[focusedIndex], focusedIndex)
        break
      default:
        // Type-ahead for single characters
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          handleTypeAhead(event.key)
        }
    }
  }

  function init(): void {
    updateItems()
    container.addEventListener('keydown', handleKeyDown as EventListener)

    // Make first item focusable
    if (items.length > 0) {
      items[0].setAttribute('tabindex', '0')
    }
  }

  function destroy(): void {
    container.removeEventListener('keydown', handleKeyDown as EventListener)
    if (typeAheadTimer) {
      clearTimeout(typeAheadTimer)
    }
  }

  function getFocusedIndex(): number {
    return focusedIndex
  }

  function setFocusedIndex(index: number): void {
    focusItem(index)
  }

  return {
    init,
    destroy,
    getFocusedIndex,
    setFocusedIndex,
  }
}

/**
 * Escape key handler
 */
export interface EscapeHandlerConfig {
  /** Callback when escape is pressed */
  onEscape: () => void
  /** Only trigger when target is within container */
  container?: Element
}

/**
 * Create escape key handler
 *
 * @example
 * ```typescript
 * const escape = createEscapeHandler({
 *   onEscape: () => closeModal(),
 *   container: modalElement,
 * })
 *
 * escape.start()
 * // ... modal is open
 * escape.stop()
 * ```
 */
export function createEscapeHandler(config: EscapeHandlerConfig): {
  start: () => void
  stop: () => void
} {
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return

    if (config.container) {
      const target = event.target as Element
      if (!config.container.contains(target)) return
    }

    event.preventDefault()
    config.onEscape()
  }

  function start(): void {
    document.addEventListener('keydown', handleKeyDown)
  }

  function stop(): void {
    document.removeEventListener('keydown', handleKeyDown)
  }

  return { start, stop }
}
