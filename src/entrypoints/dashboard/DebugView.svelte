<script>
  import { Grid, html } from "gridjs";
  import "gridjs/dist/theme/mermaid.css";
  import { Switch } from '$lib/components/ui/switch/index.js';

  let debugMode = $state(false);
  let otherStorageKeys = $state([]);
  let productCount = $state(0);
  let tableContainer;
  let grid;

  $effect(() => {
    loadAllData();
    return () => {
      grid?.destroy();
    };
  });

  async function loadAllData() {
    const data = await chrome.storage.local.get(null);
    debugMode = data.settings?.debugMode || false;

    const products = data.products || [];
    productCount = products.length;
    otherStorageKeys = Object.entries(data).filter(
      ([key]) => key !== "products",
    );

    if (tableContainer) {
      if (grid) {
        grid.updateConfig({ data: products }).forceRender();
      } else {
        createGrid(products);
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const LINK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

  function copyableUrl(cell) {
    if (!cell) return "";
    const escaped = escapeHtml(cell);
    return html(
      `<div class="url-cell"><span class="url-text">${escaped}</span><div class="url-actions"><button class="icon-btn copy-btn" data-copy="${escaped}" title="Copy">${COPY_ICON}</button><a class="icon-btn link-btn" href="${escaped}" target="_blank" rel="noopener" title="Open">${LINK_ICON}</a></div></div>`,
    );
  }

  function setupCopyHandler() {
    if (!tableContainer) return;
    tableContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      const text = btn.dataset.copy;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = CHECK_ICON;
        setTimeout(() => {
          btn.innerHTML = COPY_ICON;
        }, 1000);
      });
    });
  }

  function createGrid(products) {
    grid = new Grid({
      columns: [
        { id: "id", name: "ID", width: "100px" },
        { id: "title", name: "Title", width: "150px" },
        {
          id: "url",
          name: "URL",
          width: "250px",
          formatter: (cell) => copyableUrl(cell),
        },
        { id: "site", name: "Site", width: "90px" },
        {
          id: "savedAt",
          name: "Saved At",
          width: "150px",
          formatter: (cell) => (cell ? new Date(cell).toLocaleString() : ""),
        },
        {
          id: "image",
          name: "Image Preview",
          width: "80px",
          formatter: (cell) =>
            cell
              ? html(
                  `<img src="${escapeHtml(cell)}" style="max-height:60px;max-width:60px;border-radius:4px;object-fit:cover;" />`,
                )
              : "",
        },
        {
          id: "image",
          name: "Image URL",
          width: "300px",
          formatter: (cell) => copyableUrl(cell),
        },
        { id: "price", name: "Price", width: "90px" },
        { id: "currency", name: "Currency", width: "80px" },
        {
          id: "description",
          name: "Description",
          width: "220px",
        },
      ],
      data: products,
      sort: true,
      search: true,
      pagination: { limit: 100 },
      fixedHeader: true,
      resizable: true,
      language: {
        search: { placeholder: "Filter products..." },
        pagination: {
          showing: "Showing",
          results: () => "products",
        },
      },
    });
    grid.render(tableContainer);
    setupCopyHandler();
  }

  async function handleDebugModeChange(checked) {
    debugMode = checked;
    const data = await chrome.storage.local.get("settings");
    const settings = data.settings || {};
    settings.debugMode = debugMode;
    await chrome.storage.local.set({ settings });
  }

</script>

<header class="content-header">
  <h2>Debug</h2>
</header>

<div class="debug-content">
  <section class="debug-section">
    <h3>Debug Logging</h3>
    <div class="setting-item">
      <div class="setting-info">
        <label for="debug-mode">Enable debug mode</label>
        <p class="setting-description">
          Log product extraction, duplicate detection, and message passing to
          the console
        </p>
      </div>
      <Switch checked={debugMode} onCheckedChange={handleDebugModeChange} />
    </div>
  </section>

  <section class="debug-section">
    <h3>Products ({productCount})</h3>
    <div class="grid-container" bind:this={tableContainer}></div>
  </section>

  <section class="debug-section">
    <h3>Other Storage Keys</h3>
    {#each otherStorageKeys as [key, value]}
      <div class="storage-key">
        <strong>{key}</strong>
        <pre class="json-view">{JSON.stringify(value, null, 2)}</pre>
      </div>
    {:else}
      <p class="empty-message">No other storage keys found</p>
    {/each}
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

  .debug-content {
    max-width: 100%;
    overflow: hidden;
  }

  .debug-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 20px;
  }

  .debug-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .grid-container {
    overflow-x: auto;
    margin-right: -24px;
    padding-right: 24px;
  }

  /* Grid.js theme overrides to match extension styling */
  .grid-container :global(.gridjs-wrapper) {
    border-radius: calc(var(--radius) - 2px);
    border: 1px solid var(--border);
  }

  .grid-container :global(.gridjs-table) {
    font-size: 0.72rem;
  }

  .grid-container :global(.gridjs-thead .gridjs-tr th) {
    background: var(--muted);
    color: var(--muted-foreground);
    border-color: var(--border);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 6px 8px;
  }

  .grid-container :global(.gridjs-tbody .gridjs-tr td) {
    background: var(--card);
    color: var(--foreground);
    border-color: var(--border);
    white-space: normal;
    word-break: break-all;
    padding: 4px 8px;
    line-height: 1.3;
  }

  .grid-container :global(.gridjs-tbody .gridjs-tr:hover td) {
    background: var(--muted);
  }

  .grid-container :global(.gridjs-search-input) {
    background: var(--muted);
    color: var(--foreground);
    border-color: var(--border);
    border-radius: calc(var(--radius) - 2px);
    font-family: inherit;
    font-size: 0.75rem;
    padding: 6px 10px;
  }

  .grid-container :global(.gridjs-footer) {
    background: var(--card);
    border-color: transparent;
    color: var(--muted-foreground);
    padding: 8px 12px;
    box-shadow: none;
  }

  .grid-container :global(.gridjs-summary) {
    color: var(--muted-foreground);
    font-size: 0.7rem;
  }

  .grid-container :global(.gridjs-pages) {
    display: flex;
    gap: 4px;
  }

  .grid-container :global(.gridjs-pages button) {
    padding: 4px 10px;
    font-size: 0.75rem;
    font-family: inherit;
    background: var(--muted);
    color: var(--foreground);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 4px);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .grid-container :global(.gridjs-pages button:hover) {
    background: var(--border);
  }

  .grid-container :global(.gridjs-pages button.gridjs-currentPage) {
    background: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--primary);
  }

  .grid-container :global(.gridjs-pages button:disabled) {
    opacity: 0.4;
    cursor: default;
  }

  .grid-container :global(.gridjs-pages button:disabled:hover) {
    background: var(--muted);
  }

  /* URL cells with action icons */
  .grid-container :global(.url-cell) {
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }

  .grid-container :global(.url-text) {
    font-family: "SF Mono", "Consolas", "Monaco", monospace;
    font-size: 0.68rem;
    line-height: 1.3;
    word-break: break-all;
    flex: 1;
    min-width: 0;
  }

  .grid-container :global(.url-actions) {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .grid-container :global(.icon-btn) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--muted);
    color: var(--muted-foreground);
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
  }

  .grid-container :global(.icon-btn:hover) {
    background: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--primary);
  }

  /* Other storage keys */
  .storage-key {
    margin-top: 12px;
  }

  .storage-key strong {
    font-size: 0.85rem;
    display: block;
    margin-bottom: 6px;
  }

  .json-view {
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    padding: 12px 16px;
    font-family: "SF Mono", "Consolas", "Monaco", monospace;
    font-size: 0.78rem;
    overflow-x: auto;
    color: var(--muted-foreground);
    line-height: 1.5;
    margin: 0;
  }

  .empty-message {
    color: var(--muted-foreground);
    font-size: 0.85rem;
    padding-top: 8px;
  }
</style>
