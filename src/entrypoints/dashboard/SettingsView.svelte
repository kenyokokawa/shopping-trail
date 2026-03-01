<script>
  import { sendMessage } from '@/utils/messaging.js';
  import { formatBytes } from '@/utils/formatters.js';
  import {
    productsToJson,
    productsToCsv,
    parseJsonImport,
    parseCsvImport,
    downloadFile,
    readFileAsText,
  } from '@/utils/exportImport.js';
  import { importProducts } from '@/utils/storage.js';

  let { storageInfo, onDataChanged } = $props();

  let retentionDays = $state(365);
  let trackingEnabled = $state(true);
  let debugMode = $state(false);

  $effect(() => {
    loadSettings();
  });

  async function loadSettings() {
    const settings = await sendMessage({ type: 'GET_SETTINGS' });
    retentionDays = settings.retentionDays;
    trackingEnabled = settings.trackingEnabled;
    debugMode = settings.debugMode ?? false;
  }

  async function handleRetentionChange(e) {
    retentionDays = parseInt(e.target.value);
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { retentionDays },
    });
  }

  async function handleTrackingChange(e) {
    trackingEnabled = e.target.checked;
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { trackingEnabled },
    });
  }

  async function handleDebugModeChange(e) {
    debugMode = e.target.checked;
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { debugMode },
    });
    await onDataChanged();
  }

  async function handleClearAll() {
    if (
      confirm(
        'Are you sure you want to delete ALL saved products? This cannot be undone.'
      )
    ) {
      await sendMessage({ type: 'CLEAR_ALL' });
      await onDataChanged();
    }
  }

  let fileInput;

  async function handleExportJson() {
    const products = await sendMessage({ type: 'GET_PRODUCTS' });
    if (!products || products.length === 0) {
      alert('No products to export.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(productsToJson(products), `product-history-${date}.json`, 'application/json');
  }

  async function handleExportCsv() {
    const products = await sendMessage({ type: 'GET_PRODUCTS' });
    if (!products || products.length === 0) {
      alert('No products to export.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(productsToCsv(products), `product-history-${date}.csv`, 'text/csv');
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-imported
    e.target.value = '';

    const text = await readFileAsText(file);
    const isJson = file.name.toLowerCase().endsWith('.json');
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (!isJson && !isCsv) {
      alert('Please select a .json or .csv file.');
      return;
    }

    const result = isJson ? parseJsonImport(text) : parseCsvImport(text);

    if (result.error) {
      alert(`Import failed: ${result.error}`);
      return;
    }

    const { products, warnings } = result;
    if (products.length === 0) {
      alert('No valid products found in the file.');
      return;
    }

    const n = products.length;
    if (!confirm(`Import ${n} ${n === 1 ? 'product' : 'products'}?`)) return;

    const importResult = await importProducts(products);

    const { added, skipped } = importResult;
    let msg = `Import complete! ${added} ${added === 1 ? 'product' : 'products'} added. ${skipped} ${skipped === 1 ? 'duplicate' : 'duplicates'} skipped.`;
    if (warnings.length > 0) {
      msg += `\n\n${warnings.length} ${warnings.length === 1 ? 'row' : 'rows'} skipped due to validation errors.`;
    }
    alert(msg);
    await onDataChanged();
  }
</script>

<header class="content-header">
  <h2>Settings</h2>
</header>

<div class="settings-content">
  <section class="settings-section">
    <h3>Storage</h3>

    <div class="setting-item">
      <div class="setting-info">
        <label for="retention-period">Auto-delete products older than</label>
        <p class="setting-description">
          Products older than this will be automatically removed
        </p>
      </div>
      <select id="retention-period" value={retentionDays} onchange={handleRetentionChange}>
        <option value={7}>1 week</option>
        <option value={30}>1 month</option>
        <option value={90}>3 months</option>
        <option value={180}>6 months</option>
        <option value={365}>1 year</option>
        <option value={0}>Never (keep forever)</option>
      </select>
    </div>

    <div class="setting-item storage-usage">
      <div class="setting-info">
        <span class="setting-label">Storage Usage</span>
        <p class="setting-description">
          {storageInfo.formattedSize} of {formatBytes(storageInfo.quota)} used
          ({storageInfo.productCount} products)
        </p>
      </div>
      <button class="btn btn-danger" onclick={handleClearAll}>
        Clear All Data
      </button>
    </div>
  </section>

  <section class="settings-section">
    <h3>Data Management</h3>

    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label">Export products</span>
        <p class="setting-description">
          Download your product history as a file
        </p>
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary" onclick={handleExportJson}>
          Export JSON
        </button>
        <button class="btn btn-secondary" onclick={handleExportCsv}>
          Export CSV
        </button>
      </div>
    </div>

    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label">Import products</span>
        <p class="setting-description">
          Restore products from a JSON or CSV file
        </p>
      </div>
      <button class="btn btn-secondary" onclick={() => fileInput.click()}>
        Import File
      </button>
      <input
        type="file"
        accept=".json,.csv"
        bind:this={fileInput}
        onchange={handleImportFile}
        style="display: none;"
      />
    </div>
  </section>

  <section class="settings-section">
    <h3>Tracking</h3>

    <div class="setting-item">
      <div class="setting-info">
        <label for="tracking-enabled">Enable product tracking</label>
        <p class="setting-description">
          Automatically save products as you browse
        </p>
      </div>
      <label class="switch">
        <input
          id="tracking-enabled"
          type="checkbox"
          checked={trackingEnabled}
          onchange={handleTrackingChange}
        />
        <span class="slider"></span>
      </label>
    </div>
  </section>

  <section class="settings-section">
    <h3>Developer</h3>

    <div class="setting-item">
      <div class="setting-info">
        <label for="debug-mode">Debug mode</label>
        <p class="setting-description">
          Show the Debug view in the sidebar and log detailed extraction and duplicate detection info to the console
        </p>
      </div>
      <label class="switch">
        <input
          id="debug-mode"
          type="checkbox"
          checked={debugMode}
          onchange={handleDebugModeChange}
        />
        <span class="slider"></span>
      </label>
    </div>
  </section>
</div>

<style>
  .content-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }

  .content-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .settings-content {
    max-width: 680px;
  }

  .settings-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 20px;
  }

  .settings-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);
    gap: 16px;
  }

  .setting-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .setting-item:first-child {
    padding-top: 0;
  }

  .setting-info {
    flex: 1;
  }

  .setting-info label,
  .setting-info .setting-label {
    font-weight: 500;
    display: block;
    margin-bottom: 4px;
    font-size: 0.9rem;
  }

  .setting-description {
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .setting-item select {
    padding: 10px 14px;
    padding-right: 32px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .btn {
    padding: 10px 18px;
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    border: none;
  }

  .btn-secondary {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--border-color);
  }

  .btn-group {
    display: flex;
    gap: 8px;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
  }

  /* Toggle Switch */
  .switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-elevated);
    transition: var(--transition-smooth);
    border-radius: 24px;
    border: 1px solid var(--border-color);
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: var(--text-muted);
    transition: var(--transition-smooth);
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: var(--accent);
    border-color: var(--accent);
  }

  input:checked + .slider:before {
    transform: translateX(20px);
    background-color: white;
  }
</style>
