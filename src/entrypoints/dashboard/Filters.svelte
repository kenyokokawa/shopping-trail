<script>
  import { capitalize } from '@/utils/formatters.js';

  let { sites = [], siteFilter = '', sortBy = 'date-desc', onSiteChange, onSortChange, children } = $props();
</script>

<div class="filters">
  <select value={siteFilter} onchange={(e) => onSiteChange(e.target.value)}>
    <option value="">All Sites</option>
    {#each sites as site}
      <option value={site}>{capitalize(site)}</option>
    {/each}
  </select>

  {@render children()}

  <select value={sortBy} onchange={(e) => onSortChange(e.target.value)}>
    <option value="date-desc">Newest First</option>
    <option value="date-asc">Oldest First</option>
    <option value="price-desc">Price: High to Low</option>
    <option value="price-asc">Price: Low to High</option>
    <option value="name-asc">Name: A to Z</option>
    <option value="name-desc">Name: Z to A</option>
  </select>
</div>

<style>
  .filters {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .filters select {
    padding: 10px 14px;
    padding-right: 32px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .filters select:hover {
    border-color: var(--text-muted);
  }

  .filters select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  @media (max-width: 900px) {
    .filters {
      flex-wrap: wrap;
    }

    .filters select {
      flex: 1;
      min-width: 110px;
    }
  }
</style>
