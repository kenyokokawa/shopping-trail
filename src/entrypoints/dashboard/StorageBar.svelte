<script>
  let { storageInfo } = $props();

  let percent = $derived(
    Math.min((storageInfo.bytesUsed / storageInfo.quota) * 100, 100)
  );
</script>

<div class="text-center">
  <div class="h-1 rounded-sm overflow-hidden mb-2 bg-muted">
    <div class="h-full rounded-sm bg-primary transition-all duration-300 ease-out" style:width="{percent}%"></div>
  </div>
  <span class="text-xs text-muted-foreground">{storageInfo.formattedSize} used</span>
</div>
