import { useEffect, useState } from 'react';
import { ClipboardList, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import * as ordersApi from '../../services/orders';
import * as reviewsApi from '../../services/reviews';
import Ticket from '../../components/Ticket';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { CardSkeleton } from '../../components/Skeleton';
import { getSocket } from '../../services/socket';

const ACTIVE = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'];

export default function StudentOrders() {
  const [orders, setOrders] = useState(null);
  const [reviewableIds, setReviewableIds] = useState(new Set());
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    ordersApi.getMyOrders().then(setOrders).catch(() => setOrders([]));
    reviewsApi.getMyReviewableOrders().then((list) => setReviewableIds(new Set(list.map((o) => o.id)))).catch(() => {});
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const onStatus = () => load();
    socket.on('order:status', onStatus);
    return () => socket.off('order:status', onStatus);
  }, []);

  const submitReview = async () => {
    setSubmitting(true);
    try {
      await reviewsApi.submitReview({ orderId: reviewTarget.id, rating, comment });
      toast.success('Thanks for your review!');
      setReviewTarget(null);
      setRating(5);
      setComment('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!orders) return <div className="grid gap-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const past = orders.filter((o) => !ACTIVE.includes(o.status));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Orders</h1>
        <p className="text-ink-500 text-sm mt-1">Track live orders and browse your history.</p>
      </div>

      <div>
        <h2 className="font-display font-semibold text-ink-900 mb-3">Active</h2>
        {active.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No active orders" description="Place an order from a canteen to see it here." />
        ) : (
          <div className="space-y-4">
            {active.map((o) => (
              <Ticket key={o.id} order={o} queuePosition={o.queueEntry?.position} estimatedWaitMinutes={o.queueEntry?.estimatedWaitMinutes} qrValue={o.qrToken} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display font-semibold text-ink-900 mb-3">History</h2>
        {past.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No past orders yet" />
        ) : (
          <div className="card divide-y divide-cream-200">
            {past.map((o) => (
              <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900 truncate">{o.shop?.name} <span className="font-mono text-ink-500">#{o.tokenNumber}</span></p>
                  <p className="text-xs text-ink-500 mt-0.5">{new Date(o.createdAt).toLocaleString()} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm text-ink-700">₹{Number(o.totalAmount).toFixed(0)}</span>
                  <StatusPill status={o.status} size="sm" />
                  {reviewableIds.has(o.id) && (
                    <button onClick={() => setReviewTarget(o)} className="btn-ghost !py-1.5 !px-3 text-xs text-indigo-600">
                      <Star className="w-3.5 h-3.5" /> Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!reviewTarget} onClose={() => setReviewTarget(null)} title={`Rate ${reviewTarget?.shop?.name || 'your order'}`}>
        <div className="flex justify-center gap-1.5 mb-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star className={`w-8 h-8 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-cream-300'}`} />
            </button>
          ))}
        </div>
        <textarea
          className="input min-h-[90px]"
          placeholder="How was the food and pickup experience? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button onClick={submitReview} disabled={submitting} className="w-full mt-4">{submitting ? 'Submitting…' : 'Submit review'}</Button>
      </Modal>
    </div>
  );
}
