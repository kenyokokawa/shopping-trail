// Content script - detects products on shopping pages

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document_idle',

  main(ctx) {
    let lastExtractedUrl = null;
    let extractionTimeout = null;

    // Initialize extraction on page load
    init();

    function init() {
      if (document.readyState === 'complete') {
        scheduleExtraction();
      } else {
        window.addEventListener('load', scheduleExtraction);
      }

      observeUrlChanges();
    }

    function scheduleExtraction() {
      if (extractionTimeout) {
        clearTimeout(extractionTimeout);
      }

      extractionTimeout = setTimeout(() => {
        attemptExtraction();
      }, 1500);
    }

    function observeUrlChanges() {
      let currentUrl = window.location.href;

      setInterval(() => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          lastExtractedUrl = null;
          scheduleExtraction();
        }
      }, 1000);

      const originalPushState = history.pushState;
      history.pushState = function () {
        originalPushState.apply(this, arguments);
        lastExtractedUrl = null;
        scheduleExtraction();
      };

      window.addEventListener('popstate', () => {
        lastExtractedUrl = null;
        scheduleExtraction();
      });
    }

    function attemptExtraction() {
      const currentUrl = window.location.href;

      if (currentUrl === lastExtractedUrl) {
        return;
      }

      const product = extractProduct();

      if (product && product.title) {
        const hasValidImage =
          product.image &&
          (product.image.startsWith('http') || product.image.startsWith('//'));

        if (!hasValidImage) {
          product.image = getPageMetaImage() || '';
        }

        if (product.image && product.image.startsWith('//')) {
          product.image = 'https:' + product.image;
        }

        lastExtractedUrl = currentUrl;
        sendToBackground(product);
      }
    }

    function sendToBackground(product) {
      chrome.runtime
        .sendMessage({
          type: 'SAVE_PRODUCT',
          product: product,
        })
        .catch((err) => {
          // Extension context invalidated, ignore
        });
    }

    // ============================================
    // EXTRACTORS (JSON-LD / Schema.org / Open Graph)
    // ============================================

    function extractProduct() {
      const jsonLd = extractJsonLd();
      if (jsonLd) return jsonLd;

      const microdata = extractMicrodata();
      if (microdata) return microdata;

      const og = extractOpenGraph();
      if (og) return og;

      return null;
    }

    function extractJsonLd() {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );

      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          const product = findProductInJsonLd(data);
          if (product) {
            return normalizeJsonLdProduct(product);
          }
        } catch (e) {
          // Invalid JSON
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

      if (typeof data !== 'object' || data === null) return null;

      const type = data['@type'];
      if (
        type === 'Product' ||
        (Array.isArray(type) && type.includes('Product'))
      ) {
        return data;
      }

      if (data['@graph']) {
        return findProductInJsonLd(data['@graph']);
      }

      return null;
    }

    function normalizeJsonLdProduct(data) {
      let price = '';
      let currency = 'USD';

      if (data.offers) {
        const offer = Array.isArray(data.offers)
          ? data.offers[0]
          : data.offers;
        price = offer.price || offer.lowPrice || '';
        currency = offer.priceCurrency || 'USD';
      }

      let image = '';
      if (data.image) {
        if (typeof data.image === 'string') {
          image = data.image;
        } else if (Array.isArray(data.image)) {
          const firstImage = data.image[0];
          if (typeof firstImage === 'string') {
            image = firstImage;
          } else if (firstImage && firstImage.url) {
            image = firstImage.url;
          } else if (firstImage && firstImage['@id']) {
            image = firstImage['@id'];
          }
        } else if (data.image.url) {
          image = data.image.url;
        } else if (data.image['@id']) {
          image = data.image['@id'];
        } else if (data.image.contentUrl) {
          image = data.image.contentUrl;
        }
      }

      return {
        title: data.name || '',
        description: (data.description || '').substring(0, 300),
        image,
        price: price.toString(),
        currency,
        url: window.location.href,
        site: extractSiteName(),
      };
    }

    function extractMicrodata() {
      const productEls = document.querySelectorAll(
        '[itemtype*="schema.org/Product"]'
      );
      if (productEls.length === 0) return null;

      let name = '';
      let description = '';
      let image = '';
      let price = '';
      let currency = 'USD';

      for (const productEl of productEls) {
        if (!name) {
          const nameEl = productEl.querySelector('[itemprop="name"]');
          name =
            nameEl?.textContent?.trim() ||
            nameEl?.getAttribute('content') ||
            '';
        }

        if (!description) {
          const descEl = productEl.querySelector('[itemprop="description"]');
          description =
            descEl?.textContent?.trim() ||
            descEl?.getAttribute('content') ||
            '';
        }

        if (!image) {
          const imageEl = productEl.querySelector('[itemprop="image"]');
          image =
            imageEl?.src ||
            imageEl?.getAttribute('content') ||
            imageEl?.getAttribute('href') ||
            '';
        }

        if (!price) {
          const priceEl = productEl.querySelector('[itemprop="price"]');
          price =
            priceEl?.textContent?.trim() ||
            priceEl?.getAttribute('content') ||
            '';
        }

        if (currency === 'USD') {
          const currencyEl = productEl.querySelector(
            '[itemprop="priceCurrency"]'
          );
          const foundCurrency =
            currencyEl?.textContent?.trim() ||
            currencyEl?.getAttribute('content');
          if (foundCurrency) currency = foundCurrency;
        }
      }

      if (!name) return null;

      return {
        title: name,
        description: description.substring(0, 300),
        image,
        price,
        currency,
        url: window.location.href,
        site: extractSiteName(),
      };
    }

    function extractOpenGraph() {
      const getMeta = (prop) => {
        const el = document.querySelector(
          `meta[property="${prop}"], meta[name="${prop}"]`
        );
        return el?.getAttribute('content');
      };

      const type = getMeta('og:type');
      const priceAmount =
        getMeta('product:price:amount') || getMeta('og:price:amount');

      if (type !== 'product' && !priceAmount) {
        return null;
      }

      const title = getMeta('og:title') || document.title;
      if (!title) return null;

      let image =
        getMeta('og:image:secure_url') || getMeta('og:image') || '';

      if (image.startsWith('//')) {
        image = 'https:' + image;
      }

      return {
        title,
        description: (
          getMeta('og:description') ||
          getMeta('description') ||
          ''
        ).substring(0, 300),
        image,
        price: priceAmount || '',
        currency:
          getMeta('product:price:currency') ||
          getMeta('og:price:currency') ||
          'USD',
        url: window.location.href,
        site: extractSiteName(),
      };
    }

    function getPageMetaImage() {
      const ogImages = document.querySelectorAll('meta[property="og:image"]');
      for (const meta of ogImages) {
        const content = meta.getAttribute('content');
        if (
          content &&
          (content.startsWith('http') || content.startsWith('//'))
        ) {
          return content.startsWith('//') ? 'https:' + content : content;
        }
      }

      const ogSecure = document
        .querySelector('meta[property="og:image:secure_url"]')
        ?.getAttribute('content');
      if (ogSecure && ogSecure.startsWith('http')) {
        return ogSecure;
      }

      const twitterImage = document
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute('content');
      if (
        twitterImage &&
        (twitterImage.startsWith('http') || twitterImage.startsWith('//'))
      ) {
        return twitterImage.startsWith('//')
          ? 'https:' + twitterImage
          : twitterImage;
      }

      const linkImage = document
        .querySelector('link[rel="image_src"]')
        ?.getAttribute('href');
      if (linkImage && linkImage.startsWith('http')) {
        return linkImage;
      }

      const productImageSelectors = [
        '[data-product-image] img',
        '.product-image img',
        '.product-photo img',
        '.product-gallery img',
        '.product__image img',
        '.product-single__photo img',
        '[class*="product"] img[src*="product"]',
        '[class*="gallery"] img',
        'main img[src*="cdn"]',
        'main img[src*="product"]',
      ];

      for (const selector of productImageSelectors) {
        const img = document.querySelector(selector);
        if (img) {
          const src =
            img.src ||
            img.getAttribute('data-src') ||
            img.getAttribute('data-lazy-src');
          if (src && (src.startsWith('http') || src.startsWith('//'))) {
            return src.startsWith('//') ? 'https:' + src : src;
          }
        }
      }

      const allImages = document.querySelectorAll(
        'img[src*="cdn"], img[src*="product"], img[src*="shop"]'
      );
      let bestImage = null;
      let bestSize = 0;

      for (const img of allImages) {
        const src = img.src || img.getAttribute('data-src');
        if (!src || (!src.startsWith('http') && !src.startsWith('//')))
          continue;

        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        const size = width * height;

        if (size > bestSize && size > 10000) {
          bestSize = size;
          bestImage = src;
        }
      }

      if (bestImage) {
        return bestImage.startsWith('//') ? 'https:' + bestImage : bestImage;
      }

      return null;
    }

    function extractSiteName() {
      const hostname = window.location.hostname.replace(/^www\./, '');
      const parts = hostname.split('.');
      return parts.length >= 2 ? parts[parts.length - 2] : hostname;
    }
  },
});
