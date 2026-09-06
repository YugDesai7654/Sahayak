'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

const STATES = [
  'Gujarat', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Tamil Nadu',
  'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'West Bengal', 'Kerala',
  'Andhra Pradesh', 'Telangana', 'Odisha', 'Punjab', 'Haryana'
];

export default function CitizenRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    state: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address with a domain (e.g. citizen@example.com)');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
      setError('Password must be at least 8 characters with 1 uppercase letter and 1 number');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ ...form, email: trimmedEmail });
      setSuccess('Civic profile registered successfully! Redirecting to secure login...');
      setTimeout(() => router.push('/citizen/auth/login'), 1800);
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative overflow-hidden [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Delicate Sovereign Tricolor Accent Thread */}
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

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden md:inline">Already registered?</span>
            <Link
              href="/citizen/auth/login"
              className="text-xs font-semibold px-4 py-2 rounded-full text-[#0f1e36] bg-black/[0.04] hover:bg-black/[0.08] transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: The Editorial Split */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 lg:py-16 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Left Column: Editorial & Sovereign Identity Showcase */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="eyebrow-pill">
                National Welfare Registry • IndiaStack
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0f1e36] leading-[1.12]">
                Sovereign Welfare Access for Every Household
              </h1>
              <p className="text-base text-gray-600 leading-relaxed max-w-lg">
                Discover statutory central and state entitlements, receive cryptographic QR credentials, and track direct benefit transfers without administrative friction.
              </p>
            </div>

            {/* Asymmetrical Bento Cards (Double-Bezel Preview) */}
            <div className="space-y-4 pt-2">
              <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-black/[0.02] to-black/[0.06] shadow-sm ring-1 ring-black/[0.05]">
                <div className="p-5 rounded-[calc(1.75rem-0.25rem)] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-[#0d7a53] flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        OFFLINE IDENTITY WALLET
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      RS256 SIGNED
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    Tamper-proof QR card verifiable at any Taluka Seva Kendra without continuous internet access.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-black/[0.05] space-y-1">
                  <div className="text-xl font-extrabold text-[#0f1e36]">100%</div>
                  <div className="text-xs font-semibold text-gray-500">Paperless Delivery</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-black/[0.05] space-y-1">
                  <div className="text-xl font-extrabold text-[#c25e00]">0 Middlemen</div>
                  <div className="text-xs font-semibold text-gray-500">Direct DBT Entitlement</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Double-Bezel Registration Architecture */}
          <div className="lg:col-span-7">
            <div className="bezel-shell max-w-xl mx-auto lg:ml-auto">
              <div className="bezel-core p-6 sm:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#0f1e36]">
                    Create Citizen Account
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your civic information to calculate household scheme eligibility.
                  </p>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-sm font-medium border border-rose-200/80 flex items-start gap-3">
                    <span className="text-base leading-none">⚠️</span>
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-sm font-medium border border-emerald-200/80 flex items-start gap-3">
                    <span className="text-base leading-none">✓</span>
                    <span className="flex-1">{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Legal Name</label>
                      <input
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Rajesh Kumar Patel"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">State of Domicile</label>
                      <select
                        value={form.state}
                        onChange={e => update('state', e.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="">Select state</option>
                        {STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => update('email', e.target.value)}
                        className="input-field"
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Mobile Number (10 Digits)</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => update('phone', e.target.value)}
                        className="input-field"
                        placeholder="e.g. 9876543210"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Account Password</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => update('password', e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Confirm Password</label>
                      <input
                        type="password"
                        value={form.confirm_password}
                        onChange={e => update('confirm_password', e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] text-gray-500 mb-4">
                      Password must be at least 8 characters with 1 uppercase letter and 1 number. By registering, you consent to digital scheme auto-matching in accordance with IndiaStack privacy principles.
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-island-primary w-full group cursor-pointer disabled:opacity-50"
                    >
                      <span>{loading ? 'Registering Citizen Profile...' : 'Complete Registration'}</span>
                      <span className="btn-island-icon">
                        {loading ? '⋯' : '→'}
                      </span>
                    </button>
                  </div>
                </form>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Protected by 2048-bit RS256</span>
                  <Link href="/citizen/auth/login" className="font-semibold text-[#0f1e36] hover:underline">
                    Existing User? Sign in
                  </Link>
                </div>
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
