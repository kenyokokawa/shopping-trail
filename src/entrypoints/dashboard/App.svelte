<script>
  import { sendMessage } from '@/utils/messaging.js';
  import Sidebar from './Sidebar.svelte';
  import ProductsView from './ProductsView.svelte';
  import AnalyticsView from './AnalyticsView.svelte';
  import SettingsView from './SettingsView.svelte';

  let DebugView = $state(null);
  let currentView = $state('products');
  let allProducts = $state([]);
  let debugMode = $state(false);
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
    const [products, usage, settings] = await Promise.all([
      sendMessage({ type: 'GET_PRODUCTS' }),
      sendMessage({ type: 'GET_STORAGE_USAGE' }),
      sendMessage({ type: 'GET_SETTINGS' }),
    ]);
    allProducts = products || [];
    storageInfo = usage;
    debugMode = settings.debugMode ?? false;

    if (debugMode && !DebugView) {
      const m = await import('./DebugView.svelte');
      DebugView = m.default;
    }
  }

  function handleHashNavigation() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'settings') {
      currentView = 'settings';
    } else if (hash === 'analytics') {
      currentView = 'analytics';
    } else if (hash === 'debug') {
      currentView = 'debug';
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
  <Sidebar {currentView} {storageInfo} {debugMode} onNavigate={switchView} />

  <main class="main-content">
    {#if currentView === 'products'}
      <ProductsView {allProducts} {onDataChanged} />
    {:else if currentView === 'analytics'}
      <AnalyticsView {allProducts} />
    {:else if currentView === 'settings'}
      <SettingsView {storageInfo} {onDataChanged} />
    {:else if currentView === 'debug' && DebugView}
      {@const Debug = DebugView}
      <Debug />
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
