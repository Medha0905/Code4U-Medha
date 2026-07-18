import api from './api';

export const submitReview = (payload) => api.post('/reviews', payload).then((r) => r.data.data);
export const getShopReviews = (shopId) => api.get(`/reviews/shop/${shopId}`).then((r) => r.data.data);
export const getMyReviewableOrders = () => api.get('/reviews/mine/reviewable').then((r) => r.data.data);
