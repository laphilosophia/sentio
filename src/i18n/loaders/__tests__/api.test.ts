import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiLoader } from '../api'

describe('createApiLoader', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('fetches messages from API endpoint', async () => {
    const messages = { greeting: 'Merhaba', goodbye: 'Hoşçakal' }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => messages,
    })

    const loader = createApiLoader({
      baseUrl: '/api/i18n',
      fetch: mockFetch,
    })

    const result = await loader.load('tr')

    expect(result).toEqual(messages)
    expect(mockFetch).toHaveBeenCalledWith('/api/i18n/tr.json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('includes custom headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const loader = createApiLoader({
      baseUrl: '/api/i18n',
      fetch: mockFetch,
      headers: { Authorization: 'Bearer token' },
    })

    await loader.load('en')

    expect(mockFetch).toHaveBeenCalledWith('/api/i18n/en.json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
    })
  })

  it('throws on 404 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const loader = createApiLoader({
      baseUrl: '/api/i18n',
      fetch: mockFetch,
    })

    await expect(loader.load('xx')).rejects.toThrow('Locale not found: xx')
  })

  it('throws on other error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const loader = createApiLoader({
      baseUrl: '/api/i18n',
      fetch: mockFetch,
    })

    await expect(loader.load('tr')).rejects.toThrow('Failed to load locale tr: 500')
  })

  it('tracks loaded locales', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    const loader = createApiLoader({
      baseUrl: '/api/i18n',
      fetch: mockFetch,
    })

    expect(loader.hasLocale('tr')).toBe(false)

    await loader.load('tr')

    expect(loader.hasLocale('tr')).toBe(true)
    expect(loader.getAvailableLocales()).toContain('tr')
  })

  it('applies transform function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { greeting: 'Hello' } }),
    })

    const loader = createApiLoader({
      baseUrl: '/api/i18n',
      fetch: mockFetch,
      transform: (response) => (response as { data: Record<string, string> }).data,
    })

    const result = await loader.load('en')

    expect(result).toEqual({ greeting: 'Hello' })
  })
})
