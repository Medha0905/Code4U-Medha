import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import * as shopsApi from '../../services/shops';
import * as queueApi from '../../services/queue';
import ShopCard from '../../components/ShopCard';
import { CardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import Ticket from '../../components/Ticket';
import { Store } from 'lucide-react';

export default function StudentHome() {
  const [shops, setShops] = useState(null);
  const [myQueue, setMyQueue] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    shopsApi.listShops().then(setShops).catch(() => setShops([]));
    queueApi.getMyQueue().then(setMyQueue).catch(() => setMyQueue(null));
  }, []);

  const filtered = shops?.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Find something to eat</h1>
        <p className="text-ink-500 text-sm mt-1">Browse open canteens and order ahead.</p>
      </div>

      {myQueue && (
        <div>
          <h2 className="font-display font-semibold text-ink-900 mb-3">Your active order</h2>
          <Ticket
            order={myQueue.order}
            queuePosition={myQueue.position}
            qrValue={myQueue.order?.qrToken}
          />
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-ink-300 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search canteens…"
          className="input pl-10"
        />
      </div>

      <div>
        <h2 className="font-display font-semibold text-ink-900 mb-3">Canteens</h2>
        <AnimatePresence mode="wait">
          {!shops ? (
            <motion.div key="skeleton" exit={{ opacity: 0 }} className="grid sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState icon={Store} title="No canteens found" description="Try a different search, or check back soon." />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {filtered.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
