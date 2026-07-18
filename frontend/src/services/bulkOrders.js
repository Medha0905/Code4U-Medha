import api from './api';

export const placeBulkOrder = (payload) => api.post('/bulk-orders', payload).then((r) => r.data.data);
export const getMyBulkOrders = () => api.get('/bulk-orders/mine').then((r) => r.data.data);
export const getShopBulkOrders = () => api.get('/bulk-orders/shop').then((r) => r.data.data);
