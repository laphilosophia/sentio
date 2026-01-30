# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-30

### Added

#### i18n Engine

- `createI18n` - Core i18n instance factory
- ICU MessageFormat support (plural, select, number)
- Key-path resolution for nested messages
- LRU-cached formatter instances
- Lazy namespace loading
- Telemetry hooks (`onMissingKey`, `onError`, `onLoad`)

#### Message Loaders

- `createInMemoryLoader` - In-memory message dictionaries
- `createApiLoader` - HTTP-based message fetching
- `createCachedLoader` - Offline-first with TTL and localStorage

#### a11y Engine

- `createA11y` / `resolveAttributes` - ARIA attribute resolution
- 20+ ARIA attributes support (expanded, pressed, checked, invalid, modal, etc.)

#### Focus Management

- `createFocusTrap` - Modal/dialog focus trapping
- `createRovingTabindex` - Arrow key navigation for composite widgets
- `getFocusableElements` - Utility for finding focusable elements

#### Live Regions

- `createAnnouncer` - Screen reader announcements (polite/assertive)
- `createFormAnnouncer` - Form validation feedback

#### User Preferences

- `prefersReducedMotion`, `prefersHighContrast`, `prefersColorScheme`
- `createPreferencesObserver` - Reactive preference watching
- `withReducedMotion`, `getAnimationDuration` - Animation helpers

#### Keyboard Navigation

- `createKeyboardNavigation` - Arrow/grid navigation with type-ahead
- `createEscapeHandler` - Escape key handling

#### Skip Links

- `createSkipLinks` - Skip to content navigation

#### ID Utilities

- `generateId` - Unique ID generation
- `createIdAssociation` - ARIA relationship linking
- `createFormFieldAssociation` - Form field ID management
- `removeAriaReference` - ARIA reference cleanup

### Documentation

- Comprehensive README with usage examples
- Full API reference documentation

### Testing

- 134 unit tests
- ~89% coverage on i18n module
- 100% coverage on core a11y functions

[0.1.0]: https://github.com/cluster127/sentio/releases/tag/v0.1.0
