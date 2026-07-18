import api from './api';

export const markTutorialSeen = () => api.post('/vendor/tutorial/seen').then((r) => r.data.data);
export const replayTutorial = () => api.post('/vendor/tutorial/replay').then((r) => r.data.data);
export const toggleAutoPause = (enabled) => api.patch('/vendor/auto-pause', { enabled }).then((r) => r.data.data);
