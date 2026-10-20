const configCache = new Map();

export function isValidLiffId(id) {
  const s = (id || '').trim();
  if (!s || s.startsWith('@')) return false;
  return /^[0-9]{6,12}-[A-Za-z0-9_-]+$/.test(s);
}

export function getShopIdForLineLogin() {
  if (typeof window === 'undefined') return '';
  const fromUrl = new URLSearchParams(window.location.search).get('shop_id');
  if (fromUrl && String(fromUrl).trim()) return String(fromUrl).trim();
  const fromSession = sessionStorage.getItem('shop_id');
  if (fromSession && String(fromSession).trim()) return String(fromSession).trim();
  const fromCookie = readShopIdFromDocumentCookie();
  if (fromCookie) return fromCookie;
  const stored = localStorage.getItem('shop_id');
  return stored && String(stored).trim() ? String(stored).trim() : '';
}

function setMembrooCookie(name, value, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === 'undefined' || !value) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export function persistShopContextForLineLogin(shopId, branchId) {
  if (typeof window === 'undefined' || !shopId) return;
  const sid = String(shopId).trim();
  localStorage.setItem('shop_id', sid);
  sessionStorage.setItem('shop_id', sid);
  setMembrooCookie('membroo_shop_id', sid);
  if (branchId && String(branchId).trim()) {
    const bid = String(branchId).trim();
    localStorage.setItem('branch_id', bid);
    sessionStorage.setItem('branch_id', bid);
    setMembrooCookie('membroo_branch_id', bid);
  }
}

export function readShopIdFromDocumentCookie() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)membroo_shop_id=([^;]*)/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]).trim();
  } catch {
    return String(match[1]).trim();
  }
}

export function buildShopLoginPageUrl() {
  if (typeof window === 'undefined') return '';
  const shopId = getShopIdForLineLogin();
  if (!shopId) return '';
  const branchId =
    new URLSearchParams(window.location.search).get('branch_id') ||
    sessionStorage.getItem('branch_id') ||
    localStorage.getItem('branch_id') ||
    '';
  const url = new URL('/crm-customer/login', window.location.origin);
  url.searchParams.set('shop_id', shopId);
  if (branchId && String(branchId).trim()) {
    url.searchParams.set('branch_id', String(branchId).trim());
  }
  return url.toString();
}

export function clearShopLineLoginConfigCache(shopId) {
  if (shopId) configCache.delete(shopId);
  else configCache.clear();
}

export async function fetchShopLineLoginConfig(shopId) {
  if (!shopId) return null;
  if (configCache.has(shopId)) return configCache.get(shopId);

  const response = await fetch(`/api/shops/${encodeURIComponent(shopId)}/line-login-config`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) return null;
  const data = await response.json();
  configCache.set(shopId, data);
  return data;
}

/**
 * LIFF ID for customer login: per-shop setting first, then global env fallback.
 */
export async function resolveLiffIdForShop(shopId) {
  const fallback = (process.env.NEXT_PUBLIC_LIFF_ID || '').trim();
  if (!shopId) return isValidLiffId(fallback) ? fallback : '';

  const cfg = await fetchShopLineLoginConfig(shopId);
  if (cfg?.line_liff_invalid_config) {
    return { liffId: '', invalidConfig: true };
  }
  const shopLiff = (cfg?.line_liff_id || '').trim();
  if (isValidLiffId(shopLiff)) return { liffId: shopLiff, invalidConfig: false };
  if (isValidLiffId(fallback)) return { liffId: fallback, invalidConfig: false };
  return { liffId: '', invalidConfig: Boolean(shopLiff) };
}
