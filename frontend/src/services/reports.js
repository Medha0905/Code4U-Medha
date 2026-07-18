import api from './api';

export const getAnalytics = () => api.get('/reports/analytics').then((r) => r.data.data);
export const getDailyReport = (date) => api.get('/reports/daily', { params: { date } }).then((r) => r.data.data);

/** Downloads the end-of-day PDF report and triggers a browser save. */
export async function downloadDailyReportPdf(date) {
  const res = await api.get('/reports/daily/pdf', { params: { date }, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `end-of-day-report${date ? `-${date}` : ''}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
