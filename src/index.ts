/**
 * sentio
 *
 * Headless i18n + a11y runtime for deterministic UI platforms.
 *
 * @packageDocumentation
 */

// i18n exports
export { buildFallbackChain, createI18n, interpolate, resolveMessage } from './i18n/index.js'
export type { I18n, I18nConfig, Messages } from './i18n/index.js'

// a11y exports
export { createA11y, resolveAttributes } from './a11y/index.js'
export type { A11y, A11yAttributes, A11yConfig, A11yInput } from './a11y/index.js'
