import api from './api';

/** Uploads a menu item photo and returns its public URL. */
export const uploadMenuImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/uploads/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.url);
};

export const listMenu = (shopId, params) => api.get(`/menu/shop/${shopId}`, { params }).then((r) => r.data.data);
export const addMenuItem = (payload) => api.post('/menu', payload).then((r) => r.data.data);
export const updateMenuItem = (id, payload) => api.patch(`/menu/${id}`, payload).then((r) => r.data.data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`).then((r) => r.data.data);
export const restockItem = (id, addQuantity) => api.post(`/menu/${id}/restock`, { addQuantity }).then((r) => r.data.data);
export const setThreshold = (id, lowStockThreshold) => api.patch(`/menu/${id}/threshold`, { lowStockThreshold }).then((r) => r.data.data);
