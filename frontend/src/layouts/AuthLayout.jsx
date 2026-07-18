import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-cream-100">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-indigo-500 text-white relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-indigo-400/40" />
        <div className="absolute -left-16 bottom-10 w-56 h-56 rounded-full bg-indigo-600/40" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-display font-bold">S</div>
          <span className="font-display font-semibold">Smart Canteen</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-sm">
          <p className="font-display text-3xl font-semibold leading-snug">
            Skip the line. Watch your token move. Walk in right as it's ready.
          </p>
          <p className="text-indigo-100 mt-4 text-sm">
            Real queues, real inventory, real pickup times — no guessing, no standing around.
          </p>
        </motion.div>

        <p className="relative z-10 text-xs text-indigo-100">© {new Date().getFullYear()} Smart Canteen</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
