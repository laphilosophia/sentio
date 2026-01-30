/**
 * Manual testing script for i18n loaders
 *
 * Run: npx tsx examples/demo-loaders.ts
 */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApiLoader, createI18n, createInMemoryLoader } from '../src/i18n/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ============================================
// 1. IN-MEMORY LOADER TEST
// ============================================
async function testInMemoryLoader(): Promise<void> {
  console.log('\n=== IN-MEMORY LOADER TEST ===\n')

  const loader = createInMemoryLoader({
    en: {
      greeting: 'Hello {name}!',
      items: '{count, plural, one {# item} other {# items}}',
    },
    tr: {
      greeting: 'Merhaba {name}!',
      items: '{count, plural, one {# öğe} other {# öğe}}',
    },
  })

  const i18n = createI18n({
    locale: 'tr',
    fallback: 'en',
    loader,
  })

  // Load locale
  await i18n.loadLocale('tr')

  console.log('✓ Loaded:', i18n.isLoaded('tr'))
  console.log('✓ t("greeting"):', i18n.t('greeting', { name: 'Volta' }))
  console.log('✓ t("items", 1):', i18n.t('items', { count: 1 }))
  console.log('✓ t("items", 5):', i18n.t('items', { count: 5 }))

  // Switch locale
  i18n.setLocale('en')
  await i18n.loadLocale('en')
  console.log('\n[Switched to EN]')
  console.log('✓ t("greeting"):', i18n.t('greeting', { name: 'World' }))
  console.log('✓ t("items", 1):', i18n.t('items', { count: 1 }))
}

// ============================================
// 2. JSON FILE LOADER TEST (manual)
// ============================================
async function testJsonFileLoader(): Promise<void> {
  console.log('\n=== JSON FILE LOADER TEST ===\n')

  // Manually read JSON files and use InMemoryLoader
  const enPath = join(__dirname, 'locales', 'en.json')
  const trPath = join(__dirname, 'locales', 'tr.json')

  const enMessages = JSON.parse(await readFile(enPath, 'utf-8')) as Record<string, string>
  const trMessages = JSON.parse(await readFile(trPath, 'utf-8')) as Record<string, string>

  console.log('✓ Loaded en.json:', Object.keys(enMessages).length, 'keys')
  console.log('✓ Loaded tr.json:', Object.keys(trMessages).length, 'keys')

  const i18n = createI18n({
    locale: 'tr',
    fallback: 'en',
    messages: { en: enMessages, tr: trMessages },
  })

  console.log('\n[Static messages mode]')
  console.log('✓ t("greeting"):', i18n.t('greeting', { name: 'Dosya' }))
  console.log('✓ t("welcome"):', i18n.t('welcome'))
  console.log('✓ formatDate:', i18n.formatDate(new Date(), 'short'))
  console.log('✓ formatNumber:', i18n.formatNumber(1234.56, 'currency'))
  console.log('✓ formatList:', i18n.formatList(['Elma', 'Armut', 'Kiraz']))
}

// ============================================
// 3. API LOADER TEST (mock fetch)
// ============================================
async function testApiLoader(): Promise<void> {
  console.log('\n=== API LOADER TEST (mock) ===\n')

  // Mock fetch function that reads from local files
  const mockFetch = async (url: string): Promise<Response> => {
    const locale = url.split('/').pop()?.replace('.json', '')
    const filePath = join(__dirname, 'locales', `${locale}.json`)

    try {
      const content = await readFile(filePath, 'utf-8')
      console.log(`  → Mock fetch: ${url}`)
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(content),
      } as Response
    } catch {
      return {
        ok: false,
        status: 404,
      } as Response
    }
  }

  const loader = createApiLoader({
    baseUrl: 'http://localhost:3000/api/i18n',
    fetch: mockFetch,
  })

  const i18n = createI18n({
    locale: 'tr',
    fallback: 'en',
    loader,
  })

  // Load via "API"
  await i18n.loadLocale('tr')
  await i18n.loadLocale('en')

  console.log('\n[API-loaded messages]')
  console.log('✓ isLoaded("tr"):', i18n.isLoaded('tr'))
  console.log('✓ isLoaded("en"):', i18n.isLoaded('en'))
  console.log('✓ t("greeting"):', i18n.t('greeting', { name: 'API' }))
  console.log('✓ t("goodbye"):', i18n.t('goodbye'))

  // Test fallback for missing key
  console.log('✓ t("missing"):', i18n.t('missing')) // Should return "missing"
}

// ============================================
// RUN ALL TESTS
// ============================================
async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════╗')
  console.log('║     SENTIO I18N MANUAL TESTING        ║')
  console.log('╚═══════════════════════════════════════╝')

  try {
    await testInMemoryLoader()
    await testJsonFileLoader()
    await testApiLoader()

    console.log('\n✅ All manual tests passed!\n')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

main()
