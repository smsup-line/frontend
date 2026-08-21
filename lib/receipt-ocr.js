const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
const THAI_RANGE = /[\u0E00-\u0E7F]/;

function stripThaiMarks(value) {
  return String(value || '').replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '');
}

function convertThaiDigits(value) {
  return String(value || '').replace(/[๐-๙]/g, (digit) => String(THAI_DIGITS.indexOf(digit)));
}

function collapseDigitSpaces(value) {
  return String(value || '')
    .replace(/(\d)\s+(?=[\d.,])/g, '$1')
    .replace(/([.,])\s+(?=\d)/g, '$1')
    .replace(/(\d)\s+(?=บาท|฿)/g, '$1');
}

function collapseThaiSpaces(value) {
  return String(value || '').replace(/([\u0E00-\u0E7F])\s+(?=[\u0E00-\u0E7F\u0E31\u0E34-\u0E3A\u0E47-\u0E4E])/g, '$1');
}

export function normalizeKeyword(value) {
  return stripThaiMarks(convertThaiDigits(value))
    .toLowerCase()
    .replace(/[\s:：=\-_|.'"`~*#()[\]{}]/g, '');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordPattern(keyword) {
  const compact = normalizeKeyword(keyword);
  if (!compact) return null;
  return new RegExp(compact.split('').map(escapeRegExp).join('\\s*'), 'i');
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const next = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = next;
    }
  }
  return row[b.length];
}

function lineHasKeyword(line, keyword) {
  const compactLine = normalizeKeyword(line);
  const compactKey = normalizeKeyword(keyword);
  if (!compactKey || compactKey.length < 2) return false;
  if (compactLine.includes(compactKey)) return true;

  const pattern = keywordPattern(keyword);
  if (pattern && pattern.test(stripThaiMarks(convertThaiDigits(line)))) return true;

  if (compactKey.length >= 4 && compactLine.length >= 4) {
    const maxDist = compactKey.length >= 8 ? 2 : 1;
    for (let i = 0; i <= compactLine.length - compactKey.length + maxDist; i += 1) {
      const slice = compactLine.slice(i, i + compactKey.length);
      if (Math.abs(slice.length - compactKey.length) > maxDist) continue;
      if (levenshtein(slice, compactKey) <= maxDist) return true;
    }
  }
  return false;
}

function parseAmountToken(raw) {
  if (!raw) return null;
  let token = collapseDigitSpaces(convertThaiDigits(String(raw)));
  token = token.replace(/[Oo]/g, '0').replace(/[Il|]/g, '1').replace(/[Ss]/g, '5');
  token = token.replace(/[฿บาท]/g, '').replace(/[^\d.,]/g, '');
  if (!token) return null;

  const lastComma = token.lastIndexOf(',');
  const lastDot = token.lastIndexOf('.');
  const lastSep = Math.max(lastComma, lastDot);

  if (lastSep >= 0) {
    const decimals = token.slice(lastSep + 1).replace(/[.,]/g, '');
    const intPart = token.slice(0, lastSep).replace(/[.,]/g, '');
    if (!/^\d+$/.test(intPart) || !/^\d+$/.test(decimals)) return null;

    if (decimals.length <= 2) {
      const amount = parseFloat(`${intPart}.${decimals}`);
      if (Number.isFinite(amount) && amount > 0 && amount < 100000000) {
        return Math.round(amount * 100) / 100;
      }
      return null;
    }

    // 1.250 / 1,250 → thousands, no decimal
    if (decimals.length === 3 && intPart.length <= 4) {
      const amount = parseFloat(`${intPart}${decimals}`);
      if (Number.isFinite(amount) && amount > 0 && amount < 100000000) {
        return Math.round(amount * 100) / 100;
      }
    }
    return null;
  }

  if (!/^\d+$/.test(token)) return null;
  const amount = parseFloat(token);
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 100000000) return null;
  return Math.round(amount * 100) / 100;
}

function extractAmounts(text) {
  const source = collapseDigitSpaces(convertThaiDigits(text || ''));
  const matches =
    source.match(/(?:฿|บาท)?\s*\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{1,2})?|(?:฿|บาท)?\s*\d+[.,]\d{1,2}|(?:฿|บาท)?\s*\d{2,}/g) ||
    [];
  const amounts = [];
  for (const match of matches) {
    const amount = parseAmountToken(match);
    if (amount != null) amounts.push(amount);
  }
  return amounts;
}

function pickBestAmount(amounts) {
  if (!amounts.length) return null;
  return amounts[amounts.length - 1];
}

function joinBrokenOcrLines(lines) {
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const prev = out[out.length - 1];
    const isAmountOnly = /^[\d.,\s฿บาท๐-๙]+$/.test(trimmed);
    const isTinyThaiFragment = trimmed.length <= 3 && THAI_RANGE.test(trimmed);
    if (prev && (isAmountOnly || isTinyThaiFragment)) {
      out[out.length - 1] = `${prev} ${trimmed}`;
    } else {
      out.push(trimmed);
    }
  }
  return out;
}

function prepareLines(ocrText) {
  const raw = collapseThaiSpaces(collapseDigitSpaces(String(ocrText || '')));
  return joinBrokenOcrLines(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );
}

function findAmountForKeyword(lines, keyword) {
  const key = String(keyword || '').trim();
  if (!key) return null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!lineHasKeyword(line, key)) continue;

    const compactLine = collapseThaiSpaces(line);
    let after = compactLine;
    const pattern = keywordPattern(key);
    if (pattern) {
      pattern.lastIndex = 0;
      const match = pattern.exec(stripThaiMarks(convertThaiDigits(compactLine)));
      if (match) after = compactLine.slice(match.index + match[0].length);
    }

    const windowText = [after, lines[i + 1], lines[i + 2]].filter(Boolean).join(' ');
    const amount =
      pickBestAmount(extractAmounts(after)) ||
      pickBestAmount(extractAmounts(windowText)) ||
      pickBestAmount(extractAmounts(line));
    if (amount != null) return amount;
  }

  return null;
}

/**
 * Extract a receipt total using the shop's configured keyword
 * (settings.total_check_tax, e.g. TAX / รวมทั้งสิ้น / ยอดรวม).
 */
export function extractAmountFromReceipt(ocrText, keyword = '') {
  if (!ocrText) return null;

  const lines = prepareLines(ocrText);
  const configured = String(keyword || '').trim();
  if (configured) {
    const amount = findAmountForKeyword(lines, configured);
    if (amount != null) return amount;
  }

  const fallbacks = ['รวมทั้งสิ้น', 'ยอดรวมทั้งสิ้น', 'grand total', 'ยอดรวม', 'รวมเงิน', 'รวมทั้งหมด', 'net total', 'total', 'รวม'];
  for (const fallback of fallbacks) {
    if (configured && normalizeKeyword(fallback) === normalizeKeyword(configured)) continue;
    const amount = findAmountForKeyword(lines, fallback);
    if (amount != null) return amount;
  }
  return null;
}

async function loadImageElement(source) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  if (source && source.tagName === 'CANVAS') return source;

  const image = new Image();
  image.crossOrigin = 'anonymous';
  const url =
    typeof source === 'string'
      ? source
      : source instanceof Blob
        ? URL.createObjectURL(source)
        : null;
  if (!url) return null;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = url;
  });
  if (source instanceof Blob) URL.revokeObjectURL(url);
  return image;
}

export async function preprocessReceiptImage(source) {
  const image = await loadImageElement(source);
  if (!image || typeof document === 'undefined') return source;

  const minWidth = 1400;
  const scale = image.width > 0 && image.width < minWidth ? minWidth / image.width : 1.6;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.55 + 128));
    const binary = contrasted > 165 ? 255 : contrasted < 90 ? 0 : contrasted;
    data[i] = data[i + 1] = data[i + 2] = binary;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function recognizeReceiptText(source) {
  const { createWorker } = await import('tesseract.js');
  const preprocessed = await preprocessReceiptImage(source);
  const worker = await createWorker('tha+eng', 1);
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    const { data } = await worker.recognize(preprocessed);
    return data?.text || '';
  } finally {
    await worker.terminate();
  }
}

export async function readReceiptAmount(source, keyword = '') {
  const text = await recognizeReceiptText(source);
  return {
    text,
    amount: extractAmountFromReceipt(text, keyword),
  };
}
