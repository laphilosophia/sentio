# API Reference

Complete API documentation for Sentio.

## Table of Contents

- [i18n Module](#i18n-module)
  - [createI18n](#createi18n)
  - [Message Loaders](#message-loaders)
  - [Types](#i18n-types)
- [a11y Module](#a11y-module)
  - [Core](#core)
  - [Focus Management](#focus-management)
  - [Announcements](#announcements)
  - [Preferences](#preferences)
  - [Keyboard Navigation](#keyboard-navigation)
  - [ID Utilities](#id-utilities)
  - [Types](#a11y-types)

---

## i18n Module

### createI18n

```typescript
function createI18n(config: I18nConfig): I18n
```

Creates an internationalization instance.

#### Config

| Property       | Type                             | Default  | Description                 |
| :------------- | :------------------------------- | :------- | :-------------------------- |
| `locale`       | `string`                         | required | Current locale code         |
| `fallback`     | `string`                         | required | Fallback locale code        |
| `messages`     | `Record<string, LocaleMessages>` | `{}`     | Inline message dictionaries |
| `loader`       | `MessageLoader`                  | -        | External message loader     |
| `onMissingKey` | `(key, locale) => void`          | -        | Missing key callback        |
| `onError`      | `(error) => void`                | -        | Error callback              |
| `onLoad`       | `(locale, messages) => void`     | -        | Load complete callback      |

#### Returns: I18n

| Method                | Signature                                                | Description                             |
| :-------------------- | :------------------------------------------------------- | :-------------------------------------- |
| `t`                   | `(key: string, params?: object) => string`               | Translate message with interpolation    |
| `getLocale`           | `() => string`                                           | Get current locale                      |
| `setLocale`           | `(locale: string) => Promise<void>`                      | Change locale (triggers load if needed) |
| `hasLocale`           | `(locale: string) => boolean`                            | Check if locale is available            |
| `getAvailableLocales` | `() => string[]`                                         | List all available locales              |
| `loadNamespace`       | `(ns: string, loader: NamespaceLoader) => Promise<void>` | Load namespace lazily                   |
| `isNamespaceLoaded`   | `(ns: string) => boolean`                                | Check if namespace is loaded            |

---

### Message Loaders

#### createInMemoryLoader

```typescript
function createInMemoryLoader(messages: Record<string, LocaleMessages>): MessageLoader
```

Creates a loader from inline message dictionaries.

#### createApiLoader

```typescript
function createApiLoader(config: ApiLoaderConfig): MessageLoader
```

| Config Property | Type          | Default   | Description              |
| :-------------- | :------------ | :-------- | :----------------------- |
| `baseUrl`       | `string`      | required  | Base URL for fetching    |
| `fileExtension` | `string`      | `'.json'` | File extension           |
| `fetchOptions`  | `RequestInit` | `{}`      | Additional fetch options |

Fetches from: `{baseUrl}/{locale}{fileExtension}`

#### createCachedLoader

```typescript
function createCachedLoader(
  source: MessageLoader,
  config?: CachedLoaderConfig
): MessageLoader & { clearCache: () => Promise<void> }
```

| Config Property | Type           | Default         | Description             |
| :-------------- | :------------- | :-------------- | :---------------------- |
| `ttl`           | `number`       | `3600000` (1hr) | Cache TTL in ms         |
| `prefix`        | `string`       | `'sentio-i18n'` | localStorage key prefix |
| `storage`       | `CacheStorage` | localStorage    | Custom storage          |

---

### i18n Types

```typescript
type LocaleMessages = Record<string, string | LocaleMessages>

interface MessageLoader {
  load(locale: string): Promise<LocaleMessages>
  hasLocale(locale: string): boolean
  getAvailableLocales(): string[]
}

interface NamespaceLoader {
  load(locale: string): Promise<LocaleMessages>
}

interface CacheStorage {
  get(key: string): Promise<LocaleMessages | null>
  set(key: string, value: LocaleMessages): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}
```

---

## a11y Module

### Core

#### createA11y

```typescript
function createA11y(config?: A11yConfig): A11y
```

| Config Property | Type      | Default | Description                 |
| :-------------- | :-------- | :------ | :-------------------------- |
| `enabled`       | `boolean` | `true`  | Enable attribute resolution |
| `lang`          | `string`  | -       | Language for aria-lang      |

#### resolveAttributes

```typescript
function resolveAttributes(input: A11yInput): A11yAttributes
```

Standalone function for resolving ARIA attributes.

---

### Focus Management

#### createFocusTrap

```typescript
function createFocusTrap(config: FocusTrapConfig): FocusTrap
```

| Config Property     | Type                           | Default   | Description          |
| :------------------ | :----------------------------- | :-------- | :------------------- |
| `container`         | `Element \| string`            | required  | Trap container       |
| `initialFocus`      | `Element \| 'first' \| 'last'` | `'first'` | Initial focus target |
| `returnFocus`       | `Element \| null`              | -         | Focus return target  |
| `escapeDeactivates` | `boolean`                      | `false`   | Deactivate on Escape |
| `onEscape`          | `() => void`                   | -         | Escape callback      |
| `onFocusLeave`      | `() => void`                   | -         | Focus leave callback |

**Returns:**

| Method             | Description                  |
| :----------------- | :--------------------------- |
| `activate()`       | Activate the trap            |
| `deactivate()`     | Deactivate and restore focus |
| `isActive()`       | Check if active              |
| `updateElements()` | Refresh focusable elements   |

#### createRovingTabindex

```typescript
function createRovingTabindex(config: RovingTabindexConfig): RovingTabindex
```

| Config Property  | Type                                   | Default        | Description            |
| :--------------- | :------------------------------------- | :------------- | :--------------------- |
| `container`      | `Element`                              | required       | Container element      |
| `itemSelector`   | `string`                               | required       | Item CSS selector      |
| `orientation`    | `'horizontal' \| 'vertical' \| 'both'` | `'horizontal'` | Navigation direction   |
| `wrap`           | `boolean`                              | `true`         | Wrap at boundaries     |
| `onActiveChange` | `(el, index) => void`                  | -              | Active change callback |

#### getFocusableElements

```typescript
function getFocusableElements(container: Element): HTMLElement[]
```

Returns all focusable elements within a container.

---

### Announcements

#### createAnnouncer

```typescript
function createAnnouncer(config?: AnnouncerConfig): Announcer
```

| Config Property   | Type                      | Default         | Description           |
| :---------------- | :------------------------ | :-------------- | :-------------------- |
| `defaultPriority` | `'polite' \| 'assertive'` | `'polite'`      | Default priority      |
| `debounceMs`      | `number`                  | `100`           | Debounce delay        |
| `container`       | `Element`                 | `document.body` | Live region container |

**Returns:**

| Method                         | Description                 |
| :----------------------------- | :-------------------------- |
| `announce(message, priority?)` | Announce message            |
| `clear()`                      | Clear pending announcements |
| `destroy()`                    | Remove live regions         |

#### createFormAnnouncer

```typescript
function createFormAnnouncer(config?: FormAnnouncerConfig): FormAnnouncer
```

| Method                              | Description                           |
| :---------------------------------- | :------------------------------------ |
| `announceError(field, error)`       | Announce validation error (assertive) |
| `announceSuccess(field)`            | Announce field valid (polite)         |
| `announceSubmit(success, message?)` | Announce form result                  |
| `destroy()`                         | Cleanup                               |

---

### Preferences

#### Detection Functions

```typescript
function prefersReducedMotion(): boolean
function prefersHighContrast(): boolean
function prefersColorScheme(): 'light' | 'dark' | 'no-preference'
function prefersReducedTransparency(): boolean
function getPreferences(): A11yPreferences
```

#### createPreferencesObserver

```typescript
function createPreferencesObserver(): PreferencesObserver
```

| Method                | Description                                |
| :-------------------- | :----------------------------------------- |
| `get()`               | Get current preferences                    |
| `subscribe(callback)` | Subscribe to changes (returns unsubscribe) |
| `destroy()`           | Cleanup listeners                          |

#### Helpers

```typescript
function withReducedMotion<T>(value: T, fallback: T): T
function getAnimationDuration(durationMs: number): number
```

---

### Keyboard Navigation

#### createKeyboardNavigation

```typescript
function createKeyboardNavigation(config: KeyboardNavigationConfig): KeyboardNavigation
```

| Config Property     | Type                                   | Default      | Description           |
| :------------------ | :------------------------------------- | :----------- | :-------------------- |
| `container`         | `Element`                              | required     | Container             |
| `itemSelector`      | `string`                               | required     | Item selector         |
| `orientation`       | `'horizontal' \| 'vertical' \| 'grid'` | `'vertical'` | Nav type              |
| `columns`           | `number`                               | `1`          | Grid columns          |
| `typeAhead`         | `boolean`                              | `false`      | Enable type-ahead     |
| `typeAheadTimeout`  | `number`                               | `500`        | Type-ahead reset (ms) |
| `onActivate`        | `(el, index) => void`                  | -            | Enter/Space callback  |
| `onSelectionChange` | `(el, index) => void`                  | -            | Selection callback    |

#### createEscapeHandler

```typescript
function createEscapeHandler(config: EscapeHandlerConfig): { start: () => void; stop: () => void }
```

---

### ID Utilities

#### generateId

```typescript
function generateId(prefix?: string): string
```

Generates sequential unique IDs: `{prefix}-{counter}`

#### resetIdCounter

```typescript
function resetIdCounter(): void
```

Reset counter (testing only).

#### createIdAssociation

```typescript
function createIdAssociation(prefix?: string): IdAssociation
```

| Method                        | Description         |
| :---------------------------- | :------------------ |
| `id`                          | Generated ID string |
| `setId(element)`              | Apply ID to element |
| `setReference(element, attr)` | Set ARIA reference  |
| `link(source, target, attr)`  | Link elements       |

#### createFormFieldAssociation

```typescript
function createFormFieldAssociation(fieldName: string): FormFieldAssociation
```

| Property/Method                | Description                 |
| :----------------------------- | :-------------------------- |
| `inputId`                      | Input element ID            |
| `labelId`                      | Label element ID            |
| `descriptionId`                | Description ID              |
| `errorId`                      | Error message ID            |
| `linkLabel(label, input)`      | Connect label               |
| `linkDescription(desc, input)` | Connect description         |
| `linkError(error, input)`      | Connect error + set invalid |

#### removeAriaReference

```typescript
function removeAriaReference(element: Element, attribute: AriaRelationship, id: string): void
```

---

### a11y Types

```typescript
interface A11yInput {
  role?: string
  label?: string
  labelKey?: string
  i18n?: I18n
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

interface A11yAttributes {
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-hidden'?: boolean
  'aria-disabled'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-describedby'?: string
  'aria-controls'?: string
  'aria-expanded'?: boolean
  'aria-pressed'?: boolean | 'mixed'
  'aria-selected'?: boolean
  'aria-checked'?: boolean | 'mixed'
  'aria-required'?: boolean
  'aria-invalid'?: boolean
  'aria-errormessage'?: string
  'aria-busy'?: boolean
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-modal'?: boolean
  'aria-valuenow'?: number
  'aria-valuemin'?: number
  'aria-valuemax'?: number
  'aria-valuetext'?: string
  tabIndex?: number
}

interface A11yPreferences {
  reducedMotion: boolean
  highContrast: boolean
  colorScheme: 'light' | 'dark' | 'no-preference'
  reducedTransparency: boolean
}

type AriaRelationship =
  | 'aria-describedby'
  | 'aria-labelledby'
  | 'aria-controls'
  | 'aria-owns'
  | 'aria-activedescendant'
  | 'aria-details'
  | 'aria-errormessage'
```
