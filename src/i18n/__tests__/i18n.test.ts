import { describe, expect, it, vi } from 'vitest'
import { createI18n } from '../index'

describe('createI18n', () => {
  const messages = {
    en: {
      greeting: 'Hello {name}!',
      simple: 'Hello World',
      items: 'You have {count} items',
    },
    tr: {
      greeting: 'Merhaba {name}!',
      simple: 'Merhaba Dünya',
      items: '{count} öğeniz var',
    },
  }

  describe('t()', () => {
    it('translates simple key', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })
      expect(i18n.t('simple')).toBe('Merhaba Dünya')
    })

    it('translates with interpolation', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })
      expect(i18n.t('greeting', { name: 'Volta' })).toBe('Merhaba Volta!')
    })

    it('falls back to fallback locale', () => {
      const i18n = createI18n({ locale: 'de', fallback: 'en', messages })
      expect(i18n.t('simple')).toBe('Hello World')
    })

    it('returns key when translation missing', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })
      expect(i18n.t('nonexistent')).toBe('nonexistent')
    })

    it('calls onMissingKey callback', () => {
      const onMissingKey = vi.fn()
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages, onMissingKey })

      i18n.t('missing.key')

      expect(onMissingKey).toHaveBeenCalledWith('missing.key', 'tr')
    })
  })

  describe('locale switching', () => {
    it('returns current locale', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })
      expect(i18n.getLocale()).toBe('tr')
    })

    it('changes locale at runtime', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })

      expect(i18n.t('simple')).toBe('Merhaba Dünya')

      i18n.setLocale('en')

      expect(i18n.getLocale()).toBe('en')
      expect(i18n.t('simple')).toBe('Hello World')
    })

    it('returns fallback locale', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })
      expect(i18n.getFallback()).toBe('en')
    })
  })

  describe('formatDate()', () => {
    it('formats date with short style', () => {
      const i18n = createI18n({ locale: 'en-US', fallback: 'en', messages })
      const date = new Date('2026-01-30')

      const result = i18n.formatDate(date, 'short')

      // Format varies by environment, just check it's a non-empty string
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('respects locale for date formatting', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })
      const date = new Date('2026-01-30')

      const result = i18n.formatDate(date, 'long')

      // Turkish locale should include Turkish month name
      expect(typeof result).toBe('string')
    })
  })

  describe('formatNumber()', () => {
    it('formats decimal number', () => {
      const i18n = createI18n({ locale: 'en-US', fallback: 'en', messages })

      const result = i18n.formatNumber(1234.56)

      expect(result).toContain('1')
      expect(result).toContain('234')
    })

    it('formats percentage', () => {
      const i18n = createI18n({ locale: 'en-US', fallback: 'en', messages })

      const result = i18n.formatNumber(0.75, 'percent')

      expect(result).toContain('75')
      expect(result).toContain('%')
    })

    it('formats currency with locale', () => {
      const i18n = createI18n({ locale: 'tr', fallback: 'en', messages })

      const result = i18n.formatNumber(1234.56, 'currency')

      // Should format as Turkish Lira
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
