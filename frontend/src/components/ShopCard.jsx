import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import StatusPill from './StatusPill';

export default function ShopCard({ shop }) {
  return (
    <motion.div whileHover={{ y: -3 }}>
      <Link to={`/student/shops/${shop.id}`} className="card p-4 flex gap-4 items-center block">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl overflow-hidden shrink-0">
          {shop.logoUrl ? <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" /> : '🏪'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold text-ink-900 truncate">{shop.name}</h4>
            {shop.avgRating != null && (
              <span className="flex items-center gap-0.5 text-xs text-ink-500 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {shop.avgRating.toFixed(1)} ({shop.reviewCount})
              </span>
            )}
          </div>
          {shop.location && (
            <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {shop.location}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <StatusPill status={shop.status} size="sm" />
            <StatusPill status={shop.seatStatus} size="sm" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
