import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import * as bulkApi from '../../services/bulkOrders';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';
import { CardSkeleton } from '../../components/Skeleton';

export default function VendorBulkOrders() {
  const [bulkOrders, setBulkOrders] = useState(null);

  useEffect(() => { bulkApi.getShopBulkOrders().then(setBulkOrders).catch(() => setBulkOrders([])); }, []);

  if (!bulkOrders) return <div className="grid gap-4">{[...Array(2)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Bulk orders</h1>
      <p className="text-ink-500 text-sm mb-6">Requests for clubs, events, and group gatherings.</p>

      {bulkOrders.length === 0 ? (
        <EmptyState icon={Users} title="No bulk order requests yet" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bulkOrders.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-ink-900">{b.student?.user ? b.student.fullName : 'Student'}</p>
                <StatusPill status={b.order?.status} size="sm" />
              </div>
              <p className="text-sm text-ink-500">{b.numberOfPeople} people · {new Date(b.eventDate).toLocaleDateString()} at {b.servingTime}</p>
              {b.specialInstructions && <p className="text-sm text-ink-500 mt-1 italic">"{b.specialInstructions}"</p>}
              {b.seatReservation && <p className="text-xs text-indigo-600 mt-2">Includes seat booking for {b.seatReservation.numberOfPeople}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
