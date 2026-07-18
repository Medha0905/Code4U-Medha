import api from './api';

export const registerStudent = (payload) => api.post('/auth/register/student', payload).then((r) => r.data.data);
export const registerVendor = (payload) => api.post('/auth/register/vendor', payload).then((r) => r.data.data);
export const login = (payload) => api.post('/auth/login', payload).then((r) => r.data.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data.data);
