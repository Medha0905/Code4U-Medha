import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import * as shopsApi from '../../services/shops';
import * as vendorApi from '../../services/vendor';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { CardSkeleton } from '../../components/Skeleton';

const SEAT_OPTIONS = ['PLENTY', 'MODERATE', 'FEW_LEFT', 'NEARLY_FULL', 'FULL'];
const SEAT_LABELS = { PLENTY: '🟢 Plenty', MODERATE: '🟡 Moderate', FEW_LEFT: '🟠 Few Left', NEARLY_FULL: '🔴 Nearly Full', FULL: '⚫ Full' };

export default function VendorShop() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    shopsApi.getMyShop().then((s) => { setShop(s); setForm({ name: s.name, description: s.description || '', location: s.location || '', contactPhone: s.contactPhone || '', openingTime: s.openingTime || '', closingTime: s.closingTime || '' }); });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await shopsApi.updateMyShop(form);
      setShop(updated);
      toast.success('Shop updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update shop');
    } finally {
      setSaving(false);
    }
  };

  const setSeat = async (seatStatus) => {
    const updated = await shopsApi.setSeatStatus(seatStatus);
    setShop(updated);
  };

  const toggleAutoPause = async () => {
    const updated = await vendorApi.toggleAutoPause(!shop.autoPauseEnabled);
    setShop(updated);
  };

  const deleteShop = async () => {
    setDeleting(true);
    try {
      await shopsApi.deleteMyShop();
      toast.success('Your shop has been removed');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove shop');
    } finally {
      setDeleting(false);
    }
  };

  if (!shop || !form) return <div className="grid sm:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Shop settings</h1>
        <p className="text-ink-500 text-sm mt-1">Update your profile and operational preferences.</p>
      </div>

      <form onSubmit={save} className="card p-6 space-y-4">
        <Input label="Shop name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Input label="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Opening time" type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} />
          <Input label="Closing time" type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
        </div>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </form>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-ink-900 mb-3">Seat availability</h2>
        <div className="flex flex-wrap gap-2">
          {SEAT_OPTIONS.map((s) => (
            <button key={s} onClick={() => setSeat(s)} className={`px-3.5 py-2 rounded-full text-sm font-medium border ${shop.seatStatus === s ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-cream-300 text-ink-700'}`}>
              {SEAT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-ink-900">Auto-pause ordering</h2>
          <p className="text-sm text-ink-500 mt-1">Automatically pause new orders when kitchen load is heavy.</p>
        </div>
        <button
          onClick={toggleAutoPause}
          className={`w-12 h-7 rounded-full transition-colors relative ${shop.autoPauseEnabled ? 'bg-indigo-500' : 'bg-cream-300'}`}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${shop.autoPauseEnabled ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      <div className="card p-6 border-rose-200">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-semibold text-ink-900">Remove shop from platform</h2>
            <p className="text-sm text-ink-500 mt-1">
              Hides your shop from students immediately and stops new orders. Your order history and
              analytics are kept, not deleted. This can't be undone from the app — contact support to reopen.
            </p>
            <Button variant="secondary" className="mt-4 !text-rose-500 !border-rose-200 hover:!bg-rose-50" onClick={() => setDeleteOpen(true)}>
              Remove my shop
            </Button>
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setConfirmText(''); }} title="Remove your shop?">
        <p className="text-sm text-ink-700 mb-4">
          This will close <strong>{shop.name}</strong> and hide it from students right away. You'll need to
          complete or cancel any active orders first. Type the shop name to confirm.
        </p>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={shop.name} />
        <Button
          onClick={deleteShop}
          disabled={confirmText !== shop.name || deleting}
          className="w-full mt-4 !bg-rose-500 hover:!bg-rose-600"
        >
          {deleting ? 'Removing…' : 'Yes, remove my shop'}
        </Button>
      </Modal>
    </div>
  );
}
