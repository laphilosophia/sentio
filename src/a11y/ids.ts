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
 * Counter for unique ID generation
 */
let idCounter = 0

/**
 * Generate a unique ID
 *
 * @example
 * ```typescript
 * const id = generateId('tooltip') // 'tooltip-1'
 * const id2 = generateId('tooltip') // 'tooltip-2'
 * ```
 */
export function generateId(prefix = 'sentio'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * Reset ID counter (for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0
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
