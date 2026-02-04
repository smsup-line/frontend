/**
 * Fetch with timeout utility
 * Prevents uncaught exceptions from connection timeouts
 */

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout/abort errors gracefully
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error(`Request timeout: ไม่สามารถเชื่อมต่อ API ได้ภายใน ${timeout}ms`);
    }
    
    // Handle connection errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Connection error: ไม่สามารถเชื่อมต่อ API ได้ (${error.code})`);
    }
    
    throw error;
  }
}

