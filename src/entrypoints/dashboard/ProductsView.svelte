<script>
  import { sendMessage } from '@/utils/messaging.js';
  import { parsePrice } from '@/utils/formatters.js';
  import SearchBar from './SearchBar.svelte';
  import Filters from './Filters.svelte';
  import PriceRangeSlider from './PriceRangeSlider.svelte';
  import ProductCard from './ProductCard.svelte';

  let { allProducts = [], onDataChanged } = $props();

  let searchQuery = $state('');
  let siteFilter = $state('');
  let sortBy = $state('date-desc');
  let priceMin = $state(0);
  let priceMax = $state(1000);
  let selectedProducts = $state(new Set());

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
      const matchesSearch =
        !searchQuery ||
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSite = !siteFilter || product.site === siteFilter;

      const productPrice = parsePrice(product.price);
      const matchesPrice =
        productPrice === 0 ||
        (productPrice >= priceMin && productPrice <= priceMax);

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

  async function handleDeleteSelected() {
    if (selectedProducts.size === 0) return;
    if (
      confirm(`Delete ${selectedProducts.size} selected product(s)?`)
    ) {
      await sendMessage({
        type: 'DELETE_PRODUCTS',
        productIds: Array.from(selectedProducts),
      });
      selectedProducts = new Set();
      await onDataChanged();
    }
  }
</script>

<header class="content-header">
  <SearchBar value={searchQuery} oninput={handleSearch} />

  <Filters
    {sites}
    {siteFilter}
    {sortBy}
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
      <button class="btn btn-danger" onclick={handleDeleteSelected}>
        Delete Selected ({selectedProducts.size})
      </button>
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
    color: var(--text-muted);
    font-size: 0.85rem;
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

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background: #c82333;
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
    color: var(--text-muted);
  }

  .empty-state :global(svg) {
    margin-bottom: 16px;
    opacity: 0.4;
  }

  .empty-state h3 {
    font-size: 1.1rem;
    color: var(--text-secondary);
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
