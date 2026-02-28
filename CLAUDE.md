# CLAUDE.md — Product History Tracker

## Project Overview

Chrome browser extension that automatically captures and saves products as users browse shopping websites. Provides a full-screen dashboard to view, search, filter, and analyze browsing history. All data is stored locally — no external servers.

## Tech Stack

- **Framework**: [Wxt](https://wxt.dev) v0.20 — modern web extension framework
- **UI**: Svelte 5 — reactive components (recently migrated from vanilla JS)
- **Charts**: Chart.js v4 — analytics visualizations
- **Storage**: Chrome Storage API — local persistence
- **Build**: Wxt build system → Chrome extension bundle

## Architecture

```
Content Script (content.js)
  → Extracts product data from pages using generic extraction (JSON-LD, Microdata, Open Graph)
  → Sends message to background

Background Service Worker (background.js)
  → Receives product data, deduplicates, saves to Chrome storage
  → Manages badge count (daily reset), auto-cleanup via alarms

UI Layer (Svelte)
  → Popup: quick view of 5 most recent products
  → Dashboard: full-screen grid with search, filters, analytics, settings
```

## Key Directories

```
src/
├── entrypoints/
│   ├── background.js        # Service worker (storage, messaging, cleanup)
│   ├── content.js            # Content script (product detection)
│   ├── popup/                # Extension popup (App.svelte)
│   └── dashboard/            # Full dashboard (14 Svelte components)
├── utils/
│   ├── storage.js            # Chrome storage wrapper, dedup, locking
│   ├── messaging.js          # chrome.runtime.sendMessage helper
│   └── formatters.js         # Date, price, byte formatting
└── public/icon/              # Extension icons (16, 48, 128, svg)
```

## Development Commands

```bash
npm run dev              # Run extension in dev mode (Chrome)
npm run dev:firefox      # Run extension in dev mode (Firefox)
npm run build            # Production build
npm run build:firefox    # Production build (Firefox)
npm run zip              # Create distributable zip
```

## Code Conventions

- **JavaScript** (not TypeScript) — plain .js files throughout
- **Svelte 5** — use runes syntax (`$state`, `$derived`, `$effect`)
- **No testing framework** currently — be careful with changes
- **No linter** — follow existing code style (2-space indent, single quotes in JS, template literals for interpolation)
- **Extraction** is generic-only (JSON-LD, Microdata, Open Graph) — no site-specific logic
- **Storage** uses a lock mechanism in `saveProduct()` to prevent race conditions
- **Deduplication** checks title + image within a 1-hour window
- **Debug logging** uses `[PHT Debug]` prefix, toggled via settings

## Important Behaviors

- Product dedup window: 1 hour (same title + image = skip)
- Badge count resets daily at midnight
- Auto-cleanup runs daily, removes products older than retention period (default: 1 year)
- Extraction uses generic methods: JSON-LD → Microdata → Open Graph

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the feature backlog and project priorities.
