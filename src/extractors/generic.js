// Generic product extractor using schema.org/JSON-LD markup

export function canExtract(url) {
  // Generic extractor can try on any page
  return true;
}

export function extract() {
  // Try JSON-LD first
  const jsonLdProduct = extractFromJsonLd();
  if (jsonLdProduct) {
    return jsonLdProduct;
  }

  // Try microdata
  const microdataProduct = extractFromMicrodata();
  if (microdataProduct) {
    return microdataProduct;
  }

  // Try Open Graph tags
  const ogProduct = extractFromOpenGraph();
  if (ogProduct) {
    return ogProduct;
  }

  return null;
}

function extractFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const product = findProductInJsonLd(data);
      if (product) {
        return normalizeProduct(product, 'json-ld');
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  return null;
}

function findProductInJsonLd(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProductInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof data !== 'object' || data === null) {
    return null;
  }

  // Check if this is a product
  const type = data['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
    return data;
  }

  // Check @graph array
  if (data['@graph']) {
    return findProductInJsonLd(data['@graph']);
  }

  return null;
}

function extractFromMicrodata() {
  const productElement = document.querySelector('[itemtype*="schema.org/Product"]');
  if (!productElement) return null;

  const getName = () => {
    const el = productElement.querySelector('[itemprop="name"]');
    return el?.textContent?.trim() || el?.getAttribute('content');
  };

  const getDescription = () => {
    const el = productElement.querySelector('[itemprop="description"]');
    return el?.textContent?.trim() || el?.getAttribute('content');
  };

  const getImage = () => {
    const el = productElement.querySelector('[itemprop="image"]');
    return el?.src || el?.getAttribute('content') || el?.href;
  };

  const getPrice = () => {
    const priceEl = productElement.querySelector('[itemprop="price"]');
    const price = priceEl?.textContent?.trim() || priceEl?.getAttribute('content');
    const currencyEl = productElement.querySelector('[itemprop="priceCurrency"]');
    const currency = currencyEl?.textContent?.trim() || currencyEl?.getAttribute('content') || 'USD';
    return { price, currency };
  };

  const name = getName();
  if (!name) return null;

  const { price, currency } = getPrice();

  return {
    title: name,
    description: getDescription() || '',
    image: getImage() || '',
    price: price || '',
    currency: currency,
    url: window.location.href,
    site: extractSiteName(window.location.hostname)
  };
}

function extractFromOpenGraph() {
  const getMeta = (property) => {
    const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return el?.getAttribute('content');
  };

  const type = getMeta('og:type');
  const title = getMeta('og:title') || document.title;
  const description = getMeta('og:description') || getMeta('description');
  const image = getMeta('og:image');
  const priceAmount = getMeta('product:price:amount') || getMeta('og:price:amount');
  const priceCurrency = getMeta('product:price:currency') || getMeta('og:price:currency');

  // Only return if this looks like a product page
  if (type !== 'product' && !priceAmount) {
    return null;
  }

  if (!title) return null;

  return {
    title: title,
    description: description || '',
    image: image || '',
    price: priceAmount || '',
    currency: priceCurrency || 'USD',
    url: window.location.href,
    site: extractSiteName(window.location.hostname)
  };
}

function normalizeProduct(data, source) {
  const getPrice = () => {
    if (data.offers) {
      const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
      return {
        price: offer.price || offer.lowPrice || '',
        currency: offer.priceCurrency || 'USD'
      };
    }
    return { price: '', currency: 'USD' };
  };

  const getImage = () => {
    if (data.image) {
      if (typeof data.image === 'string') return data.image;
      if (Array.isArray(data.image)) return data.image[0];
      if (data.image.url) return data.image.url;
    }
    return '';
  };

  const { price, currency } = getPrice();

  return {
    title: data.name || '',
    description: data.description || '',
    image: getImage(),
    price: price,
    currency: currency,
    url: window.location.href,
    site: extractSiteName(window.location.hostname)
  };
}

function extractSiteName(hostname) {
  // Remove www. and get the main domain
  const cleaned = hostname.replace(/^www\./, '');
  const parts = cleaned.split('.');
  // Return the main part (e.g., "amazon" from "amazon.com")
  return parts.length >= 2 ? parts[parts.length - 2] : cleaned;
}

export const site = 'generic';
export const priority = 0; // Lowest priority, used as fallback
