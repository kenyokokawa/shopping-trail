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
  import { Button } from '$lib/components/ui/button/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';

  let { storageInfo, onDataChanged } = $props();

  let retentionDays = $state(365);
  let retentionValue = $state('365');
  let trackingEnabled = $state(true);
  let debugMode = $state(false);

  // Dialog state
  let showClearDialog = $state(false);
  let showImportDialog = $state(false);
  let pendingImport = $state(null);

  $effect(() => {
    loadSettings();
  });

  async function loadSettings() {
    const settings = await sendMessage({ type: 'GET_SETTINGS' });
    retentionDays = settings.retentionDays;
    retentionValue = String(settings.retentionDays);
    trackingEnabled = settings.trackingEnabled;
    debugMode = settings.debugMode ?? false;
  }

  async function handleRetentionChange(value) {
    retentionDays = parseInt(value);
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { retentionDays },
    });
  }

  async function handleTrackingChange(checked) {
    trackingEnabled = checked;
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { trackingEnabled: checked },
    });
  }

  async function handleDebugModeChange(checked) {
    debugMode = checked;
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { debugMode: checked },
    });
    await onDataChanged();
  }

  async function confirmClearAll() {
    showClearDialog = false;
    await sendMessage({ type: 'CLEAR_ALL' });
    await onDataChanged();
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

    pendingImport = { products, warnings };
    showImportDialog = true;
  }

  async function confirmImport() {
    if (!pendingImport) return;
    showImportDialog = false;
    const { products, warnings } = pendingImport;

    const importResult = await importProducts(products);
    const { added, skipped } = importResult;
    let msg = `Import complete! ${added} ${added === 1 ? 'product' : 'products'} added. ${skipped} ${skipped === 1 ? 'duplicate' : 'duplicates'} skipped.`;
    if (warnings.length > 0) {
      msg += `\n\n${warnings.length} ${warnings.length === 1 ? 'row' : 'rows'} skipped due to validation errors.`;
    }
    alert(msg);
    pendingImport = null;
    await onDataChanged();
  }

  const retentionOptions = [
    { value: '7', label: '1 week' },
    { value: '30', label: '1 month' },
    { value: '90', label: '3 months' },
    { value: '180', label: '6 months' },
    { value: '365', label: '1 year' },
    { value: '0', label: 'Never (keep forever)' },
  ];
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
      <Select.Root type="single" bind:value={retentionValue} onValueChange={handleRetentionChange}>
        <Select.Trigger class="w-[160px]">
          <span data-slot="select-value">{retentionOptions.find(o => o.value === retentionValue)?.label || 'Select period'}</span>
        </Select.Trigger>
        <Select.Content>
          {#each retentionOptions as opt}
            <Select.Item value={opt.value} label={opt.label} />
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="setting-item storage-usage">
      <div class="setting-info">
        <span class="setting-label">Storage Usage</span>
        <p class="setting-description">
          {storageInfo.formattedSize} of {formatBytes(storageInfo.quota)} used
          ({storageInfo.productCount} products)
        </p>
      </div>
      <Button variant="destructive" onclick={() => showClearDialog = true}>
        Clear All Data
      </Button>
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
      <div class="flex gap-2">
        <Button variant="outline" onclick={handleExportJson}>
          Export JSON
        </Button>
        <Button variant="outline" onclick={handleExportCsv}>
          Export CSV
        </Button>
      </div>
    </div>

    <div class="setting-item">
      <div class="setting-info">
        <span class="setting-label">Import products</span>
        <p class="setting-description">
          Restore products from a JSON or CSV file
        </p>
      </div>
      <Button variant="outline" onclick={() => fileInput.click()}>
        Import File
      </Button>
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
      <Switch checked={trackingEnabled} onCheckedChange={handleTrackingChange} />
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
      <Switch checked={debugMode} onCheckedChange={handleDebugModeChange} />
    </div>
  </section>
</div>

<!-- Clear All Confirmation Dialog -->
<Dialog.Root bind:open={showClearDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Clear All Data</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete ALL saved products? This cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showClearDialog = false}>Cancel</Button>
      <Button variant="destructive" onclick={confirmClearAll}>Delete All</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Import Confirmation Dialog -->
<Dialog.Root bind:open={showImportDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Import Products</Dialog.Title>
      <Dialog.Description>
        {#if pendingImport}
          Import {pendingImport.products.length} {pendingImport.products.length === 1 ? 'product' : 'products'}?
        {/if}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => { showImportDialog = false; pendingImport = null; }}>Cancel</Button>
      <Button onclick={confirmImport}>Import</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

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
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 20px;
  }

  .settings-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 4px;
  }
</style>
