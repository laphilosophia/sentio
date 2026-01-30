# sentio

> **Status:** 📋 Incubation
> **Graduation Target:** `@voltakit/i18n` + `@voltakit/a11y`
> **Author:** @laphilosophia

---

## Mission

Headless i18n + a11y runtime for deterministic UI platforms.

**Not a framework.** A pure function layer:

```
(key, locale, params) → string
(component, config) → ARIA attributes
```

---

## Scope

### ✅ In Scope

| Feature                     | Description                            |
| --------------------------- | -------------------------------------- |
| ICU Message Format          | Interpolation, pluralization, select   |
| Date/Number/List formatting | Via native `Intl` API                  |
| Locale switching            | Runtime locale change                  |
| Fallback chain              | `tr-TR` → `tr` → `en`                  |
| ARIA attributes             | Role, label, describedby, live regions |
| Semantic roles              | Whitelist of common roles              |

### ❌ Out of Scope

| Feature                | Reason                               |
| ---------------------- | ------------------------------------ |
| Translation management | External concern (Lokalise, Crowdin) |
| Focus management       | Adapter/framework responsibility     |
| Screen reader testing  | QA concern, not runtime              |
| RTL layout             | CSS concern                          |

---

## Design Principles

1. **Zero framework dependency** — Works anywhere
2. **Tree-shakeable** — Import only what you use
3. **Native first** — Prefer `Intl` over polyfills
4. **Deterministic** — Same input = same output
5. **DevTools friendly** — Missing key warnings, format errors

---

## API Design

### i18n Module

```typescript
import { createI18n } from 'sentio'

const i18n = createI18n({
  locale: 'tr',
  fallback: 'en',
  messages: {
    en: {
      greeting: 'Hello {name}!',
      items: '{count, plural, one {# item} other {# items}}',
    },
    tr: {
      greeting: 'Merhaba {name}!',
      items: '{count, plural, one {# öğe} other {# öğe}}',
    },
  },
})

i18n.t('greeting', { name: 'Volta' }) // "Merhaba Volta!"
i18n.t('items', { count: 5 }) // "5 öğe"

i18n.formatDate(new Date(), 'short') // "30.01.2026"
i18n.formatNumber(1234.56, 'currency') // "₺1.234,56"
```

### a11y Module

```typescript
import { createA11y, resolveAttributes } from 'sentio/a11y'

const a11y = createA11y({
  enabled: true,
  lang: 'tr',
})

// From component definition
const attrs = resolveAttributes({
  role: 'button',
  label: 'Submit form',
  disabled: true,
})

// Output:
// {
//   role: 'button',
//   'aria-label': 'Submit form',
//   'aria-disabled': true,
//   tabIndex: -1
// }
```

### Integrated Usage (Volta Pattern)

```typescript
import { createI18n, createA11y } from 'sentio'

const i18n = createI18n({ ... })
const a11y = createA11y({ lang: i18n.getLocale() })

// Component with i18n-driven a11y
const attrs = a11y.resolve({
  role: 'button',
  labelKey: 'buttons.submit',  // i18n key
  i18n,                        // resolver instance
})

// Output: { role: 'button', 'aria-label': 'Gönder' }
```

---

## Package Structure

```
sentio/
├── src/
│   ├── i18n/
│   │   ├── index.ts          # createI18n, t(), formatDate(), formatNumber()
│   │   ├── parser.ts         # ICU Message Format parser
│   │   ├── formatters.ts     # Date/Number/List formatters
│   │   └── __tests__/
│   ├── a11y/
│   │   ├── index.ts          # createA11y, resolveAttributes()
│   │   ├── roles.ts          # ARIA role whitelist
│   │   └── __tests__/
│   └── index.ts              # Public exports
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Graduation Criteria

| Criterion             | Target                                 |
| --------------------- | -------------------------------------- |
| Test coverage         | ≥ 80%                                  |
| API stability         | 2+ weeks without breaking changes      |
| Documentation         | README + API reference                 |
| TypeScript            | Strict mode, 0 errors                  |
| Bundle size           | < 20KB minified                        |
| Real-world validation | Used in at least 1 Volta-based project |

---

## Dependencies

### Required

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^3.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### Optional (if ICU complexity needed)

```json
{
  "dependencies": {
    "@formatjs/intl-messageformat": "^10.0.0"
  }
}
```

**Decision:** Start with native `Intl` API. Add `intl-messageformat` only if complex pluralization needed.

---

## Roadmap

### Phase 1: Foundation

- [ ] Repository setup (TypeScript, Vitest, ESLint)
- [ ] Basic `t()` function with interpolation
- [ ] Locale switching
- [ ] Fallback chain

### Phase 2: ICU Message Format

- [ ] Pluralization rules
- [ ] Select expressions
- [ ] Nested messages
- [ ] Date/Number formatters

### Phase 3: a11y Module

- [ ] ARIA role whitelist
- [ ] Attribute resolver
- [ ] i18n integration (labelKey → aria-label)
- [ ] Live region support

### Phase 4: Graduation Prep

- [ ] API freeze
- [ ] Documentation
- [ ] Bundle optimization
- [ ] Volta integration tests

---

## References

- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Sthira](https://github.com/laphilosophia/sthira) — Graduation pattern reference
- [Sightline](https://github.com/laphilosophia/sightline) — Graduation pattern reference

---

## Quick Start

```bash
# Clone and setup
git clone https://github.com/laphilosophia/sentio.git
cd sentio
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```
