import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ClipboardList, Boxes, QrCode, LineChart, ArrowRight } from 'lucide-react';
import * as shopsApi from '../../services/shops';
import * as vendorApi from '../../services/vendor';
import Input from '../../components/Input';
import Button from '../../components/Button';

const TUTORIAL_STEPS = [
  { icon: LayoutDashboard, title: 'Your dashboard', body: "See today's revenue, pending orders, and kitchen load at a glance." },
  { icon: ClipboardList, title: 'Orders', body: 'Accept, prepare, and mark orders ready — students get live updates automatically.' },
  { icon: Boxes, title: 'Inventory', body: 'Enter opening stock once. It deducts automatically with every order and flags low stock.' },
  { icon: QrCode, title: 'QR pickup', body: 'Scan a student\'s QR at pickup to verify and complete the order — duplicates are blocked.' },
  { icon: LineChart, title: 'Reports & analytics', body: 'Revenue, best sellers, and AI insights — all generated from your real orders.' },
];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState('shop'); // shop | tutorial
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [form, setForm] = useState({ name: '', description: '', location: '', openingTime: '09:00', closingTime: '18:00' });
  const [loading, setLoading] = useState(false);

  const createShop = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await shopsApi.createShop(form);
      setStep('tutorial');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create shop');
    } finally {
      setLoading(false);
    }
  };

  const finishTutorial = async () => {
    await vendorApi.markTutorialSeen();
    navigate('/vendor');
  };

  if (step === 'shop') {
    return (
      <div className="max-w-lg mx-auto py-10">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Set up your shop</h1>
        <p className="text-ink-500 text-sm mt-1.5 mb-8">This is what students will see when browsing canteens.</p>

        <form onSubmit={createShop} className="card p-6 space-y-4">
          <Input label="Shop name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="The Daily Grind" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="South Indian breakfast & filter coffee" />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Block C, Ground Floor" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Opening time" type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} />
            <Input label="Closing time" type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating…' : 'Create shop'}</Button>
        </form>
      </div>
    );
  }

  const StepIcon = TUTORIAL_STEPS[tutorialIndex].icon;
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <AnimatePresence mode="wait">
        <motion.div key={tutorialIndex} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <StepIcon className="w-8 h-8 text-indigo-500" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink-900">{TUTORIAL_STEPS[tutorialIndex].title}</h2>
          <p className="text-ink-500 text-sm mt-2">{TUTORIAL_STEPS[tutorialIndex].body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-1.5 mt-8">
        {TUTORIAL_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i === tutorialIndex ? 'w-6 bg-indigo-500' : 'w-1.5 bg-cream-300'}`} />
        ))}
      </div>

      <Button
        className="mt-8"
        onClick={() => (tutorialIndex < TUTORIAL_STEPS.length - 1 ? setTutorialIndex((i) => i + 1) : finishTutorial())}
      >
        {tutorialIndex < TUTORIAL_STEPS.length - 1 ? 'Next' : "Let's go"} <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
