'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { citizenApi, schemeApi } from '@/lib/api';
import { matchSchemes } from '@/lib/eligibility-engine';
import type { SchemeMatchResult } from '@/types';

export default function SchemesPage() {
  const { lang } = useAuthStore();
  const [tab, setTab] = useState<'eligible' | 'near_miss' | 'upcoming'>('eligible');
  const [eligible, setEligible] = useState<SchemeMatchResult[]>([]);
  const [nearMiss, setNearMiss] = useState<SchemeMatchResult[]>([]);
  const [totalBenefit, setTotalBenefit] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchemes();
  }, []);

  async function loadSchemes() {
    try {
      const [bundle, profile] = await Promise.all([
        schemeApi.bundle(),
        citizenApi.getProfile(),
      ]);
      const schemes = bundle.schemes || [];

      if (profile?.profile) {
        const result = matchSchemes(profile.profile, schemes);
        setEligible(result.eligible);
        setNearMiss(result.nearMiss);
        setTotalBenefit(result.totalAnnualBenefit);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const getName = (name: any) => ((lang === 'hi' && name?.hi) ? name.hi : name?.en || '');

  const categories = [...new Set([...eligible, ...nearMiss].flatMap(s => s.category))].filter(Boolean);

  const filterSchemes = (list: SchemeMatchResult[]) =>
    list.filter(s => {
      if (search && !getName(s.name).toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && !s.category.includes(categoryFilter)) return false;
      return true;
    });

  const upcoming = eligible.filter(s => {
    if (!s.deadline) return false;
    const days = (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  });

  const freqLabel = (f: string) => (f === 'monthly' ? '/month' : f === 'annual' ? '/year' : 'one-time');

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="bezel-shell max-w-sm w-full">
          <div className="bezel-core p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#0f1e36] border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#0f1e36]">Evaluating Scheme Eligibility...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Sovereign Tricolor Accent Thread */}
      <div className="civic-tricolor-thread fixed top-0 left-0 right-0 z-50" />

      {/* Floating Island Navigation */}
      <header className="pt-6 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between py-3 px-5 sm:px-6 rounded-full bg-white/85 backdrop-blur-md shadow-[0_4px_25px_rgba(15,30,54,0.04)] ring-1 ring-black/[0.06]">
          <Link href="/citizen/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-[#0f1e36] text-xs font-bold transition-transform duration-300 group-hover:-translate-x-0.5">
              ←
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#0f1e36]">
                {t('Statutory Scheme Matching', 'सरकारी योजना मिलान')}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-widest uppercase text-[#c25e00] bg-amber-500/10 px-2 py-0.5 rounded-full">
                AUTOMATED RULES
              </span>
            </div>
          </Link>

          <Link
            href="/citizen/profile"
            className="text-xs font-semibold px-4 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#0f1e36] transition-colors"
          >
            {t('Edit Profile', 'प्रोफ़ाइल बदलें')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
        
        {/* Entitlement Banner (Double-Bezel) */}
        <div className="bezel-shell">
          <div className="bezel-core p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="eyebrow-pill">Combined Benefit Evaluation</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f1e36]">
                ₹{totalBenefit.toLocaleString('en-IN')}
                <span className="text-sm font-semibold text-gray-400 ml-2">/ year</span>
              </h2>
              <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                {eligible.length} {t('programs qualify based on your declared socioeconomic parameters.', 'योजनाएं आपके घोषित सामाजिक-आर्थिक विवरण पर आधारित हैं।')}
              </p>
            </div>

            <div className="flex gap-2 sm:self-center">
              <Link
                href="/citizen/benefit-calculator"
                className="btn-island-primary !py-2.5 !px-5 text-xs group"
              >
                <span>{t('Calculate Breakdown', 'विस्तृत विवरण')}</span>
                <span className="btn-island-icon !w-6 !h-6 text-xs">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: 'eligible', label: t('Eligible Schemes', 'पात्र योजनाएं'), count: eligible.length, bg: 'bg-emerald-50 text-[#0d7a53]' },
            { key: 'near_miss', label: t('Near Miss Matches', 'समीप पात्र योजनाएं'), count: nearMiss.length, bg: 'bg-amber-50 text-[#c25e00]' },
            { key: 'upcoming', label: t('Upcoming Deadlines', 'आने वाली तिथियां'), count: upcoming.length, bg: 'bg-blue-50 text-blue-700' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                tab === item.key
                  ? 'bg-[#0f1e36] text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-black/[0.08] hover:bg-gray-50'
              }`}
            >
              <span>{item.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.bg}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <input
              type="text"
              placeholder={t('Search by scheme title, ministry, or department...', 'योजना, मंत्रालय या विभाग खोजें...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field !py-2.5 !text-xs"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="input-field !py-2.5 !text-xs"
            >
              <option value="">{t('All Welfare Categories', 'सभी श्रेणियां')}</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scheme List Cards */}
        <div className="space-y-4">
          {(tab === 'eligible' ? filterSchemes(eligible) : tab === 'near_miss' ? filterSchemes(nearMiss) : upcoming).map(scheme => (
            <div key={scheme.scheme_id} className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {scheme.category.map(c => (
                        <span key={c} className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800">
                          {c}
                        </span>
                      ))}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {scheme.scope}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0f1e36]">
                      {getName(scheme.name)}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {scheme.ministry} • {scheme.department}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-2xl font-extrabold text-[#0f1e36]">
                      ₹{scheme.benefit_amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      {freqLabel(scheme.benefit_frequency)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {getName(scheme.description)}
                </p>

                {scheme.near_miss_rule && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <p className="text-xs font-bold text-[#c25e00] flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>{scheme.near_miss_rule.label}</span>
                    </p>
                    <p className="text-[11px] text-amber-900 leading-normal pl-5">
                      {scheme.near_miss_rule.tip}
                    </p>
                  </div>
                )}

                {scheme.deadline && (
                  <p className="text-xs font-semibold text-rose-700">
                    Application Deadline: {new Date(scheme.deadline).toLocaleDateString('en-IN')}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                  <Link
                    href={`/citizen/schemes/${scheme.scheme_id}`}
                    className="text-xs font-semibold text-gray-500 hover:text-[#0f1e36] transition-colors"
                  >
                    {t('View Full Rules & Checklist', 'नियम और दस्तावेज़ देखें')} →
                  </Link>

                  <Link
                    href={`/citizen/schemes/${scheme.scheme_id}/apply`}
                    className="btn-island-primary !py-2 !px-4 text-xs group"
                  >
                    <span>{t('Apply Online', 'आवेदन करें')}</span>
                    <span className="btn-island-icon !w-6 !h-6 text-xs">→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {((tab === 'eligible' && filterSchemes(eligible).length === 0) ||
            (tab === 'near_miss' && filterSchemes(nearMiss).length === 0) ||
            (tab === 'upcoming' && upcoming.length === 0)) && (
            <div className="bezel-shell">
              <div className="bezel-core p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center text-xl mx-auto text-gray-400">
                  🔍
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#0f1e36]">
                    {t('No Matching Welfare Programs Found', 'कोई सुपात्र योजना नहीं मिली')}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    {t(
                      'Eligibility rules evaluate declared household income, occupation, land holding, and social category. Complete your profile to unlock qualified programs.',
                      'पात्रता नियम आपकी पारिवारिक आय, व्यवसाय, भूमि और सामाजिक श्रेणी का मूल्यांकन करते हैं। सभी योजनाओं को अनलॉक करने के लिए प्रोफ़ाइल पूरी करें।'
                    )}
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/citizen/profile" className="btn-island-primary !py-2.5 !px-5 text-xs group">
                    <span>{t('Update Civic Profile Details', 'प्रोफ़ाइल विवरण अपडेट करें')}</span>
                    <span className="btn-island-icon !w-6 !h-6 text-xs">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Subtle Civic Footer */}
      <footer className="py-6 px-4 text-center text-xs text-gray-400 border-t border-gray-100">
        Sahayak Civic Access Infrastructure • Automated Welfare Entitlement Directory
      </footer>
    </div>
  );
}
