const TIERS = {
  AVAILABLE: { label: 'Available', dot: 'bg-sage-500', bg: 'bg-sage-50', text: 'text-sage-600' },
  LIMITED: { label: 'Limited Stock', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  ALMOST_FINISHED: { label: 'Almost Finished', dot: 'bg-peach-500', bg: 'bg-peach-50', text: 'text-peach-600' },
  SOLD_OUT: { label: 'Sold Out', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },

  PLENTY: { label: 'Plenty of Seats', dot: 'bg-sage-500', bg: 'bg-sage-50', text: 'text-sage-600' },
  MODERATE: { label: 'Moderate Availability', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  FEW_LEFT: { label: 'Few Seats Left', dot: 'bg-peach-500', bg: 'bg-peach-50', text: 'text-peach-600' },
  NEARLY_FULL: { label: 'Nearly Full', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },
  FULL: { label: 'No Seats Available', dot: 'bg-ink-500', bg: 'bg-cream-200', text: 'text-ink-700' },

  LOW: { label: 'Kitchen Load: Low', dot: 'bg-sage-500', bg: 'bg-sage-50', text: 'text-sage-600' },
  MEDIUM: { label: 'Kitchen Load: Medium', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  HEAVY: { label: 'Kitchen Load: Heavy', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },

  PLACED: { label: 'Placed', dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-600' },
  ACCEPTED: { label: 'Accepted', dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  PREPARING: { label: 'Preparing', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  READY: { label: 'Ready for Pickup', dot: 'bg-sage-500', bg: 'bg-sage-50', text: 'text-sage-600' },
  COMPLETED: { label: 'Completed', dot: 'bg-ink-500', bg: 'bg-cream-200', text: 'text-ink-700' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },
  NO_SHOW: { label: 'No-Show', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' },

  OPEN: { label: 'Open', dot: 'bg-sage-500', bg: 'bg-sage-50', text: 'text-sage-600' },
  CLOSED: { label: 'Closed', dot: 'bg-ink-500', bg: 'bg-cream-200', text: 'text-ink-700' },
  PAUSED: { label: 'Paused', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
};

export default function StatusPill({ status, size = 'md' }) {
  const tier = TIERS[status] || { label: status, dot: 'bg-ink-300', bg: 'bg-cream-200', text: 'text-ink-700' };
  const padding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${tier.bg} ${tier.text} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
      {tier.label}
    </span>
  );
}
