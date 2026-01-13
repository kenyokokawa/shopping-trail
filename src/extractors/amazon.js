// Amazon product extractor

export function canExtract(url) {
  return /amazon\.(com|co\.uk|ca|de|co\.jp|fr|es|it|com\.au|in|com\.br|com\.mx|nl|sg|ae|sa|pl|se|com\.tr|eg)/.test(url);
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
    site: 'amazon'
  };
}

function isProductPage() {
  // Amazon product pages have /dp/ or /gp/product/ in the URL
  return /\/(dp|gp\/product)\/[A-Z0-9]{10}/i.test(window.location.pathname);
}

function getTitle() {
  // Try multiple selectors as Amazon's structure can vary
  const selectors = [
    '#productTitle',
    '#title span',
    'h1.a-size-large',
    '[data-feature-name="title"] span'
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
  // Try feature bullets first
  const bullets = document.querySelectorAll('#feature-bullets li span');
  if (bullets.length > 0) {
    return Array.from(bullets)
      .map(b => b.textContent?.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(' | ');
  }

  // Try product description
  const descEl = document.querySelector('#productDescription p, #productDescription');
  if (descEl?.textContent?.trim()) {
    const text = descEl.textContent.trim();
    return text.length > 300 ? text.substring(0, 300) + '...' : text;
  }

  return '';
}

function getImage() {
  const selectors = [
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    '.a-dynamic-image',
    '#imageBlock img'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.src && !el.src.includes('placeholder')) {
      // Get the largest image by modifying the URL
      return el.src.replace(/\._[^.]+_\./, '._SL500_.');
    }
  }

  // Try data-a-dynamic-image attribute
  const dynamicImg = document.querySelector('[data-a-dynamic-image]');
  if (dynamicImg) {
    try {
      const imgData = JSON.parse(dynamicImg.getAttribute('data-a-dynamic-image'));
      const urls = Object.keys(imgData);
      if (urls.length > 0) {
        return urls[0];
      }
    } catch (e) {
      // Invalid JSON
    }
  }

  return '';
}

function getPrice() {
  const selectors = [
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice',
    '.a-price-whole',
    '#corePrice_feature_div .a-offscreen',
    '#corePriceDisplay_desktop_feature_div .a-offscreen',
    'span[data-a-color="price"] .a-offscreen'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }

  return '';
}

function getCurrency() {
  // Try to detect currency from page
  const currencySymbols = {
    '$': 'USD',
    '£': 'GBP',
    '€': 'EUR',
    '¥': 'JPY',
    'C$': 'CAD',
    'A$': 'AUD',
    '₹': 'INR',
    'R$': 'BRL'
  };

  const price = getPrice();
  for (const [symbol, code] of Object.entries(currencySymbols)) {
    if (price.includes(symbol)) {
      return code;
    }
  }

  // Default based on domain
  const domain = window.location.hostname;
  if (domain.includes('.co.uk')) return 'GBP';
  if (domain.includes('.de') || domain.includes('.fr') || domain.includes('.es') || domain.includes('.it')) return 'EUR';
  if (domain.includes('.co.jp')) return 'JPY';
  if (domain.includes('.ca')) return 'CAD';
  if (domain.includes('.com.au')) return 'AUD';
  if (domain.includes('.in')) return 'INR';
  if (domain.includes('.com.br')) return 'BRL';

  return 'USD';
}

export const site = 'amazon';
export const priority = 10;
