# Product History Tracker — Roadmap

## Current State

A working Chrome extension that detects products on any site using generic extraction (JSON-LD, Microdata, Open Graph), stores them locally, and provides a dashboard with search, filtering, analytics, and settings. Recently migrated to Svelte 5.

---

## High Priority

### Data Quality
- [ ] Remove false positives from being saved (Yelp, non-product pages, etc.)
- [ ] Blacklist specific sites from product tracking (user-configurable)

### Core Features
- [ ] Product price tracking — tag showing price increased/decreased since first saved
- [ ] Product categories / tags (manual or auto-detected)
- [ ] Favorites / wishlist — pin products to save them from auto-cleanup
- [ ] Manually add products
- [ ] Deletion confirmation — toast prompt asking user to confirm or undo removal

### Impulse Purchase Protection
- [ ] "Lock" add-to-cart buttons on products for X days to curb impulse purchases
- [ ] Site-level blacklist for locking (block specific stores)
- [ ] Override/bypass option for locked purchases

## Medium Priority

### Search, Sort & Filter Upgrades
- [ ] Enhanced sort options (by category, by price change, by visit count)
- [ ] Advanced filtering (date ranges, price change direction, favorites only)
- [ ] Improved search (fuzzy matching, search across all fields)

### UI/UX
- [ ] Responsive layout improvements for narrow windows
- [ ] Browser sidebar panel mode (Manifest V3 side panel API)

### Analytics Enhancements
- [ ] Category breakdown chart
- [ ] Most visited sites ranking

## Lower Priority

### Developer Experience
- [ ] Add ESLint + Prettier
- [ ] Migrate to TypeScript

### Integrations
- [ ] Integration with price comparison APIs

---

## Completed

- [x] Core product detection and storage
- [x] Generic product extraction (JSON-LD, Microdata, Open Graph)
- [x] Full-screen dashboard with grid layout
- [x] Search and filtering (site, price range, date)
- [x] Analytics view with Chart.js
- [x] Dark/light mode (system theme)
- [x] Auto-cleanup with configurable retention
- [x] Storage usage monitoring
- [x] Debug mode
- [x] Migrate from vanilla JS to Svelte 5
- [x] Export data (CSV and JSON)
- [x] Import data (restore from backup)