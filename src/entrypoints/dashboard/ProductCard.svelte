<script>
  import { formatDate, formatFullDate, formatPrice, getHostname } from '@/utils/formatters.js';

  let { product, selected = false, onSelect, onDelete } = $props();

  function handleCheckbox(e) {
    onSelect(product.id, e.target.checked);
  }

  function handleDelete() {
    if (confirm('Delete this product?')) {
      onDelete(product.id);
    }
  }

  function handleImageError(e) {
    e.target.style.display = 'none';
  }
</script>

<div class="product-card" class:selected>
  <input
    type="checkbox"
    class="card-checkbox"
    checked={selected}
    onchange={handleCheckbox}
  />
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
    <span class="card-site">{getHostname(product.url)}</span>
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
      <div class="card-actions">
        <a href={product.url} target="_blank" class="card-btn card-btn-link">
          View
        </a>
        <button class="card-btn card-btn-delete" onclick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .product-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-smooth);
    position: relative;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.3s ease backwards;
  }

  .product-card:hover {
    box-shadow: var(--shadow-card-hover);
  }

  .product-card.selected {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  .card-checkbox {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    width: 20px;
    height: 20px;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--transition-fast);
    accent-color: var(--accent);
  }

  .product-card:hover .card-checkbox,
  .product-card.selected .card-checkbox {
    opacity: 1;
  }

  .card-image-container {
    width: 100%;
    aspect-ratio: 1;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .card-image {
    max-width: 85%;
    max-height: 85%;
    object-fit: contain;
    transition: transform var(--transition-smooth);
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

  .card-site {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 8px;
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
    color: var(--text-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .card-title a:hover {
    color: var(--accent);
  }

  .card-description {
    font-size: 0.8rem;
    color: var(--text-secondary);
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
    color: var(--text-primary);
  }

  .card-date {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-left: 8px;
  }

  .card-actions {
    display: flex;
    gap: 6px;
  }

  .card-btn {
    padding: 7px 12px;
    border: none;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .card-btn-link {
    background: var(--accent);
    color: white;
    text-decoration: none;
  }

  .card-btn-link:hover {
    background: var(--accent-hover);
  }

  .card-btn-delete {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .card-btn-delete:hover {
    background: #dc3545;
    border-color: #dc3545;
    color: white;
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
