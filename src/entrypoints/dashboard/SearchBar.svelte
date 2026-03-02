<script>
  import SearchIcon from '@lucide/svelte/icons/search';
  import { Input } from '$lib/components/ui/input/index.js';

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

<div class="relative flex-1 max-w-80 max-md:max-w-none">
  <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
  <Input
    type="text"
    placeholder="Search products..."
    {value}
    oninput={handleInput}
    class="pl-9"
  />
</div>
