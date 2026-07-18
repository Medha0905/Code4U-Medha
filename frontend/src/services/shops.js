import api from './api';

export const listShops = (params) => api.get('/shops', { params }).then((r) => r.data.data);
export const getShop = (id) => api.get(`/shops/${id}`).then((r) => r.data.data);
export const getMyShop = () => api.get('/shops/me/mine').then((r) => r.data.data);
export const createShop = (payload) => api.post('/shops', payload).then((r) => r.data.data);
export const updateMyShop = (payload) => api.patch('/shops/me/mine', payload).then((r) => r.data.data);
export const setShopStatus = (status) => api.patch('/shops/me/status', { status }).then((r) => r.data.data);
export const setSeatStatus = (seatStatus) => api.patch('/shops/me/seat-status', { seatStatus }).then((r) => r.data.data);
export const deleteMyShop = () => api.delete('/shops/me/mine').then((r) => r.data.data);
