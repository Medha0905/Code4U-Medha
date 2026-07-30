import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function DashboardLayout({ navItems, brandLabel }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const navigate = useNavigate();

  const displayName = user?.student?.fullName || user?.vendor?.fullName || user?.admin?.fullName || 'there';

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-cream-300/60 bg-white/60 backdrop-blur-sm px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-display font-bold">S</div>
          <div>
            <p className="font-display font-semibold text-ink-900 leading-tight">Smart Canteen</p>
            <p className="text-xs text-ink-500">{brandLabel}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end, tourId }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-tour={tourId}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-500 text-white shadow-soft' : 'text-ink-700 hover:bg-cream-200'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" strokeWidth={1.9} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-ink-500 hover:bg-cream-200 hover:text-rose-500 transition-colors"
        >
          <LogOut className="w-4.5 h-4.5" strokeWidth={1.9} />
          Log out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-cream-300/60 bg-white/60 backdrop-blur-sm flex items-center justify-between px-6">
          <p className="text-sm text-ink-500">
            Welcome back, <span className="text-ink-900 font-medium">{displayName}</span>
          </p>
          <div className="flex items-center gap-3">
            <NavLink to="notifications" className="relative w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors">
              <Bell className="w-4.5 h-4.5 text-ink-700" strokeWidth={1.9} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center"
                >
                  {unreadCount}
                </motion.span>
              )}
            </NavLink>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
