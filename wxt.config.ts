import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Product History Tracker',
    version: '1.0.0',
    description:
      'Automatically saves products you view while shopping online. Browse your product history anytime.',
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
