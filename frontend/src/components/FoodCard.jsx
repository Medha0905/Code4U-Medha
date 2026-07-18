import { motion } from 'framer-motion';
import { Heart, Clock } from 'lucide-react';
import StatusPill from './StatusPill';

export default function FoodCard({ item, onAdd, onToggleFavorite, isFavorite, quantity, onIncrement, onDecrement }) {
  const soldOut = item.availability === 'SOLD_OUT' || item.inventory?.quantity === 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      className="card overflow-hidden flex flex-col"
    >
      <div className="relative h-36 bg-cream-200">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
        )}
        <button
          onClick={() => onToggleFavorite?.(item)}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-soft"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-ink-500'}`} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display font-semibold text-ink-900 leading-tight">{item.name}</h4>
          <span className="font-mono font-semibold text-indigo-600 whitespace-nowrap">₹{Number(item.price).toFixed(0)}</span>
        </div>
        <p className="text-xs text-ink-500 mt-0.5">{item.category}</p>
        {item.description && <p className="text-sm text-ink-500 mt-2 line-clamp-2">{item.description}</p>}

        <div className="flex items-center justify-between mt-3">
          <StatusPill status={item.availability} size="sm" />
          <span className="flex items-center gap-1 text-xs text-ink-500">
            <Clock className="w-3.5 h-3.5" /> {item.prepTimeMinutes}m
          </span>
        </div>

        <div className="mt-4">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-indigo-50 rounded-full px-2 py-1">
              <button onClick={onDecrement} className="w-7 h-7 rounded-full bg-white shadow-soft font-semibold">−</button>
              <span className="font-mono font-semibold text-indigo-700">{quantity}</span>
              <button onClick={onIncrement} disabled={soldOut} className="w-7 h-7 rounded-full bg-white shadow-soft font-semibold disabled:opacity-40">+</button>
            </div>
          ) : (
            <button
              onClick={() => onAdd?.(item)}
              disabled={soldOut}
              className="btn-secondary w-full !py-2 text-sm disabled:opacity-50"
            >
              {soldOut ? 'Sold Out' : 'Add to order'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
