'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  // Benefit Estimator Interactive State
  const [stateFilter, setStateFilter] = useState('Gujarat');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [occupationFilter, setOccupationFilter] = useState('Farmer');
  const [incomeFilter, setIncomeFilter] = useState('150000');

  // Scheme estimation logic
  const getEstimatedSchemes = () => {
    let count = 4;
    const income = Number(incomeFilter);
    if (income <= 200000) count += 3;
    if (income <= 100000) count += 2;
    if (occupationFilter === 'Farmer') count += 3;
    if (occupationFilter === 'Student') count += 2;
    if (occupationFilter === 'Small Business') count += 2;
    if (categoryFilter === 'SC' || categoryFilter === 'ST' || categoryFilter === 'OBC') count += 2;
    if (stateFilter === 'Gujarat') count += 1;
    return count;
  };

  const estimatedCount = getEstimatedSchemes();
  const estimatedAid = estimatedCount * 12500;

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Sovereign Tricolor Accent Thread */}
      <div className="civic-tricolor-thread fixed top-0 left-0 right-0 z-50" />

      {/* Floating Island Header Bar */}
      <header className="pt-6 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between py-3 px-5 sm:px-6 rounded-full bg-white/85 backdrop-blur-md shadow-[0_4px_25px_rgba(15,30,54,0.04)] ring-1 ring-black/[0.06]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#0f1e36] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              स
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#0f1e36]">SAHAYAK</span>
                <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest uppercase text-[#c25e00] bg-amber-500/10 px-2 py-0.5 rounded-full">
                  CIVIC ACCESS
                </span>
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/citizen/auth/login"
              className="text-xs font-semibold px-4 py-2 rounded-full text-[#0f1e36] bg-black/[0.04] hover:bg-black/[0.08] transition-all duration-300"
            >
              Citizen Login
            </Link>
            <Link
              href="/officer/auth/login"
              className="hidden md:inline-flex text-xs font-medium text-gray-600 hover:text-[#0f1e36] px-3 py-2 rounded-full hover:bg-black/[0.03] transition-colors"
            >
              Officer Portal
            </Link>
            <Link
              href="/citizen/auth/register"
              className="btn-island-primary !py-2 !px-4 text-xs group"
            >
              <span>Get Started</span>
              <span className="btn-island-icon !w-6 !h-6 text-xs">→</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 space-y-20">
        
        {/* Hero Section: Editorial Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Hero Left Column: Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <span className="eyebrow-pill">
                National Welfare Scheme Auto-Matcher • Digital India
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0f1e36] leading-[1.1]">
                Sovereign Welfare Access for Every Citizen
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
                Single-window discovery, instant eligibility calculation, and offline-verifiable QR credentials across central and state welfare programs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/citizen/auth/register"
                className="btn-island-primary group cursor-pointer"
              >
                <span>Calculate Your Entitlement</span>
                <span className="btn-island-icon">→</span>
              </Link>
              <Link
                href="/citizen/auth/login"
                className="btn-island-secondary group cursor-pointer"
              >
                <span>Open Citizen Wallet</span>
                <span className="text-sm font-bold text-gray-400 group-hover:text-[#0f1e36] transition-colors">↗</span>
              </Link>
            </div>

            {/* High-Trust Verification Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200/80 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-[#0d7a53] flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-bold text-[#0f1e36]">RS256 Offline QR</p>
                  <p className="text-gray-500 text-[11px]">Valid in remote villages without internet</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-[#0d7a53] flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-bold text-[#0f1e36]">Zero Paperwork</p>
                  <p className="text-gray-500 text-[11px]">Pre-filled forms from encrypted wallet</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-[#0d7a53] flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </span>
                <div>
                  <p className="font-bold text-[#0f1e36]">Direct Benefit (DBT)</p>
                  <p className="text-gray-500 text-[11px]">Statutory transfers straight to bank account</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Column: Interactive Double-Bezel Benefit Estimator */}
          <div className="lg:col-span-5">
            <div className="bezel-shell">
              <div className="bezel-core p-6 sm:p-8 space-y-5">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c25e00] bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                      Instant Estimator
                    </span>
                    <span className="text-[11px] font-semibold text-gray-400">30-Second Match</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0f1e36]">
                    Check Eligible Programs
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    No login required. Select household parameters to evaluate statutory aid.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="state-select" className="label text-xs">State of Domicile</label>
                    <select
                      id="state-select"
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      className="input-field !py-2 !text-xs"
                    >
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="All India">All India / Other State</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="category-select" className="label text-xs">Social Category</label>
                      <select
                        id="category-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-field !py-2 !text-xs"
                      >
                        <option value="All">All Categories</option>
                        <option value="General">General / EWS</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">Scheduled Caste (SC)</option>
                        <option value="ST">Scheduled Tribe (ST)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="occupation-select" className="label text-xs">Occupation</label>
                      <select
                        id="occupation-select"
                        value={occupationFilter}
                        onChange={(e) => setOccupationFilter(e.target.value)}
                        className="input-field !py-2 !text-xs"
                      >
                        <option value="Farmer">Farmer / Agriculture</option>
                        <option value="Student">Student / Scholar</option>
                        <option value="Small Business">Artisan / Small Trade</option>
                        <option value="Daily Wage">Daily Wage Labor</option>
                        <option value="Senior Citizen">Senior Citizen (60+)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="income-select" className="label text-xs !mb-0">Annual Family Income</label>
                      <span className="text-xs font-bold text-[#c25e00]">
                        ₹{Number(incomeFilter).toLocaleString('en-IN')}/year
                      </span>
                    </div>
                    <select
                      id="income-select"
                      value={incomeFilter}
                      onChange={(e) => setIncomeFilter(e.target.value)}
                      className="input-field !py-2 !text-xs"
                    >
                      <option value="80000">Below ₹1,00,000 (BPL)</option>
                      <option value="150000">₹1,00,000 to ₹2,50,000 (EWS)</option>
                      <option value="350000">₹2,50,000 to ₹5,00,000 (Middle)</option>
                      <option value="700000">Above ₹5,00,000</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Calculation Result Box */}
                <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-black/[0.05] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500">Qualifying Schemes</p>
                      <p className="text-2xl font-extrabold text-[#0d7a53]">
                        {estimatedCount} Schemes Matched
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-gray-500">Estimated Annual Aid</p>
                      <p className="text-base font-bold text-[#0f1e36]">
                        ₹{estimatedAid.toLocaleString('en-IN')}+
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex flex-wrap gap-1.5 text-[10px] font-semibold text-gray-600">
                    <span className="bg-white px-2 py-0.5 rounded-full ring-1 ring-black/[0.06]">PM-KISAN</span>
                    <span className="bg-white px-2 py-0.5 rounded-full ring-1 ring-black/[0.06]">Ayushman Bharat</span>
                    <span className="bg-white px-2 py-0.5 rounded-full ring-1 ring-black/[0.06]">PM Awas Yojana</span>
                    <span className="bg-emerald-50 text-[#0d7a53] px-2 py-0.5 rounded-full font-bold">
                      +{estimatedCount - 3} more schemes
                    </span>
                  </div>
                </div>

                <Link
                  href="/citizen/auth/register"
                  className="btn-island-primary w-full group cursor-pointer text-xs !py-3"
                >
                  <span>Claim Benefits with Verified Wallet</span>
                  <span className="btn-island-icon">→</span>
                </Link>
              </div>
            </div>
          </div>

        </section>

        {/* Asymmetrical Bento Grid: Welfare Domains */}
        <section className="space-y-6">
          <div className="max-w-xl space-y-2">
            <span className="eyebrow-pill">Directory Coverage</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f1e36]">
              Statutory Schemes Indexed by Domain
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Sahayak cross-evaluates active Central Government ministries and State departmental databases with rule engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-3 h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-[#c25e00] flex items-center justify-center font-bold text-lg">
                    🌾
                  </div>
                  <h3 className="font-bold text-base text-[#0f1e36]">Agriculture &amp; Farmers</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Direct income support, subsidized fertilizer vouchers, crop insurance, and solar irrigation pumps.
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>PM-KISAN, PMFBY</span>
                  <span className="text-[#0d7a53]">Active</span>
                </div>
              </div>
            </div>

            <div className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-3 h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-[#0d7a53] flex items-center justify-center font-bold text-lg">
                    🏥
                  </div>
                  <h3 className="font-bold text-base text-[#0f1e36]">Health &amp; Medical Security</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Cashless secondary and tertiary hospitalization coverage up to ₹5,00,000 per family per year.
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>Ayushman Bharat PM-JAY</span>
                  <span className="text-[#0d7a53]">Active</span>
                </div>
              </div>
            </div>

            <div className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-3 h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-700 flex items-center justify-center font-bold text-lg">
                    🎓
                  </div>
                  <h3 className="font-bold text-base text-[#0f1e36]">Education &amp; Skill Grants</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Post-matric stipends, state merit scholarships, and competitive examination coaching fee waivers.
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>MYSY, NSP Grants</span>
                  <span className="text-[#0d7a53]">Active</span>
                </div>
              </div>
            </div>

            <div className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-3 h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold text-lg">
                    🏢
                  </div>
                  <h3 className="font-bold text-base text-[#0f1e36]">Livelihood &amp; Housing</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Collateral-free micro-credit loans, pucca housing assistance, and social security pensions.
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                  <span>PMAY, PM SVANidhi</span>
                  <span className="text-[#0d7a53]">Active</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Sahayak Works: 3-Step Sovereign Protocol */}
        <section className="bezel-shell">
          <div className="bezel-core p-8 sm:p-12 space-y-10">
            <div className="max-w-xl space-y-2">
              <span className="eyebrow-pill">Execution Architecture</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f1e36]">
                How Sahayak Works for You
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Eliminating bureaucratic intermediaries through verified civic records and cryptographic verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-black/[0.04] space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#0f1e36] text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-base text-[#0f1e36]">Build Local Civic Wallet</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Record family dependents, social category, land holdings, and income declarations once in your personal encrypted wallet.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-black/[0.04] space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#0f1e36] text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-bold text-base text-[#0f1e36]">Automated Scheme Match</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The rule engine evaluates your profile against statutory rules to match eligible central and state welfare benefits with zero guesswork.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-black/[0.04] space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#0f1e36] text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="font-bold text-base text-[#0f1e36]">Offline Seva Inspection</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Present your cryptographic QR card at any Seva Kendra or Taluka inspection desk. Officers verify credentials offline with RSA-2048 keys.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cryptographic Sovereign Trust Spotlight (Single Theme Lock) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="eyebrow-pill">
              Sovereign Cryptographic Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0f1e36] leading-tight">
              Tamper-Evident Offline Civic Verification
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
              Sahayak generates an asymmetric RS256 token embedded directly into your Civic Identity QR code. Authorized government personnel verify credentials in remote villages without server connectivity.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] space-y-1">
                <p className="font-bold text-[#c25e00]">Asymmetric Keypair</p>
                <p className="text-gray-500 text-[11px]">2048-bit RSA signatures issued by state authority roots.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] space-y-1">
                <p className="font-bold text-[#c25e00]">Optical OCR Parsing</p>
                <p className="text-gray-500 text-[11px]">Tesseract OCR for Aadhaar and ration cards with Hindi support.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-xs font-bold text-[#0f1e36]">
                  <span className="text-[10px] tracking-widest uppercase text-gray-400">CIVIC CREDENTIAL PREVIEW</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0d7a53]">
                    OFFLINE VALID
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#f8f9fa] border border-black/[0.08] flex items-center justify-center text-xs font-mono font-bold text-gray-400">
                    [QR-SEC]
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#0f1e36]">RAMESHBHAI SOLANKI</p>
                    <p className="text-xs text-gray-400 font-mono">SAH-2024-GJ-00001</p>
                    <p className="text-xs text-gray-500 mt-0.5">Gujarat • SC Category • Farmer</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="font-mono">Algorithm: RS256</span>
                  <span className="font-bold text-[#0d7a53]">Verified Signature</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Official Civic Footer */}
      <footer className="bg-white border-t border-gray-200/80 text-gray-500 text-xs mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0f1e36] text-white flex items-center justify-center font-bold text-xs">
                  स
                </div>
                <span className="font-bold text-sm text-[#0f1e36]">Sahayak Portal</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                A sovereign public-interest civic technology implementation for paperless delivery of state and national welfare benefits.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-xs uppercase tracking-wider text-[#0f1e36]">Portals</p>
              <ul className="space-y-2 text-xs">
                <li><Link href="/citizen/auth/login" className="hover:text-[#0f1e36] transition-colors">Citizen Identity Wallet</Link></li>
                <li><Link href="/citizen/schemes" className="hover:text-[#0f1e36] transition-colors">Scheme Directory</Link></li>
                <li><Link href="/officer/auth/login" className="hover:text-[#0f1e36] transition-colors">Officer Offline Scanner</Link></li>
                <li><Link href="/admin/auth/login" className="hover:text-[#0f1e36] transition-colors">Administration Console</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-xs uppercase tracking-wider text-[#0f1e36]">Citizen Assistance</p>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li>Toll Free Helpline: <span className="font-bold text-[#0f1e36]">1800-11-0001</span></li>
                <li>Operating Hours: 09:00 to 18:00 IST</li>
                <li>District Grievance Redressal Desk</li>
                <li>Taluka Seva Kendra Directory</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-xs uppercase tracking-wider text-[#0f1e36]">Technical Standards</p>
              <p className="text-xs leading-relaxed text-gray-500">
                Compliant with Indian e-Governance Interoperability Standards and Digital Personal Data Protection guidelines.
              </p>
              <span className="inline-block text-[10px] font-bold bg-[#f8f9fa] text-[#0f1e36] px-2.5 py-1 rounded-full ring-1 ring-black/[0.08]">
                RS256 Asymmetric Cryptography
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-400">
            <p>
              Copyright 2026 Sahayak National Civic Welfare Portal. Built for Digital India.
            </p>
            <div className="flex gap-4">
              <span className="hover:text-[#0f1e36] transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#0f1e36] transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-[#0f1e36] transition-colors cursor-pointer">Accessibility</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
