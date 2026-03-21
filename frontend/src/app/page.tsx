'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white">
      {/* Tricolor band */}
      <div className="tricolor-gradient" />

      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-bold text-lg">S</div>
          <span className="text-xl font-bold">Sahayak</span>
        </div>
        <div className="flex gap-3">
          <Link href="/citizen/auth/login" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium">
            Citizen Login
          </Link>
          <Link href="/officer/auth/login" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium">
            Officer
          </Link>
          <Link href="/admin/auth/login" className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-light transition text-sm font-medium">
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="page-enter">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/20 rounded-full text-accent-light text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Offline-First Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Your Gateway to<br />
              <span className="text-accent">Government Schemes</span>
            </h1>
            <p className="text-lg text-blue-200 mb-8 leading-relaxed max-w-lg">
              Discover, match, and apply for government welfare schemes instantly.
              Works offline. Multilingual. Powered by AI matching.
            </p>
            <div className="flex gap-4">
              <Link href="/citizen/auth/register" className="btn-accent text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl">
                Get Started Free
              </Link>
              <Link href="/citizen/auth/login" className="btn-secondary text-lg px-8 py-4 rounded-2xl border-white/30 text-white hover:bg-white/10">
                Sign In
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              {/* Mock QR Card */}
              <div className="qr-card p-8 mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="h-1 bg-gradient-to-r from-saffron via-white to-tricolor-green rounded-full mb-4" />
                <p className="text-center text-xs opacity-70 mb-1">GOVERNMENT OF INDIA</p>
                <p className="text-center font-bold text-sm mb-6">SAHAYAK CIVIC IDENTITY</p>
                <div className="w-32 h-32 mx-auto bg-white/20 rounded-lg mb-4 flex items-center justify-center text-4xl">
                  📱
                </div>
                <p className="text-center font-bold text-lg">RAMESH SOLANKI</p>
                <p className="text-center opacity-70 text-sm">SAH-2024-GJ-00001</p>
                <div className="flex justify-between mt-4 text-xs opacity-60">
                  <span>Gujarat | SC</span>
                  <span>Valid: 2025</span>
                </div>
              </div>

              {/* Floating stats */}
              <div className="absolute -top-4 -left-4 bg-white text-primary rounded-2xl p-4 shadow-xl">
                <p className="text-2xl font-extrabold">15+</p>
                <p className="text-xs font-medium opacity-60">Govt Schemes</p>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent text-white rounded-2xl p-4 shadow-xl">
                <p className="text-2xl font-extrabold">₹6L+</p>
                <p className="text-xs font-medium opacity-80">Benefits/year</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          {[
            { icon: '🎯', title: 'Auto-Match Schemes', desc: 'AI matches your profile to eligible government schemes instantly — even offline.' },
            { icon: '📱', title: 'QR Identity Card', desc: 'Digital government ID with signed QR code. Works at any government office.' },
            { icon: '🔒', title: 'Offline-First', desc: 'Everything works without internet. Data syncs automatically when connected.' },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <p className="text-center text-sm opacity-50">© 2024 Sahayak — Government Scheme Auto-Matcher | Built for Digital India</p>
      </footer>
    </div>
  );
}
