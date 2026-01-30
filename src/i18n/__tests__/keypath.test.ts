import { describe, expect, it } from 'vitest'
import { flattenMessages, getByPath, hasPath } from '../keypath'

describe('getByPath', () => {
  const obj = {
    common: {
      buttons: {
        submit: 'Submit',
        cancel: 'Cancel',
      },
    },
    welcome: 'Welcome!',
    nested: {
      deep: {
        value: 'Deep Value',
      },
    },
  }

  it('gets shallow keys', () => {
    expect(getByPath(obj, 'welcome')).toBe('Welcome!')
  })

  it('gets nested keys', () => {
    expect(getByPath(obj, 'common.buttons.submit')).toBe('Submit')
    expect(getByPath(obj, 'common.buttons.cancel')).toBe('Cancel')
  })

  it('gets deeply nested keys', () => {
    expect(getByPath(obj, 'nested.deep.value')).toBe('Deep Value')
  })

  it('returns undefined for missing keys', () => {
    expect(getByPath(obj, 'missing')).toBeUndefined()
    expect(getByPath(obj, 'common.missing')).toBeUndefined()
    expect(getByPath(obj, 'common.buttons.missing')).toBeUndefined()
  })

  it('returns undefined for non-string values', () => {
    expect(getByPath(obj, 'common')).toBeUndefined()
    expect(getByPath(obj, 'common.buttons')).toBeUndefined()
  })

  it('handles empty path', () => {
    expect(getByPath(obj, '')).toBeUndefined()
  })
})

describe('hasPath', () => {
  const obj = { a: { b: 'value' } }

  it('returns true for existing paths', () => {
    expect(hasPath(obj, 'a.b')).toBe(true)
  })

  it('returns false for missing paths', () => {
    expect(hasPath(obj, 'a.c')).toBe(false)
    expect(hasPath(obj, 'x.y.z')).toBe(false)
  })
})

describe('flattenMessages', () => {
  it('flattens nested objects', () => {
    const obj = {
      common: {
        buttons: {
          submit: 'Submit',
          cancel: 'Cancel',
        },
      },
      welcome: 'Welcome!',
    }

    const result = flattenMessages(obj)

    expect(result).toEqual({
      'common.buttons.submit': 'Submit',
      'common.buttons.cancel': 'Cancel',
      welcome: 'Welcome!',
    })
  })

  it('handles empty objects', () => {
    expect(flattenMessages({})).toEqual({})
  })

  it('handles flat objects', () => {
    const obj = { a: 'A', b: 'B' }
    expect(flattenMessages(obj)).toEqual({ a: 'A', b: 'B' })
  })
})
