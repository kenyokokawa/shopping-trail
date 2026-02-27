<script>
  let { value = '', oninput } = $props();
  let timeout;

  function handleInput(e) {
    const val = e.target.value;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      oninput(val);
    }, 300);
  }
</script>

<div class="search-box">
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
  <input
    type="text"
    placeholder="Search products..."
    {value}
    oninput={handleInput}
  />
</div>

<style>
  .search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    flex: 1;
    max-width: 320px;
    transition: all var(--transition-fast);
  }

  .search-box:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .search-box :global(svg) {
    color: var(--text-muted);
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }

  .search-box input {
    border: none;
    background: none;
    outline: none;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--text-primary);
    width: 100%;
  }

  .search-box input::placeholder {
    color: var(--text-muted);
  }

  @media (max-width: 900px) {
    .search-box {
      max-width: none;
    }
  }
</style>
