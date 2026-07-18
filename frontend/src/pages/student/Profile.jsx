import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function Profile() {
  const { user } = useAuth();
  const student = user?.student;
  const [form] = useState({ fullName: student?.fullName || '', phone: student?.phone || '', email: user?.email || '' });

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">Profile</h1>
      <p className="text-ink-500 text-sm mb-6">Your account details.</p>

      <div className="card p-6 space-y-4">
        <Input label="Full name" value={form.fullName} disabled />
        <Input label="Email" value={form.email} disabled />
        <Input label="Phone" value={form.phone} disabled placeholder="Not set" />
        <Button variant="secondary" className="w-full" disabled>Edit profile (coming soon)</Button>
      </div>
    </div>
  );
}
