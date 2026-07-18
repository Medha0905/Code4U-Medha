import api from './api';

export const getShopQueue = (shopId) => api.get(`/queue/shop/${shopId}`).then((r) => r.data.data);
export const getMyQueue = () => api.get('/queue/mine').then((r) => r.data.data);
