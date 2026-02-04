/**
 * API Helper utility for Next.js API routes
 * Provides fetch with timeout and error handling
 */

import { fetchWithTimeout } from './fetch-with-timeout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Make a fetch request with timeout and error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}, timeout = DEFAULT_TIMEOUT) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    return await fetchWithTimeout(url, options, timeout);
  } catch (error) {
    // Log error details for debugging
    console.error('API fetch error:', {
      url,
      method: options.method || 'GET',
      error: error.message,
      code: error.code,
    });
    
    // Re-throw with better error message
    if (error.message.includes('timeout')) {
      throw new Error(`Request timeout: ไม่สามารถเชื่อมต่อ API ได้ภายใน ${timeout}ms`);
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Connection error: ไม่สามารถเชื่อมต่อ API ได้ (${error.code})`);
    }
    
    throw error;
  }
}

export { API_BASE_URL };

