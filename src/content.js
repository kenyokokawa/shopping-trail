// Content script - detects products on shopping pages
// This runs on all pages and attempts to extract product data

(function () {
  "use strict";

  // Debounce to avoid duplicate extractions
  let lastExtractedUrl = null;
  let extractionTimeout = null;

  // Initialize extraction on page load
  init();

  function init() {
    // Wait for page to be ready
    if (document.readyState === "complete") {
      scheduleExtraction();
    } else {
      window.addEventListener("load", scheduleExtraction);
    }

    // Handle SPA navigation
    observeUrlChanges();
  }

  function scheduleExtraction() {
    // Clear any pending extraction
    if (extractionTimeout) {
      clearTimeout(extractionTimeout);
    }

    // Wait a bit for dynamic content to load
    extractionTimeout = setTimeout(() => {
      attemptExtraction();
    }, 1500);
  }

  function observeUrlChanges() {
    let currentUrl = window.location.href;

    // Check for URL changes periodically (for SPAs)
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        lastExtractedUrl = null; // Reset for new page
        scheduleExtraction();
      }
    }, 1000);

    // Also observe history state changes
    const originalPushState = history.pushState;
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      lastExtractedUrl = null;
      scheduleExtraction();
    };

    window.addEventListener("popstate", () => {
      lastExtractedUrl = null;
      scheduleExtraction();
    });
  }

  function attemptExtraction() {
    const currentUrl = window.location.href;

    // Don't extract same page twice
    if (currentUrl === lastExtractedUrl) {
      return;
    }

    const product = extractProduct();

    if (product && product.title) {
      // Use page meta image as fallback if no product image or invalid image URL
      const hasValidImage =
        product.image &&
        (product.image.startsWith("http") || product.image.startsWith("//"));

      if (!hasValidImage) {
        product.image = getPageMetaImage() || "";
      }

      // Convert protocol-relative URLs to https
      if (product.image && product.image.startsWith("//")) {
        product.image = "https:" + product.image;
      }

      lastExtractedUrl = currentUrl;
      sendToBackground(product);
    }
  }

  function sendToBackground(product) {
    chrome.runtime
      .sendMessage({
        type: "SAVE_PRODUCT",
        product: product,
      })
      .catch((err) => {
        // Extension context invalidated, ignore
      });
  }

  // ============================================
  // EXTRACTORS (inlined for content script)
  // ============================================

  function extractProduct() {
    const url = window.location.href;

    // Try site-specific extractors first
    if (isAmazon(url)) {
      const product = extractAmazon();
      if (product) return product;
    }

    if (isEbay(url)) {
      const product = extractEbay();
      if (product) return product;
    }

    if (isWalmart(url)) {
      const product = extractWalmart();
      if (product) return product;
    }

    if (isTarget(url)) {
      const product = extractTarget();
      if (product) return product;
    }

    if (isBestBuy(url)) {
      const product = extractBestBuy();
      if (product) return product;
    }

    // Fall back to generic extraction
    return extractGeneric();
  }

  // --- Amazon ---
  function isAmazon(url) {
    return /amazon\.(com|co\.uk|ca|de|co\.jp|fr|es|it|com\.au|in|com\.br|com\.mx)/.test(
      url
    );
  }

  function extractAmazon() {
    if (!/\/(dp|gp\/product)\/[A-Z0-9]{10}/i.test(window.location.pathname)) {
      return null;
    }

    const title = getText("#productTitle") || getText("#title span");
    if (!title) return null;

    const bullets = document.querySelectorAll("#feature-bullets li span");
    let description = "";
    if (bullets.length > 0) {
      description = Array.from(bullets)
        .map((b) => b.textContent?.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(" | ");
    }

    const image =
      getImage("#landingImage") ||
      getImage("#imgBlkFront") ||
      getImage(".a-dynamic-image");
    const price =
      getText(".a-price .a-offscreen") ||
      getText("#priceblock_ourprice") ||
      getText("#corePrice_feature_div .a-offscreen");

    return {
      title,
      description,
      image: image ? image.replace(/\._[^.]+_\./, "._SL500_.") : "",
      price,
      currency: detectCurrency(price, "amazon"),
      url: window.location.href,
      site: "amazon",
    };
  }

  // --- eBay ---
  function isEbay(url) {
    return /ebay\.(com|co\.uk|de|fr|it|es|com\.au|ca)/.test(url);
  }

  function extractEbay() {
    if (!/\/itm\//.test(window.location.pathname)) {
      return null;
    }

    let title =
      getText("h1.x-item-title__mainTitle span") ||
      getText('h1[itemprop="name"]');
    if (!title) return null;
    title = title.replace(/^Details about\s+/i, "");

    const image =
      getImage(".ux-image-carousel-item.active img") ||
      getImage(".ux-image-carousel-item img");
    const price =
      getText('.x-price-primary span[itemprop="price"]') ||
      getText(".x-price-primary .ux-textspans");

    return {
      title,
      description: getText(".x-item-title__subTitle span") || "",
      image: image ? image.replace(/s-l\d+/, "s-l500") : "",
      price,
      currency: detectCurrency(price, "ebay"),
      url: window.location.href,
      site: "ebay",
    };
  }

  // --- Walmart ---
  function isWalmart(url) {
    return /walmart\.com/.test(url);
  }

  function extractWalmart() {
    if (!/\/ip\//.test(window.location.pathname)) {
      return null;
    }

    const title =
      getText('h1[itemprop="name"]') ||
      getText('[data-testid="product-title"]');
    if (!title) return null;

    const highlights = document.querySelectorAll(
      '[data-testid="product-highlights"] li'
    );
    let description = "";
    if (highlights.length > 0) {
      description = Array.from(highlights)
        .map((h) => h.textContent?.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(" | ");
    }

    const image =
      getImage('[data-testid="hero-image-container"] img') ||
      getImage(".hover-zoom-hero-image img");
    const priceEl = document.querySelector('[itemprop="price"]');
    let price = priceEl?.getAttribute("content");
    if (price) price = "$" + price;
    if (!price) price = getText('[data-testid="price-wrap"] span');

    return {
      title,
      description,
      image: image || "",
      price: price || "",
      currency: "USD",
      url: window.location.href,
      site: "walmart",
    };
  }

  // --- Target ---
  function isTarget(url) {
    return /target\.com/.test(url);
  }

  function extractTarget() {
    if (
      !/\/p\//.test(window.location.pathname) &&
      !/\/A-\d+/.test(window.location.pathname)
    ) {
      return null;
    }

    const title =
      getText('h1[data-test="product-title"]') ||
      getText('[data-test="product-title"]');
    if (!title) return null;

    const highlights = document.querySelectorAll(
      '[data-test="product-highlights"] li'
    );
    let description = "";
    if (highlights.length > 0) {
      description = Array.from(highlights)
        .map((h) => h.textContent?.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(" | ");
    }

    const image =
      getImage('[data-test="product-image"] img') ||
      getImage(".slideDeckPicture img");
    let price = getText('[data-test="product-price"]');
    if (price) {
      price = price.split("-")[0].trim();
    }

    return {
      title,
      description,
      image: image || "",
      price: price || "",
      currency: "USD",
      url: window.location.href,
      site: "target",
    };
  }

  // --- Best Buy ---
  function isBestBuy(url) {
    return /bestbuy\.(com|ca)/.test(url);
  }

  function extractBestBuy() {
    if (
      !/\/site\/.*\/\d+\.p/.test(window.location.pathname) &&
      !document.querySelector("[data-sku-id]")
    ) {
      return null;
    }

    const title = getText(".sku-title h1") || getText("h1.heading-5");
    if (!title) return null;

    const features = document.querySelectorAll(".feature-list li");
    let description = "";
    if (features.length > 0) {
      description = Array.from(features)
        .map((f) => f.textContent?.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(" | ");
    }

    const image =
      getImage(".primary-image img") ||
      getImage('[data-track="primary-image"] img');
    const price =
      getText('[data-testid="customer-price"] span') ||
      getText(".priceView-customer-price span");

    return {
      title,
      description,
      image: image || "",
      price: price || "",
      currency: window.location.hostname.includes(".ca") ? "CAD" : "USD",
      url: window.location.href,
      site: "bestbuy",
    };
  }

  // --- Generic (JSON-LD / Schema.org / Open Graph) ---
  function extractGeneric() {
    // Try JSON-LD
    const jsonLd = extractJsonLd();
    if (jsonLd) return jsonLd;

    // Try microdata
    const microdata = extractMicrodata();
    if (microdata) return microdata;

    // Try Open Graph
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

    if (typeof data !== "object" || data === null) return null;

    const type = data["@type"];
    if (
      type === "Product" ||
      (Array.isArray(type) && type.includes("Product"))
    ) {
      return data;
    }

    if (data["@graph"]) {
      return findProductInJsonLd(data["@graph"]);
    }

    return null;
  }

  function normalizeJsonLdProduct(data) {
    let price = "";
    let currency = "USD";

    if (data.offers) {
      const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
      price = offer.price || offer.lowPrice || "";
      currency = offer.priceCurrency || "USD";
    }

    let image = "";
    if (data.image) {
      if (typeof data.image === "string") image = data.image;
      else if (Array.isArray(data.image)) image = data.image[0];
      else if (data.image.url) image = data.image.url;
    }

    return {
      title: data.name || "",
      description: (data.description || "").substring(0, 300),
      image,
      price: price.toString(),
      currency,
      url: window.location.href,
      site: extractSiteName(),
    };
  }

  function extractMicrodata() {
    const productEl = document.querySelector(
      '[itemtype*="schema.org/Product"]'
    );
    if (!productEl) return null;

    const nameEl = productEl.querySelector('[itemprop="name"]');
    const name = nameEl?.textContent?.trim() || nameEl?.getAttribute("content");
    if (!name) return null;

    const descEl = productEl.querySelector('[itemprop="description"]');
    const priceEl = productEl.querySelector('[itemprop="price"]');
    const currencyEl = productEl.querySelector('[itemprop="priceCurrency"]');
    const imageEl = productEl.querySelector('[itemprop="image"]');

    return {
      title: name,
      description: (
        descEl?.textContent?.trim() ||
        descEl?.getAttribute("content") ||
        ""
      ).substring(0, 300),
      image: imageEl?.src || imageEl?.getAttribute("content") || "",
      price:
        priceEl?.textContent?.trim() || priceEl?.getAttribute("content") || "",
      currency:
        currencyEl?.textContent?.trim() ||
        currencyEl?.getAttribute("content") ||
        "USD",
      url: window.location.href,
      site: extractSiteName(),
    };
  }

  function extractOpenGraph() {
    const getMeta = (prop) => {
      const el = document.querySelector(
        `meta[property="${prop}"], meta[name="${prop}"]`
      );
      return el?.getAttribute("content");
    };

    const type = getMeta("og:type");
    const priceAmount =
      getMeta("product:price:amount") || getMeta("og:price:amount");

    // Only consider if it's a product type or has price
    if (type !== "product" && !priceAmount) {
      return null;
    }

    const title = getMeta("og:title") || document.title;
    if (!title) return null;

    return {
      title,
      description: (
        getMeta("og:description") ||
        getMeta("description") ||
        ""
      ).substring(0, 300),
      image: getMeta("og:image") || "",
      price: priceAmount || "",
      currency:
        getMeta("product:price:currency") ||
        getMeta("og:price:currency") ||
        "USD",
      url: window.location.href,
      site: extractSiteName(),
    };
  }

  // --- Helpers ---
  function getText(selector) {
    const el = document.querySelector(selector);
    return el?.textContent?.trim() || null;
  }

  function getImage(selector) {
    const el = document.querySelector(selector);
    return el?.src || null;
  }

  function getPageMetaImage() {
    // Try og:image first (there may be multiple, get all and pick the best)
    const ogImages = document.querySelectorAll('meta[property="og:image"]');
    for (const meta of ogImages) {
      const content = meta.getAttribute("content");
      if (content && content.startsWith("http")) {
        return content;
      }
    }

    // Try twitter:image
    const twitterImage = document
      .querySelector('meta[name="twitter:image"]')
      ?.getAttribute("content");
    if (twitterImage && twitterImage.startsWith("http")) {
      return twitterImage;
    }

    // Try link rel="image_src"
    const linkImage = document
      .querySelector('link[rel="image_src"]')
      ?.getAttribute("href");
    if (linkImage && linkImage.startsWith("http")) {
      return linkImage;
    }

    return null;
  }

  function extractSiteName() {
    const hostname = window.location.hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    return parts.length >= 2 ? parts[parts.length - 2] : hostname;
  }

  function detectCurrency(price, site) {
    if (!price) return "USD";

    const symbols = {
      "£": "GBP",
      "€": "EUR",
      "¥": "JPY",
      "₹": "INR",
      R$: "BRL",
    };

    for (const [symbol, code] of Object.entries(symbols)) {
      if (price.includes(symbol)) return code;
    }

    const domain = window.location.hostname;
    if (domain.includes(".co.uk")) return "GBP";
    if (
      domain.includes(".de") ||
      domain.includes(".fr") ||
      domain.includes(".es") ||
      domain.includes(".it")
    )
      return "EUR";
    if (domain.includes(".co.jp")) return "JPY";
    if (domain.includes(".ca")) return "CAD";
    if (domain.includes(".com.au")) return "AUD";
    if (domain.includes(".in")) return "INR";

    return "USD";
  }
})();
