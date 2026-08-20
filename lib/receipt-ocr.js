const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

function stripThaiMarks(value) {
  return String(value || '').replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '');
}

function convertThaiDigits(value) {
  return String(value || '').replace(/[๐-๙]/g, (digit) => String(THAI_DIGITS.indexOf(digit)));
}

export function normalizeKeyword(value) {
  return stripThaiMarks(convertThaiDigits(value))
    .toLowerCase()
    .replace(/[\s:：=\-_|.'"]/g, '');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordPattern(keyword) {
  const compact = normalizeKeyword(keyword);
  if (!compact) return null;
  return new RegExp(compact.split('').map(escapeRegExp).join('\\s*'), 'i');
}

function parseAmountToken(raw) {
  if (!raw) return null;
  let token = convertThaiDigits(String(raw)).replace(/[฿บาท\s]/g, '');
  token = token.replace(/[Oo]/g, '0').replace(/[Il]/g, '1');

  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(token)) {
    token = token.replace(/\./g, '').replace(',', '.');
  } else {
    token = token.replace(/,/g, '');
  }

  token = token.replace(/[^\d.]/g, '');
  const amount = parseFloat(token);
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 100000000) return null;
  return Math.round(amount * 100) / 100;
}

function extractAmounts(text) {
  const source = convertThaiDigits(text || '');
  const matches = source.match(/(?:฿|บาท)?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+[.,]\d{2}|\d{2,}/g) || [];
  const amounts = [];
  for (const match of matches) {
    const amount = parseAmountToken(match);
    if (amount != null) amounts.push(amount);
  }
  return amounts;
}

function pickBestAmount(amounts) {
  if (!amounts.length) return null;
  const withDecimals = amounts.filter((n) => !Number.isInteger(n));
  const pool = withDecimals.length ? withDecimals : amounts;
  return pool[pool.length - 1];
}

function findAmountForKeyword(lines, keyword) {
  const pattern = keywordPattern(keyword);
  if (!pattern) return null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = stripThaiMarks(convertThaiDigits(lines[i]));
    pattern.lastIndex = 0;
    const match = pattern.exec(line);
    if (!match) continue;

    const after = line.slice(match.index + match[0].length);
    const nextLines = [lines[i + 1], lines[i + 2]].filter(Boolean).join(' ');

    const amount =
      pickBestAmount(extractAmounts(after)) ||
      pickBestAmount(extractAmounts(nextLines)) ||
      pickBestAmount(extractAmounts(line));
    if (amount != null) return amount;
  }

  return null;
}

/**
 * Extract a receipt total using the shop's configured keyword
 * (settings.total_check_tax, e.g. TAX / VAT / รวมทั้งสิ้น).
 *
 * When a keyword is set, only that keyword is used so the captured
 * number matches the configured text.
 */
export function extractAmountFromReceipt(ocrText, keyword = '') {
  if (!ocrText) return null;

  const lines = String(ocrText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const configured = String(keyword || '').trim();
  if (configured) {
    return findAmountForKeyword(lines, configured);
  }

  const fallbacks = ['รวมทั้งสิ้น', 'grand total', 'ยอดรวม', 'รวมเงิน', 'รวมทั้งหมด', 'total', 'รวม'];
  for (const fallback of fallbacks) {
    const amount = findAmountForKeyword(lines, fallback);
    if (amount != null) return amount;
  }
  return null;
}
