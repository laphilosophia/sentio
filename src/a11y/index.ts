/**
 * sentio/a11y
 *
 * Headless accessibility runtime for deterministic UI platforms.
 * Provides ARIA attribute resolution, focus management, live regions,
 * keyboard navigation, and user preference detection.
 *
 * @module sentio/a11y
 */

import type { I18n } from '../i18n/index.js'

// ============================================================================
// Core ARIA Attribute Resolution
// ============================================================================

/**
 * Configuration for a11y instance
 */
export interface A11yConfig {
  /** Enable a11y attribute resolution */
  enabled?: boolean
  /** Language for aria-lang attribute */
  lang?: string
}

/**
 * Input for attribute resolution
 */
export interface A11yInput {
  /** ARIA role */
  role?: string
  /** Static label text */
  label?: string
  /** i18n key for localized label */
  labelKey?: string
  /** i18n instance for label resolution */
  i18n?: I18n
  /** Disabled state */
  disabled?: boolean
  /** Hidden state */
  hidden?: boolean
  /** Live region type */
  live?: 'polite' | 'assertive' | 'off'
  /** Described by element ID */
  describedBy?: string
  /** Labelled by element ID */
  labelledBy?: string
  /** Controls element ID */
  controls?: string
  /** Expanded state */
  expanded?: boolean
  /** Pressed state (toggle buttons) */
  pressed?: boolean | 'mixed'
  /** Selected state */
  selected?: boolean
  /** Checked state */
  checked?: boolean | 'mixed'
  /** Required state */
  required?: boolean
  /** Invalid state */
  invalid?: boolean
  /** Error message ID */
  errorMessage?: string
  /** Busy/loading state */
  busy?: boolean
  /** Current item indicator */
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  /** Has popup */
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  /** Modal dialog */
  modal?: boolean
  /** Value for range widgets */
  valueNow?: number
  /** Minimum value */
  valueMin?: number
  /** Maximum value */
  valueMax?: number
  /** Text representation of value */
  valueText?: string
}

/**
 * Resolved ARIA attributes
 */
export interface A11yAttributes {
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-hidden'?: boolean
  'aria-disabled'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-describedby'?: string
  'aria-controls'?: string
  'aria-expanded'?: boolean
  'aria-pressed'?: boolean | 'mixed'
  'aria-selected'?: boolean
  'aria-checked'?: boolean | 'mixed'
  'aria-required'?: boolean
  'aria-invalid'?: boolean
  'aria-errormessage'?: string
  'aria-busy'?: boolean
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-modal'?: boolean
  'aria-valuenow'?: number
  'aria-valuemin'?: number
  'aria-valuemax'?: number
  'aria-valuetext'?: string
  tabIndex?: number
}

/**
 * a11y instance interface
 */
export interface A11y {
  /** Resolve attributes from input */
  resolve: (input: A11yInput) => A11yAttributes
}

/**
 * Create an a11y instance
 *
 * @example
 * ```typescript
 * const a11y = createA11y({ enabled: true, lang: 'tr' })
 *
 * const attrs = a11y.resolve({
 *   role: 'button',
 *   label: 'Submit form',
 *   disabled: true,
 * })
 * // { role: 'button', 'aria-label': 'Submit form', 'aria-disabled': true, tabIndex: -1 }
 * ```
 */
export function createA11y(config: A11yConfig = {}): A11y {
  const enabled = config.enabled ?? true

  function resolve(input: A11yInput): A11yAttributes {
    if (!enabled) {
      return {}
    }
    return resolveAttributes(input)
  }

  return { resolve }
}

/**
 * Standalone attribute resolver
 *
 * Resolves ARIA attributes from semantic input.
 */
export function resolveAttributes(input: A11yInput): A11yAttributes {
  const attrs: A11yAttributes = {}

  // Role
  if (input.role) {
    attrs.role = input.role
  }

  // Label resolution: i18n key takes priority
  if (input.labelKey && input.i18n) {
    attrs['aria-label'] = input.i18n.t(input.labelKey)
  } else if (input.label) {
    attrs['aria-label'] = input.label
  }

  // Label by reference
  if (input.labelledBy) {
    attrs['aria-labelledby'] = input.labelledBy
  }

  // Disabled state
  if (input.disabled) {
    attrs['aria-disabled'] = true
    attrs.tabIndex = -1
  }

  // Hidden state
  if (input.hidden) {
    attrs['aria-hidden'] = true
  }

  // Live region
  if (input.live) {
    attrs['aria-live'] = input.live
  }

  // Described by
  if (input.describedBy) {
    attrs['aria-describedby'] = input.describedBy
  }

  // Controls
  if (input.controls) {
    attrs['aria-controls'] = input.controls
  }

  // Expanded
  if (input.expanded !== undefined) {
    attrs['aria-expanded'] = input.expanded
  }

  // Pressed (toggle buttons)
  if (input.pressed !== undefined) {
    attrs['aria-pressed'] = input.pressed
  }

  // Selected
  if (input.selected !== undefined) {
    attrs['aria-selected'] = input.selected
  }

  // Checked
  if (input.checked !== undefined) {
    attrs['aria-checked'] = input.checked
  }

  // Required
  if (input.required) {
    attrs['aria-required'] = true
  }

  // Invalid
  if (input.invalid) {
    attrs['aria-invalid'] = true
  }

  // Error message
  if (input.errorMessage) {
    attrs['aria-errormessage'] = input.errorMessage
  }

  // Busy
  if (input.busy) {
    attrs['aria-busy'] = true
  }

  // Current
  if (input.current !== undefined) {
    attrs['aria-current'] = input.current
  }

  // Has popup
  if (input.hasPopup !== undefined) {
    attrs['aria-haspopup'] = input.hasPopup
  }

  // Modal
  if (input.modal) {
    attrs['aria-modal'] = true
  }

  // Range values
  if (input.valueNow !== undefined) {
    attrs['aria-valuenow'] = input.valueNow
  }
  if (input.valueMin !== undefined) {
    attrs['aria-valuemin'] = input.valueMin
  }
  if (input.valueMax !== undefined) {
    attrs['aria-valuemax'] = input.valueMax
  }
  if (input.valueText) {
    attrs['aria-valuetext'] = input.valueText
  }

  return attrs
}

// ============================================================================
// Re-export submodules
// ============================================================================

// Focus management
export {
  createFocusTrap,
  createRovingTabindex,
  getFocusableElements,
  type FocusTrap,
  type FocusTrapConfig,
  type RovingTabindex,
  type RovingTabindexConfig,
} from './focus.js'

// Live region announcements
export {
  createAnnouncer,
  createFormAnnouncer,
  type AnnouncePriority,
  type Announcer,
  type AnnouncerConfig,
  type FormAnnouncer,
  type FormAnnouncerConfig,
} from './announce.js'

// User preferences
export {
  createPreferencesObserver,
  getAnimationDuration,
  getPreferences,
  prefersColorScheme,
  prefersHighContrast,
  prefersReducedMotion,
  prefersReducedTransparency,
  withReducedMotion,
  type A11yPreferences,
  type PreferencesObserver,
} from './preferences.js'

// Skip links
export {
  createSkipLinks,
  type SkipLinks,
  type SkipLinksConfig,
  type SkipLinkTarget,
} from './skip-links.js'

// Keyboard navigation
export {
  createEscapeHandler,
  createKeyboardNavigation,
  type KeyboardNavigation,
  type KeyboardNavigationConfig,
} from './keyboard.js'

// ID utilities
export {
  createFormFieldAssociation,
  createIdAssociation,
  generateId,
  removeAriaReference,
  resetIdCounter,
  type AriaRelationship,
  type FormFieldAssociation,
  type IdAssociation,
} from './ids.js'
