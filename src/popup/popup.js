// Popup script for Product History Tracker

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadStats();
  await loadRecentProducts();
  await loadTrackingState();
  setupEventListeners();
}

async function loadStats() {
  const usage = await sendMessage({ type: 'GET_STORAGE_USAGE' });

  document.getElementById('product-count').textContent = usage.productCount || 0;
  document.getElementById('storage-used').textContent = usage.formattedSize || '0 B';
}

async function loadRecentProducts() {
  const products = await sendMessage({ type: 'GET_RECENT_PRODUCTS', limit: 5 });
  const container = document.getElementById('recent-products');

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="empty-message">No products saved yet. Start shopping!</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-item" data-url="${escapeHtml(product.url)}" data-id="${escapeHtml(product.id)}">
      <img
        class="product-image"
        src="${escapeHtml(product.image)}"
        alt=""
        onerror="this.style.display='none'"
      >
      <div class="product-info">
        <span class="product-title">${escapeHtml(product.title)}</span>
        <div class="product-meta">
          ${product.price ? `<span class="product-price">${escapeHtml(product.price)}</span>` : ''}
          <span class="product-site">${escapeHtml(product.site)}</span>
        </div>
      </div>
      <button class="product-delete" title="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `).join('');
}

async function loadTrackingState() {
  const settings = await sendMessage({ type: 'GET_SETTINGS' });
  const toggleBtn = document.getElementById('toggle-tracking');

  if (settings.trackingEnabled) {
    toggleBtn.classList.add('active');
  } else {
    toggleBtn.classList.remove('active');
  }
}

function setupEventListeners() {
  // Toggle tracking
  document.getElementById('toggle-tracking').addEventListener('click', async () => {
    const settings = await sendMessage({ type: 'GET_SETTINGS' });
    const newState = !settings.trackingEnabled;

    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { trackingEnabled: newState }
    });

    const toggleBtn = document.getElementById('toggle-tracking');
    if (newState) {
      toggleBtn.classList.add('active');
    } else {
      toggleBtn.classList.remove('active');
    }
  });

  // Open dashboard
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html') });
    window.close();
  });

  // Open settings (using dashboard with settings tab)
  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html#settings') });
    window.close();
  });

  // Product item clicks (delegated)
  document.getElementById('recent-products').addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.product-delete');
    const productItem = e.target.closest('.product-item');

    if (!productItem) return;

    if (deleteBtn) {
      e.stopPropagation();
      const productId = productItem.dataset.id;
      await sendMessage({ type: 'DELETE_PRODUCT', productId });
      await loadRecentProducts();
      await loadStats();
    } else {
      window.open(productItem.dataset.url, '_blank');
    }
  });
}

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
