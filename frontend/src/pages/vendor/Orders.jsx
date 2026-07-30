import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { QrCode, ClipboardList, Camera, Keyboard } from 'lucide-react';
import * as ordersApi from '../../services/orders';
import StatusPill from '../../components/StatusPill';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import { getSocket } from '../../services/socket';
import QrScanner from '../../components/QrScanner';
import ErrorBoundary from '../../components/ErrorBoundary';
import OrderChat from '../../components/OrderChat';

const NEXT_STATUS = { PLACED: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'READY' };
const NEXT_LABEL = { PLACED: 'Accept', ACCEPTED: 'Start preparing', PREPARING: 'Mark ready' };

export default function VendorOrders() {
  const [orders, setOrders] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState('camera'); // camera | manual
  const [cameraError, setCameraError] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState(null);

  const load = () => ordersApi.getShopOrders().then(setOrders).catch(() => setOrders([]));

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket.on('order:status', refresh);
    return () => socket.off('order:status', refresh);
  }, []);

  const advance = async (order, waitBucket) => {
    const nextStatus = NEXT_STATUS[order.status];
    const previousOrders = orders;

    // Optimistic update: reflect the change instantly, before the server confirms,
    // so the vendor's UI feels immediate during a busy rush instead of waiting on
    // a network round-trip. Reconciled with real data via load(); rolled back on error.
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus, waitBucket: waitBucket || o.waitBucket } : o)));

    try {
      await ordersApi.updateOrderStatus(order.id, nextStatus, waitBucket);
      toast.success('Order updated');
      load();
    } catch (err) {
      setOrders(previousOrders); // roll back on failure
      toast.error(err.response?.data?.message || 'Could not update order');
    }
  };

  const noShow = async (order) => {
    try {
      const res = await ordersApi.markNoShow(order.id);
      toast(res.message, { icon: '⚠️' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record no-show');
    }
  };

  const scan = async (rawToken) => {
    const value = (rawToken ?? tokenInput).trim();
    if (!value) return toast.error('Scan or paste a pickup code first');
    try {
      const res = await ordersApi.scanQr(value);
      setTokenInput(value);
      setScanResult(res);
    } catch (err) {
      toast.error(err.response?.data?.message === 'Invalid QR token'
        ? "That code doesn't match any order — make sure you're scanning the student's QR, not typing the order number (#1042)."
        : err.response?.data?.message || 'Invalid QR token');
    }
  };

  const handleCameraScan = (decodedText) => {
    setScanMode('manual');
    scan(decodedText);
  };

  const complete = async () => {
    try {
      await ordersApi.completeScan(tokenInput.trim());
      toast.success('Order completed');
      setScanOpen(false);
      setScanResult(null);
      setTokenInput('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not complete order');
    }
  };

  const activeOrders = orders ? orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Orders</h1>
          <p className="text-ink-500 text-sm mt-1">Manage the live order pipeline.</p>
        </div>
        <Button onClick={() => setScanOpen(true)}><QrCode className="w-4 h-4" /> Scan pickup</Button>
      </div>

      <AnimatePresence mode="wait">
        {!orders ? (
          <motion.div key="skeleton" exit={{ opacity: 0 }} className="grid gap-4">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </motion.div>
        ) : activeOrders.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState icon={ClipboardList} title="No active orders" description="New orders will appear here in real time." />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {activeOrders.map((o) => (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="card p-4"
                >
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono font-semibold text-indigo-600">#{o.tokenNumber}</p>
                <StatusPill status={o.status} size="sm" />
              </div>
              <p className="text-sm text-ink-700 font-medium">{o.student?.user ? o.student.fullName : 'Student'}</p>
              <ul className="text-sm text-ink-500 mt-1.5 space-y-0.5">
                {o.items.map((it) => <li key={it.id}>{it.quantity} × {it.menuItem.name}</li>)}
              </ul>
              {o.waitBucket && (
                <p className="text-xs text-indigo-500 mt-1.5">
                  Promised: {o.waitBucket === 'UNDER_20' ? 'under 20 min' : '20+ min'}
                </p>
              )}
              <div className="flex items-center gap-2 mt-4">
                {o.status === 'PLACED' ? (
                  <>
                    <Button onClick={() => advance(o, 'UNDER_20')} className="!py-2 text-xs flex-1">Accept · Under 20 min</Button>
                    <Button onClick={() => advance(o, 'OVER_20')} variant="secondary" className="!py-2 text-xs flex-1">Accept · 20+ min</Button>
                  </>
                ) : (
                  NEXT_STATUS[o.status] && (
                    <Button onClick={() => advance(o)} className="!py-2 text-sm flex-1">{NEXT_LABEL[o.status]}</Button>
                  )
                )}
                {o.paymentMethod === 'COD' && o.status !== 'READY' && (
                  <button onClick={() => noShow(o)} className="btn-ghost !py-2 text-sm text-rose-500">No-show</button>
                )}
              </div>
              <OrderChat orderId={o.id} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={scanOpen}
        onClose={() => { setScanOpen(false); setScanResult(null); setTokenInput(''); setCameraError(''); setScanMode('camera'); }}
        title="Scan pickup QR"
      >
        {!scanResult ? (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setScanMode('camera')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5 ${scanMode === 'camera' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-cream-300 text-ink-700'}`}
              >
                <Camera className="w-4 h-4" /> Scan with camera
              </button>
              <button
                onClick={() => setScanMode('manual')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-1.5 ${scanMode === 'manual' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-cream-300 text-ink-700'}`}
              >
                <Keyboard className="w-4 h-4" /> Enter manually
              </button>
            </div>

            {scanMode === 'camera' ? (
              <div>
                <ErrorBoundary>
                  <QrScanner onScan={handleCameraScan} onError={setCameraError} />
                </ErrorBoundary>
                {cameraError && (
                  <p className="text-xs text-rose-500 mt-2">
                    {cameraError} — you can switch to "Enter manually" instead.
                  </p>
                )}
                <p className="text-xs text-ink-500 mt-2">Point the camera at the student's QR code shown on their order ticket.</p>
              </div>
            ) : (
              <>
                <Input
                  label="Pickup code"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste the long pickup code from the student's ticket"
                />
                <p className="text-xs text-ink-500 mt-1.5">
                  This is the small code printed under the QR — not the order number (#1042).
                </p>
                <Button onClick={() => scan()} className="w-full mt-4">Verify</Button>
              </>
            )}
          </>
        ) : scanResult.alreadyScanned ? (
          <div className="text-center py-4">
            <p className="font-medium text-rose-500">This order has already been collected.</p>
          </div>
        ) : (
          <div>
            <p className="font-mono font-semibold text-indigo-600 text-lg mb-2">#{scanResult.order.tokenNumber}</p>
            <p className="text-sm text-ink-700 font-medium">{scanResult.order.studentName}</p>
            <ul className="text-sm text-ink-500 mt-2 space-y-0.5">
              {scanResult.order.items.map((it, i) => <li key={i}>{it.quantity} × {it.name}</li>)}
            </ul>
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-cream-200">
              <span>{scanResult.order.paymentMethod} · {scanResult.order.paymentStatus}</span>
              <span className="font-mono font-semibold">₹{Number(scanResult.order.totalAmount).toFixed(0)}</span>
            </div>
            <Button onClick={complete} className="w-full mt-4">Complete order</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
