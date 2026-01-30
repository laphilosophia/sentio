/**
 * sentio/a11y
 *
 * Headless accessibility runtime for deterministic UI platforms.
 * Provides ARIA attribute resolution and semantic role validation.
 *
 * @module sentio/a11y
 */

import type { I18n } from '../i18n/index.js'

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
}

/**
 * Resolved ARIA attributes
 */
export interface A11yAttributes {
  role?: string
  'aria-label'?: string
  'aria-hidden'?: boolean
  'aria-disabled'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-describedby'?: string
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
export function createA11y(_config: A11yConfig): A11y {
  // TODO: Implement in Phase 3
  throw new Error('Not implemented')
}

/**
 * Standalone attribute resolver
 */
export function resolveAttributes(_input: A11yInput): A11yAttributes {
  // TODO: Implement in Phase 3
  throw new Error('Not implemented')
}
