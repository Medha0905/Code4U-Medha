import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Clock, LineChart } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream-100">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-display font-bold">S</div>
          <span className="font-display font-semibold text-ink-900">Smart Canteen</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/register/student" className="btn-primary">Get started</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-indigo-600 font-medium text-sm mb-3">Real queues. Real inventory. Real time.</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight">
            Order ahead.<br />Watch your token move.<br />Walk in when it's ready.
          </h1>
          <p className="text-ink-500 mt-5 max-w-md">
            Smart Canteen replaces the physical line with a live queue, AI wait-time
            predictions, and a QR pickup ticket — for students and vendors alike.
          </p>
          <div className="flex gap-3 mt-8">
            <Link to="/register/student" className="btn-primary">I'm a student</Link>
            <Link to="/register/vendor" className="btn-secondary">I run a shop</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="ticket flex">
          <div className="flex-1 p-6">
            <p className="text-xs uppercase tracking-wide text-ink-500 font-medium mb-3">The Daily Grind</p>
            <ul className="space-y-1.5 text-sm text-ink-700">
              <li className="flex justify-between"><span>1 × Masala Dosa</span><span className="font-mono">₹80</span></li>
              <li className="flex justify-between"><span>1 × Filter Coffee</span><span className="font-mono">₹30</span></li>
            </ul>
            <div className="flex items-center gap-4 pt-3 mt-3 border-t border-cream-200 text-sm text-ink-700">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> ~8 min</span>
              <span>2 orders ahead</span>
            </div>
          </div>
          <div className="ticket-perforation flex flex-col items-center justify-center gap-3 p-6 w-40">
            <div className="w-24 h-24 rounded-lg bg-cream-200 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-ink-300" />
            </div>
            <p className="font-mono text-xl font-semibold tracking-wider text-indigo-600">#1042</p>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-6">
        {[
          { icon: Clock, title: 'AI wait-time prediction', body: 'Know exactly when to walk in — no more standing in line to find out.' },
          { icon: QrCode, title: 'QR pickup tokens', body: 'Scan, verify, done. No duplicate collections, no manual bookkeeping.' },
          { icon: LineChart, title: 'Vendor analytics', body: 'Revenue, demand patterns, and end-of-day reports — all from real orders.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="font-display font-semibold text-ink-900">{title}</h3>
            <p className="text-sm text-ink-500 mt-1.5">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
