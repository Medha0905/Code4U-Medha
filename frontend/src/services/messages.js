import api from './api';

export const listMessages = (orderId) => api.get(`/messages/${orderId}`).then((r) => r.data.data);
export const sendMessage = (orderId, text) => api.post(`/messages/${orderId}`, { text }).then((r) => r.data.data);
