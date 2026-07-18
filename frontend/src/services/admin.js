import api from './api';

export const listStudents = () => api.get('/admin/students').then((r) => r.data.data);
export const listVendors = () => api.get('/admin/vendors').then((r) => r.data.data);
export const listShops = () => api.get('/admin/shops').then((r) => r.data.data);
export const getPlatformAnalytics = () => api.get('/admin/analytics').then((r) => r.data.data);
export const setUserActive = (userId, isActive) => api.patch(`/admin/users/${userId}/active`, { isActive }).then((r) => r.data.data);
export const approveShop = (shopId) => api.patch(`/admin/shops/${shopId}/approve`).then((r) => r.data.data);
export const forceRemoveShop = (shopId) => api.delete(`/admin/shops/${shopId}`).then((r) => r.data.data);
export const restoreShop = (shopId) => api.patch(`/admin/shops/${shopId}/restore`).then((r) => r.data.data);
