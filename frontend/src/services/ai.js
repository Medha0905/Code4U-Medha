import api from './api';

export const getRecommendations = (shopId) => api.get(`/ai/recommendations/${shopId}`).then((r) => r.data.data);
export const getKitchenAssistant = () => api.get('/ai/kitchen-assistant').then((r) => r.data.data);
export const getBusinessInsights = () => api.get('/ai/business-insights').then((r) => r.data.data);
