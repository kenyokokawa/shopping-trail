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

  // Save the product
  const result = await saveProduct(product);

  // Update badge if save was successful
  if (result.success) {
    await updateBadge();
  }

  return result;
}

// Update extension badge with today's product count
async function updateBadge() {
  const products = await getProducts();

  // Count only products saved today
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayCount = products.filter(p => p.savedAt >= startOfDay).length;

  if (todayCount > 0) {
    chrome.action.setBadgeText({ text: todayCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#1E90FF' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Set up daily cleanup alarm
chrome.alarms.create('daily-cleanup', {
  periodInMinutes: 24 * 60 // Once per day
});

// Set up midnight alarm to reset badge count
function scheduleMidnightAlarm() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  const delayMinutes = (midnight.getTime() - now.getTime()) / (1000 * 60);

  chrome.alarms.create('midnight-reset', {
    delayInMinutes: delayMinutes,
    periodInMinutes: 24 * 60
  });
}

scheduleMidnightAlarm();

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-cleanup') {
    const result = await cleanupOldProducts();
    if (result.removed > 0) {
      await updateBadge();
    }
  } else if (alarm.name === 'midnight-reset') {
    await updateBadge();
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
