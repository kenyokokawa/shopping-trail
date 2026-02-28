// Storage utility functions for Product History Tracker

const STORAGE_KEYS = {
  PRODUCTS: 'products',
  SETTINGS: 'settings'
};

const DEFAULT_SETTINGS = {
  retentionDays: 365, // 1 year default
  trackingEnabled: true,
  debugMode: false,
  enabledSites: {
    amazon: true,
    ebay: true,
    walmart: true,
    target: true,
    bestbuy: true,
    other: true
  }
};

// Debug logging helper - only logs when enabled
function debugLog(enabled, ...args) {
  if (enabled) {
    console.log('[PHT Debug]', ...args);
  }
}

// Generate unique ID for a product
export function generateProductId(url) {
  const timestamp = Date.now();
  const hash = simpleHash(url + timestamp);
  return `${hash}-${timestamp}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Get all products from storage
export async function getProducts() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PRODUCTS);
  return result[STORAGE_KEYS.PRODUCTS] || [];
}

// Lock to prevent concurrent saveProduct() calls from racing
let saveLock = Promise.resolve();

// Save a new product
export async function saveProduct(product) {
  // Queue behind any in-flight save to prevent read-before-write races
  const release = saveLock;
  let resolve;
  saveLock = new Promise(r => { resolve = r; });
  await release;

  try {
    return await _saveProduct(product);
  } finally {
    resolve();
  }
}

async function _saveProduct(product) {
  const settings = await getSettings();
  const debug = settings.debugMode;
  const products = await getProducts();

  debugLog(debug, 'saveProduct() called with:', { title: product.title, url: product.url, image: product.image });

  // Check for duplicate (same title + image within last hour)
  const oneHourAgo = Date.now() - 3600000;
  const recentProducts = products.filter(p => p.savedAt > oneHourAgo);
  debugLog(debug, `Checking ${recentProducts.length} recent products (last hour) for duplicates`);

  const recentDuplicate = recentProducts.find(p => {
    const titleMatch = p.title && product.title && p.title === product.title;
    const imageMatch = product.image && p.image && p.image === product.image;
    debugLog(debug, 'Comparing with:', {
      existingTitle: p.title,
      incomingTitle: product.title,
      titleMatch,
      existingImage: p.image,
      incomingImage: product.image || '',
      imageMatch,
      savedAt: new Date(p.savedAt).toISOString(),
    });
    return titleMatch || imageMatch;
  });

  if (recentDuplicate) {
    debugLog(debug, 'DUPLICATE detected, skipping save. Matched product id:', recentDuplicate.id);
    return { success: false, reason: 'duplicate' };
  }

  const newProduct = {
    id: generateProductId(product.url),
    ...product,
    savedAt: Date.now()
  };

  products.unshift(newProduct);
  await chrome.storage.local.set({ [STORAGE_KEYS.PRODUCTS]: products });

  debugLog(debug, 'Product SAVED with id:', newProduct.id);
  return { success: true, product: newProduct };
}

// Delete a product by ID
export async function deleteProduct(productId) {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== productId);
  await chrome.storage.local.set({ [STORAGE_KEYS.PRODUCTS]: filtered });
  return { success: true };
}

// Delete multiple products by IDs
export async function deleteProducts(productIds) {
  const products = await getProducts();
  const idSet = new Set(productIds);
  const filtered = products.filter(p => !idSet.has(p.id));
  await chrome.storage.local.set({ [STORAGE_KEYS.PRODUCTS]: filtered });
  return { success: true, deleted: productIds.length };
}

// Clear all products
export async function clearAllProducts() {
  await chrome.storage.local.set({ [STORAGE_KEYS.PRODUCTS]: [] });
  return { success: true };
}

// Get settings
export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
}

// Update settings
export async function updateSettings(newSettings) {
  const currentSettings = await getSettings();
  const merged = { ...currentSettings, ...newSettings };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged });
  return merged;
}

// Clean up old products based on retention settings
export async function cleanupOldProducts() {
  const settings = await getSettings();
  const products = await getProducts();

  if (settings.retentionDays === 0) {
    // 0 means keep forever
    return { removed: 0 };
  }

  const cutoffTime = Date.now() - (settings.retentionDays * 24 * 60 * 60 * 1000);
  const filtered = products.filter(p => p.savedAt > cutoffTime);
  const removed = products.length - filtered.length;

  if (removed > 0) {
    await chrome.storage.local.set({ [STORAGE_KEYS.PRODUCTS]: filtered });
  }

  return { removed };
}

// Calculate storage usage
export async function getStorageUsage() {
  const bytesInUse = await chrome.storage.local.getBytesInUse(null);
  const products = await getProducts();

  return {
    bytesUsed: bytesInUse,
    formattedSize: formatBytes(bytesInUse),
    productCount: products.length,
    quota: chrome.storage.local.QUOTA_BYTES || 10485760 // 10MB default
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get recent products (for popup)
export async function getRecentProducts(limit = 5) {
  const products = await getProducts();
  return products.slice(0, limit);
}

// Search products
export async function searchProducts(query) {
  const products = await getProducts();
  const lowerQuery = query.toLowerCase();
  return products.filter(p =>
    p.title?.toLowerCase().includes(lowerQuery) ||
    p.description?.toLowerCase().includes(lowerQuery)
  );
}

// Filter products by site
export async function getProductsBySite(site) {
  const products = await getProducts();
  return products.filter(p => p.site === site);
}

// Get unique sites from saved products
export async function getUniqueSites() {
  const products = await getProducts();
  return [...new Set(products.map(p => p.site).filter(Boolean))];
}

export { STORAGE_KEYS, DEFAULT_SETTINGS };
