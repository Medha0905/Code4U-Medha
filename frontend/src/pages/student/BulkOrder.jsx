import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import * as shopsApi from '../../services/shops';
import * as bulkApi from '../../services/bulkOrders';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { CardSkeleton } from '../../components/Skeleton';

export default function BulkOrder() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const shopId = params.get('shopId');
  const [shop, setShop] = useState(null);
  const [allShops, setAllShops] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [form, setForm] = useState({ numberOfPeople: 10, eventDate: '', servingTime: '', eatingTime: '', specialInstructions: '', seatBooking: true, paymentMethod: 'ONLINE' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (shopId) shopsApi.getShop(shopId).then(setShop);
    else shopsApi.listShops().then(setAllShops).catch(() => setAllShops([]));
  }, [shopId]);

  // No shop chosen yet — show a real picker instead of a dead-end message.
  if (!shopId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Bulk order</h1>
          <p className="text-ink-500 text-sm mt-1">Perfect for clubs, events, or class gatherings. Pick a canteen to get started.</p>
        </div>
        {!allShops ? (
          <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : allShops.length === 0 ? (
          <p className="text-ink-500">No canteens available right now.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {allShops.map((s) => (
              <button
                key={s.id}
                onClick={() => setParams({ shopId: s.id })}
                className="card p-4 flex items-center gap-4 text-left hover:border-indigo-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0">🏪</div>
                <div>
                  <p className="font-display font-semibold text-ink-900">{s.name}</p>
                  {s.location && <p className="text-xs text-ink-500 mt-0.5">{s.location}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (!shop) return <div className="grid sm:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  const items = Object.entries(quantities).filter(([, qty]) => qty > 0).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Add at least one item');
    setSubmitting(true);
    try {
      await bulkApi.placeBulkOrder({ shopId, items, ...form, numberOfPeople: Number(form.numberOfPeople) });
      toast.success('Bulk order request sent to the vendor');
      navigate('/student/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place bulk order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Bulk order — {shop.name}</h1>
      <p className="text-ink-500 text-sm mb-6">Perfect for clubs, events, or class gatherings.</p>

      <form onSubmit={submit} className="space-y-6">
        <div className="card p-5">
          <h3 className="font-medium text-ink-900 mb-3">Select items & quantities</h3>
          <div className="space-y-2">
            {shop.menuItems?.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-sm text-ink-700">{item.name} · ₹{Number(item.price).toFixed(0)}</span>
                <input
                  type="number" min="0" placeholder="0"
                  className="input w-24 !py-1.5"
                  value={quantities[item.id] || ''}
                  onChange={(e) => setQuantities((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 grid grid-cols-2 gap-4">
          <Input label="Number of people" type="number" min="1" value={form.numberOfPeople} onChange={(e) => setForm({ ...form, numberOfPeople: e.target.value })} />
          <Input label="Event date" type="date" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
          <Input label="Serving time" required value={form.servingTime} onChange={(e) => setForm({ ...form, servingTime: e.target.value })} placeholder="e.g. 4:00 PM" />
          <Input label="Eating time (optional)" value={form.eatingTime} onChange={(e) => setForm({ ...form, eatingTime: e.target.value })} placeholder="e.g. 4:30 PM" />
          <div className="col-span-2">
            <Input label="Special instructions" value={form.specialInstructions} onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={form.seatBooking} onChange={(e) => setForm({ ...form, seatBooking: e.target.checked })} />
            Also request seat booking for this group
          </label>
        </div>

        <Button type="submit" disabled={submitting} className="w-full">{submitting ? 'Sending…' : 'Send bulk order request'}</Button>
      </form>
    </div>
  );
}
