// src/services/api.js
// Couche de communication avec l'API Anouan Express

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

// ─── Intercepteur de réponse : refresh token automatique ──────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        processQueue(null, true);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
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
  getById: (id) => api.get(`/products/${id}`),
  search: (q, params) => api.get('/products/search', { params: { q, ...params } }),
  create: (formData) =>
    api.post('/products', formData, formData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  update: (id, formData) =>
    api.put(`/products/${id}`, formData, formData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  delete: (id) => api.delete(`/products/${id}`),
};

export const storesAPI = {
  getAll: () => api.get('/stores'),
  getById: (id) => api.get(`/stores/${id}`),
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
};

export const paymentsAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  getStatus: (transactionId) => api.get(`/payments/status/${transactionId}`),
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
  submit: (data) => api.post('/reviews', data),
};

export const vendorsAPI = {
  getMyVendor: () => api.get('/vendors/me'),
  updateMyVendor: (data) => api.put('/vendors/me', data),
  getDashboard: () => api.get('/vendors/dashboard'),
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  updateStatus: (id, data) => api.patch(`/vendors/${id}/status`, data),
  updateCommission: (id, data) => api.patch(`/vendors/${id}/commission`, data),
  register: (data) => api.post('/vendors/register', data),
};

export const financeAPI = {
  getVendorStats: (params) => api.get('/finance/vendor/stats', { params }),
  getVendorHistory: (params) => api.get('/finance/vendor/history', { params }),
  getVendorPayouts: (params) => api.get('/finance/vendor/payouts', { params }),
  getAdminStats: (params) => api.get('/finance/admin/stats', { params }),
  getAllPayouts: (params) => api.get('/finance/admin/payouts', { params }),
  createPayout: (data) => api.post('/finance/admin/payouts', data),
  markPayoutPaid: (id, data) => api.put(`/finance/admin/payouts/${id}/paid`, data),
  requestPayout: (data) => api.post('/finance/vendor/payout', data),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getBanners: () => api.get('/admin/banners'),
  getPublicBanners: () => api.get('/admin/public/banners'),
  createBanner: (data) => api.post('/admin/banners', data),
  updateBanner: (id, data) => api.put(`/admin/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`),
  getFlashSales: () => api.get('/admin/flash-sales'),
  getPublicFlashSales: () => api.get('/admin/public/flash-sales'),
  createFlashSale: (data) => api.post('/admin/flash-sales', data),
  updateFlashSale: (id, data) => api.put(`/admin/flash-sales/${id}`, data),
  deleteFlashSale: (id) => api.delete(`/admin/flash-sales/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages'),
  getMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  send: (data) => api.post('/messages', data),
  markRead: (partnerId) => api.put(`/messages/${partnerId}/read`),
};

export const disputesAPI = {
  create: (data) => api.post('/disputes', data),
  getMyDisputes: () => api.get('/disputes/my'),
  getAll: (params) => api.get('/disputes', { params }),
  resolve: (id, data) => api.patch(`/disputes/${id}/resolve`, data),
};

export default api;
