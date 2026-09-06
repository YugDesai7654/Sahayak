'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';

export default function AdminLogin() {
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
      const res = await authApi.adminLogin(email.trim().toLowerCase(), password);
      setUser(res.user);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('admin@sahayak.gov.in');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative overflow-hidden [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="civic-tricolor-thread fixed top-0 left-0 right-0 z-50" />

      {/* Floating Island Header */}
      <header className="pt-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between py-3 px-5 rounded-full bg-white/80 backdrop-blur-md shadow-[0_4px_20px_rgba(15,30,54,0.04)] ring-1 ring-black/[0.06]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#c25e00] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              ⚙
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#0f1e36]">SAHAYAK</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold tracking-wider uppercase text-[#c25e00] bg-amber-500/10 px-2 py-0.5 rounded-full">
                ADMINISTRATION CONSOLE
              </span>
            </div>
          </Link>

          <Link
            href="/citizen/auth/login"
            className="text-xs font-semibold px-4 py-2 rounded-full text-[#0f1e36] bg-black/[0.04] hover:bg-black/[0.08] transition-all duration-300"
          >
            Citizen Portal →
          </Link>
        </div>
      </header>

      {/* Double-Bezel Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bezel-shell">
            <div className="bezel-core p-8 sm:p-10 space-y-6">
              
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.2em] bg-amber-500/10 text-[#c25e00] border border-amber-500/20">
                  System Administration
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f1e36]">
                  Admin Sign In
                </h1>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Configure statutory welfare schemes, eligibility rules, and platform security keys.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-sm font-medium border border-rose-200/80 flex items-start gap-3">
                  <span className="text-base leading-none">⚠️</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Admin Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="admin@sahayak.gov.in"
                    required
                  />
                </div>

                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-between w-full px-7 py-3.5 rounded-full bg-[#0f1e36] text-white font-semibold text-[15px] shadow-[0_10px_25px_-5px_rgba(15,30,54,0.25)] hover:bg-[#1a2f52] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Authenticating...' : 'Enter Admin Console'}</span>
                    <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                      {loading ? '⋯' : '→'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Instant Test Credentials Pill */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={fillTestCredentials}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 text-left flex items-center justify-between text-xs text-[#c25e00] transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold">Admin Demo: </span>
                    <span className="text-gray-600">admin@sahayak.gov.in / Admin@123</span>
                  </div>
                  <span className="font-semibold underline">Use</span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
                Administrative actions require active multi-factor session audit.
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center text-xs text-gray-400">
        Sahayak Civic Access Infrastructure • System Administration
      </footer>
    </div>
  );
}
