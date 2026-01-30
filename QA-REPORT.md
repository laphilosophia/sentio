# Sentio Comprehensive QA Audit Report

**Date:** 2026-01-30
**Auditor:** Claude (Gemini Antigravity)
**Version:** v0.1.0

---

## Executive Summary

| Severity    | Count |
| :---------- | :---- |
| 🔴 Critical | 2     |
| 🟠 High     | 4     |
| 🟡 Medium   | 6     |
| 🟢 Low      | 5     |

**Verdict:** ❌ **NOT READY for production release.** Critical bugs found.

---

## 🔴 CRITICAL ISSUES

### C1. Nested Key Resolution is BROKEN

**File:** `src/i18n/index.ts` (line 80-96)

**Bug:** `resolveMessageFromLoaded()` does flat lookup only. Nested keys like `user.profile.name` will NEVER resolve.

```typescript
// Current code (WRONG):
if (dict && Object.prototype.hasOwnProperty.call(dict, key)) {
  return dict[key]
}

// This means: i18n.t('user.profile.name') looks for dict['user.profile.name']
// NOT for: dict.user.profile.name
```

**Evidence:** `keypath.ts` exists with `getByPath()` function but is NEVER imported in `index.ts`.

**Impact:** A core feature documented in README doesn't work.

**Fix Required:**

```typescript
import { getByPath } from './keypath.js'

// In resolveMessageFromLoaded:
const value = getByPath(dict, key)
if (value !== undefined) {
  return value
}
```

---

### C2. Global State in ID Counter (Multi-Instance Leak)

**File:** `src/a11y/ids.ts` (line 16)

```typescript
let idCounter = 0 // ← GLOBAL MODULE STATE
```

**Bug:** All `createIdAssociation()` calls share the same counter. This causes:

1. ID collisions in SSR (counter starts at 0 each request but not reset)
2. Non-deterministic IDs (depends on call order across all instances)
3. Memory leak if generating millions of IDs

**Impact:** Accessibility IDs may collide in production.

**Fix Options:**

1. Pass counter through config
2. Use WeakMap per instance
3. Use crypto.randomUUID() instead

---

## 🟠 HIGH PRIORITY ISSUES

### H1. No XSS Protection in Interpolation

**File:** `src/i18n/interpolate.ts` (line 14-27)

```typescript
return String(value) // ← No escaping!
```

**Risk:** If user input is passed as params and rendered as HTML, XSS is possible.

```typescript
i18n.t('message', { name: '<script>alert("xss")</script>' })
// Returns: '<script>alert("xss")</script>'
```

**Mitigation:** Document that consumers MUST sanitize output. Or add optional escaping.

---

### H2. Currency Map is Hardcoded (5 locales only)

**File:** `src/i18n/index.ts` (line 185-192)

```typescript
const currencyMap: Record<string, string> = {
  tr: 'TRY',
  en: 'USD',
  'en-US': 'USD',
  'en-GB': 'GBP',
  de: 'EUR',
  fr: 'EUR',
}
```

**Bug:** Using `formatNumber(100, 'currency')` with `ja`, `zh`, `es`, etc. defaults to USD.

**Impact:** Wrong currency for 95% of world locales.

**Fix:** Add `currency` option to config, or use locale-to-currency lookup library.

---

### H3. Focus Trap Event Listener Leak Potential

**File:** `src/a11y/focus.ts` (line 180-191)

`deactivate()` always tries to remove event listeners, but if `activate()` was never called, listeners don't exist. While harmless, the pattern is brittle.

**Bigger Issue:** If user creates trap but never calls `deactivate()`, listeners persist forever.

**Fix:** Document cleanup requirements or add destroy() that's idempotent.

---

### H4. CachedLoader Double localStorage Read

**File:** `src/i18n/loaders/cached.ts` (line 111-128)

```typescript
const cached = await storage.get(locale)  // ← First read
if (cached) {
  const raw = localStorage.getItem(`${prefix}:${locale}`)  // ← Second read (redundant!)
```

**Impact:** Reads localStorage twice on every cache hit. Performance penalty.

**Fix:** Return `{ messages, timestamp }` from `storage.get()` instead of just messages.

---

## 🟡 MEDIUM PRIORITY ISSUES

### M1. No Input Validation on Locale Strings

**Files:** Multiple

```typescript
i18n.setLocale('../../../../etc/passwd') // No validation
```

While this doesn't cause security issues (no filesystem access), malformed locales like empty strings, very long strings, or special characters are not handled.

**Fix:** Add `isValidLocale()` check.

---

### M2. resolveMessage() vs resolveMessageFromLoaded() Duplication

**Files:** `src/i18n/resolve.ts` and `src/i18n/index.ts`

Two nearly identical functions exist:

- `resolveMessage()` in resolve.ts (exported)
- `resolveMessageFromLoaded()` in index.ts (internal)

**Impact:** Maintenance burden, potential divergence.

**Fix:** Use one function.

---

### M3. Missing Error Types

No custom error classes. All errors are generic `Error`.

```typescript
throw new Error(`No loader configured...`) // Generic
```

**Better:**

```typescript
throw new I18nConfigError(`No loader configured...`)
```

---

### M4. ICU Parser Default Parser is Lazy Singleton (Potential Memory)

**File:** `src/i18n/parser.ts` (line 100-107)

```typescript
let defaultParser: ICUParser | null = null // Module-level singleton

function getDefaultParser(): ICUParser {
  if (!defaultParser) {
    defaultParser = createICUParser()
  }
  return defaultParser
}
```

While createI18n() properly creates instance-scoped parsers, legacy `formatICU()` uses this global.

**Impact:** Legacy API grows indefinitely if used.

**Fix:** Already deprecated with `@deprecated` JSDoc. Consider removal in v1.0.

---

### M5. No Test for Actual Nested Key Resolution

**Files:** `src/i18n/__tests__/*.ts`

No test verifies that `i18n.t('user.profile.name')` works with nested messages. This would have caught C1.

---

### M6. SSR Safety Not Consistent

Some a11y functions check `typeof window === 'undefined'`:

- ✅ `preferences.ts` (line 42, 50, 62, 77)
- ❌ `focus.ts` - Uses `document` directly with no guard
- ❌ `announce.ts` - Uses `document.createElement` with no guard

**Impact:** Import errors in Node.js SSR.

---

## 🟢 LOW PRIORITY ISSUES

### L1. Legacy `.docs/intl-engine-starter.md` File

Stale planning document from project rename.

### L2. `notes.md` in Root

Internal notes file committed to repo.

### L3. Repository URL Points to Personal Account

`package.json` has `laphilosophia/sentio`, not org repo.

### L4. Missing CONTRIBUTING.md

No contribution guidelines.

### L5. No .nvmrc or engines.pnpm

Only `engines.node` specified.

---

## Test Coverage Analysis

| Module                   | Coverage | Assessment                           |
| :----------------------- | :------- | :----------------------------------- |
| `i18n/index.ts`          | 80%      | Adequate but missing nested key test |
| `i18n/parser.ts`         | 96%      | Good                                 |
| `i18n/interpolate.ts`    | 100%     | Perfect                              |
| `i18n/keypath.ts`        | 93%      | Good but NEVER USED                  |
| `i18n/loaders/cached.ts` | 80%      | Adequate                             |
| `a11y/index.ts`          | 81%      | Good                                 |
| `a11y/ids.ts`            | 96%      | Good                                 |
| `a11y/focus.ts`          | 6%       | ❌ Almost no coverage                |
| `a11y/announce.ts`       | 2%       | ❌ Almost no coverage                |
| `a11y/keyboard.ts`       | 1%       | ❌ Almost no coverage                |
| `a11y/preferences.ts`    | 9%       | ❌ Minimal coverage                  |

---

## API Consistency Check

| Pattern                             | Consistent?     |
| :---------------------------------- | :-------------- |
| Factory function naming (`create*`) | ✅ Yes          |
| Config object pattern               | ✅ Yes          |
| Return type interfaces              | ✅ Yes          |
| JSDoc on exports                    | ⚠️ Mostly       |
| Error handling                      | ❌ Inconsistent |

---

## Security Checklist

| Check                  | Status                                 |
| :--------------------- | :------------------------------------- |
| XSS in interpolation   | ⚠️ Not escaped (documented?)           |
| Prototype pollution    | ✅ Uses hasOwnProperty                 |
| ReDoS in regex         | ✅ Safe patterns                       |
| Path traversal         | N/A (no filesystem)                    |
| localStorage injection | ⚠️ Keys are prefixed but not validated |

---

## Recommendations

### Must Fix Before Release

1. **C1:** Integrate `keypath.ts` into `resolveMessageFromLoaded()`
2. **C2:** Make ID counter instance-scoped or use UUIDs
3. **H2:** Add currency config option or document limitation
4. **M5:** Add nested key resolution test

### Should Fix

1. **H1:** Document XSS responsibility in README
2. **H3:** Add `destroy()` method to focus trap
3. **H4:** Optimize cached loader
4. **M6:** Add SSR guards to all a11y modules

### Nice to Have

1. Custom error types
2. Clean up legacy files
3. Add CONTRIBUTING.md

---

## Conclusion

This codebase has solid architecture and good TypeScript practices. However, **Critical Bug C1** (nested keys don't work) means a documented core feature is broken. This must be fixed before any release.

The a11y module's DOM-based features lack test coverage but are structurally sound.

**Recommendation:** Fix C1 and C2, add tests, then release.
