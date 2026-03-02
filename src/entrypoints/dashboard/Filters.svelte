<script>
  import { capitalize } from '@/utils/formatters.js';
  import * as Select from '$lib/components/ui/select/index.js';

  let { sites = [], siteFilter = '', sortBy = $bindable('date-desc'), onSiteChange, onSortChange, children } = $props();

  const sortLabels = {
    'date-desc': 'Newest First',
    'date-asc': 'Oldest First',
    'price-desc': 'Price: High to Low',
    'price-asc': 'Price: Low to High',
    'name-asc': 'Name: A to Z',
    'name-desc': 'Name: Z to A',
  };

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

  <Select.Root type="single" bind:value={sortBy} onValueChange={onSortChange}>
    <Select.Trigger class="w-[170px]">
      <span data-slot="select-value">{sortLabels[sortBy] || 'Sort by'}</span>
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="date-desc" label="Newest First" />
      <Select.Item value="date-asc" label="Oldest First" />
      <Select.Item value="price-desc" label="Price: High to Low" />
      <Select.Item value="price-asc" label="Price: Low to High" />
      <Select.Item value="name-asc" label="Name: A to Z" />
      <Select.Item value="name-desc" label="Name: Z to A" />
    </Select.Content>
  </Select.Root>
</div>

<style>
  .filters {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .site-filter {
    position: relative;
  }

  .site-filter-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    background: var(--card);
    color: var(--foreground);
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .site-filter-button:hover {
    border-color: var(--muted-foreground);
  }

  .site-filter-button svg {
    color: var(--muted-foreground);
    flex-shrink: 0;
  }

  .site-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 200px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 100;
    overflow: hidden;
  }

  .site-search-input {
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: var(--background);
    color: var(--foreground);
    font-family: inherit;
    font-size: 0.85rem;
    outline: none;
    box-sizing: border-box;
  }

  .site-search-input::placeholder {
    color: var(--muted-foreground);
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
    color: var(--foreground);
    font-family: inherit;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .site-option:hover {
    background: var(--muted);
  }

  .site-option.active {
    color: var(--primary);
    font-weight: 600;
  }

  .site-option-empty {
    padding: 8px 12px;
    color: var(--muted-foreground);
    font-size: 0.85rem;
    font-style: italic;
  }

  @media (max-width: 900px) {
    .filters {
      flex-wrap: wrap;
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
