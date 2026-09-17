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
  const stored = localStorage.getItem('shop_id');
  return stored && String(stored).trim() ? String(stored).trim() : '';
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
