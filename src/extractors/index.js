// Extractor registry - manages all product extractors

import * as amazon from './amazon.js';
import * as ebay from './ebay.js';
import * as walmart from './walmart.js';
import * as target from './target.js';
import * as bestbuy from './bestbuy.js';
import * as generic from './generic.js';

// All extractors sorted by priority (highest first)
const extractors = [
  amazon,
  ebay,
  walmart,
  target,
  bestbuy,
  generic // Fallback with lowest priority
].sort((a, b) => (b.priority || 0) - (a.priority || 0));

// Get the appropriate extractor for a URL
export function getExtractor(url) {
  for (const extractor of extractors) {
    if (extractor.canExtract(url)) {
      return extractor;
    }
  }
  return generic; // Always fall back to generic
}

// Extract product data from current page
export function extractProduct() {
  const url = window.location.href;

  // Try each extractor in priority order
  for (const extractor of extractors) {
    if (extractor.canExtract(url)) {
      const product = extractor.extract();
      if (product && product.title) {
        return {
          ...product,
          extractedBy: extractor.site
        };
      }
    }
  }

  return null;
}

// Get list of supported sites
export function getSupportedSites() {
  return extractors
    .filter(e => e.site !== 'generic')
    .map(e => e.site);
}

export { extractors };
