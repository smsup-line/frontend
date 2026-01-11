const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * API utility functions for CRM Customer system
 */
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    // ถ้า endpoint เริ่มด้วย /api/ ใช้ relative path (Next.js API routes)
    // ถ้าไม่ใช่ ใช้ full URL (direct backend call)
    const isNextApiRoute = endpoint.startsWith('/api/');
    const url = isNextApiRoute 
      ? endpoint  // ใช้ relative path สำหรับ Next.js API routes
      : `${this.baseURL}${endpoint}`;  // ใช้ full URL สำหรับ direct backend calls
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };
    
    // Ensure Authorization header is present for authenticated requests
    if (!config.headers.Authorization && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log token status for debugging (always log for receipts)
    if (typeof window !== 'undefined' && endpoint.includes('/api/receipts')) {
      console.log('=== ApiClient: Receipts API Request ===');
      console.log('Endpoint:', endpoint);
      console.log('Auth token:', token ? 'present' : 'missing');
      if (token) {
        console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
        console.log('Token length:', token.length);
      } else {
        console.error('ERROR: Auth token is missing!');
      }
      console.log('Request config headers:', {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? config.headers.Authorization.substring(0, 30) + '...' : 'missing',
      });
    }

    try {
      const response = await fetch(url, config);
      
      // ถ้า response ไม่ ok
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = {};
        
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // ถ้า parse JSON ไม่ได้ ใช้ statusText
          const responseText = await response.text().catch(() => '');
          errorMessage = responseText || response.statusText || errorMessage;
        }
        
        // Log error details for debugging
        if (typeof window !== 'undefined' && endpoint.includes('/api/receipts')) {
          console.error('=== ApiClient: Receipts API Error ===');
          console.error('Status:', response.status);
          console.error('Status Text:', response.statusText);
          console.error('Error Message:', errorMessage);
          console.error('Error Data:', errorData);
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // ถ้า response เป็น empty ให้ return null
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null;
      }

      return await response.json();
    } catch (error) {
      // ถ้าเป็น network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('API request failed - Network error:', error);
        throw new Error('ไม่สามารถเชื่อมต่อ API ได้ กรุณาตรวจสอบว่า API server รันอยู่ที่ http://localhost:8080');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Store Management APIs (ใช้ /api/shops แทน /stores)
export const storeApi = {
  getAll: (params) => new ApiClient().get('/api/shops', params),
  getById: (id) => new ApiClient().get(`/api/shops/${id}`),
  create: (data) => new ApiClient().post('/api/shops', data),
  update: (id, data) => new ApiClient().put(`/api/shops/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/shops/${id}`),
};

// Branch Management APIs
export const branchApi = {
  getAll: (params) => new ApiClient().get('/api/branches', params),
  getById: (id) => new ApiClient().get(`/api/branches/${id}`),
  create: (data) => new ApiClient().post('/api/branches', data),
  update: (id, data) => new ApiClient().put(`/api/branches/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/branches/${id}`),
};

// Admin Management APIs
export const adminApi = {
  getAll: (params) => new ApiClient().get('/api/admins', params),
  getById: (id) => new ApiClient().get(`/api/admins/${id}`),
  create: (data) => new ApiClient().post('/api/admins', data),
  update: (id, data) => new ApiClient().put(`/api/admins/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/admins/${id}`),
};

// Employee Management APIs
export const employeeApi = {
  getById: (id) => new ApiClient().get(`/api/employees/${id}`),
  getByLineToken: (lineToken) => new ApiClient().get(`/api/employeetokenline?line_token=${encodeURIComponent(lineToken)}`),
};

// Customer Token Line API
export const customerTokenLineApi = {
  getByLineToken: (lineToken) => new ApiClient().get(`/api/customertokenline?line_token=${encodeURIComponent(lineToken)}`),
};

// Customer Management APIs
export const customerApi = {
  getAll: (params) => new ApiClient().get('/api/customers', params),
  getById: (id) => new ApiClient().get(`/api/customers/${id}`),
  create: (data) => new ApiClient().post('/api/customers', data),
  update: (id, data) => new ApiClient().put(`/api/customers/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/customers/${id}`),
  checkPhoneDuplicate: (phone, storeId, branchId) => 
    new ApiClient().get('/api/customers/check-phone', { phone, storeId, branchId }),
};

// Customer Phone API
export const customerPhoneApi = {
  update: (data) => new ApiClient().put('/api/customer-phone', data),
};

// Customer Points History APIs
// ใช้ /api/customers/{customerId}/points สำหรับ GET
// ใช้ /api/points สำหรับ POST (ต้องมี customer_id ใน body)
export const pointsApi = {
  // ดึงคะแนนสะสมของลูกค้า
  getByCustomerId: (customerId) => new ApiClient().get(`/api/customers/${customerId}/points`),
  // เพิ่มคะแนนสะสมให้ลูกค้า (ใช้ POST /points โดยต้องมี customer_id ใน body)
  addPoints: (customerId, data) => new ApiClient().post('/api/points', { ...data, customer_id: customerId }),
  // สำหรับดึงทั้งหมด (ถ้ามี endpoint นี้)
  getAll: (params) => new ApiClient().get('/api/customer-points', params),
  getById: (id) => new ApiClient().get(`/api/customer-points/${id}`),
  update: (id, data) => new ApiClient().put(`/api/customer-points/${id}`, data),
  // ลบประวัติคะแนนสะสม: DELETE /customers/:id/points/:points_id
  delete: (customerId, pointsId) => new ApiClient().delete(`/api/customers/${customerId}/points/${pointsId}`),
  // ดึงยอดรวมคะแนนสะสมและประวัติคะแนน: GET /customerpoint
  getCustomerPoints: (customerId) => {
    const params = customerId ? { customer_id: customerId } : {};
    return new ApiClient().get('/api/customerpoint', params);
  },
};

// Custom Fields APIs
export const customFieldsApi = {
  getAll: (params) => new ApiClient().get('/api/custom-fields', params),
  getById: (id) => new ApiClient().get(`/api/custom-fields/${id}`),
  create: (data) => new ApiClient().post('/api/custom-fields', data),
  update: (id, data) => new ApiClient().put(`/api/custom-fields/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/custom-fields/${id}`),
};

// SMS Templates APIs
export const smsTemplatesApi = {
  getAll: (params) => new ApiClient().get('/api/sms-templates', params),
  getById: (id) => new ApiClient().get(`/api/sms-templates/${id}`),
  create: (data) => new ApiClient().post('/api/sms-templates', data),
  update: (id, data) => new ApiClient().put(`/api/sms-templates/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/sms-templates/${id}`),
};

// Settings APIs
export const settingsApi = {
  getByShopId: (shopId) => new ApiClient().get(`/api/settings/${shopId}`),
  update: (shopId, data) => new ApiClient().put(`/api/settings/${shopId}`, data),
};

// Settings Center APIs
export const settingsCenterApi = {
  get: () => new ApiClient().get('/api/setting-center'),
  update: (data) => new ApiClient().put('/api/setting-center', data),
};

// Referrers APIs
export const referrersApi = {
  getAll: (params) => new ApiClient().get('/api/referrers', params),
  getById: (id) => new ApiClient().get(`/api/referrers/${id}`),
  create: (data) => new ApiClient().post('/api/referrers', data),
  update: (id, data) => new ApiClient().put(`/api/referrers/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/referrers/${id}`),
};

// Referral History APIs
export const referralHistoryApi = {
  getAll: (params) => new ApiClient().get('/api/referral-history', params),
  getById: (id) => new ApiClient().get(`/api/referral-history/${id}`),
  create: (data) => new ApiClient().post('/api/referral-history', data),
  update: (id, data) => new ApiClient().put(`/api/referral-history/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/referral-history/${id}`),
};

// Affiliate API
export const affiliateApi = {
  getByCustomerId: (customerId) => new ApiClient().get(`/api/affiliate/${customerId}`),
};

// Customer Custom Values APIs
export const customerCustomValuesApi = {
  getAll: (customerId) => new ApiClient().get(`/api/customers/${customerId}/custom-values`),
  createOrUpdate: (customerId, data) => new ApiClient().post(`/api/customers/${customerId}/custom-values`, data),
  update: (customerId, fieldId, data) => new ApiClient().put(`/api/customers/${customerId}/custom-values/${fieldId}`, data),
  delete: (customerId, fieldId) => new ApiClient().delete(`/api/customers/${customerId}/custom-values/${fieldId}`),
};

// Promotions APIs
export const promotionsApi = {
  getAll: (params) => new ApiClient().get('/api/promotions', params),
  getPublic: (params) => new ApiClient().get('/api/promotions/public', params),
  getById: (id) => new ApiClient().get(`/api/promotions/${id}`),
  create: (data) => new ApiClient().post('/api/promotions', data),
  update: (id, data) => new ApiClient().put(`/api/promotions/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/promotions/${id}`),
};

// Promotion History APIs
export const promotionHistoryApi = {
  getAll: (params) => new ApiClient().get('/api/promotion-history', params),
  getById: (id) => new ApiClient().get(`/api/promotion-history/${id}`),
  create: (data) => new ApiClient().post('/api/promotion-history', data),
  update: (id, data) => new ApiClient().put(`/api/promotion-history/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/promotion-history/${id}`),
};

// My Promotions API (for customers)
export const myPromotionsApi = {
  getAll: (params = {}) => {
    // Filter out undefined/null values
    const filteredParams = {};
    if (params.customer_id) filteredParams.customer_id = params.customer_id;
    if (params.shop_id) filteredParams.shop_id = params.shop_id;
    if (params.branch_id) filteredParams.branch_id = params.branch_id;
    return new ApiClient().get('/api/my-promotions', filteredParams);
  },
};

// Approve Promotion API
export const approvePromotionApi = {
  approve: (data) => new ApiClient().put('/api/approve-promotion', data),
};

// Customer Name API
export const customerNameApi = {
  get: (customerId) => new ApiClient().get('/api/customer-name', { customer_id: customerId }),
};

// Promotion Name API
export const promotionNameApi = {
  get: (promotionId) => new ApiClient().get('/api/promotion-name', { promotion_id: promotionId }),
};

// Auth APIs - ใช้ Next.js API routes เป็น proxy เพื่อหลีกเลี่ยง CORS
export const authApi = {
  login: (username, password, rememberMe = false) => 
    new ApiClient().post('/api/auth/login', { username, password, rememberMe }),
  lineLogin: (lineToken, name, avatarUrl, shopId, branchId) =>
    new ApiClient().post('/api/auth/line-login', { 
      line_token: lineToken, 
      name, 
      avatar_url: avatarUrl, 
      shop_id: shopId, 
      branch_id: branchId 
    }),
  logout: () => new ApiClient().post('/api/auth/logout'),
  getCurrentUser: () => new ApiClient().get('/api/auth/me'),
  getEmployeeById: (id) => employeeApi.getById(id),
};

// Menus APIs
export const menusApi = {
  getAll: (params) => new ApiClient().get('/api/menus', params),
  getById: (id) => new ApiClient().get(`/api/menus/${id}`),
  create: (data) => new ApiClient().post('/api/menus', data),
  update: (id, data) => new ApiClient().put(`/api/menus/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/menus/${id}`),
};

// Packages APIs
export const packagesApi = {
  getAll: (params) => new ApiClient().get('/api/packages', params),
  getById: (id) => new ApiClient().get(`/api/packages/${id}`),
  create: (data) => new ApiClient().post('/api/packages', data),
  update: (id, data) => new ApiClient().put(`/api/packages/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/packages/${id}`),
};

// Package Renewal History APIs
export const packageRenewalHistoryApi = {
  getAll: (params) => new ApiClient().get('/api/package-renewal-history', params),
  getById: (id) => new ApiClient().get(`/api/package-renewal-history/${id}`),
  create: (data) => new ApiClient().post('/api/package-renewal-history', data),
  update: (id, data) => new ApiClient().put(`/api/package-renewal-history/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/package-renewal-history/${id}`),
};

// Receipts APIs
export const receiptsApi = {
  getAll: () => new ApiClient().get('/api/receipts'), // For customer's own receipts
  getById: (id) => new ApiClient().get(`/api/receipts/${id}`),
  create: (data) => new ApiClient().post('/api/receipts', data),
  update: (id, data) => new ApiClient().put(`/api/receipts/${id}`, data),
  // Employee receipts - get receipts by shop_id and branch_id
  getEmployeeReceipts: (shopId, branchId = null) => {
    const params = new URLSearchParams({ shop_id: shopId });
    if (branchId) {
      params.append('branch_id', branchId);
    }
    return new ApiClient().get(`/api/employee-receipts?${params.toString()}`);
  },
};

export default new ApiClient();


};

// Promotions APIs
export const promotionsApi = {
  getAll: (params) => new ApiClient().get('/api/promotions', params),
  getPublic: (params) => new ApiClient().get('/api/promotions/public', params),
  getById: (id) => new ApiClient().get(`/api/promotions/${id}`),
  create: (data) => new ApiClient().post('/api/promotions', data),
  update: (id, data) => new ApiClient().put(`/api/promotions/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/promotions/${id}`),
};

// Promotion History APIs
export const promotionHistoryApi = {
  getAll: (params) => new ApiClient().get('/api/promotion-history', params),
  getById: (id) => new ApiClient().get(`/api/promotion-history/${id}`),
  create: (data) => new ApiClient().post('/api/promotion-history', data),
  update: (id, data) => new ApiClient().put(`/api/promotion-history/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/promotion-history/${id}`),
};

// My Promotions API (for customers)
export const myPromotionsApi = {
  getAll: (params = {}) => {
    // Filter out undefined/null values
    const filteredParams = {};
    if (params.customer_id) filteredParams.customer_id = params.customer_id;
    if (params.shop_id) filteredParams.shop_id = params.shop_id;
    if (params.branch_id) filteredParams.branch_id = params.branch_id;
    return new ApiClient().get('/api/my-promotions', filteredParams);
  },
};

// Approve Promotion API
export const approvePromotionApi = {
  approve: (data) => new ApiClient().put('/api/approve-promotion', data),
};

// Customer Name API
export const customerNameApi = {
  get: (customerId) => new ApiClient().get('/api/customer-name', { customer_id: customerId }),
};

// Promotion Name API
export const promotionNameApi = {
  get: (promotionId) => new ApiClient().get('/api/promotion-name', { promotion_id: promotionId }),
};

// Auth APIs - ใช้ Next.js API routes เป็น proxy เพื่อหลีกเลี่ยง CORS
export const authApi = {
  login: (username, password, rememberMe = false) => 
    new ApiClient().post('/api/auth/login', { username, password, rememberMe }),
  lineLogin: (lineToken, name, avatarUrl, shopId, branchId) =>
    new ApiClient().post('/api/auth/line-login', { 
      line_token: lineToken, 
      name, 
      avatar_url: avatarUrl, 
      shop_id: shopId, 
      branch_id: branchId 
    }),
  logout: () => new ApiClient().post('/api/auth/logout'),
  getCurrentUser: () => new ApiClient().get('/api/auth/me'),
  getEmployeeById: (id) => employeeApi.getById(id),
};

// Menus APIs
export const menusApi = {
  getAll: (params) => new ApiClient().get('/api/menus', params),
  getById: (id) => new ApiClient().get(`/api/menus/${id}`),
  create: (data) => new ApiClient().post('/api/menus', data),
  update: (id, data) => new ApiClient().put(`/api/menus/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/menus/${id}`),
};

// Packages APIs
export const packagesApi = {
  getAll: (params) => new ApiClient().get('/api/packages', params),
  getById: (id) => new ApiClient().get(`/api/packages/${id}`),
  create: (data) => new ApiClient().post('/api/packages', data),
  update: (id, data) => new ApiClient().put(`/api/packages/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/packages/${id}`),
};

// Package Renewal History APIs
export const packageRenewalHistoryApi = {
  getAll: (params) => new ApiClient().get('/api/package-renewal-history', params),
  getById: (id) => new ApiClient().get(`/api/package-renewal-history/${id}`),
  create: (data) => new ApiClient().post('/api/package-renewal-history', data),
  update: (id, data) => new ApiClient().put(`/api/package-renewal-history/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/package-renewal-history/${id}`),
};

// Receipts APIs
export const receiptsApi = {
  getAll: () => new ApiClient().get('/api/receipts'), // For customer's own receipts
  getById: (id) => new ApiClient().get(`/api/receipts/${id}`),
  create: (data) => new ApiClient().post('/api/receipts', data),
  update: (id, data) => new ApiClient().put(`/api/receipts/${id}`, data),
  // Employee receipts - get receipts by shop_id and branch_id
  getEmployeeReceipts: (shopId, branchId = null) => {
    const params = new URLSearchParams({ shop_id: shopId });
    if (branchId) {
      params.append('branch_id', branchId);
    }
    return new ApiClient().get(`/api/employee-receipts?${params.toString()}`);
  },
};

export default new ApiClient();


};

// Promotions APIs
export const promotionsApi = {
  getAll: (params) => new ApiClient().get('/api/promotions', params),
  getPublic: (params) => new ApiClient().get('/api/promotions/public', params),
  getById: (id) => new ApiClient().get(`/api/promotions/${id}`),
  create: (data) => new ApiClient().post('/api/promotions', data),
  update: (id, data) => new ApiClient().put(`/api/promotions/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/promotions/${id}`),
};

// Promotion History APIs
export const promotionHistoryApi = {
  getAll: (params) => new ApiClient().get('/api/promotion-history', params),
  getById: (id) => new ApiClient().get(`/api/promotion-history/${id}`),
  create: (data) => new ApiClient().post('/api/promotion-history', data),
  update: (id, data) => new ApiClient().put(`/api/promotion-history/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/promotion-history/${id}`),
};

// My Promotions API (for customers)
export const myPromotionsApi = {
  getAll: (params = {}) => {
    // Filter out undefined/null values
    const filteredParams = {};
    if (params.customer_id) filteredParams.customer_id = params.customer_id;
    if (params.shop_id) filteredParams.shop_id = params.shop_id;
    if (params.branch_id) filteredParams.branch_id = params.branch_id;
    return new ApiClient().get('/api/my-promotions', filteredParams);
  },
};

// Approve Promotion API
export const approvePromotionApi = {
  approve: (data) => new ApiClient().put('/api/approve-promotion', data),
};

// Customer Name API
export const customerNameApi = {
  get: (customerId) => new ApiClient().get('/api/customer-name', { customer_id: customerId }),
};

// Promotion Name API
export const promotionNameApi = {
  get: (promotionId) => new ApiClient().get('/api/promotion-name', { promotion_id: promotionId }),
};

// Auth APIs - ใช้ Next.js API routes เป็น proxy เพื่อหลีกเลี่ยง CORS
export const authApi = {
  login: (username, password, rememberMe = false) => 
    new ApiClient().post('/api/auth/login', { username, password, rememberMe }),
  lineLogin: (lineToken, name, avatarUrl, shopId, branchId) =>
    new ApiClient().post('/api/auth/line-login', { 
      line_token: lineToken, 
      name, 
      avatar_url: avatarUrl, 
      shop_id: shopId, 
      branch_id: branchId 
    }),
  logout: () => new ApiClient().post('/api/auth/logout'),
  getCurrentUser: () => new ApiClient().get('/api/auth/me'),
  getEmployeeById: (id) => employeeApi.getById(id),
};

// Menus APIs
export const menusApi = {
  getAll: (params) => new ApiClient().get('/api/menus', params),
  getById: (id) => new ApiClient().get(`/api/menus/${id}`),
  create: (data) => new ApiClient().post('/api/menus', data),
  update: (id, data) => new ApiClient().put(`/api/menus/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/menus/${id}`),
};

// Packages APIs
export const packagesApi = {
  getAll: (params) => new ApiClient().get('/api/packages', params),
  getById: (id) => new ApiClient().get(`/api/packages/${id}`),
  create: (data) => new ApiClient().post('/api/packages', data),
  update: (id, data) => new ApiClient().put(`/api/packages/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/packages/${id}`),
};

// Package Renewal History APIs
export const packageRenewalHistoryApi = {
  getAll: (params) => new ApiClient().get('/api/package-renewal-history', params),
  getById: (id) => new ApiClient().get(`/api/package-renewal-history/${id}`),
  create: (data) => new ApiClient().post('/api/package-renewal-history', data),
  update: (id, data) => new ApiClient().put(`/api/package-renewal-history/${id}`, data),
  delete: (id) => new ApiClient().delete(`/api/package-renewal-history/${id}`),
};

// Receipts APIs
export const receiptsApi = {
  getAll: () => new ApiClient().get('/api/receipts'), // For customer's own receipts
  getById: (id) => new ApiClient().get(`/api/receipts/${id}`),
  create: (data) => new ApiClient().post('/api/receipts', data),
  update: (id, data) => new ApiClient().put(`/api/receipts/${id}`, data),
  // Employee receipts - get receipts by shop_id and branch_id
  getEmployeeReceipts: (shopId, branchId = null) => {
    const params = new URLSearchParams({ shop_id: shopId });
    if (branchId) {
      params.append('branch_id', branchId);
    }
    return new ApiClient().get(`/api/employee-receipts?${params.toString()}`);
  },
};

export default new ApiClient();

