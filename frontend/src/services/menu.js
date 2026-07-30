import api from './api';

/** Uploads a menu item photo and returns its public URL. */
export const uploadMenuImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/uploads/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.url);
};

/** AI Menu Photo Extraction: uploads a menu photo, returns suggested items (not yet saved). */
export const extractMenuFromPhoto = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/menu/extract-from-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
};

/** Confirms the (possibly edited) extracted items and actually creates them. */
export const bulkCreateFromExtraction = (items) => api.post('/menu/bulk-from-extraction', { items }).then((r) => r.data.data);

export const listMenu = (shopId, params) => api.get(`/menu/shop/${shopId}`, { params }).then((r) => r.data.data);
export const addMenuItem = (payload) => api.post('/menu', payload).then((r) => r.data.data);
export const updateMenuItem = (id, payload) => api.patch(`/menu/${id}`, payload).then((r) => r.data.data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`).then((r) => r.data.data);
export const restockItem = (id, addQuantity) => api.post(`/menu/${id}/restock`, { addQuantity }).then((r) => r.data.data);
export const setThreshold = (id, lowStockThreshold) => api.patch(`/menu/${id}/threshold`, { lowStockThreshold }).then((r) => r.data.data);
