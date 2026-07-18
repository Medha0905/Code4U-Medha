import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function RegisterVendor() {
  const { registerVendor } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerVendor(form);
      toast.success('Vendor account created — let\'s set up your shop');
      navigate('/vendor/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Register your shop</h1>
      <p className="text-ink-500 text-sm mt-1.5">Manage orders, inventory, and analytics from one dashboard.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="Your name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Owner / manager name" />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="shop@college.edu" />
        <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
        <Input label="Password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create vendor account'}
        </Button>
      </form>

      <p className="text-sm text-ink-500 mt-6 text-center">
        Already registered? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
