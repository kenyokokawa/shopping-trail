// Best Buy product extractor

export function canExtract(url) {
  return /bestbuy\.(com|ca)/.test(url);
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
    site: 'bestbuy'
  };
}

function isProductPage() {
  // Best Buy product pages have /site/ followed by product name and SKU
  return /\/site\/.*\/\d+\.p/.test(window.location.pathname) ||
    document.querySelector('[data-sku-id]');
}

function getTitle() {
  const selectors = [
    '.sku-title h1',
    'h1.heading-5',
    '[data-track="product-title"]',
    '.shop-product-title h1'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }

  return null;
}

function getDescription() {
  // Try features list
  const features = document.querySelectorAll('.feature-list li, [data-track="product-features"] li');
  if (features.length > 0) {
    return Array.from(features)
      .map(f => f.textContent?.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(' | ');
  }

  // Try model info
  const modelInfo = document.querySelector('.model-info-value');
  if (modelInfo?.textContent?.trim()) {
    return 'Model: ' + modelInfo.textContent.trim();
  }

  return '';
}

function getImage() {
  const selectors = [
    '.primary-image img',
    '[data-track="primary-image"] img',
    '.picture-wrapper img',
    '.media-gallery-image img',
    '.shop-media-gallery img'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.src && !el.src.includes('placeholder')) {
      // Get larger image
      let src = el.src;
      src = src.replace(/;maxHeight=\d+;maxWidth=\d+/, ';maxHeight=640;maxWidth=640');
      return src;
    }
  }

  return '';
}

function getPrice() {
  const selectors = [
    '[data-testid="customer-price"] span',
    '.priceView-customer-price span',
    '.priceView-hero-price span',
    '[data-track="product-price"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      const price = el.textContent.trim();
      // Only return if it looks like a price
      if (price.includes('$') || /^\d/.test(price)) {
        return price;
      }
    }
  }

  return '';
}

function getCurrency() {
  const domain = window.location.hostname;
  if (domain.includes('.ca')) return 'CAD';
  return 'USD';
}

export const site = 'bestbuy';
export const priority = 10;
