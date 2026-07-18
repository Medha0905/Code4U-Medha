import { useEffect, useState } from 'react';
import { Users, Store, GraduationCap, IndianRupee } from 'lucide-react';
import * as adminApi from '../../services/admin';
import StatusPill from '../../components/StatusPill';
import { CardSkeleton } from '../../components/Skeleton';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [shops, setShops] = useState(null);

  useEffect(() => {
    adminApi.getPlatformAnalytics().then(setAnalytics).catch(() => {});
    adminApi.listShops().then(setShops).catch(() => setShops([]));
  }, []);

  if (!analytics) return <div className="grid sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Platform overview</h1>
        <p className="text-ink-500 text-sm mt-1">Real-time figures across every shop.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><GraduationCap className="w-5 h-5 text-indigo-500 mb-2" /><p className="text-2xl font-display font-semibold">{analytics.studentCount}</p><p className="text-xs text-ink-500 mt-0.5">Students</p></div>
        <div className="card p-5"><Users className="w-5 h-5 text-indigo-500 mb-2" /><p className="text-2xl font-display font-semibold">{analytics.vendorCount}</p><p className="text-xs text-ink-500 mt-0.5">Vendors</p></div>
        <div className="card p-5"><Store className="w-5 h-5 text-indigo-500 mb-2" /><p className="text-2xl font-display font-semibold">{analytics.shopCount}</p><p className="text-xs text-ink-500 mt-0.5">Shops</p></div>
        <div className="card p-5"><IndianRupee className="w-5 h-5 text-indigo-500 mb-2" /><p className="text-2xl font-display font-semibold">₹{analytics.totalPlatformRevenue.toFixed(0)}</p><p className="text-xs text-ink-500 mt-0.5">Total revenue</p></div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink-900 mb-4">Shops</h2>
        <div className="divide-y divide-cream-200">
          {shops?.map((s) => (
            <div key={s.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-900 text-sm">{s.name}</p>
                <p className="text-xs text-ink-500">{s.vendor?.fullName} · {s._count?.orders || 0} orders</p>
              </div>
              <StatusPill status={s.status} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
