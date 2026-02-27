<script>
  import { sendMessage } from '@/utils/messaging.js';
  import Sidebar from './Sidebar.svelte';
  import ProductsView from './ProductsView.svelte';
  import SettingsView from './SettingsView.svelte';

  let currentView = $state('products');
  let allProducts = $state([]);
  let storageInfo = $state({
    bytesUsed: 0,
    formattedSize: '0 B',
    productCount: 0,
    quota: 10485760,
  });

  $effect(() => {
    loadData();
    handleHashNavigation();
  });

  async function loadData() {
    const [products, usage] = await Promise.all([
      sendMessage({ type: 'GET_PRODUCTS' }),
      sendMessage({ type: 'GET_STORAGE_USAGE' }),
    ]);
    allProducts = products || [];
    storageInfo = usage;
  }

  function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'settings') {
      currentView = 'settings';
    }
  }

  function switchView(viewName) {
    currentView = viewName;
    window.location.hash = viewName === 'products' ? '' : viewName;
  }

  async function onDataChanged() {
    await loadData();
  }
</script>

<div class="app">
  <Sidebar {currentView} {storageInfo} onNavigate={switchView} />

  <main class="main-content">
    {#if currentView === 'products'}
      <ProductsView {allProducts} {onDataChanged} />
    {:else if currentView === 'settings'}
      <SettingsView {storageInfo} {onDataChanged} />
    {/if}
  </main>
</div>

<style>
  .app {
    display: flex;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    min-height: 100vh;
    background: var(--bg-primary);
    padding: 28px 32px;
  }

  @media (max-width: 900px) {
    .app {
      flex-direction: column;
    }

    .main-content {
      margin-left: 0;
      padding: 20px;
    }
  }
</style>
