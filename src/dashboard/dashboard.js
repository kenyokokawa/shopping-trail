// Dashboard script for Product History Tracker

let allProducts = [];
let filteredProducts = [];
let selectedProducts = new Set();

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadProducts();
  await loadSettings();
  await loadStorageInfo();
  setupEventListeners();
  handleHashNavigation();
}

// Navigation
function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'settings') {
    switchView('settings');
  }
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`${viewName}-view`).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
}

// Products
async function loadProducts() {
  allProducts = await sendMessage({ type: 'GET_PRODUCTS' });
  filteredProducts = [...allProducts];
  await populateSiteFilter();
  renderProducts();
  updateProductCount();
}

function renderProducts() {
  const container = document.getElementById('products-grid');

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters, or start shopping to save products!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredProducts.map(product => `
    <div class="product-card ${selectedProducts.has(product.id) ? 'selected' : ''}" data-id="${product.id}">
      <input type="checkbox" class="card-checkbox" ${selectedProducts.has(product.id) ? 'checked' : ''}>
      <img
        class="card-image"
        src="${escapeHtml(product.image)}"
        alt="${escapeHtml(product.title)}"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%221%22><rect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/><circle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/><path d=%22M21 15l-5-5L5 21%22/></svg>'"
      >
      <div class="card-content">
        <span class="card-site">${escapeHtml(product.site)}</span>
        <h3 class="card-title">
          <a href="${escapeHtml(product.url)}" target="_blank" title="${escapeHtml(product.title)}">
            ${escapeHtml(product.title)}
          </a>
        </h3>
        ${product.description ? `<p class="card-description">${escapeHtml(product.description)}</p>` : ''}
        <div class="card-footer">
          <div>
            ${product.price ? `<span class="card-price">${escapeHtml(product.price)}</span>` : ''}
            <span class="card-date">${formatDate(product.savedAt)}</span>
          </div>
          <div class="card-actions">
            <a href="${escapeHtml(product.url)}" target="_blank" class="card-btn card-btn-link">View</a>
            <button class="card-btn card-btn-delete" data-delete="${product.id}">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function populateSiteFilter() {
  const sites = await sendMessage({ type: 'GET_UNIQUE_SITES' });
  const select = document.getElementById('site-filter');

  select.innerHTML = '<option value="">All Sites</option>' +
    sites.map(site => `<option value="${site}">${capitalize(site)}</option>`).join('');
}

function filterAndSortProducts() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const siteFilter = document.getElementById('site-filter').value;
  const sortBy = document.getElementById('sort-by').value;

  // Filter
  filteredProducts = allProducts.filter(product => {
    const matchesSearch = !searchQuery ||
      product.title?.toLowerCase().includes(searchQuery) ||
      product.description?.toLowerCase().includes(searchQuery);

    const matchesSite = !siteFilter || product.site === siteFilter;

    return matchesSearch && matchesSite;
  });

  // Sort
  filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return b.savedAt - a.savedAt;
      case 'date-asc':
        return a.savedAt - b.savedAt;
      case 'price-desc':
        return parsePrice(b.price) - parsePrice(a.price);
      case 'price-asc':
        return parsePrice(a.price) - parsePrice(b.price);
      case 'name-asc':
        return (a.title || '').localeCompare(b.title || '');
      case 'name-desc':
        return (b.title || '').localeCompare(a.title || '');
      default:
        return 0;
    }
  });

  renderProducts();
  updateProductCount();
}

function updateProductCount() {
  const countEl = document.getElementById('product-count');
  const total = allProducts.length;
  const showing = filteredProducts.length;

  if (total === showing) {
    countEl.textContent = `${total} product${total !== 1 ? 's' : ''}`;
  } else {
    countEl.textContent = `${showing} of ${total} products`;
  }
}

// Settings
async function loadSettings() {
  const settings = await sendMessage({ type: 'GET_SETTINGS' });

  // Retention period
  document.getElementById('retention-period').value = settings.retentionDays.toString();

  // Tracking enabled
  document.getElementById('tracking-enabled').checked = settings.trackingEnabled;

  // Site toggles
  const sitesContainer = document.getElementById('sites-toggles');
  const sites = [
    { key: 'amazon', label: 'Amazon' },
    { key: 'ebay', label: 'eBay' },
    { key: 'walmart', label: 'Walmart' },
    { key: 'target', label: 'Target' },
    { key: 'bestbuy', label: 'Best Buy' },
    { key: 'other', label: 'Other Sites' }
  ];

  sitesContainer.innerHTML = sites.map(site => `
    <div class="site-toggle">
      <label>${site.label}</label>
      <label class="switch">
        <input type="checkbox" data-site="${site.key}" ${settings.enabledSites?.[site.key] !== false ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>
  `).join('');
}

async function loadStorageInfo() {
  const usage = await sendMessage({ type: 'GET_STORAGE_USAGE' });

  // Sidebar
  const percent = Math.min((usage.bytesUsed / usage.quota) * 100, 100);
  document.getElementById('storage-fill').style.width = `${percent}%`;
  document.getElementById('storage-text').textContent = `${usage.formattedSize} used`;

  // Settings
  document.getElementById('settings-storage-used').textContent = usage.formattedSize;
  document.getElementById('settings-storage-quota').textContent = formatBytes(usage.quota);
  document.getElementById('settings-product-count').textContent = usage.productCount;
}

// Event Listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
      window.location.hash = view === 'products' ? '' : view;
    });
  });

  // Search and filters
  let searchTimeout;
  document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterAndSortProducts, 300);
  });

  document.getElementById('site-filter').addEventListener('change', filterAndSortProducts);
  document.getElementById('sort-by').addEventListener('change', filterAndSortProducts);

  // Product actions
  document.getElementById('products-grid').addEventListener('click', async (e) => {
    // Checkbox
    if (e.target.classList.contains('card-checkbox')) {
      const card = e.target.closest('.product-card');
      const id = card.dataset.id;

      if (e.target.checked) {
        selectedProducts.add(id);
        card.classList.add('selected');
      } else {
        selectedProducts.delete(id);
        card.classList.remove('selected');
      }

      updateDeleteSelectedButton();
      return;
    }

    // Delete button
    if (e.target.dataset.delete) {
      const id = e.target.dataset.delete;
      if (confirm('Delete this product?')) {
        await sendMessage({ type: 'DELETE_PRODUCT', productId: id });
        await loadProducts();
        await loadStorageInfo();
      }
    }
  });

  // Delete selected
  document.getElementById('delete-selected').addEventListener('click', async () => {
    if (selectedProducts.size === 0) return;

    if (confirm(`Delete ${selectedProducts.size} selected product(s)?`)) {
      await sendMessage({ type: 'DELETE_PRODUCTS', productIds: Array.from(selectedProducts) });
      selectedProducts.clear();
      await loadProducts();
      await loadStorageInfo();
      updateDeleteSelectedButton();
    }
  });

  // Settings
  document.getElementById('retention-period').addEventListener('change', async (e) => {
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { retentionDays: parseInt(e.target.value) }
    });
  });

  document.getElementById('tracking-enabled').addEventListener('change', async (e) => {
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { trackingEnabled: e.target.checked }
    });
  });

  document.getElementById('sites-toggles').addEventListener('change', async (e) => {
    if (e.target.dataset.site) {
      const settings = await sendMessage({ type: 'GET_SETTINGS' });
      const enabledSites = { ...settings.enabledSites };
      enabledSites[e.target.dataset.site] = e.target.checked;

      await sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { enabledSites }
      });
    }
  });

  document.getElementById('clear-all-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete ALL saved products? This cannot be undone.')) {
      await sendMessage({ type: 'CLEAR_ALL' });
      await loadProducts();
      await loadStorageInfo();
    }
  });
}

function updateDeleteSelectedButton() {
  const btn = document.getElementById('delete-selected');
  if (selectedProducts.size > 0) {
    btn.style.display = 'inline-block';
    btn.textContent = `Delete Selected (${selectedProducts.size})`;
  } else {
    btn.style.display = 'none';
  }
}

// Helpers
function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diff / 60000);
      return mins < 1 ? 'Just now' : `${mins}m ago`;
    }
    return `${hours}h ago`;
  }

  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Format as date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  // Remove currency symbols and parse
  const match = priceStr.match(/[\d,.]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, '')) || 0;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
