// Walmart product extractor

export function canExtract(url) {
  return /walmart\.com/.test(url);
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
    currency: 'USD',
    url: window.location.href,
    site: 'walmart'
  };
}

function isProductPage() {
  // Walmart product pages have /ip/ in the URL
  return /\/ip\//.test(window.location.pathname);
}

function getTitle() {
  const selectors = [
    'h1[itemprop="name"]',
    '#main-title',
    'h1.prod-ProductTitle',
    '[data-testid="product-title"]',
    'h1.lh-copy'
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
  // Try product highlights
  const highlights = document.querySelectorAll('[data-testid="product-highlights"] li');
  if (highlights.length > 0) {
    return Array.from(highlights)
      .map(h => h.textContent?.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(' | ');
  }

  // Try short description
  const selectors = [
    '[itemprop="description"]',
    '.about-desc',
    '[data-testid="product-description"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      const text = el.textContent.trim();
      return text.length > 300 ? text.substring(0, 300) + '...' : text;
    }
  }

  return '';
}

function getImage() {
  const selectors = [
    '[data-testid="hero-image-container"] img',
    '.hover-zoom-hero-image img',
    '.prod-hero-image img',
    'img[itemprop="image"]',
    '.carousel-container img'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.src && !el.src.includes('placeholder')) {
      // Get larger image
      let src = el.src;
      src = src.replace(/\?.*$/, ''); // Remove query params for cleaner URL
      return src;
    }
  }

  return '';
}

function getPrice() {
  const selectors = [
    '[itemprop="price"]',
    '[data-testid="price-wrap"] span',
    '.price-characteristic',
    '.prod-PriceHero .price-group',
    'span[data-automation="product-price"]'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const content = el?.getAttribute('content');
    if (content) {
      return '$' + content;
    }
    if (el?.textContent?.trim()) {
      const price = el.textContent.trim();
      // If it's just a number, add $
      if (/^\d/.test(price) && !price.includes('$')) {
        return '$' + price;
      }
      return price;
    }
  }

  // Try finding price parts (characteristic and mantissa)
  const characteristic = document.querySelector('.price-characteristic');
  const mantissa = document.querySelector('.price-mantissa');
  if (characteristic?.textContent) {
    const dollars = characteristic.textContent.trim();
    const cents = mantissa?.textContent?.trim() || '00';
    return `$${dollars}.${cents}`;
  }

  return '';
}

export const site = 'walmart';
export const priority = 10;
