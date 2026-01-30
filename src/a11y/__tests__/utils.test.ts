/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createFormFieldAssociation,
  createIdAssociation,
  generateId,
  removeAriaReference,
  resetIdCounter,
} from '../ids'

describe('generateId', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  it('generates sequential IDs with default prefix', () => {
    expect(generateId()).toBe('sentio-1')
    expect(generateId()).toBe('sentio-2')
    expect(generateId()).toBe('sentio-3')
  })

  it('generates IDs with custom prefix', () => {
    expect(generateId('tooltip')).toBe('tooltip-1')
    expect(generateId('modal')).toBe('modal-2')
  })
})

describe('createIdAssociation', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  it('creates association with generated ID', () => {
    const assoc = createIdAssociation('test')
    expect(assoc.id).toBe('test-1')
  })

  it('setId applies ID to element', () => {
    const assoc = createIdAssociation('tooltip')
    const element = document.createElement('div')

    assoc.setId(element)

    expect(element.getAttribute('id')).toBe('tooltip-1')
  })

  it('setReference applies aria attribute to element', () => {
    const assoc = createIdAssociation('desc')
    const element = document.createElement('button')

    assoc.setReference(element, 'aria-describedby')

    expect(element.getAttribute('aria-describedby')).toBe('desc-1')
  })

  it('setReference appends to existing IDs', () => {
    const assoc = createIdAssociation('desc')
    const element = document.createElement('button')
    element.setAttribute('aria-describedby', 'existing-id')

    assoc.setReference(element, 'aria-describedby')

    expect(element.getAttribute('aria-describedby')).toBe('existing-id desc-1')
  })

  it('setReference does not duplicate IDs', () => {
    const assoc = createIdAssociation('desc')
    const element = document.createElement('button')

    assoc.setReference(element, 'aria-describedby')
    assoc.setReference(element, 'aria-describedby')

    expect(element.getAttribute('aria-describedby')).toBe('desc-1')
  })

  it('link connects source and target', () => {
    const assoc = createIdAssociation('tooltip')
    const trigger = document.createElement('button')
    const tooltip = document.createElement('div')

    assoc.link(trigger, tooltip, 'aria-describedby')

    expect(tooltip.getAttribute('id')).toBe('tooltip-1')
    expect(trigger.getAttribute('aria-describedby')).toBe('tooltip-1')
  })
})

describe('createFormFieldAssociation', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  it('generates all field IDs', () => {
    const field = createFormFieldAssociation('email')

    expect(field.inputId).toBe('email-input-1')
    expect(field.labelId).toBe('email-label-2')
    expect(field.descriptionId).toBe('email-desc-3')
    expect(field.errorId).toBe('email-error-4')
  })

  it('linkLabel connects label and input', () => {
    const field = createFormFieldAssociation('email')
    const label = document.createElement('label')
    const input = document.createElement('input')

    field.linkLabel(label, input)

    expect(label.getAttribute('id')).toBe('email-label-2')
    expect(input.getAttribute('id')).toBe('email-input-1')
    expect(label.getAttribute('for')).toBe('email-input-1')
  })

  it('linkDescription connects description to input', () => {
    const field = createFormFieldAssociation('email')
    const desc = document.createElement('p')
    const input = document.createElement('input')

    field.linkDescription(desc, input)

    expect(desc.getAttribute('id')).toBe('email-desc-3')
    expect(input.getAttribute('aria-describedby')).toBe('email-desc-3')
  })

  it('linkError connects error and marks input invalid', () => {
    const field = createFormFieldAssociation('email')
    const error = document.createElement('span')
    const input = document.createElement('input')

    field.linkError(error, input)

    expect(error.getAttribute('id')).toBe('email-error-4')
    expect(input.getAttribute('aria-errormessage')).toBe('email-error-4')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })
})

describe('removeAriaReference', () => {
  it('removes ID from single-value attribute', () => {
    const element = document.createElement('button')
    element.setAttribute('aria-describedby', 'tooltip-1')

    removeAriaReference(element, 'aria-describedby', 'tooltip-1')

    expect(element.hasAttribute('aria-describedby')).toBe(false)
  })

  it('removes ID from multi-value attribute', () => {
    const element = document.createElement('button')
    element.setAttribute('aria-describedby', 'desc-1 tooltip-1 help-1')

    removeAriaReference(element, 'aria-describedby', 'tooltip-1')

    expect(element.getAttribute('aria-describedby')).toBe('desc-1 help-1')
  })

  it('does nothing for non-existent ID', () => {
    const element = document.createElement('button')
    element.setAttribute('aria-describedby', 'desc-1')

    removeAriaReference(element, 'aria-describedby', 'nonexistent')

    expect(element.getAttribute('aria-describedby')).toBe('desc-1')
  })
})

describe('resolveAttributes - extended', () => {
  // These are covered by the main a11y.test.ts but we add edge cases here
  it('handles mixed pressed state', async () => {
    const { resolveAttributes } = await import('../index')
    const attrs = resolveAttributes({ pressed: 'mixed' })
    expect(attrs['aria-pressed']).toBe('mixed')
  })

  it('handles range values', async () => {
    const { resolveAttributes } = await import('../index')
    const attrs = resolveAttributes({
      role: 'slider',
      valueNow: 50,
      valueMin: 0,
      valueMax: 100,
      valueText: '50%',
    })

    expect(attrs['aria-valuenow']).toBe(50)
    expect(attrs['aria-valuemin']).toBe(0)
    expect(attrs['aria-valuemax']).toBe(100)
    expect(attrs['aria-valuetext']).toBe('50%')
  })

  it('handles expanded state', async () => {
    const { resolveAttributes } = await import('../index')
    expect(resolveAttributes({ expanded: true })['aria-expanded']).toBe(true)
    expect(resolveAttributes({ expanded: false })['aria-expanded']).toBe(false)
  })

  it('handles modal state', async () => {
    const { resolveAttributes } = await import('../index')
    const attrs = resolveAttributes({ role: 'dialog', modal: true })
    expect(attrs['aria-modal']).toBe(true)
  })

  it('handles current indicator', async () => {
    const { resolveAttributes } = await import('../index')
    expect(resolveAttributes({ current: 'page' })['aria-current']).toBe('page')
    expect(resolveAttributes({ current: true })['aria-current']).toBe(true)
  })

  it('handles haspopup', async () => {
    const { resolveAttributes } = await import('../index')
    expect(resolveAttributes({ hasPopup: 'menu' })['aria-haspopup']).toBe('menu')
    expect(resolveAttributes({ hasPopup: true })['aria-haspopup']).toBe(true)
  })
})
