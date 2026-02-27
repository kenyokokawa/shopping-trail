// Shared formatting utilities extracted from dashboard.js

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diff / 60000);
      return mins < 1 ? 'Just now' : `${mins}m ago`;
    }
    return `${hours}h ago`;
  }

  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Format as date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatFullDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.match(/[\d,.]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, '')) || 0;
}

export function formatPrice(priceStr) {
  if (!priceStr) return '';

  const hasCurrency = /[$£€¥₹]/.test(priceStr);
  const match = priceStr.match(/[\d,.]+/);
  if (!match) return priceStr;

  let numericValue = parseFloat(match[0].replace(/,/g, ''));
  if (isNaN(numericValue)) return priceStr;

  let formatted;
  if (numericValue % 1 === 0) {
    formatted = numericValue.toFixed(0);
  } else {
    formatted = numericValue.toFixed(2).replace(/\.?0+$/, '');
  }

  if (!hasCurrency) {
    return '$' + formatted;
  }

  const currencyMatch = priceStr.match(/[$£€¥₹]/);
  const currency = currencyMatch ? currencyMatch[0] : '$';
  return currency + formatted;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getHostname(url) {
  if (!url) return '';
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
