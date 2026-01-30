/**
 * ARIA ID Utilities
 *
 * Utilities for generating and managing ARIA relationship IDs:
 * - Unique ID generation
 * - aria-describedby associations
 * - aria-labelledby associations
 * - aria-controls associations
 *
 * @module sentio/a11y/ids
 */

/**
 * ID Generator interface for instance-scoped ID generation
 */
export interface IdGenerator {
  /** Generate a unique ID with optional prefix */
  generate: (prefix?: string) => string
  /** Reset counter (for testing) */
  reset: () => void
}

/**
 * Create an instance-scoped ID generator
 *
 * Avoids global state issues in SSR and multi-instance scenarios.
 *
 * @example
 * ```typescript
 * const idGen = createIdGenerator()
 * idGen.generate('tooltip') // 'tooltip-1'
 * idGen.generate('modal')   // 'modal-2'
 * ```
 */
export function createIdGenerator(): IdGenerator {
  let counter = 0

  return {
    generate(prefix = 'sentio'): string {
      return `${prefix}-${++counter}`
    },
    reset(): void {
      counter = 0
    },
  }
}

// Internal default generator for convenience functions
const defaultGenerator = createIdGenerator()

/**
 * Generate a unique ID using the default generator
 * For multi-instance scenarios, use createIdGenerator() instead
 */
function generateId(prefix = 'sentio'): string {
  return defaultGenerator.generate(prefix)
}

/**
 * ID association for ARIA relationships
 */
export interface IdAssociation {
  /** Generated ID */
  id: string
  /** Set ID on target element */
  setId: (element: Element) => void
  /** Set reference attribute on source element */
  setReference: (element: Element, attribute: AriaRelationship) => void
  /** Link source to target with specified relationship */
  link: (source: Element, target: Element, attribute: AriaRelationship) => void
}

/**
 * ARIA relationship attributes
 */
export type AriaRelationship =
  | 'aria-describedby'
  | 'aria-labelledby'
  | 'aria-controls'
  | 'aria-owns'
  | 'aria-activedescendant'
  | 'aria-details'
  | 'aria-errormessage'

/**
 * Create an ID association
 *
 * Generates and manages IDs for ARIA relationships.
 *
 * @example
 * ```typescript
 * const association = createIdAssociation('tooltip')
 *
 * // Set ID on tooltip element
 * association.setId(tooltipElement)
 *
 * // Reference from trigger
 * association.setReference(triggerElement, 'aria-describedby')
 *
 * // Or use link for both at once
 * association.link(trigger, tooltip, 'aria-describedby')
 * ```
 */
export function createIdAssociation(prefix = 'sentio'): IdAssociation {
  const id = generateId(prefix)

  function setId(element: Element): void {
    element.setAttribute('id', id)
  }

  function setReference(element: Element, attribute: AriaRelationship): void {
    const existing = element.getAttribute(attribute)
    if (existing) {
      // Append to existing IDs
      if (!existing.split(' ').includes(id)) {
        element.setAttribute(attribute, `${existing} ${id}`)
      }
    } else {
      element.setAttribute(attribute, id)
    }
  }

  function link(source: Element, target: Element, attribute: AriaRelationship): void {
    setId(target)
    setReference(source, attribute)
  }

  return {
    id,
    setId,
    setReference,
    link,
  }
}

/**
 * Form field association helper
 */
export interface FormFieldAssociation {
  /** Field input ID */
  inputId: string
  /** Label ID */
  labelId: string
  /** Description ID */
  descriptionId: string
  /** Error message ID */
  errorId: string
  /** Link label to input */
  linkLabel: (label: Element, input: Element) => void
  /** Link description to input */
  linkDescription: (description: Element, input: Element) => void
  /** Link error to input */
  linkError: (error: Element, input: Element) => void
}

/**
 * Create form field associations
 *
 * Generates all necessary IDs for accessible form fields.
 *
 * @example
 * ```typescript
 * const field = createFormFieldAssociation('email')
 *
 * field.linkLabel(labelElement, inputElement)
 * field.linkDescription(descElement, inputElement)
 * field.linkError(errorElement, inputElement)
 * ```
 */
export function createFormFieldAssociation(fieldName: string): FormFieldAssociation {
  const inputId = generateId(`${fieldName}-input`)
  const labelId = generateId(`${fieldName}-label`)
  const descriptionId = generateId(`${fieldName}-desc`)
  const errorId = generateId(`${fieldName}-error`)

  function linkLabel(label: Element, input: Element): void {
    label.setAttribute('id', labelId)
    input.setAttribute('id', inputId)
    label.setAttribute('for', inputId)
  }

  function linkDescription(description: Element, input: Element): void {
    description.setAttribute('id', descriptionId)
    appendAriaAttribute(input, 'aria-describedby', descriptionId)
  }

  function linkError(error: Element, input: Element): void {
    error.setAttribute('id', errorId)
    input.setAttribute('aria-errormessage', errorId)
    input.setAttribute('aria-invalid', 'true')
  }

  return {
    inputId,
    labelId,
    descriptionId,
    errorId,
    linkLabel,
    linkDescription,
    linkError,
  }
}

/**
 * Append value to space-separated attribute
 */
function appendAriaAttribute(element: Element, attribute: string, value: string): void {
  const existing = element.getAttribute(attribute)
  if (existing) {
    if (!existing.split(' ').includes(value)) {
      element.setAttribute(attribute, `${existing} ${value}`)
    }
  } else {
    element.setAttribute(attribute, value)
  }
}

/**
 * Remove value from space-separated attribute
 */
export function removeAriaReference(
  element: Element,
  attribute: AriaRelationship,
  id: string
): void {
  const existing = element.getAttribute(attribute)
  if (!existing) return

  const ids = existing.split(' ').filter((existingId) => existingId !== id)
  if (ids.length > 0) {
    element.setAttribute(attribute, ids.join(' '))
  } else {
    element.removeAttribute(attribute)
  }
}
