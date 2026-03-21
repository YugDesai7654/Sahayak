'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch { setSent(true); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 space-y-5">
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          {sent ? (
            <div className="bg-green-50 text-success p-4 rounded-xl">If an account exists with that email, a reset link has been sent.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-600 text-sm">Enter your email and we'll send you a password reset link.</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="Email address" required />
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send Reset Link'}</button>
            </form>
          )}
          <Link href="/citizen/auth/login" className="block text-center text-primary text-sm font-medium hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
