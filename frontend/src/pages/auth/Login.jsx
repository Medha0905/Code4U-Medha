import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.student?.fullName || user.vendor?.fullName || user.admin?.fullName}`);
      navigate(user.role === 'STUDENT' ? '/student' : user.role === 'VENDOR' ? '/vendor' : '/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Log in</h1>
      <p className="text-ink-500 text-sm mt-1.5">Welcome back to your canteen.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@college.edu" />
        <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="text-sm text-ink-500 mt-6 text-center">
        New here?{' '}
        <Link to="/register/student" className="text-indigo-600 font-medium hover:underline">Create a student account</Link>
        {' '}or{' '}
        <Link to="/register/vendor" className="text-indigo-600 font-medium hover:underline">register your shop</Link>
      </p>
    </div>
  );
}
