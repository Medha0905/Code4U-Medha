import { Routes, Route } from 'react-router-dom';
import { Home, UtensilsCrossed, ClipboardList, Heart, User, Store, LayoutDashboard, Users2, GraduationCap } from 'lucide-react';

import Landing from './pages/Landing';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/auth/Login';
import RegisterStudent from './pages/auth/RegisterStudent';
import RegisterVendor from './pages/auth/RegisterVendor';

import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import StudentHome from './pages/student/Home';
import ShopDetail from './pages/student/ShopDetail';
import StudentOrders from './pages/student/Orders';
import Favorites from './pages/student/Favorites';
import Profile from './pages/student/Profile';
import BulkOrder from './pages/student/BulkOrder';

import VendorOnboarding from './pages/vendor/Onboarding';
import VendorHome from './pages/vendor/Home';
import VendorMenu from './pages/vendor/Menu';
import VendorOrders from './pages/vendor/Orders';
import VendorAnalytics from './pages/vendor/Analytics';
import VendorShop from './pages/vendor/Shop';
import VendorBulkOrders from './pages/vendor/BulkOrders';

import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminVendors from './pages/admin/Vendors';
import Notifications from './pages/shared/Notifications';

const studentNav = [
  { to: '/student', label: 'Home', icon: Home, end: true },
  { to: '/student/bulk-order', label: 'Bulk Order', icon: UtensilsCrossed },
  { to: '/student/orders', label: 'Orders', icon: ClipboardList },
  { to: '/student/favorites', label: 'Favorites', icon: Heart },
  { to: '/student/profile', label: 'Profile', icon: User },
];

const vendorNav = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard, end: true, tourId: 'nav-dashboard' },
  { to: '/vendor/menu', label: 'Menu', icon: UtensilsCrossed, tourId: 'nav-menu' },
  { to: '/vendor/orders', label: 'Orders', icon: ClipboardList, tourId: 'nav-orders' },
  { to: '/vendor/bulk-orders', label: 'Bulk Orders', icon: Users2, tourId: 'nav-bulk' },
  { to: '/vendor/analytics', label: 'Analytics', icon: LayoutDashboard, tourId: 'nav-analytics' },
  { to: '/vendor/shop', label: 'Shop', icon: Store, tourId: 'nav-shop' },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/vendors', label: 'Vendors & Shops', icon: Store },
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register/student" element={<RegisterStudent />} />
        <Route path="/register/vendor" element={<RegisterVendor />} />
      </Route>

      <Route path="/vendor/onboarding" element={<ProtectedRoute role="VENDOR"><VendorOnboarding /></ProtectedRoute>} />

      <Route path="/student" element={<ProtectedRoute role="STUDENT"><DashboardLayout navItems={studentNav} brandLabel="Student" /></ProtectedRoute>}>
        <Route index element={<StudentHome />} />
        <Route path="shops/:id" element={<ShopDetail />} />
        <Route path="bulk-order" element={<BulkOrder />} />
        <Route path="orders" element={<StudentOrders />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/vendor" element={<ProtectedRoute role="VENDOR"><DashboardLayout navItems={vendorNav} brandLabel="Vendor" /></ProtectedRoute>}>
        <Route index element={<VendorHome />} />
        <Route path="menu" element={<VendorMenu />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="bulk-orders" element={<VendorBulkOrders />} />
        <Route path="analytics" element={<VendorAnalytics />} />
        <Route path="shop" element={<VendorShop />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><DashboardLayout navItems={adminNav} brandLabel="Admin" /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
