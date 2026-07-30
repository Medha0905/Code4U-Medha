import api from './api';

export const placeOrder = (payload) => api.post('/orders', payload).then((r) => r.data.data);
export const getMyOrders = () => api.get('/orders/mine').then((r) => r.data.data);
export const getShopOrders = (status) => api.get('/orders/shop', { params: { status } }).then((r) => r.data.data);
export const updateOrderStatus = (id, status, waitBucket) => api.patch(`/orders/${id}/status`, { status, waitBucket }).then((r) => r.data.data);
export const markNoShow = (id) => api.post(`/orders/${id}/no-show`).then((r) => r.data.data);
export const scanQr = (qrToken) => api.post('/orders/scan', { qrToken }).then((r) => r.data.data);
export const completeScan = (qrToken) => api.post('/orders/scan/complete', { qrToken }).then((r) => r.data.data);
