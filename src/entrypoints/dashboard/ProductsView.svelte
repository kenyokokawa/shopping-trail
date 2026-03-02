<script>
  import { sendMessage } from '@/utils/messaging.js';
  import { parsePrice } from '@/utils/formatters.js';
  import SearchBar from './SearchBar.svelte';
  import Filters from './Filters.svelte';
  import PriceRangeSlider from './PriceRangeSlider.svelte';
  import ProductCard from './ProductCard.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';

  let { allProducts = [], onDataChanged } = $props();

  let searchQuery = $state('');
  let siteFilter = $state('');
  let sortBy = $state('date-desc');
  let priceMin = $state(0);
  let priceMax = $state(1000);
  let selectedProducts = $state(new Set());
  let showDeleteSelectedDialog = $state(false);

  // Compute price range from all products
  let priceRange = $derived.by(() => {
    const prices = allProducts.map((p) => parsePrice(p.price)).filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 1000 };
    return {
      min: 0,
      max: Math.ceil(Math.max(...prices) / 10) * 10,
    };
  });

  // Reset price sliders when price range changes
  $effect(() => {
    priceMin = priceRange.min;
    priceMax = priceRange.max;
  });

  // Get unique sites
  let sites = $derived(
    [...new Set(allProducts.map((p) => p.site).filter(Boolean))]
  );

  // Filter + sort products
  let filteredProducts = $derived.by(() => {
    let result = allProducts.filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        product.title?.toLowerCase().includes(q) ||
        product.description?.toLowerCase().includes(q) ||
        product.site?.toLowerCase().includes(q);

      const matchesSite = !siteFilter || product.site === siteFilter;

      const productPrice = parsePrice(product.price);
      const priceFilterActive = priceMin > priceRange.min || priceMax < priceRange.max;
      const matchesPrice =
        !priceFilterActive ||
        (productPrice > 0 && productPrice >= priceMin && productPrice <= priceMax);

      return matchesSearch && matchesSite && matchesPrice;
    });

    result.sort((a, b) => {
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

    return result;
  });

  let productCountText = $derived(() => {
    const total = allProducts.length;
    const showing = filteredProducts.length;
    if (total === showing) {
      return `${total} product${total !== 1 ? 's' : ''}`;
    }
    return `${showing} of ${total} products`;
  });

  function handleSearch(value) {
    searchQuery = value;
  }

  function handleSiteChange(value) {
    siteFilter = value;
  }

  function handleSortChange(value) {
    sortBy = value;
  }

  function handlePriceChange(newMin, newMax) {
    priceMin = newMin;
    priceMax = newMax;
  }

  function handleSelect(productId, checked) {
    const next = new Set(selectedProducts);
    if (checked) {
      next.add(productId);
    } else {
      next.delete(productId);
    }
    selectedProducts = next;
  }

  async function handleDelete(productId) {
    await sendMessage({ type: 'DELETE_PRODUCT', productId });
    selectedProducts = new Set();
    await onDataChanged();
  }

  async function confirmDeleteSelected() {
    showDeleteSelectedDialog = false;
    await sendMessage({
      type: 'DELETE_PRODUCTS',
      productIds: Array.from(selectedProducts),
    });
    selectedProducts = new Set();
    await onDataChanged();
  }
</script>

<header class="content-header">
  <SearchBar value={searchQuery} oninput={handleSearch} />

  <Filters
    {sites}
    {siteFilter}
    bind:sortBy
    onSiteChange={handleSiteChange}
    onSortChange={handleSortChange}
  >
    <PriceRangeSlider
      min={priceRange.min}
      max={priceRange.max}
      valueMin={priceMin}
      valueMax={priceMax}
      onChange={handlePriceChange}
    />
  </Filters>

  <div class="header-actions">
    <span class="product-count">{productCountText()}</span>
    {#if selectedProducts.size > 0}
      <Button variant="destructive" onclick={() => showDeleteSelectedDialog = true}>
        Delete Selected ({selectedProducts.size})
      </Button>
    {/if}
  </div>
</header>

<div class="products-grid">
  {#if filteredProducts.length === 0}
    <div class="empty-state">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      <h3>No products found</h3>
      <p>
        Try adjusting your search or filters, or start shopping to save
        products!
      </p>
    </div>
  {:else}
    {#each filteredProducts as product, i (product.id)}
      <ProductCard
        {product}
        selected={selectedProducts.has(product.id)}
        onSelect={handleSelect}
        onDelete={handleDelete}
        style="animation-delay: {Math.min(i * 0.02, 0.16)}s"
      />
    {/each}
  {/if}
</div>

<Dialog.Root bind:open={showDeleteSelectedDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Selected Products</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete {selectedProducts.size} selected product{selectedProducts.size !== 1 ? 's' : ''}?
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showDeleteSelectedDialog = false}>Cancel</Button>
      <Button variant="destructive" onclick={confirmDeleteSelected}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  .content-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
  }

  .product-count {
    color: var(--muted-foreground);
    font-size: 0.85rem;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    color: var(--muted-foreground);
  }

  .empty-state :global(svg) {
    margin: 0 auto 16px;
    opacity: 0.4;
  }

  .empty-state h3 {
    font-size: 1.1rem;
    color: var(--muted-foreground);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .empty-state p {
    font-size: 0.9rem;
    max-width: 280px;
    margin: 0 auto;
  }

  @media (max-width: 900px) {
    .content-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .header-actions {
      margin-left: 0;
      justify-content: space-between;
    }

    .products-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
  }

  @media (max-width: 480px) {
    .products-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
