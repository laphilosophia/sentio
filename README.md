# Sentio

**Headless i18n & a11y resolution engine for deterministic UI platforms.**

[![Tests](https://github.com/cluster127/sentio/actions/workflows/ci.yml/badge.svg)](https://github.com/cluster127/sentio/actions)
[![npm version](https://img.shields.io/npm/v/sentio.svg)](https://www.npmjs.com/package/sentio)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

### i18n Engine

- **ICU MessageFormat** - Full plural, select, and number formatting
- **Key-path resolution** - Deep nested message access (`user.profile.name`)
- **LRU caching** - Automatic formatter caching for performance
- **Lazy namespace loading** - Load translations on demand
- **Multiple loaders** - API, in-memory, cached (offline-first)
- **Telemetry hooks** - Track missing keys, load times, errors

### a11y Engine

- **ARIA attribute resolution** - 20+ attributes from semantic input
- **Focus management** - Focus trap, roving tabindex
- **Live regions** - Screen reader announcements
- **Keyboard patterns** - Arrow navigation, type-ahead
- **User preferences** - Reduced motion, high contrast detection
- **ID utilities** - ARIA relationship management

## Installation

```bash
npm install sentio
# or
pnpm add sentio
```

## Quick Start

### i18n

```typescript
import { createI18n } from 'sentio/i18n'

const i18n = createI18n({
  locale: 'en',
  fallback: 'en',
  messages: {
    en: {
      greeting: 'Hello, {name}!',
      items: '{count, plural, =0 {No items} one {# item} other {# items}}',
    },
    tr: {
      greeting: 'Merhaba, {name}!',
      items: '{count, plural, =0 {Öğe yok} one {# öğe} other {# öğe}}',
    },
  },
})

i18n.t('greeting', { name: 'World' }) // "Hello, World!"
i18n.t('items', { count: 5 }) // "5 items"

i18n.setLocale('tr')
i18n.t('greeting', { name: 'Dünya' }) // "Merhaba, Dünya!"
```

### a11y

```typescript
import { createA11y, resolveAttributes } from 'sentio/a11y'

// Instance-based
const a11y = createA11y({ enabled: true })

const buttonAttrs = a11y.resolve({
  role: 'button',
  label: 'Delete item',
  disabled: true,
  describedBy: 'warning-text',
})
// → { role: 'button', 'aria-label': 'Delete item', 'aria-disabled': true, tabIndex: -1, 'aria-describedby': 'warning-text' }

// Standalone
const menuAttrs = resolveAttributes({
  role: 'menu',
  expanded: true,
  hasPopup: 'menu',
})
// → { role: 'menu', 'aria-expanded': true, 'aria-haspopup': 'menu' }
```

## i18n API Reference

### `createI18n(config)`

Creates an i18n instance.

```typescript
interface I18nConfig {
  locale: string // Current locale
  fallback: string // Fallback locale
  messages?: Record<string, LocaleMessages> // Inline messages
  loader?: MessageLoader // External message loader
  onMissingKey?: (key: string, locale: string) => void
  onError?: (error: Error) => void
  onLoad?: (locale: string, messages: LocaleMessages) => void
}

interface I18n {
  t(key: string, params?: Record<string, unknown>): string
  getLocale(): string
  setLocale(locale: string): Promise<void>
  hasLocale(locale: string): boolean
  getAvailableLocales(): string[]
  loadNamespace(namespace: string, loader: NamespaceLoader): Promise<void>
  isNamespaceLoaded(namespace: string): boolean
}
```

### Message Loaders

```typescript
import { createApiLoader, createInMemoryLoader, createCachedLoader } from 'sentio/i18n/loaders'

// API loader - fetch from server
const apiLoader = createApiLoader({
  baseUrl: '/api/translations',
  // Fetches: /api/translations/en.json
})

// In-memory loader
const memoryLoader = createInMemoryLoader({
  en: { hello: 'Hello' },
  tr: { hello: 'Merhaba' },
})

// Cached loader - offline-first with TTL
const cachedLoader = createCachedLoader(apiLoader, {
  ttl: 60 * 60 * 1000, // 1 hour
  prefix: 'myapp-i18n', // localStorage key prefix
})
```

### ICU MessageFormat

```typescript
// Pluralization
i18n.t('messages', { count: 1 }) // "1 message"
i18n.t('messages', { count: 42 }) // "42 messages"

// Select
i18n.t('pronoun', { gender: 'female' }) // "she"

// Number formatting
i18n.t('price', { amount: 1234.5 }) // "$1,234.50"

// Nested messages
i18n.t('user.profile.bio') // Deep key access
```

## a11y API Reference

### `resolveAttributes(input)`

Resolves ARIA attributes from semantic input.

```typescript
interface A11yInput {
  role?: string
  label?: string
  labelKey?: string // i18n key
  i18n?: I18n // i18n instance for labelKey
  disabled?: boolean
  hidden?: boolean
  live?: 'polite' | 'assertive' | 'off'
  describedBy?: string
  labelledBy?: string
  controls?: string
  expanded?: boolean
  pressed?: boolean | 'mixed'
  selected?: boolean
  checked?: boolean | 'mixed'
  required?: boolean
  invalid?: boolean
  errorMessage?: string
  busy?: boolean
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  modal?: boolean
  valueNow?: number
  valueMin?: number
  valueMax?: number
  valueText?: string
}
```

### Focus Management

```typescript
import { createFocusTrap, createRovingTabindex } from 'sentio/a11y'

// Focus trap for modals
const trap = createFocusTrap({
  container: modalElement,
  initialFocus: 'first',
  escapeDeactivates: true,
  onEscape: () => closeModal(),
})

trap.activate()
// ... modal is open
trap.deactivate()

// Roving tabindex for toolbars/menus
const roving = createRovingTabindex({
  container: toolbarElement,
  itemSelector: 'button',
  orientation: 'horizontal',
  wrap: true,
})

roving.init()
```

### Live Region Announcements

```typescript
import { createAnnouncer, createFormAnnouncer } from 'sentio/a11y'

// General announcements
const announcer = createAnnouncer()
announcer.announce('Item added to cart')
announcer.announce('Error: Invalid input', 'assertive')

// Form-specific announcements
const formAnnouncer = createFormAnnouncer()
formAnnouncer.announceError('Email', 'Invalid email format')
formAnnouncer.announceSuccess('Password')
formAnnouncer.announceSubmit(true, 'Account created!')
```

### User Preferences

```typescript
import {
  prefersReducedMotion,
  prefersHighContrast,
  prefersColorScheme,
  createPreferencesObserver,
  withReducedMotion,
  getAnimationDuration,
} from 'sentio/a11y'

// Check current preferences
if (prefersReducedMotion()) {
  disableAnimations()
}

// Observe changes
const observer = createPreferencesObserver()
observer.subscribe((prefs) => {
  if (prefs.reducedMotion) {
    disableAnimations()
  }
  if (prefs.colorScheme === 'dark') {
    enableDarkMode()
  }
})

// Helpers
const transition = withReducedMotion('transform 0.3s ease', 'none')
const duration = getAnimationDuration(300) // 0 if reduced motion
```

### Keyboard Navigation

```typescript
import { createKeyboardNavigation, createEscapeHandler } from 'sentio/a11y'

// Arrow key navigation
const nav = createKeyboardNavigation({
  container: listbox,
  itemSelector: '[role="option"]',
  orientation: 'vertical',
  typeAhead: true,
  onActivate: (el, index) => selectOption(index),
})

nav.init()

// Escape handler
const escape = createEscapeHandler({
  onEscape: () => closeDropdown(),
  container: dropdownElement,
})

escape.start()
```

### ID Utilities

```typescript
import { generateId, createIdAssociation, createFormFieldAssociation } from 'sentio/a11y'

// Generate unique IDs
const id = generateId('tooltip') // "tooltip-1"

// Link elements with ARIA relationships
const assoc = createIdAssociation('tooltip')
assoc.link(trigger, tooltip, 'aria-describedby')
// trigger: aria-describedby="tooltip-1"
// tooltip: id="tooltip-1"

// Form field associations
const field = createFormFieldAssociation('email')
field.linkLabel(labelEl, inputEl)
field.linkDescription(descEl, inputEl)
field.linkError(errorEl, inputEl)
```

## Framework Integration

Sentio is headless - it provides the logic, you handle the rendering:

```typescript
// React example
function Button({ label, disabled, describedBy }) {
  const attrs = resolveAttributes({
    role: 'button',
    label,
    disabled,
    describedBy
  })

  return <button {...attrs}>{label}</button>
}

// Vue example
const attrs = computed(() =>
  resolveAttributes({
    role: 'button',
    label: props.label,
    disabled: props.disabled
  })
)
```

## License

MIT © [Erdem Arslan](https://github.com/laphilosophia)
