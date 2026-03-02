import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  alias: {
    '$lib': 'src/lib',
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Product History Tracker',
    version: '1.0.0',
    description:
      'Automatically saves products you view while shopping online. Browse your product history anytime.',
    icons: {
      16: 'icon/16.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    permissions: ['storage', 'alarms'],
    host_permissions: [
      'https://*.amazon.com/*',
      'https://*.amazon.co.uk/*',
      'https://*.amazon.ca/*',
      'https://*.amazon.de/*',
      'https://*.amazon.co.jp/*',
      'https://*.ebay.com/*',
      'https://*.walmart.com/*',
      'https://*.target.com/*',
      'https://*.bestbuy.com/*',
      'https://*/*',
      'http://*/*',
    ],
  },
});
