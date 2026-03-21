'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';

export default function CitizenLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setUser(res.user);
      router.push('/citizen/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center p-4">
      <div className="tricolor-gradient fixed top-0 left-0 right-0" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">S</div>
          <h1 className="text-3xl font-extrabold text-white">Sahayak</h1>
          <p className="text-blue-200 mt-1">Citizen Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          <h2 className="text-2xl font-bold text-gray-800">Sign in to your account</h2>
          {error && <div className="bg-red-50 text-danger px-4 py-3 rounded-xl text-sm font-medium">{error}</div>}
          <div>
            <label className="label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="test@citizen.in" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
          </div>
          <div className="flex justify-between items-center text-sm">
            <Link href="/citizen/auth/forgot-password" className="text-primary font-medium hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account? <Link href="/citizen/auth/register" className="text-primary font-semibold hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
