// eBay product extractor

export function canExtract(url) {
  return /ebay\.(com|co\.uk|de|fr|it|es|com\.au|ca|at|be|ch|ie|nl|ph|pl|com\.sg)/.test(url);
}

export function extract() {
  // Check if this is a product page
  if (!isProductPage()) {
    return null;
  }

  const title = getTitle();
  if (!title) return null;

  return {
    title: title,
    description: getDescription(),
    image: getImage(),
    price: getPrice(),
    currency: getCurrency(),
    url: window.location.href,
    site: 'ebay'
  };
}

function isProductPage() {
  // eBay product pages have /itm/ in the URL
  return /\/itm\//.test(window.location.pathname);
}

function getTitle() {
  const selectors = [
    'h1.x-item-title__mainTitle span',
    'h1[itemprop="name"]',
    '#itemTitle',
    '.x-item-title__mainTitle'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      let title = el.textContent.trim();
      // Remove "Details about" prefix if present
      title = title.replace(/^Details about\s+/i, '');
      return title;
    }
  }

  return null;
}

function getDescription() {
  // eBay descriptions are often in iframes, so we get the item specifics instead
  const specifics = document.querySelectorAll('.ux-labels-values__labels-content, .ux-labels-values__values-content');
  if (specifics.length > 0) {
    const pairs = [];
    for (let i = 0; i < specifics.length - 1; i += 2) {
      const label = specifics[i]?.textContent?.trim();
      const value = specifics[i + 1]?.textContent?.trim();
      if (label && value) {
        pairs.push(`${label}: ${value}`);
      }
    }
    if (pairs.length > 0) {
      return pairs.slice(0, 5).join(' | ');
    }
  }

  // Try subtitle
  const subtitle = document.querySelector('.x-item-title__subTitle span');
  if (subtitle?.textContent?.trim()) {
    return subtitle.textContent.trim();
  }

  return '';
}

function getImage() {
  const selectors = [
    '.ux-image-carousel-item.active img',
    '.ux-image-carousel-item img',
    '#icImg',
    'img[itemprop="image"]',
    '.img-container img',
    '.image-viewer-container img'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.src && !el.src.includes('placeholder')) {
      // Get larger image by modifying the URL
      let src = el.src;
      src = src.replace(/s-l\d+/, 's-l500');
      src = src.replace(/s-l64/, 's-l500');
      return src;
    }
  }

  return '';
}

function getPrice() {
  const selectors = [
    '.x-price-primary span[itemprop="price"]',
    '.x-price-primary .ux-textspans',
    '#prcIsum',
    '#mm-saleDscPrc',
    '.display-price',
    '[itemprop="price"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      let price = el.textContent.trim();
      // Clean up price
      price = price.replace(/\s+/g, ' ');
      return price;
    }
  }

  // Check for attribute
  const priceEl = document.querySelector('[itemprop="price"]');
  if (priceEl?.getAttribute('content')) {
    return priceEl.getAttribute('content');
  }

  return '';
}

function getCurrency() {
  // Try to get from itemprop
  const currencyEl = document.querySelector('[itemprop="priceCurrency"]');
  if (currencyEl?.getAttribute('content')) {
    return currencyEl.getAttribute('content');
  }

  // Detect from price
  const price = getPrice();
  const currencyMap = {
    '$': 'USD',
    '£': 'GBP',
    '€': 'EUR',
    'C $': 'CAD',
    'AU $': 'AUD'
  };

  for (const [symbol, code] of Object.entries(currencyMap)) {
    if (price.includes(symbol)) {
      return code;
    }
  }

  // Default based on domain
  const domain = window.location.hostname;
  if (domain.includes('.co.uk')) return 'GBP';
  if (domain.includes('.de') || domain.includes('.fr') || domain.includes('.it') || domain.includes('.es')) return 'EUR';
  if (domain.includes('.ca')) return 'CAD';
  if (domain.includes('.com.au')) return 'AUD';

  return 'USD';
}

export const site = 'ebay';
export const priority = 10;
