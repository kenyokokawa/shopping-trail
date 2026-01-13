// Background service worker for Product History Tracker
// Handles storage management, cleanup, and message routing

import {
  saveProduct,
  getProducts,
  deleteProduct,
  deleteProducts,
  clearAllProducts,
  getSettings,
  updateSettings,
  cleanupOldProducts,
  getStorageUsage,
  getRecentProducts,
  searchProducts,
  getUniqueSites
} from './utils/storage.js';

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'SAVE_PRODUCT':
      return handleSaveProduct(message.product);

    case 'GET_PRODUCTS':
      return getProducts();

    case 'GET_RECENT_PRODUCTS':
      return getRecentProducts(message.limit || 5);

    case 'DELETE_PRODUCT':
      return deleteProduct(message.productId);

    case 'DELETE_PRODUCTS':
      return deleteProducts(message.productIds);

    case 'CLEAR_ALL':
      return clearAllProducts();

    case 'GET_SETTINGS':
      return getSettings();

    case 'UPDATE_SETTINGS':
      return updateSettings(message.settings);

    case 'GET_STORAGE_USAGE':
      return getStorageUsage();

    case 'SEARCH_PRODUCTS':
      return searchProducts(message.query);

    case 'GET_UNIQUE_SITES':
      return getUniqueSites();

    case 'CLEANUP':
      return cleanupOldProducts();

    default:
      return { error: 'Unknown message type' };
  }
}

async function handleSaveProduct(product) {
  // Check if tracking is enabled
  const settings = await getSettings();

  if (!settings.trackingEnabled) {
    return { success: false, reason: 'tracking_disabled' };
  }

  // Check if site is enabled
  const siteName = product.site?.toLowerCase();
  if (siteName && settings.enabledSites) {
    const isKnownSite = ['amazon', 'ebay', 'walmart', 'target', 'bestbuy'].includes(siteName);
    if (isKnownSite && !settings.enabledSites[siteName]) {
      return { success: false, reason: 'site_disabled' };
    }
    if (!isKnownSite && !settings.enabledSites.other) {
      return { success: false, reason: 'site_disabled' };
    }
  }

  // Save the product
  const result = await saveProduct(product);

  // Update badge if save was successful
  if (result.success) {
    await updateBadge();
  }

  return result;
}

// Update extension badge with product count
async function updateBadge() {
  const products = await getProducts();
  const count = products.length;

  if (count > 0) {
    chrome.action.setBadgeText({ text: count > 99 ? '99+' : count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4F46E5' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Set up daily cleanup alarm
chrome.alarms.create('daily-cleanup', {
  periodInMinutes: 24 * 60 // Once per day
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-cleanup') {
    const result = await cleanupOldProducts();
    if (result.removed > 0) {
      await updateBadge();
    }
  }
});

// Initialize badge on install/update
chrome.runtime.onInstalled.addListener(async () => {
  await updateBadge();
  // Run cleanup on install in case there are old products
  await cleanupOldProducts();
});

// Initialize badge on startup
chrome.runtime.onStartup.addListener(async () => {
  await updateBadge();
});
