import { describe, expect, it, vi } from 'vitest'
import { createI18n, type LocaleMessages, type NamespaceLoader } from '../index'

describe('namespace loading', () => {
  const createMockNamespaceLoader = (): NamespaceLoader => ({
    load: vi.fn(async (namespace: string, _locale: string): Promise<LocaleMessages> => {
      if (namespace === 'admin') {
        return {
          'admin.dashboard': 'Dashboard',
          'admin.users': 'Users',
          'admin.settings': 'Settings',
        }
      }
      if (namespace === 'checkout') {
        return {
          'checkout.cart': 'Cart',
          'checkout.payment': 'Payment',
          'checkout.confirm': 'Confirm Order',
        }
      }
      throw new Error(`Unknown namespace: ${namespace}`)
    }),
  })

  it('loads namespace and merges messages', async () => {
    const loader = createMockNamespaceLoader()
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      messages: { en: { common: 'Common' } },
      namespaceLoader: loader,
    })

    await i18n.loadNamespace('admin')

    expect(loader.load).toHaveBeenCalledWith('admin', 'en')
    expect(i18n.t('admin.dashboard')).toBe('Dashboard')
    expect(i18n.t('common')).toBe('Common')
  })

  it('tracks loaded namespaces', async () => {
    const loader = createMockNamespaceLoader()
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      namespaceLoader: loader,
    })

    expect(i18n.isNamespaceLoaded('admin')).toBe(false)

    await i18n.loadNamespace('admin')

    expect(i18n.isNamespaceLoaded('admin')).toBe(true)
    expect(i18n.isNamespaceLoaded('checkout')).toBe(false)
  })

  it('does not reload already loaded namespace', async () => {
    const loader = createMockNamespaceLoader()
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      namespaceLoader: loader,
    })

    await i18n.loadNamespace('admin')
    await i18n.loadNamespace('admin')

    expect(loader.load).toHaveBeenCalledTimes(1)
  })

  it('throws without namespaceLoader', async () => {
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
    })

    await expect(i18n.loadNamespace('admin')).rejects.toThrow('No namespaceLoader configured')
  })

  it('supports multiple namespaces', async () => {
    const loader = createMockNamespaceLoader()
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      namespaceLoader: loader,
    })

    await i18n.loadNamespace('admin')
    await i18n.loadNamespace('checkout')

    expect(i18n.t('admin.dashboard')).toBe('Dashboard')
    expect(i18n.t('checkout.cart')).toBe('Cart')
    expect(i18n.isNamespaceLoaded('admin')).toBe(true)
    expect(i18n.isNamespaceLoaded('checkout')).toBe(true)
  })

  it('tracks namespaces per locale', async () => {
    const loader = createMockNamespaceLoader()
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      namespaceLoader: loader,
    })

    await i18n.loadNamespace('admin')
    expect(i18n.isNamespaceLoaded('admin')).toBe(true)

    i18n.setLocale('tr')
    expect(i18n.isNamespaceLoaded('admin')).toBe(false)
  })

  it('calls onLoad hook with namespace info', async () => {
    const onLoad = vi.fn()
    const loader = createMockNamespaceLoader()
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      namespaceLoader: loader,
      hooks: { onLoad },
    })

    await i18n.loadNamespace('admin')

    expect(onLoad).toHaveBeenCalledWith('en:admin', expect.any(Number))
  })
})
