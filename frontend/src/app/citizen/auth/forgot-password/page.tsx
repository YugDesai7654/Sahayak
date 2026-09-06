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
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative overflow-hidden [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="civic-tricolor-thread fixed top-0 left-0 right-0 z-50" />

      {/* Floating Island Header */}
      <header className="pt-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between py-3 px-5 rounded-full bg-white/80 backdrop-blur-md shadow-[0_4px_20px_rgba(15,30,54,0.04)] ring-1 ring-black/[0.06]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#0f1e36] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              स
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#0f1e36]">SAHAYAK</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold tracking-wider uppercase text-[#c25e00] bg-amber-500/10 px-2 py-0.5 rounded-full">
                CREDENTIAL RECOVERY
              </span>
            </div>
          </Link>

          <Link
            href="/citizen/auth/login"
            className="text-xs font-semibold px-4 py-2 rounded-full text-[#0f1e36] bg-black/[0.04] hover:bg-black/[0.08] transition-all duration-300"
          >
            ← Back to Login
          </Link>
        </div>
      </header>

      {/* Double-Bezel Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bezel-shell">
            <div className="bezel-core p-8 sm:p-10 space-y-6">
              
              <div className="text-center space-y-2">
                <span className="eyebrow-pill">Security Recovery</span>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f1e36]">
                  Account Recovery
                </h1>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Receive a cryptographically verified token to regain access to your civic profile.
                </p>
              </div>

              {sent ? (
                <div className="p-5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#0d7a53]">
                    <span>✓</span> Recovery Instructions Dispatched
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    If an active citizen record corresponds to that email address, an account recovery link has been issued. Check your email inbox to proceed.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Registered Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="citizen@example.com"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-island-primary w-full group cursor-pointer disabled:opacity-50"
                    >
                      <span>{loading ? 'Issuing Recovery Token...' : 'Send Recovery Token'}</span>
                      <span className="btn-island-icon">
                        {loading ? '⋯' : '→'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
                <Link href="/citizen/auth/login" className="font-semibold text-[#0f1e36] hover:underline">
                  Return to Citizen Login
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center text-xs text-gray-400">
        Sahayak Civic Access Infrastructure • Government Scheme Discovery & Auto-Matching
      </footer>
    </div>
  );
}
