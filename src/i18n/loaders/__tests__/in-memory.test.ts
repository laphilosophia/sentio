import { describe, expect, it } from 'vitest'
import { createInMemoryLoader } from '../in-memory'

describe('createInMemoryLoader', () => {
  const messages = {
    en: { greeting: 'Hello', goodbye: 'Goodbye' },
    tr: { greeting: 'Merhaba', goodbye: 'Hoşçakal' },
  }

  it('loads messages for a locale', async () => {
    const loader = createInMemoryLoader(messages)

    const result = await loader.load('tr')

    expect(result).toEqual({ greeting: 'Merhaba', goodbye: 'Hoşçakal' })
  })

  it('throws for unknown locale', async () => {
    const loader = createInMemoryLoader(messages)

    await expect(loader.load('de')).rejects.toThrow('Locale not found: de')
  })

  it('checks if locale exists', () => {
    const loader = createInMemoryLoader(messages)

    expect(loader.hasLocale('tr')).toBe(true)
    expect(loader.hasLocale('de')).toBe(false)
  })

  it('returns available locales', () => {
    const loader = createInMemoryLoader(messages)

    expect(loader.getAvailableLocales()).toEqual(['en', 'tr'])
  })
})
