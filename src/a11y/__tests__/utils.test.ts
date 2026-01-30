/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import {
  createFormFieldAssociation,
  createIdAssociation,
  createIdGenerator,
  removeAriaReference,
} from '../ids'

describe('createIdGenerator', () => {
  it('generates sequential IDs with default prefix', () => {
    const gen = createIdGenerator()
    expect(gen.generate()).toBe('sentio-1')
    expect(gen.generate()).toBe('sentio-2')
    expect(gen.generate()).toBe('sentio-3')
  })

  it('generates IDs with custom prefix', () => {
    const gen = createIdGenerator()
    expect(gen.generate('tooltip')).toBe('tooltip-1')
    expect(gen.generate('modal')).toBe('modal-2')
  })

  it('each generator has independent counter', () => {
    const gen1 = createIdGenerator()
    const gen2 = createIdGenerator()

    expect(gen1.generate('a')).toBe('a-1')
    expect(gen2.generate('b')).toBe('b-1')
    expect(gen1.generate('a')).toBe('a-2')
  })

  it('reset clears the counter', () => {
    const gen = createIdGenerator()
    gen.generate()
    gen.generate()
    gen.reset()
    expect(gen.generate()).toBe('sentio-1')
  })
})

describe('createIdAssociation', () => {
  it('creates association with generated ID', () => {
    const assoc = createIdAssociation('test')
    expect(assoc.id).toMatch(/^test-\d+$/)
  })

  it('setId applies ID to element', () => {
    const assoc = createIdAssociation('tooltip')
    const element = document.createElement('div')

    assoc.setId(element)

    expect(element.getAttribute('id')).toBe(assoc.id)
  })

  it('setReference applies aria attribute to element', () => {
    const assoc = createIdAssociation('desc')
    const element = document.createElement('button')

    assoc.setReference(element, 'aria-describedby')

    expect(element.getAttribute('aria-describedby')).toBe(assoc.id)
  })

  it('setReference appends to existing IDs', () => {
    const assoc = createIdAssociation('desc')
    const element = document.createElement('button')
    element.setAttribute('aria-describedby', 'existing-id')

    assoc.setReference(element, 'aria-describedby')

    expect(element.getAttribute('aria-describedby')).toBe(`existing-id ${assoc.id}`)
  })

  it('setReference does not duplicate IDs', () => {
    const assoc = createIdAssociation('desc')
    const element = document.createElement('button')

    assoc.setReference(element, 'aria-describedby')
    assoc.setReference(element, 'aria-describedby')

    expect(element.getAttribute('aria-describedby')).toBe(assoc.id)
  })

  it('link connects source and target', () => {
    const assoc = createIdAssociation('tooltip')
    const trigger = document.createElement('button')
    const tooltip = document.createElement('div')

    assoc.link(trigger, tooltip, 'aria-describedby')

    expect(tooltip.getAttribute('id')).toBe(assoc.id)
    expect(trigger.getAttribute('aria-describedby')).toBe(assoc.id)
  })
})

describe('createFormFieldAssociation', () => {
  it('generates all field IDs', () => {
    const field = createFormFieldAssociation('email')

    expect(field.inputId).toMatch(/^email-input-\d+$/)
    expect(field.labelId).toMatch(/^email-label-\d+$/)
    expect(field.descriptionId).toMatch(/^email-desc-\d+$/)
    expect(field.errorId).toMatch(/^email-error-\d+$/)
  })

  it('linkLabel connects label and input', () => {
    const field = createFormFieldAssociation('email')
    const label = document.createElement('label')
    const input = document.createElement('input')

    field.linkLabel(label, input)

    expect(label.getAttribute('id')).toBe(field.labelId)
    expect(input.getAttribute('id')).toBe(field.inputId)
    expect(label.getAttribute('for')).toBe(field.inputId)
  })

  it('linkDescription connects description to input', () => {
    const field = createFormFieldAssociation('email')
    const desc = document.createElement('p')
    const input = document.createElement('input')

    field.linkDescription(desc, input)

    expect(desc.getAttribute('id')).toBe(field.descriptionId)
    expect(input.getAttribute('aria-describedby')).toBe(field.descriptionId)
  })

  it('linkError connects error and marks input invalid', () => {
    const field = createFormFieldAssociation('email')
    const error = document.createElement('span')
    const input = document.createElement('input')

    field.linkError(error, input)

    expect(error.getAttribute('id')).toBe(field.errorId)
    expect(input.getAttribute('aria-errormessage')).toBe(field.errorId)
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
