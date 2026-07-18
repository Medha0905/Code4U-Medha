import api from './api';

export const listFavorites = () => api.get('/favorites').then((r) => r.data.data);
export const addFavorite = (menuItemId) => api.post('/favorites', { menuItemId }).then((r) => r.data.data);
export const removeFavorite = (menuItemId) => api.delete(`/favorites/${menuItemId}`).then((r) => r.data.data);
