// Target product extractor

export function canExtract(url) {
  return /target\.com/.test(url);
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
    site: 'target'
  };
}

function isProductPage() {
  // Target product pages have /p/ in the URL
  return /\/p\//.test(window.location.pathname) ||
    /\/A-\d+/.test(window.location.pathname);
}

function getTitle() {
  const selectors = [
    'h1[data-test="product-title"]',
    '[data-test="product-title"]',
    'h1.Heading',
    '#pdp-product-title-id'
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
  // Try product highlights/features
  const highlights = document.querySelectorAll('[data-test="product-highlights"] li, [data-test="item-details-highlights"] li');
  if (highlights.length > 0) {
    return Array.from(highlights)
      .map(h => h.textContent?.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(' | ');
  }

  // Try description
  const selectors = [
    '[data-test="item-details-description"]',
    '[data-test="product-description"]'
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
    '[data-test="product-image"] img',
    '.slideDeckPicture img',
    'picture img[src*="target.scene7"]',
    '[data-test="image-gallery-item-0"] img'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.src && !el.src.includes('placeholder')) {
      return el.src;
    }
  }

  // Try srcset
  const picture = document.querySelector('[data-test="product-image"] picture source');
  if (picture?.srcset) {
    const srcset = picture.srcset;
    const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
    if (urls.length > 0) {
      return urls[urls.length - 1]; // Get the largest
    }
  }

  return '';
}

function getPrice() {
  const selectors = [
    '[data-test="product-price"]',
    '[data-test="current-price"]',
    '.h-text-lg span',
    '.styles__CurrentPriceFontSize'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      let price = el.textContent.trim();
      // Clean up price - get first price if range
      price = price.split('-')[0].trim();
      price = price.split('–')[0].trim();
      return price;
    }
  }

  return '';
}

export const site = 'target';
export const priority = 10;
