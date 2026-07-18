import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ShoppingBag, Users } from 'lucide-react';
import * as shopsApi from '../../services/shops';
import * as ordersApi from '../../services/orders';
import * as favoritesApi from '../../services/favorites';
import FoodCard from '../../components/FoodCard';
import { CardSkeleton } from '../../components/Skeleton';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import StatusPill from '../../components/StatusPill';
import { getSocket } from '../../services/socket';

/** Unit price including any selected add-ons for a given menu item. */
function unitPriceFor(item, selectedLabels = []) {
  const group = item.customizations?.[0];
  if (!group || !selectedLabels.length) return Number(item.price);
  const extra = group.options
    .filter((o) => selectedLabels.includes(o.label))
    .reduce((sum, o) => sum + Number(o.extraPrice), 0);
  return Number(item.price) + extra;
}

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState({}); // { menuItemId: quantity }
  const [cartCustomizations, setCartCustomizations] = useState({}); // { menuItemId: [labels] }
  const [favorites, setFavorites] = useState(new Set());
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customizeItem, setCustomizeItem] = useState(null); // item pending add-on selection
  const [pendingSelection, setPendingSelection] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    shopsApi.getShop(id).then((s) => { setShop(s); setItems(s.menuItems); });
    favoritesApi.listFavorites().then((favs) => setFavorites(new Set(favs.map((f) => f.menuItemId)))).catch(() => {});

    const socket = getSocket();
    socket.emit('shop:subscribe', id);
    const onInventory = (payload) => {
      setItems((prev) => prev?.map((it) => (it.id === payload.menuItemId ? { ...it, availability: payload.availability, inventory: { ...it.inventory, quantity: payload.quantity } } : it)));
    };
    socket.on('inventory:update', onInventory);
    return () => { socket.emit('shop:unsubscribe', id); socket.off('inventory:update', onInventory); };
  }, [id]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase()) && (!category || it.category === category));
  }, [items, search, category]);

  const categories = useMemo(() => [...new Set((items || []).map((i) => i.category))], [items]);

  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0);
  const cartTotal = cartItems.reduce((sum, [itemId, qty]) => {
    const item = items?.find((i) => i.id === itemId);
    return sum + qty * unitPriceFor(item, cartCustomizations[itemId]);
  }, 0);

  const toggleFavorite = async (item) => {
    if (favorites.has(item.id)) {
      await favoritesApi.removeFavorite(item.id);
      setFavorites((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    } else {
      await favoritesApi.addFavorite(item.id);
      setFavorites((prev) => new Set(prev).add(item.id));
    }
  };

  const handleAdd = (item) => {
    if (item.customizations?.[0]?.options?.length) {
      setCustomizeItem(item);
      setPendingSelection(cartCustomizations[item.id] || []);
    } else {
      setCart((prev) => ({ ...prev, [item.id]: 1 }));
    }
  };

  const confirmCustomization = () => {
    setCart((prev) => ({ ...prev, [customizeItem.id]: prev[customizeItem.id] || 1 }));
    setCartCustomizations((prev) => ({ ...prev, [customizeItem.id]: pendingSelection }));
    setCustomizeItem(null);
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const order = await ordersApi.placeOrder({
        shopId: id,
        items: cartItems.map(([menuItemId, quantity]) => ({
          menuItemId,
          quantity,
          selectedCustomizations: cartCustomizations[menuItemId] || undefined,
        })),
        paymentMethod,
        type: 'IMMEDIATE',
      });
      toast.success(`Order placed — token #${order.tokenNumber}`);
      navigate('/student/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  if (!shop) {
    return <div className="grid sm:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}</div>;
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl overflow-hidden">
          {shop.logoUrl ? <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" /> : '🏪'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink-900">{shop.name}</h1>
            {shop.avgRating != null && (
              <span className="flex items-center gap-1 text-sm text-ink-600 bg-amber-50 px-2 py-0.5 rounded-full">
                ⭐ {shop.avgRating.toFixed(1)} <span className="text-ink-500">({shop.reviewCount})</span>
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-1.5">
            <StatusPill status={shop.status} size="sm" />
            <StatusPill status={shop.seatStatus} size="sm" />
          </div>
        </div>
        <button
          onClick={() => navigate(`/student/bulk-order?shopId=${id}`)}
          className="btn-secondary !py-2 text-sm shrink-0"
        >
          <Users className="w-4 h-4" /> Bulk order
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-ink-300 absolute left-4 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu…" className="input pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCategory('')} className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${!category ? 'bg-indigo-500 text-white' : 'bg-white border border-cream-300 text-ink-700'}`}>All</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${category === c ? 'bg-indigo-500 text-white' : 'bg-white border border-cream-300 text-ink-700'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <FoodCard
            key={item.id}
            item={item}
            isFavorite={favorites.has(item.id)}
            onToggleFavorite={toggleFavorite}
            quantity={cart[item.id] || 0}
            onAdd={handleAdd}
            onIncrement={() => setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
            onDecrement={() => setCart((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }))}
          />
        ))}
      </div>

      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Button onClick={() => setCheckoutOpen(true)} className="shadow-lift px-6">
            <ShoppingBag className="w-4 h-4" /> {cartItems.length} item{cartItems.length > 1 ? 's' : ''} · ₹{cartTotal.toFixed(0)}
          </Button>
        </div>
      )}

      <Modal open={!!customizeItem} onClose={() => setCustomizeItem(null)} title={`Customize ${customizeItem?.name || ''}`}>
        {customizeItem && (
          <div>
            <p className="text-sm text-ink-500 mb-3">{customizeItem.customizations[0].name}</p>
            <div className="space-y-2 mb-5">
              {customizeItem.customizations[0].options.map((opt) => (
                <label key={opt.label} className="flex items-center justify-between p-2.5 rounded-xl border border-cream-300 cursor-pointer">
                  <span className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={pendingSelection.includes(opt.label)}
                      onChange={(e) => setPendingSelection((prev) => (e.target.checked ? [...prev, opt.label] : prev.filter((l) => l !== opt.label)))}
                    />
                    {opt.label}
                  </span>
                  <span className="font-mono text-xs text-ink-500">+₹{Number(opt.extraPrice).toFixed(0)}</span>
                </label>
              ))}
            </div>
            <Button onClick={confirmCustomization} className="w-full">Add to order</Button>
          </div>
        )}
      </Modal>

      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Confirm your order">
        <ul className="space-y-2 mb-4">
          {cartItems.map(([itemId, qty]) => {
            const item = items.find((i) => i.id === itemId);
            const unit = unitPriceFor(item, cartCustomizations[itemId]);
            const selected = cartCustomizations[itemId];
            return (
              <li key={itemId} className="text-sm">
                <div className="flex justify-between">
                  <span>{qty} × {item.name}</span>
                  <span className="font-mono">₹{(qty * unit).toFixed(0)}</span>
                </div>
                {selected?.length > 0 && <p className="text-xs text-ink-500 mt-0.5">+ {selected.join(', ')}</p>}
              </li>
            );
          })}
        </ul>
        <div className="flex justify-between font-semibold pt-3 border-t border-cream-200 mb-5">
          <span>Total</span>
          <span className="font-mono">₹{cartTotal.toFixed(0)}</span>
        </div>

        <label className="label">Payment method</label>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setPaymentMethod('ONLINE')} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${paymentMethod === 'ONLINE' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-cream-300'}`}>Pay Online</button>
          <button onClick={() => setPaymentMethod('COD')} className={`flex-1 py-2 rounded-xl text-sm font-medium border ${paymentMethod === 'COD' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-cream-300'}`}>Cash on Pickup</button>
        </div>

        <Button onClick={placeOrder} disabled={placing} className="w-full">
          {placing ? 'Placing order…' : 'Place order'}
        </Button>
      </Modal>
    </div>
  );
}
