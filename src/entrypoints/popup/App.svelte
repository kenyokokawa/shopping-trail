<script>
  import { sendMessage } from '@/utils/messaging.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';

  let products = $state([]);
  let trackingEnabled = $state(true);
  let productCount = $state(0);
  let storageUsed = $state('0 B');

  $effect(() => {
    loadData();
  });

  async function loadData() {
    const [recentProducts, usage, settings] = await Promise.all([
      sendMessage({ type: 'GET_RECENT_PRODUCTS', limit: 5 }),
      sendMessage({ type: 'GET_STORAGE_USAGE' }),
      sendMessage({ type: 'GET_SETTINGS' }),
    ]);

    products = recentProducts || [];
    productCount = usage.productCount || 0;
    storageUsed = usage.formattedSize || '0 B';
    trackingEnabled = settings.trackingEnabled;
  }

  async function handleTrackingChange(checked) {
    trackingEnabled = checked;
    await sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: { trackingEnabled: checked },
    });
  }

  function openDashboard() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('/dashboard.html'),
    });
    window.close();
  }

  function openSettings() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('/dashboard.html#settings'),
    });
    window.close();
  }

  async function deleteProduct(e, productId) {
    e.stopPropagation();
    await sendMessage({ type: 'DELETE_PRODUCT', productId });
    await loadData();
  }

  function openProduct(url) {
    window.open(url, '_blank');
  }

  function handleImageError(e) {
    e.target.style.display = 'none';
  }
</script>

<div class="popup-container">
  <header class="header">
    <h1>Product History</h1>
    <div class="tracking-toggle">
      <span class="tracking-label">Track history</span>
      <Switch checked={trackingEnabled} onCheckedChange={handleTrackingChange} />
    </div>
  </header>

  <section class="recent-section">
    <h2>Recent Products</h2>
    <div class="recent-products">
      {#if products.length === 0}
        <p class="empty-message">No products saved yet. Start shopping!</p>
      {:else}
        {#each products as product (product.id)}
          <div
            class="product-item"
            role="button"
            tabindex="0"
            onclick={() => openProduct(product.url)}
            onkeydown={(e) =>
              e.key === 'Enter' && openProduct(product.url)}
          >
            {#if product.image}
              <img
                class="product-image"
                src={product.image}
                alt=""
                onerror={handleImageError}
              />
            {/if}
            <div class="product-info">
              <span class="product-title">{product.title}</span>
              <div class="product-meta">
                {#if product.price}
                  <span class="product-price">{product.price}</span>
                {/if}
                <span class="product-site">{product.site}</span>
              </div>
            </div>
            <button
              class="product-delete"
              title="Delete"
              onclick={(e) => deleteProduct(e, product.id)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <div class="actions">
    <Button class="flex-1" onclick={openDashboard}>View All Products</Button>
    <Button variant="outline" class="flex-1" onclick={openSettings}>Settings</Button>
  </div>

  <div class="stats-footer">
    {productCount} products &middot; {storageUsed} used
  </div>
</div>

<style>
  :global(body) {
    width: 320px;
  }

  .popup-container {
    padding: 16px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .header h1 {
    font-size: 18px;
    font-weight: 600;
  }

  .tracking-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tracking-label {
    font-size: 12px;
    color: var(--muted-foreground);
  }

  .recent-section {
    margin-bottom: 16px;
  }

  .recent-section h2 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--muted-foreground);
  }

  .recent-products {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-message {
    color: var(--muted-foreground);
    text-align: center;
    padding: 20px;
    font-size: 13px;
  }

  .product-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: var(--card);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    text-decoration: none;
    color: inherit;
    position: relative;
  }

  .product-item:hover {
    background: var(--muted);
  }

  .product-delete {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: var(--muted);
    color: var(--muted-foreground);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s, background 0.2s, color 0.2s;
  }

  .product-item:hover .product-delete {
    opacity: 1;
  }

  .product-delete:hover {
    background: var(--destructive);
    color: white;
  }

  .product-image {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    object-fit: cover;
    background: var(--muted);
  }

  .product-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .product-title {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .product-meta {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: var(--muted-foreground);
  }

  .product-price {
    font-weight: 600;
    color: var(--primary);
  }

  .product-site {
    text-transform: capitalize;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .stats-footer {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 12px;
    color: var(--muted-foreground);
  }
</style>
