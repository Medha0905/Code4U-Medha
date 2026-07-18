import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import * as favoritesApi from '../../services/favorites';
import FoodCard from '../../components/FoodCard';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';

export default function Favorites() {
  const [favorites, setFavorites] = useState(null);

  const load = () => favoritesApi.listFavorites().then(setFavorites).catch(() => setFavorites([]));
  useEffect(() => { load(); }, []);

  const removeFavorite = async (item) => {
    await favoritesApi.removeFavorite(item.id);
    load();
  };

  if (!favorites) return <div className="grid sm:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Favorites</h1>
      <p className="text-ink-500 text-sm mb-6">Your saved dishes for quick reordering.</p>

      {favorites.length === 0 ? (
        <EmptyState icon={Heart} title="No favorites yet" description="Tap the heart on any dish to save it here." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((f) => (
            <FoodCard key={f.id} item={f.menuItem} isFavorite onToggleFavorite={() => removeFavorite(f.menuItem)} />
          ))}
        </div>
      )}
    </div>
  );
}
