import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IndianRupee, ClipboardList, Flame, AlertTriangle, Sparkles } from 'lucide-react';
import * as shopsApi from '../../services/shops';
import * as ordersApi from '../../services/orders';
import * as aiApi from '../../services/ai';
import * as vendorApi from '../../services/vendor';
import StatusPill from '../../components/StatusPill';
import { CardSkeleton } from '../../components/Skeleton';
import { getSocket } from '../../services/socket';
import CoachTour from '../../components/CoachTour';
import { useAuth } from '../../context/AuthContext';

const TOUR_STEPS = [
  { target: 'nav-dashboard', title: 'Your dashboard', body: "See today's revenue, pending orders, and kitchen load at a glance — this is your home base." },
  { target: 'nav-menu', title: 'Menu', body: 'Add dishes one by one, or upload a photo of your physical menu and let AI pre-fill it for you.' },
  { target: 'nav-orders', title: 'Orders', body: 'Accept, prepare, and mark orders ready. Scan a student\'s QR here to verify and complete pickup.' },
  { target: 'nav-bulk', title: 'Bulk Orders', body: 'See incoming requests from clubs, events, and group gatherings here.' },
  { target: 'nav-analytics', title: 'Analytics', body: 'Revenue, best sellers, and AI-generated insights — plus a downloadable end-of-day report.' },
  { target: 'nav-shop', title: 'Shop settings', body: 'Update your profile, seat availability, and auto-pause preferences here.' },
];

function StatCard({ icon: Icon, label, value, accent = 'indigo' }) {
  return (
    <div className="card p-5">
      <div className={`w-9 h-9 rounded-xl bg-${accent}-50 flex items-center justify-center mb-3`}>
        <Icon className={`w-4.5 h-4.5 text-${accent}-500`} strokeWidth={1.9} />
      </div>
      <p className="text-2xl font-display font-semibold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function VendorHome() {
  const { user, setUser } = useAuth();
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [assistant, setAssistant] = useState(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (user?.vendor && !user.vendor.hasSeenTutorial) setShowTour(true);
  }, [user]);

  const finishTour = async () => {
    setShowTour(false);
    try {
      await vendorApi.markTutorialSeen();
      setUser((u) => ({ ...u, vendor: { ...u.vendor, hasSeenTutorial: true } }));
    } catch {
      // non-fatal — tour just won't be marked seen, will show again next login
    }
  };

  const load = () => {
    shopsApi.getMyShop().then(setShop).catch(() => {});
    ordersApi.getShopOrders().then(setOrders).catch(() => {});
    aiApi.getKitchenAssistant().then(setAssistant).catch(() => {});
  };

  useEffect(() => {
    load();
    if (shop?.id) {
      const socket = getSocket();
      socket.emit('shop:subscribe', shop.id);
    }
    const socket = getSocket();
    const refresh = () => load();
    socket.on('order:status', refresh);
    socket.on('kitchen:load', refresh);
    return () => { socket.off('order:status', refresh); socket.off('kitchen:load', refresh); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const toggleShop = async () => {
    try {
      const next = shop.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      const updated = await shopsApi.setShopStatus(next);
      setShop(updated);
      toast.success(`Shop is now ${next}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update shop');
    }
  };

  if (!shop) return <div className="grid sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  const today = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = today.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + Number(o.totalAmount), 0);
  const pending = orders.filter((o) => o.status === 'PLACED').length;
  const preparing = orders.filter((o) => o.status === 'PREPARING').length;
  const lowStock = (shop.menuItems || []).filter((m) => m.inventory && m.inventory.quantity <= m.inventory.lowStockThreshold && m.inventory.quantity > 0);

  return (
    <div className="space-y-8">
      {showTour && <CoachTour steps={TOUR_STEPS} onFinish={finishTour} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">{shop.name}</h1>
          <div className="flex gap-2 mt-1.5"><StatusPill status={shop.status} size="sm" /></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTour(true)} className="btn-ghost text-sm">Replay tutorial</button>
          <button onClick={toggleShop} className={shop.status === 'OPEN' ? 'btn-secondary' : 'btn-primary'}>
            {shop.status === 'OPEN' ? 'Close shop' : 'Open shop'}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Today's revenue" value={`₹${todayRevenue.toFixed(0)}`} accent="sage" />
        <StatCard icon={ClipboardList} label="Today's orders" value={today.length} accent="indigo" />
        <StatCard icon={Flame} label="Pending + Preparing" value={pending + preparing} accent="peach" />
        <StatCard icon={AlertTriangle} label="Low stock items" value={lowStock.length} accent="amber" />
      </div>

      {assistant && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
            <h2 className="font-display font-semibold text-ink-900">AI Kitchen Assistant</h2>
            <span className="ml-auto text-xs text-ink-500">Efficiency: {assistant.efficiency}</span>
          </div>
          <ul className="space-y-2">
            {assistant.suggestions?.length ? assistant.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-ink-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> {s}
              </li>
            )) : <p className="text-sm text-ink-500">No active orders right now — kitchen is clear.</p>}
          </ul>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50/40">
          <p className="font-medium text-ink-900 text-sm mb-2">Low stock alerts</p>
          <ul className="space-y-1">
            {lowStock.map((m) => (
              <li key={m.id} className="text-sm text-ink-700">Only {m.inventory.quantity} {m.name} left</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
