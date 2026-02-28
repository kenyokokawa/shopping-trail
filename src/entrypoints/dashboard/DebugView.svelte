<script>
  import { Grid, html } from "gridjs";
  import "gridjs/dist/theme/mermaid.css";

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
      pagination: { limit: 25 },
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

  async function toggleDebugMode() {
    debugMode = !debugMode;
    const data = await chrome.storage.local.get("settings");
    const settings = data.settings || {};
    settings.debugMode = debugMode;
    await chrome.storage.local.set({ settings });
  }

  async function refresh() {
    await loadAllData();
  }
</script>

<header class="content-header">
  <h2>Debug</h2>
  <button class="btn btn-refresh" onclick={refresh}>Refresh</button>
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
      <label class="switch">
        <input
          id="debug-mode"
          type="checkbox"
          checked={debugMode}
          onchange={toggleDebugMode}
        />
        <span class="slider"></span>
      </label>
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

  .btn {
    padding: 4px 6px;
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid var(--border-color);
  }

  .btn-refresh {
    background: var(--bg-elevated);
    color: var(--text-secondary);
  }

  .btn-refresh:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .debug-content {
    max-width: 100%;
  }

  .debug-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-bottom: 20px;
  }

  .debug-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0 0;
    gap: 16px;
  }

  .setting-info {
    flex: 1;
  }

  .setting-info label {
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

  /* Toggle Switch (matches SettingsView) */
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
    content: "";
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

  /* Grid.js theme overrides to match extension styling */
  .grid-container :global(.gridjs-wrapper) {
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }

  .grid-container :global(.gridjs-table) {
    font-size: 0.72rem;
  }

  .grid-container :global(.gridjs-thead .gridjs-tr th) {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border-color: var(--border-color);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 6px 8px;
  }

  .grid-container :global(.gridjs-tbody .gridjs-tr td) {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--border-color);
    white-space: normal;
    word-break: break-all;
    padding: 4px 8px;
    line-height: 1.3;
  }

  .grid-container :global(.gridjs-tbody .gridjs-tr:hover td) {
    background: var(--bg-elevated);
  }

  .grid-container :global(.gridjs-search-input) {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-color: var(--border-color);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 0.75rem;
    padding: 6px 10px;
  }

  .grid-container :global(.gridjs-pages button.gridjs-currentPage) {
    background: var(--accent);
    color: white;
  }

  .grid-container :global(.gridjs-footer) {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-muted);
    padding: 6px 8px;
  }

  .grid-container :global(.gridjs-summary) {
    color: var(--text-muted);
    font-size: 0.7rem;
  }

  .grid-container :global(.gridjs-pages button) {
    padding: 4px 10px;
    font-size: 0.7rem;
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
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-elevated);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
  }

  .grid-container :global(.icon-btn:hover) {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
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
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-family: "SF Mono", "Consolas", "Monaco", monospace;
    font-size: 0.78rem;
    overflow-x: auto;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .empty-message {
    color: var(--text-muted);
    font-size: 0.85rem;
    padding-top: 8px;
  }
</style>
