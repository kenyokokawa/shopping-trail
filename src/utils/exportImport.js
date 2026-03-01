// Export/Import utilities for Product History Tracker

const CSV_COLUMNS = ['id', 'title', 'url', 'image', 'description', 'price', 'site', 'savedAt'];

// --- Export ---

export function productsToJson(products) {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    count: products.length,
    products,
  }, null, 2);
}

export function productsToCsv(products) {
  const rows = [CSV_COLUMNS.join(',')];
  for (const p of products) {
    const row = CSV_COLUMNS.map(col => {
      let val = p[col] ?? '';
      if (col === 'savedAt' && typeof val === 'number') {
        val = new Date(val).toISOString();
      }
      return csvEscape(String(val));
    });
    rows.push(row.join(','));
  }
  return rows.join('\r\n');
}

function csvEscape(value) {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// --- Import ---

export function parseJsonImport(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'Invalid JSON file' };
  }

  if (Array.isArray(parsed)) {
    return validateProducts(parsed);
  }
  if (parsed && Array.isArray(parsed.products)) {
    return validateProducts(parsed.products);
  }
  return { error: 'JSON must contain a "products" array or be an array of products' };
}

export function parseCsvImport(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return { error: 'CSV file is empty or has no data rows' };
  }

  const header = rows[0].map(h => h.trim().toLowerCase());
  const products = [];
  const warnings = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue;

    const obj = {};
    for (let j = 0; j < header.length; j++) {
      const col = header[j];
      const val = (row[j] ?? '').trim();
      if (col === 'savedat' || col === 'savedAt') {
        obj.savedAt = parseSavedAt(val);
      } else {
        obj[col] = val;
      }
    }
    products.push(obj);
  }

  return validateProducts(products);
}

function parseSavedAt(val) {
  if (!val) return Date.now();
  // Try as millisecond timestamp
  const num = Number(val);
  if (!isNaN(num) && num > 1e12) return num;
  // Try as ISO 8601
  const date = new Date(val);
  if (!isNaN(date.getTime())) return date.getTime();
  return Date.now();
}

// RFC 4180 CSV parser
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
        if (i < text.length && text[i] === '\n') i++;
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Last field/row
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

// --- Validation ---

export function validateProducts(products) {
  const valid = [];
  const warnings = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p.id || !p.title || p.savedAt == null) {
      warnings.push(`Row ${i + 1}: missing required field (id, title, or savedAt) — skipped`);
      continue;
    }
    if (typeof p.savedAt === 'string') {
      p.savedAt = new Date(p.savedAt).getTime();
    }
    if (typeof p.savedAt !== 'number' || isNaN(p.savedAt)) {
      warnings.push(`Row ${i + 1}: invalid savedAt — skipped`);
      continue;
    }
    valid.push(p);
  }

  return { products: valid, warnings };
}

// --- File helpers ---

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
