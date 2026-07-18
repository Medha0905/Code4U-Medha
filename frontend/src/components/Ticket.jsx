import QRCode from 'react-qr-code';
import { motion } from 'framer-motion';
import { Clock, Users } from 'lucide-react';
import StatusPill from './StatusPill';

/**
 * The pickup Ticket — this app's signature visual element. Styled like a
 * boarding pass / café stub: a real perforation separates the order
 * summary (left) from the pickup stub (right, QR + token number), because
 * that's the actual seam in the data — one half is "what you ordered",
 * the other is "what gets scanned at pickup".
 */
export default function Ticket({ order, queuePosition, estimatedWaitMinutes, qrValue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="ticket flex flex-col sm:flex-row"
    >
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wide text-ink-500 font-medium">{order.shop?.name || 'Order'}</p>
          <StatusPill status={order.status} size="sm" />
        </div>

        <ul className="space-y-1.5 mb-4">
          {order.items?.map((item) => (
            <li key={item.id} className="flex justify-between text-sm text-ink-700">
              <span>{item.quantity} × {item.menuItem?.name}</span>
              <span className="font-mono">₹{(item.quantity * Number(item.unitPrice)).toFixed(0)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 pt-3 border-t border-cream-200">
          {queuePosition != null && (
            <div className="flex items-center gap-1.5 text-sm text-ink-700">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{queuePosition <= 1 ? "You're next" : `${queuePosition - 1} orders ahead`}</span>
            </div>
          )}
          {estimatedWaitMinutes != null && (
            <div className="flex items-center gap-1.5 text-sm text-ink-700">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>~{estimatedWaitMinutes} min</span>
            </div>
          )}
        </div>
      </div>

      <div className="ticket-perforation flex flex-col items-center justify-center gap-2.5 p-6 sm:w-48">
        {qrValue && (
          <div className="bg-white p-2 rounded-lg">
            <QRCode value={qrValue} size={104} fgColor="#2B2A28" />
          </div>
        )}
        <p className="font-mono text-xl font-semibold tracking-wider text-indigo-600">#{order.tokenNumber}</p>
        {qrValue && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-ink-300">Pickup code (if scan unavailable)</p>
            <p className="font-mono text-[11px] text-ink-500 break-all leading-tight">{qrValue}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
