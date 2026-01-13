# Product History Tracker

A Chrome extension that automatically saves products you view while shopping online. Browse your complete product history anytime with a full-screen dashboard.

## Features

- **Automatic Product Detection**: Saves products as you browse shopping sites
- **Supported Sites**: Amazon, eBay, Walmart, Target, Best Buy, plus generic support for any site using schema.org/JSON-LD markup
- **Full-Screen Dashboard**: View all saved products in a grid layout with images, names, descriptions, prices, and links
- **Search & Filter**: Find products by name, filter by site, sort by date or price
- **Local Storage**: All data stored locally in your browser - no external servers
- **Auto-Cleanup**: Configurable retention period (default 1 year)
- **System Theme Support**: Automatically matches your OS light/dark mode preference
- **Storage Monitoring**: See how much storage the extension is using at a glance

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `product-history-tracker` folder

## Usage

1. **Browse normally** - Products are automatically saved when you visit product pages
2. **Click the extension icon** to see recent products and quick stats
3. **Click "View All Products"** to open the full dashboard
4. **Customize settings** including retention period and which sites to track

## Project Structure

```
product-history-tracker/
├── manifest.json           # Extension configuration
├── src/
│   ├── background.js       # Service worker for storage & cleanup
│   ├── content.js          # Product detection on pages
│   ├── extractors/         # Site-specific product extractors
│   ├── popup/              # Extension popup UI
│   ├── dashboard/          # Full-screen dashboard
│   └── utils/              # Storage utilities
└── icons/                  # Extension icons
```

## Privacy

This extension stores all data locally in your browser using Chrome's storage API. No data is sent to external servers.
