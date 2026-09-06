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
      const res = await authApi.login(email.trim().toLowerCase(), password);
      setUser(res.user);
      router.push('/citizen/dashboard');
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('test@citizen.in');
    setPassword('Citizen@123');
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative overflow-hidden [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Subtle Sovereign Tricolor Accent Thread */}
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
                CIVIC PORTAL
              </span>
            </div>
          </Link>

          <Link
            href="/citizen/auth/register"
            className="text-xs font-semibold px-4 py-2 rounded-full text-[#0f1e36] bg-black/[0.04] hover:bg-black/[0.08] transition-all duration-300"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Centerpiece: Double-Bezel Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bezel-shell">
            <div className="bezel-core p-8 sm:p-10 space-y-6">
              
              <div className="text-center space-y-2">
                <span className="eyebrow-pill">Citizen Access</span>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f1e36]">
                  Sign In to Sahayak
                </h1>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Access your sovereign welfare dossier, entitlement score, and offline QR card.
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
                  <label className="label">Registered Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label !mb-0">Password</label>
                    <Link
                      href="/citizen/auth/forgot-password"
                      className="text-xs text-gray-500 hover:text-[#0f1e36] hover:underline transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
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
                    className="btn-island-primary w-full group cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                    <span className="btn-island-icon">
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
                    <span className="font-bold">Demo Account: </span>
                    <span className="text-gray-600">test@citizen.in / Citizen@123</span>
                  </div>
                  <span className="font-semibold underline">Use</span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>New to Sahayak?</span>
                <Link href="/citizen/auth/register" className="font-semibold text-[#0f1e36] hover:underline">
                  Create new account
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-6 px-4 text-center text-xs text-gray-400">
        Sahayak Civic Access Infrastructure • Government Scheme Discovery & Auto-Matching
      </footer>
    </div>
  );
}
