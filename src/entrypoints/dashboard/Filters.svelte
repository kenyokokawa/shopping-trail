<script>
  import { capitalize } from '@/utils/formatters.js';

  let { sites = [], siteFilter = '', sortBy = 'date-desc', onSiteChange, onSortChange, children } = $props();

  let siteSearchQuery = $state('');
  let siteDropdownOpen = $state(false);
  let inputEl = $state(null);
  let containerEl = $state(null);

  let filteredSites = $derived(
    siteSearchQuery
      ? sites.filter(s => s.toLowerCase().includes(siteSearchQuery.toLowerCase()))
      : sites
  );

  function toggleDropdown() {
    if (siteDropdownOpen) {
      closeDropdown();
    } else {
      siteDropdownOpen = true;
      siteSearchQuery = '';
      setTimeout(() => inputEl?.focus(), 0);
    }
  }

  function closeDropdown() {
    siteDropdownOpen = false;
    siteSearchQuery = '';
  }

  function selectSite(site) {
    onSiteChange(site);
    closeDropdown();
  }

  function handleInputKeydown(e) {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  }

  function handleFocusOut(e) {
    if (containerEl && !containerEl.contains(e.relatedTarget)) {
      closeDropdown();
    }
  }
</script>

<div class="filters">
  <div
    class="site-filter"
    bind:this={containerEl}
    onfocusout={handleFocusOut}
  >
    <button class="site-filter-button" onclick={toggleDropdown}>
      <span>{siteFilter ? capitalize(siteFilter) : 'All Sites'}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
    {#if siteDropdownOpen}
      <div class="site-dropdown">
        <input
          bind:this={inputEl}
          type="text"
          class="site-search-input"
          placeholder="Search sites..."
          bind:value={siteSearchQuery}
          onkeydown={handleInputKeydown}
        />
        <div class="site-options">
          <button
            class="site-option"
            class:active={!siteFilter}
            onmousedown={() => selectSite('')}
          >All Sites</button>
          {#each filteredSites as site}
            <button
              class="site-option"
              class:active={siteFilter === site}
              onmousedown={() => selectSite(site)}
            >{capitalize(site)}</button>
          {/each}
          {#if filteredSites.length === 0}
            <div class="site-option-empty">No sites found</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

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

  .site-filter {
    position: relative;
  }

  .site-filter-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .site-filter-button:hover {
    border-color: var(--text-muted);
  }

  .site-filter-button svg {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .site-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 200px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 100;
    overflow: hidden;
  }

  .site-search-input {
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.85rem;
    outline: none;
    box-sizing: border-box;
  }

  .site-search-input::placeholder {
    color: var(--text-muted);
  }

  .site-options {
    max-height: 220px;
    overflow-y: auto;
    padding: 4px 0;
  }

  .site-option {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .site-option:hover {
    background: var(--bg-elevated);
  }

  .site-option.active {
    color: var(--accent);
    font-weight: 600;
  }

  .site-option-empty {
    padding: 8px 12px;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-style: italic;
  }

  @media (max-width: 900px) {
    .filters {
      flex-wrap: wrap;
    }

    .filters select {
      flex: 1;
      min-width: 110px;
    }

    .site-filter {
      flex: 1;
      min-width: 110px;
    }

    .site-filter-button {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
