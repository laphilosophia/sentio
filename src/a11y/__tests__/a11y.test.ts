import { describe, expect, it } from 'vitest'
import { createI18n } from '../../i18n/index'
import { createA11y, resolveAttributes } from '../index'

describe('resolveAttributes', () => {
  it('resolves role', () => {
    const attrs = resolveAttributes({ role: 'button' })
    expect(attrs.role).toBe('button')
  })

  it('resolves static label', () => {
    const attrs = resolveAttributes({ label: 'Submit' })
    expect(attrs['aria-label']).toBe('Submit')
  })

  it('resolves i18n label with labelKey', () => {
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      messages: { en: { 'button.submit': 'Submit Form' } },
    })

    const attrs = resolveAttributes({ labelKey: 'button.submit', i18n })
    expect(attrs['aria-label']).toBe('Submit Form')
  })

  it('prefers labelKey over static label', () => {
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      messages: { en: { 'button.submit': 'i18n Label' } },
    })

    const attrs = resolveAttributes({
      label: 'Static Label',
      labelKey: 'button.submit',
      i18n,
    })

    expect(attrs['aria-label']).toBe('i18n Label')
  })

  it('falls back to static label without i18n', () => {
    const attrs = resolveAttributes({ label: 'Static', labelKey: 'key' })
    expect(attrs['aria-label']).toBe('Static')
  })

  it('resolves disabled state', () => {
    const attrs = resolveAttributes({ disabled: true })
    expect(attrs['aria-disabled']).toBe(true)
    expect(attrs.tabIndex).toBe(-1)
  })

  it('resolves hidden state', () => {
    const attrs = resolveAttributes({ hidden: true })
    expect(attrs['aria-hidden']).toBe(true)
  })

  it('resolves live region', () => {
    expect(resolveAttributes({ live: 'polite' })['aria-live']).toBe('polite')
    expect(resolveAttributes({ live: 'assertive' })['aria-live']).toBe('assertive')
    expect(resolveAttributes({ live: 'off' })['aria-live']).toBe('off')
  })

  it('resolves describedBy', () => {
    const attrs = resolveAttributes({ describedBy: 'help-text' })
    expect(attrs['aria-describedby']).toBe('help-text')
  })

  it('resolves multiple attributes', () => {
    const attrs = resolveAttributes({
      role: 'button',
      label: 'Delete',
      disabled: true,
      describedBy: 'delete-warning',
    })

    expect(attrs).toEqual({
      role: 'button',
      'aria-label': 'Delete',
      'aria-disabled': true,
      tabIndex: -1,
      'aria-describedby': 'delete-warning',
    })
  })

  it('returns empty object for empty input', () => {
    const attrs = resolveAttributes({})
    expect(attrs).toEqual({})
  })
})

describe('createA11y', () => {
  it('creates a11y instance with resolve method', () => {
    const a11y = createA11y()
    expect(typeof a11y.resolve).toBe('function')
  })

  it('resolves attributes when enabled', () => {
    const a11y = createA11y({ enabled: true })
    const attrs = a11y.resolve({ role: 'button', label: 'Click me' })

    expect(attrs.role).toBe('button')
    expect(attrs['aria-label']).toBe('Click me')
  })

  it('returns empty object when disabled', () => {
    const a11y = createA11y({ enabled: false })
    const attrs = a11y.resolve({ role: 'button', label: 'Click me' })

    expect(attrs).toEqual({})
  })

  it('is enabled by default', () => {
    const a11y = createA11y()
    const attrs = a11y.resolve({ role: 'button' })

    expect(attrs.role).toBe('button')
  })
})
