import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Search } from 'lucide-react';
import * as adminApi from '../../services/admin';
import StatusPill from '../../components/StatusPill';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';

export default function AdminVendors() {
  const [shops, setShops] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => adminApi.listShops().then(setShops).catch(() => setShops([]));
  useEffect(() => { load(); }, []);

  const toggleVendorActive = async (shop) => {
    const nextActive = !shop.vendor.user.isActive;
    if (!nextActive && !confirm(`Deactivate ${shop.vendor.fullName}'s vendor account? They won't be able to log in.`)) return;
    try {
      await adminApi.setUserActive(shop.vendor.user.id, nextActive);
      toast.success(nextActive ? 'Vendor reactivated' : 'Vendor deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update vendor');
    }
  };

  const approve = async (shop) => {
    try {
      await adminApi.approveShop(shop.id);
      toast.success('Shop approved');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve shop');
    }
  };

  const removeShop = async (shop) => {
    if (!confirm(`Remove "${shop.name}" from the platform? Students will no longer be able to find or order from it.`)) return;
    try {
      await adminApi.forceRemoveShop(shop.id);
      toast.success('Shop removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove shop');
    }
  };

  const restore = async (shop) => {
    try {
      await adminApi.restoreShop(shop.id);
      toast.success('Shop restored');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not restore shop');
    }
  };

  if (!shops) return <div className="grid gap-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  const filtered = shops.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.vendor?.fullName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Vendors & Shops</h1>
          <p className="text-ink-500 text-sm mt-1">{shops.length} registered shops.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-ink-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shops or vendors…" className="input pl-9 !py-2" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Store} title="No shops found" />
      ) : (
        <div className="card divide-y divide-cream-200">
          {filtered.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-ink-900">{s.name}</p>
                  {s.isDeleted && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">Removed</span>}
                  {!s.isApproved && !s.isDeleted && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Pending approval</span>}
                </div>
                <p className="text-xs text-ink-500 mt-0.5">
                  {s.vendor?.fullName} · {s.vendor?.user?.email} · {s._count?.orders || 0} orders · {s._count?.menuItems || 0} items
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={s.status} size="sm" />
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.vendor?.user?.isActive ? 'bg-sage-50 text-sage-600' : 'bg-rose-50 text-rose-600'}`}>
                  {s.vendor?.user?.isActive ? 'Vendor active' : 'Vendor deactivated'}
                </span>

                {!s.isApproved && !s.isDeleted && (
                  <button onClick={() => approve(s)} className="btn-ghost !py-1.5 !px-3 text-xs text-sage-600">Approve</button>
                )}
                <button
                  onClick={() => toggleVendorActive(s)}
                  className={`btn-ghost !py-1.5 !px-3 text-xs ${s.vendor?.user?.isActive ? 'text-rose-500' : 'text-sage-600'}`}
                >
                  {s.vendor?.user?.isActive ? 'Deactivate vendor' : 'Reactivate vendor'}
                </button>
                {s.isDeleted ? (
                  <button onClick={() => restore(s)} className="btn-ghost !py-1.5 !px-3 text-xs text-sage-600">Restore shop</button>
                ) : (
                  <button onClick={() => removeShop(s)} className="btn-ghost !py-1.5 !px-3 text-xs text-rose-500">Remove shop</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
