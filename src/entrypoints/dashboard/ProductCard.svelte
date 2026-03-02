<script>
  import { formatDate, formatFullDate, formatPrice, getHostname } from '@/utils/formatters.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';

  let { product, selected = false, onSelect, onDelete } = $props();

  let showDeleteDialog = $state(false);

  function handleCheckbox(checked) {
    onSelect(product.id, checked);
  }

  function confirmDelete() {
    showDeleteDialog = false;
    onDelete(product.id);
  }

  function handleImageError(e) {
    e.target.style.display = 'none';
  }
</script>

<div class="product-card" class:selected>
  <div class="card-checkbox-wrapper">
    <Checkbox checked={selected} onCheckedChange={handleCheckbox} />
  </div>
  <div class="card-image-container">
    {#if product.image}
      <img
        class="card-image"
        src={product.image}
        alt={product.title}
        onerror={handleImageError}
      />
    {/if}
  </div>
  <div class="card-content">
    <Badge variant="secondary" class="mb-2 text-xs">{getHostname(product.url)}</Badge>
    <h3 class="card-title">
      <a href={product.url} target="_blank" title={product.title}>
        {product.title}
      </a>
    </h3>
    {#if product.description}
      <p class="card-description">{product.description}</p>
    {/if}
    <div class="card-footer">
      <div>
        {#if product.price}
          <span class="card-price">{formatPrice(product.price)}</span>
        {/if}
        <span class="card-date" title={formatFullDate(product.savedAt)}>
          {formatDate(product.savedAt)}
        </span>
      </div>
      <div class="flex gap-1.5">
        <Button size="sm" href={product.url} target="_blank">
          View
        </Button>
        <Button variant="outline" size="sm" onclick={() => showDeleteDialog = true}>
          Delete
        </Button>
      </div>
    </div>
  </div>
</div>

<Dialog.Root bind:open={showDeleteDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Product</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this product?
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => showDeleteDialog = false}>Cancel</Button>
      <Button variant="destructive" onclick={confirmDelete}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  .product-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: all 0.25s ease;
    position: relative;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.3s ease backwards;
  }

  .product-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .product-card.selected {
    border-color: var(--primary);
    box-shadow: 0 0 0 1px var(--primary);
  }

  .card-checkbox-wrapper {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .product-card:hover .card-checkbox-wrapper,
  .product-card.selected .card-checkbox-wrapper {
    opacity: 1;
  }

  .card-image-container {
    width: 100%;
    aspect-ratio: 1;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .card-image {
    max-width: 85%;
    max-height: 85%;
    object-fit: contain;
    transition: transform 0.25s ease;
  }

  .product-card:hover .card-image {
    transform: scale(1.02);
  }

  .card-content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .card-title {
    font-size: 0.9rem;
    font-weight: 500;
    line-height: 1.4;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-title a {
    color: var(--foreground);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .card-title a:hover {
    color: var(--primary);
  }

  .card-description {
    font-size: 0.8rem;
    color: var(--muted-foreground);
    line-height: 1.5;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
  }

  .card-price {
    font-size: 1rem;
    font-weight: 600;
    color: var(--foreground);
  }

  .card-date {
    font-size: 0.75rem;
    color: var(--muted-foreground);
    margin-left: 8px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    .card-image-container {
      aspect-ratio: 4/3;
    }
  }
</style>
