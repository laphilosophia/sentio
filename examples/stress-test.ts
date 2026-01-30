/**
 * Stress test for sentio i18n
 *
 * Tests:
 * 1. Large file parsing (55MB+)
 * 2. Complex ICU patterns
 * 3. Nested key resolution
 * 4. Performance benchmarks
 * 5. Error handling
 *
 * Run: npx tsx examples/stress-test.ts
 */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createI18n } from '../src/i18n/index.js'
import { isICUMessage } from '../src/i18n/parser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface TestResult {
  name: string
  passed: boolean
  duration: number
  details?: string
}

const results: TestResult[] = []

function test(name: string, fn: () => void | Promise<void>): Promise<TestResult> {
  return (async () => {
    const start = performance.now()
    try {
      await fn()
      const duration = performance.now() - start
      const result = { name, passed: true, duration }
      results.push(result)
      console.log(`  ✓ ${name} (${duration.toFixed(2)}ms)`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      const result = { name, passed: false, duration, details: String(error) }
      results.push(result)
      console.log(`  ✗ ${name} (${duration.toFixed(2)}ms)`)
      console.log(`    Error: ${error}`)
      return result
    }
  })()
}

// ============================================
// 1. ICU PATTERN TESTS
// ============================================
async function testICUPatterns(): Promise<void> {
  console.log('\n=== ICU PATTERN TESTS ===\n')

  const icuData = JSON.parse(await readFile(join(__dirname, 'icu-test.json'), 'utf-8')) as Record<
    string,
    unknown
  >

  // Flatten nested object for testing
  function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'string') {
        result[fullKey] = value
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, flatten(value as Record<string, unknown>, fullKey))
      }
    }
    return result
  }

  const messages = flatten(icuData)
  const i18n = createI18n({ locale: 'en', fallback: 'en', messages: { en: messages } })

  await test('Basic interpolation', () => {
    const result = i18n.t('basic.interpolation', { name: 'Volta' })
    if (!result.includes('Volta')) throw new Error(`Expected 'Volta', got: ${result}`)
  })

  await test('Plural: zero', () => {
    const result = i18n.t('plural.files', { count: 0 })
    if (!result.includes('No files')) throw new Error(`Expected 'No files', got: ${result}`)
  })

  await test('Plural: one', () => {
    const result = i18n.t('plural.files', { count: 1 })
    if (!result.includes('1 file')) throw new Error(`Expected '1 file', got: ${result}`)
  })

  await test('Plural: other', () => {
    const result = i18n.t('plural.files', { count: 42 })
    if (!result.includes('42 files')) throw new Error(`Expected '42 files', got: ${result}`)
  })

  await test('Ordinal: 1st', () => {
    const result = i18n.t('ordinal.rank', { position: 1 })
    if (!result.includes('1st')) throw new Error(`Expected '1st', got: ${result}`)
  })

  await test('Ordinal: 2nd', () => {
    const result = i18n.t('ordinal.rank', { position: 2 })
    if (!result.includes('2nd')) throw new Error(`Expected '2nd', got: ${result}`)
  })

  await test('Select: male', () => {
    const result = i18n.t('select.gender', { gender: 'male' })
    if (!result.includes('He')) throw new Error(`Expected 'He', got: ${result}`)
  })

  await test('Select: female', () => {
    const result = i18n.t('select.gender', { gender: 'female' })
    if (!result.includes('She')) throw new Error(`Expected 'She', got: ${result}`)
  })

  await test('Nested ICU', () => {
    const result = i18n.t('nested.login', { count: 5, gender: 'female' })
    if (!result.includes('She') || !result.includes('5 times')) {
      throw new Error(`Unexpected: ${result}`)
    }
  })

  await test('Stress: deep nesting', () => {
    const result = i18n.t('stress.deep', { a: 'x', b: 1, c: 'on' })
    if (!result.includes('Enabled')) throw new Error(`Expected 'Enabled', got: ${result}`)
  })

  await test('Escaped braces', () => {
    const result = i18n.t('stress.escaped', {})
    if (!result.includes('{') || !result.includes('}')) {
      throw new Error(`Expected literal braces, got: ${result}`)
    }
  })
}

// ============================================
// 2. LARGE FILE TESTS
// ============================================
async function testLargeFiles(): Promise<void> {
  console.log('\n=== LARGE FILE TESTS ===\n')

  await test('Parse 55MB JSON (plain i18n)', async () => {
    const start = performance.now()
    const data = await readFile(join(__dirname, 'i18n.large.json'), 'utf-8')
    const parsed = JSON.parse(data) as Record<string, unknown>
    const parseTime = performance.now() - start

    console.log(`    → File size: ${(data.length / 1024 / 1024).toFixed(2)} MB`)
    console.log(`    → Parse time: ${parseTime.toFixed(2)}ms`)

    // Count keys
    let keyCount = 0
    function countKeys(obj: Record<string, unknown>): void {
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') keyCount++
        else if (typeof value === 'object' && value) countKeys(value as Record<string, unknown>)
      }
    }
    countKeys(parsed)
    console.log(`    → Total keys: ${keyCount.toLocaleString()}`)
  })

  await test('Parse 195MB JSON (ICU i18n)', async () => {
    const start = performance.now()
    const data = await readFile(join(__dirname, 'icu-i18n.large.json'), 'utf-8')
    const parsed = JSON.parse(data) as Record<string, unknown>
    const parseTime = performance.now() - start

    console.log(`    → File size: ${(data.length / 1024 / 1024).toFixed(2)} MB`)
    console.log(`    → Parse time: ${parseTime.toFixed(2)}ms`)

    // Count ICU messages
    let icuCount = 0
    let totalCount = 0
    function countICU(obj: Record<string, unknown>): void {
      for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
          totalCount++
          if (isICUMessage(value)) icuCount++
        } else if (typeof value === 'object' && value) {
          countICU(value as Record<string, unknown>)
        }
      }
    }
    countICU(parsed)
    console.log(`    → Total keys: ${totalCount.toLocaleString()}`)
    console.log(`    → ICU messages: ${icuCount.toLocaleString()}`)
  })
}

// ============================================
// 3. NESTED KEY RESOLUTION TEST
// ============================================
async function testNestedKeys(): Promise<void> {
  console.log('\n=== NESTED KEY RESOLUTION TEST ===\n')

  // Use large file for nested key testing
  const data = JSON.parse(await readFile(join(__dirname, 'i18n.large.json'), 'utf-8')) as Record<
    string,
    unknown
  >

  // Flatten for current flat-key system
  function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'string') {
        result[fullKey] = value
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, flatten(value as Record<string, unknown>, fullKey))
      }
    }
    return result
  }

  const messages = flatten(data)
  console.log(`    → Flattened ${Object.keys(messages).length.toLocaleString()} keys`)
  const i18n = createI18n({ locale: 'en', fallback: 'en', messages: { en: messages } })

  // Pick a random deep key from the flattened messages
  const keys = Object.keys(messages)
  const sampleKey = keys.find((k) => k.split('.').length > 4) || keys[0]

  await test(`Deep nested key: ${sampleKey.slice(0, 40)}...`, () => {
    const result = i18n.t(sampleKey)
    // Check it's a valid translation (not the key itself for a found key)
    if (result === sampleKey && messages[sampleKey]) {
      throw new Error(`Expected translation, got key: ${result}`)
    }
  })

  await test('Random deep key lookup', () => {
    // Pick 100 random keys and verify they resolve
    for (let i = 0; i < 100; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)]
      const result = i18n.t(randomKey)
      if (result === randomKey && messages[randomKey]) {
        throw new Error(`Key ${randomKey} returned itself`)
      }
    }
  })

  await test('Missing key returns key', () => {
    const result = i18n.t('nonexistent.deep.key')
    if (result !== 'nonexistent.deep.key') throw new Error(`Expected key fallback, got: ${result}`)
  })
}

// ============================================
// 4. ERROR HANDLING TESTS
// ============================================
async function testErrorHandling(): Promise<void> {
  console.log('\n=== ERROR HANDLING TESTS ===\n')

  await test('Malformed ICU: unclosed brace', () => {
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      messages: { en: { broken: '{count, plural, one {# item' } },
    })
    // Should not throw, should return original
    const result = i18n.t('broken', { count: 1 })
    if (!result.includes('plural')) throw new Error('Should return original on parse error')
  })

  await test('Missing params in ICU', () => {
    const i18n = createI18n({
      locale: 'en',
      fallback: 'en',
      messages: { en: { msg: '{count, plural, one {# item} other {# items}}' } },
    })
    // Should not throw with missing params
    const result = i18n.t('msg', {})
    // intl-messageformat uses default or throws - we catch it
    console.log(`    → Result with missing params: "${result}"`)
  })

  await test('Invalid locale code', () => {
    const i18n = createI18n({
      locale: 'invalid-locale-code-xxx',
      fallback: 'en',
      messages: { en: { hello: 'Hello' } },
    })
    // Should fallback to en
    const result = i18n.t('hello')
    if (result !== 'Hello') throw new Error(`Expected fallback, got: ${result}`)
  })
}

// ============================================
// 5. PERFORMANCE BENCHMARK
// ============================================
async function testPerformance(): Promise<void> {
  console.log('\n=== PERFORMANCE BENCHMARK ===\n')

  const i18n = createI18n({
    locale: 'en',
    fallback: 'en',
    messages: {
      en: {
        simple: 'Hello World',
        interpolated: 'Hello {name}!',
        plural: '{count, plural, one {# item} other {# items}}',
      },
    },
  })

  const iterations = 10000

  await test(`Simple t() x${iterations.toLocaleString()}`, () => {
    for (let i = 0; i < iterations; i++) {
      i18n.t('simple')
    }
  })

  await test(`Interpolation t() x${iterations.toLocaleString()}`, () => {
    for (let i = 0; i < iterations; i++) {
      i18n.t('interpolated', { name: 'Test' })
    }
  })

  await test(`ICU plural t() x${iterations.toLocaleString()}`, () => {
    for (let i = 0; i < iterations; i++) {
      i18n.t('plural', { count: i % 100 })
    }
  })
}

// ============================================
// RUN ALL TESTS
// ============================================
async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════╗')
  console.log('║     SENTIO I18N STRESS TEST               ║')
  console.log('╚═══════════════════════════════════════════╝')

  const startTime = performance.now()

  await testICUPatterns()
  await testLargeFiles()
  await testNestedKeys()
  await testErrorHandling()
  await testPerformance()

  const totalTime = performance.now() - startTime

  console.log('\n═══════════════════════════════════════════')
  console.log('SUMMARY')
  console.log('═══════════════════════════════════════════')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log(`Total: ${results.length} tests`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Duration: ${(totalTime / 1000).toFixed(2)}s`)

  if (failed > 0) {
    console.log('\nFailed tests:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.details}`)
      })
    process.exit(1)
  }

  console.log('\n✅ All stress tests passed!\n')
}

main()
