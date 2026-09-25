// src/services/api.js
// Couche de communication avec l'API Anouan Express

import axios from 'axios';

// Détection intelligente de l'environnement Capacitor / Mobile
const isCapacitor = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Capacitor?.isNativePlatform?.() || window.location.origin === 'http://localhost' || window.location.origin === 'capacitor://localhost');
};

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith('http')) return envUrl;
  if (isCapacitor()) {
    // En production mobile : pointer vers le backend Railway
    // En développement local : ADB reverse (localhost proxifié)
    const prodApi = import.meta.env.VITE_API_URL_MOBILE;
    if (prodApi) return prodApi;
    return 'http://localhost:5000/api'; // dev via adb reverse tcp:5000
  }
  return envUrl || '/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const getAssetUrl = (url) => {
  if (!url || url.startsWith('http') || url.startsWith('blob:')) return url;
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const hasSessionCookie = () => document.cookie.split(';').some((cookie) => cookie.trim().startsWith('accessToken='));

api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrfToken');
  if (csrfToken && !['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  const token = localStorage.getItem('accessToken');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Intercepteur de réponse : refresh token automatique ──────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const hasSessionHint = Boolean(localStorage.getItem('accessToken') || getCookie('csrfToken') || hasSessionCookie());
    if (error.response?.status === 401 && hasSessionHint && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
          headers: { 'X-CSRF-Token': getCookie('csrfToken') || '' },
        });
        // The refreshed access token is HttpOnly; stop sending the expired
        // local token so the retried request uses the refreshed cookie.
        localStorage.removeItem('accessToken');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helpers ──────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  loginPassword: (data) => api.post('/auth/login', data),
  sendOTP: (data) => api.post('/auth/otp/send', data),
  verifyOTP: (data) => api.post('/auth/otp/verify', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/password/forgot', data),
  resetPassword: (data) => api.post('/auth/password/reset', data),
};

export const usersAPI = {
  getMe: () => api.get('/users/me'),
  getAll: (params) => api.get('/users', { params }),
  updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  delete: (id) => api.delete(`/users/${id}`),
  updateMe: (data) => api.put('/users/me', data),
  updateAvatar: (formData) =>
    api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getVendorProducts: (params) => api.get('/products/vendor/me', { params }),
  getById: (id) => api.get(`/products/${id}`),
  search: (q, params) => api.get('/products/search', { params: { q, ...params } }),
  create: (formData) =>
    api.post('/products', formData, formData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  update: (id, formData) =>
    api.put(`/products/${id}`, formData, formData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const storesAPI = {
  getAll: (params) => api.get('/stores', { params }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  toggleActive: (id) => api.patch(`/stores/${id}/toggle`),
  delete: (id) => api.delete(`/stores/${id}`),
};

export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getVendorOrders: (params) => api.get('/orders/vendor', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  updateItemStatus: (orderId, itemId, data) =>
    api.put(`/orders/${orderId}/items/${itemId}/status`, typeof data === 'object' ? data : { status: data }),
  getInvoice: (id) =>
    api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
  getMyStats: () => api.get('/orders/my/stats'),
  setDelegate: (orderId, data) => api.patch(`/orders/${orderId}/delegate`, data),
  getAgentStats: () => api.get('/orders/agent/stats'),
};

export const paymentsAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  getStatus: (transactionId) => api.get(`/payments/status/${transactionId}`),
  poll: (orderId) => api.get(`/payments/poll/${orderId}`),
};

export const pickupAPI = {
  getCode: (orderId) => api.get(`/pickup/code/${orderId}`),
  receiveItems: (data) => api.post('/pickup/receive', data),
  validateCode: (data) => api.post('/pickup/validate', data),
  getPending: (params) => api.get('/pickup/pending', { params }),
  getStock: (params) => api.get('/pickup/stock', { params }),
  getTodayLog: (storeId) => api.get('/pickup/today', { params: { storeId } }),
};

export const reviewsAPI = {
  getProductReviews: (productId, params) =>
    api.get(`/reviews/product/${productId}`, { params }),
  getVendorReviews: (vendorId, params) =>
    api.get(`/reviews/vendor/${vendorId}`, { params }),
  submit: (data) => api.post('/reviews', data),
};

export const vendorsAPI = {
  getMyVendor: () => api.get('/vendors/me'),
  updateMyVendor: (data) => api.put('/vendors/me', data),
  getDashboard: () => api.get('/vendors/me/stats'),
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  updateStatus: (id, data) => api.put(`/vendors/${id}/validate`, data),
  updateCommission: (id, data) => api.put(`/vendors/${id}/commission`, data),
  register: (data) => api.post('/vendors/register', data),
};

export const financeAPI = {
  getVendorStats: (params) => api.get('/finance/vendor/stats', { params }),
  getVendorHistory: (params) => api.get('/finance/vendor/history', { params }),
  getVendorPayouts: (params) => api.get('/finance/vendor/payouts', { params }),
  getAdminStats: (params) => api.get('/finance/admin/stats', { params }),
  getAllPayouts: (params) => api.get('/finance/admin/payouts', { params }),
  exportOrders: (params) => api.get('/finance/admin/export/orders', { params, responseType: 'blob' }),
  exportInventory: (params) => api.get('/finance/admin/export/inventory', { params, responseType: 'blob' }),
  exportPayouts: (params) => api.get('/finance/admin/export/payouts', { params, responseType: 'blob' }),
  exportVendorOrders: (params) => api.get('/finance/vendor/export/orders', { params, responseType: 'blob' }),
  exportVendorInventory: (params) => api.get('/finance/vendor/export/inventory', { params, responseType: 'blob' }),
  createPayout: (data) => api.post('/finance/admin/payouts', data),
  markPayoutPaid: (id, data) => api.put(`/finance/admin/payouts/${id}/paid`, data),
  rejectPayout: (id, data) => api.put(`/finance/admin/payouts/${id}/rejected`, data),
  requestPayout: (data) => api.post('/finance/vendor/payout', data),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getBanners: () => api.get('/admin/banners'),
  getPublicBanners: () => api.get('/admin/public/banners'),
  createBanner: (data) => api.post('/admin/banners', data),
  updateBanner: (id, data) => api.put(`/admin/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`),
  toggleBanner: (id) => api.patch(`/admin/banners/${id}/toggle`),
  getFlashSales: () => api.get('/admin/flash-sales'),
  getPublicFlashSales: () => api.get('/admin/public/flash-sales'),
  createFlashSale: (data) => api.post('/admin/flash-sales', data),
  createFlashSales: (data) => api.post('/admin/flash-sales/bulk', data),
  toggleFlashSale: (id) => api.patch(`/admin/flash-sales/${id}/toggle`),
  updateFlashSale: (id, data) => api.put(`/admin/flash-sales/${id}`, data),
  deleteFlashSale: (id) => api.delete(`/admin/flash-sales/${id}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, data) => api.put(`/admin/settings/${key}`, data),
  createAdmin: (data) => api.post('/admin/admins', data),
  createAgent: (data) => api.post('/admin/agents', data),
  assignAgentStore: (userId, storeId) => api.put(`/admin/agents/${userId}/store`, { storeId }),
  updateAgent: (userId, data) => api.put(`/admin/agents/${userId}`, data),
  getWeeklyReport: (params) => api.get('/admin/reports/weekly', { params }),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages'),
  getMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  send: (data) => api.post('/messages', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  markRead: (partnerId) => api.put(`/messages/${partnerId}/read`),
};

export const disputesAPI = {
  create: (data) => api.post('/disputes', data),
  getMyDisputes: () => api.get('/disputes/my'),
  getAll: (params) => api.get('/disputes', { params }),
  resolve: (id, data) => api.put(`/disputes/${id}/resolve`, data),
};

export default api;
