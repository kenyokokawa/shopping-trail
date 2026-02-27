<script>
  import StorageBar from './StorageBar.svelte';

  let { currentView, storageInfo, onNavigate } = $props();
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <svg
      class="sidebar-logo"
      width="27"
      height="26"
      viewBox="0 0 27 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.00049 2.00098L3.20624 6.50098M3.20624 6.50098L6.2876 18.001H21.5005L24.5819 6.50098H3.20624Z"
        stroke="#0085FF"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8.00049 22.501C8.55277 22.501 9.00049 22.9487 9.00049 23.501C9.00049 24.0533 8.55277 24.501 8.00049 24.501C7.4482 24.501 7.00049 24.0533 7.00049 23.501C7.00049 22.9487 7.4482 22.501 8.00049 22.501Z"
        fill="#0085FF"
        stroke="#0085FF"
        stroke-width="3"
      />
      <path
        d="M20.0005 22.001C20.8289 22.001 21.5005 22.6725 21.5005 23.501C21.5005 24.3294 20.8289 25.001 20.0005 25.001C19.1721 25.001 18.5005 24.3294 18.5005 23.501C18.5005 22.6725 19.1721 22.001 20.0005 22.001Z"
        fill="#0085FF"
        stroke="#0085FF"
        stroke-width="2"
      />
    </svg>
    <h1>Product History</h1>
  </div>

  <nav class="sidebar-nav">
    <button
      class="nav-item"
      class:active={currentView === 'products'}
      onclick={() => onNavigate('products')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      Products
    </button>
    <button
      class="nav-item"
      class:active={currentView === 'settings'}
      onclick={() => onNavigate('settings')}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="3"></circle>
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        ></path>
      </svg>
      Settings
    </button>
  </nav>

  <div class="sidebar-footer">
    <StorageBar {storageInfo} />
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-width);
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
  }

  .sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sidebar-logo {
    width: 20px;
    height: 19px;
    flex-shrink: 0;
  }

  .sidebar-header h1 {
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .sidebar-nav {
    flex: 1;
    padding: 12px;
  }

  .nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: none;
    background: none;
    color: var(--text-secondary);
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .nav-item :global(svg) {
    opacity: 0.7;
  }

  .nav-item:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .nav-item:hover :global(svg) {
    opacity: 1;
  }

  .nav-item.active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .nav-item.active :global(svg) {
    opacity: 1;
    color: var(--accent);
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border-color);
  }

  @media (max-width: 900px) {
    .sidebar {
      width: 100%;
      height: auto;
      position: relative;
      border-right: none;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-header {
      padding: 16px 20px;
    }

    .sidebar-nav {
      display: flex;
      gap: 8px;
      padding: 12px;
    }

    .nav-item {
      flex: 1;
      justify-content: center;
      padding: 10px;
    }

    .sidebar-footer {
      display: none;
    }
  }
</style>
