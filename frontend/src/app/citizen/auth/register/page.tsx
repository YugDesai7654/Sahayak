'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

const STATES = ['Gujarat', 'Rajasthan', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'West Bengal', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Odisha', 'Punjab', 'Haryana'];

export default function CitizenRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', phone: '', state: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Password must be min 8 chars with 1 uppercase and 1 number'); return;
    }
    setLoading(true);
    try {
      await authApi.register(form);
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => router.push('/citizen/auth/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center p-4">
      <div className="tricolor-gradient fixed top-0 left-0 right-0" />
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">S</div>
          <h1 className="text-2xl font-extrabold text-white">Create Sahayak Account</h1>
        </div>
        <form onSubmit={handleSubmit} className="card p-8 space-y-4">
          {error && <div className="bg-red-50 text-danger px-4 py-3 rounded-xl text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-success px-4 py-3 rounded-xl text-sm">{success}</div>}
          <div><label className="label">Full Name</label><input value={form.name} onChange={e => update('name', e.target.value)} className="input-field" required /></div>
          <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-field" required /></div>
          <div><label className="label">Phone</label><input value={form.phone} onChange={e => update('phone', e.target.value)} className="input-field" placeholder="+91..." required /></div>
          <div><label className="label">State</label>
            <select value={form.state} onChange={e => update('state', e.target.value)} className="input-field" required>
              <option value="">Select state</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Password</label><input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input-field" required /></div>
          <div><label className="label">Confirm Password</label><input type="password" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} className="input-field" required /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Creating...' : 'Create Account'}</button>
          <p className="text-center text-sm text-gray-500">Already have an account? <Link href="/citizen/auth/login" className="text-primary font-semibold hover:underline">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
