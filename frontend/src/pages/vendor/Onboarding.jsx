import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as shopsApi from '../../services/shops';
import Input from '../../components/Input';
import Button from '../../components/Button';

/**
 * Shop registration. The step-by-step tutorial itself now runs as a
 * spotlight coach tour on the actual dashboard (see CoachTour.jsx +
 * VendorHome.jsx) — it highlights the real sidebar buttons instead of a
 * separate generic modal carousel, so vendors see exactly what to click.
 */
export default function VendorOnboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', location: '', openingTime: '09:00', closingTime: '18:00' });
  const [loading, setLoading] = useState(false);

  const createShop = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await shopsApi.createShop(form);
      toast.success('Shop created — welcome!');
      navigate('/vendor');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10">
      <h1 className="font-display text-2xl font-semibold text-ink-900">Set up your shop</h1>
      <p className="text-ink-500 text-sm mt-1.5 mb-8">This is what students will see when browsing canteens.</p>

      <form onSubmit={createShop} className="card p-6 space-y-4">
        <Input label="Shop name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="The Daily Grind" />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="South Indian breakfast & filter coffee" />
        <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Block C, Ground Floor" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Opening time" type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} />
          <Input label="Closing time" type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating…' : 'Create shop'}</Button>
      </form>
    </div>
  );
}
