<script>
  let { storageInfo } = $props();

  let percent = $derived(
    Math.min((storageInfo.bytesUsed / storageInfo.quota) * 100, 100)
  );
</script>

<div class="storage-info">
  <div class="storage-bar">
    <div class="storage-fill" style:width="{percent}%"></div>
  </div>
  <span class="storage-text">{storageInfo.formattedSize} used</span>
</div>

<style>
  .storage-info {
    text-align: center;
  }

  .storage-bar {
    height: 4px;
    background: var(--bg-elevated);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .storage-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width var(--transition-smooth);
  }

  .storage-text {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>
