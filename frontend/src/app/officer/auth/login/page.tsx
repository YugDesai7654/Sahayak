'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';

export default function OfficerLogin() {
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
      const res = await authApi.officerLogin(email, password);
      setUser(res.user);
      router.push('/officer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4">
      <div className="tricolor-gradient fixed top-0 left-0 right-0" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-tricolor-green rounded-2xl flex items-center justify-center text-2xl text-white mx-auto mb-4">🏛️</div>
          <h1 className="text-3xl font-extrabold text-white">Officer Portal</h1>
          <p className="text-gray-400 mt-1">Sahayak Verification System</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          <h2 className="text-xl font-bold text-gray-800">Officer Sign In</h2>
          {error && <div className="bg-red-50 text-danger px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div><label className="label">Official Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="officer@sahayak.gov.in" required /></div>
          <div><label className="label">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required /></div>
          <button type="submit" disabled={loading} className="w-full bg-tricolor-green text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
