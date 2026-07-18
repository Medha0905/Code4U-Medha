import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

export default function Notifications() {
  const { notifications, markRead, markAllRead } = useNotifications() || { notifications: [] };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Notifications</h1>
          <p className="text-ink-500 text-sm mt-1">Order updates, alerts, and reminders.</p>
        </div>
        {notifications?.length > 0 && <Button variant="ghost" onClick={markAllRead}>Mark all read</Button>}
      </div>

      {!notifications?.length ? (
        <EmptyState icon={Bell} title="No notifications yet" />
      ) : (
        <div className="card divide-y divide-cream-200">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full text-left p-4 flex gap-3 transition-colors hover:bg-cream-100 ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-indigo-500' : 'bg-transparent'}`} />
              <div>
                <p className="font-medium text-ink-900 text-sm">{n.title}</p>
                <p className="text-sm text-ink-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-ink-300 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
