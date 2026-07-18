import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, TrendingUp, Sparkles } from 'lucide-react';
import * as reportsApi from '../../services/reports';
import * as aiApi from '../../services/ai';
import Button from '../../components/Button';
import { CardSkeleton } from '../../components/Skeleton';

function Bar({ label, value, max }) {
  const pct = max ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink-700">{label}</span>
        <span className="font-mono text-ink-500">{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-cream-200 overflow-hidden">
        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function VendorAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    reportsApi.getAnalytics().then(setAnalytics).catch(() => {});
    aiApi.getBusinessInsights().then(setInsights).catch(() => {});
  }, []);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await reportsApi.downloadDailyReportPdf(new Date().toISOString().slice(0, 10));
    } catch {
      toast.error('Could not generate report');
    } finally {
      setDownloading(false);
    }
  };

  if (!analytics) return <div className="grid sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  const maxSold = Math.max(...analytics.productWiseSales.map((p) => p.sold || 0), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Analytics</h1>
          <p className="text-ink-500 text-sm mt-1">Computed live from your real orders.</p>
        </div>
        <Button variant="secondary" onClick={downloadPdf} disabled={downloading}>
          <Download className="w-4 h-4" /> {downloading ? 'Preparing…' : 'End-of-day report (PDF)'}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><p className="text-2xl font-display font-semibold">₹{analytics.todayRevenue.toFixed(0)}</p><p className="text-xs text-ink-500 mt-1">Today's revenue</p></div>
        <div className="card p-5"><p className="text-2xl font-display font-semibold">₹{analytics.weeklyRevenue.toFixed(0)}</p><p className="text-xs text-ink-500 mt-1">7-day revenue</p></div>
        <div className="card p-5"><p className="text-2xl font-display font-semibold">{analytics.avgWaitMinutes}m</p><p className="text-xs text-ink-500 mt-1">Average wait time</p></div>
        <div className="card p-5"><p className="text-2xl font-display font-semibold">{analytics.peakHour}:00</p><p className="text-xs text-ink-500 mt-1">Peak hour</p></div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
          <h2 className="font-display font-semibold text-ink-900">Product-wise sales</h2>
        </div>
        {analytics.productWiseSales.length === 0 ? (
          <p className="text-sm text-ink-500">No completed orders yet.</p>
        ) : (
          <div className="space-y-3">
            {analytics.productWiseSales.slice(0, 8).map((p) => <Bar key={p.name} label={p.name} value={p.sold} max={maxSold} />)}
          </div>
        )}
      </div>

      {insights && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
            <h2 className="font-display font-semibold text-ink-900">AI business insights</h2>
          </div>
          <ul className="space-y-2">
            {insights.insights.map((i, idx) => (
              <li key={idx} className="text-sm text-ink-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" /> {i}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
