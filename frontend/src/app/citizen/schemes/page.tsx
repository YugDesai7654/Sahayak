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

  useEffect(() => { loadSchemes(); }, []);

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
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const getName = (name: any) => (lang === 'hi' && name?.hi) ? name.hi : name?.en || '';

  const categories = [...new Set([...eligible, ...nearMiss].flatMap(s => s.category))].filter(Boolean);

  const filterSchemes = (list: SchemeMatchResult[]) => list.filter(s => {
    if (search && !getName(s.name).toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && !s.category.includes(categoryFilter)) return false;
    return true;
  });

  const upcoming = eligible.filter(s => {
    if (!s.deadline) return false;
    const days = (new Date(s.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  });

  const benefitLabel = (type: string) => {
    const map: Record<string, string> = { cash: '💵 Cash', subsidy: '🏠 Subsidy', insurance: '🛡️ Insurance', pension: '👴 Pension', scholarship: '🎓 Scholarship', other: '📦 Other' };
    return map[type] || type;
  };

  const freqLabel = (f: string) => f === 'monthly' ? '/month' : f === 'annual' ? '/year' : 'one-time';

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-4xl mx-auto space-y-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/citizen/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
          <h1 className="font-bold text-lg text-primary">{t('Scheme Matching', 'योजना मिलान')}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-6 page-enter">
        {/* Total banner */}
        <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-2xl p-6 mb-6">
          <p className="text-sm opacity-80">{t('Total Annual Government Entitlement', 'कुल वार्षिक सरकारी हक़')}</p>
          <p className="text-4xl font-extrabold mt-1">₹{totalBenefit.toLocaleString('en-IN')}</p>
          <p className="text-sm mt-2 opacity-70">{eligible.length} {t('eligible schemes', 'पात्र योजनाएं')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { key: 'eligible', label: t('Eligible', 'पात्र'), count: eligible.length, color: 'bg-green-500' },
            { key: 'near_miss', label: t('Near Miss', 'लगभग पात्र'), count: nearMiss.length, color: 'bg-amber-500' },
            { key: 'upcoming', label: t('Upcoming Deadlines', 'आने वाली तिथियां'), count: upcoming.length, color: 'bg-blue-500' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${tab === t.key ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
              {t.label} <span className={`ml-1.5 ${t.color} text-white text-xs px-1.5 py-0.5 rounded-full`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input type="text" placeholder={t('Search schemes...', 'योजना खोजें...')} value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field w-40">
            <option value="">{t('All Categories', 'सभी श्रेणियां')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Scheme Cards */}
        <div className="space-y-4">
          {(tab === 'eligible' ? filterSchemes(eligible) : tab === 'near_miss' ? filterSchemes(nearMiss) : upcoming).map(scheme => (
            <div key={scheme.scheme_id} className={`card border-l-4 ${tab === 'near_miss' ? 'border-l-amber-400' : 'border-l-green-400'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {scheme.category.map(c => <span key={c} className="badge-info text-[10px]">{c}</span>)}
                    <span className="badge-neutral text-[10px]">{scheme.scope}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{getName(scheme.name)}</h3>
                  <p className="text-sm text-gray-500 mt-1">{scheme.ministry} • {scheme.department}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-extrabold text-primary">₹{scheme.benefit_amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{freqLabel(scheme.benefit_frequency)}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">{getName(scheme.description)}</p>

              {scheme.near_miss_rule && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-amber-800">⚠️ {scheme.near_miss_rule.label}</p>
                  <p className="text-xs text-amber-600 mt-1">💡 {scheme.near_miss_rule.tip}</p>
                </div>
              )}

              {scheme.deadline && (
                <p className="text-xs text-danger mt-2 font-medium">⏰ Deadline: {new Date(scheme.deadline).toLocaleDateString('en-IN')}</p>
              )}

              <div className="flex gap-3 mt-4">
                <Link href={`/citizen/schemes/${scheme.scheme_id}/apply`} className="btn-primary text-sm px-4 py-2">
                  {t('Apply Now', 'अभी आवेदन करें')} →
                </Link>
                <Link href={`/citizen/schemes/${scheme.scheme_id}`} className="btn-secondary text-sm px-4 py-2">
                  {t('Learn More', 'और जानें')}
                </Link>
              </div>
            </div>
          ))}

          {((tab === 'eligible' && filterSchemes(eligible).length === 0) || (tab === 'near_miss' && filterSchemes(nearMiss).length === 0) || (tab === 'upcoming' && upcoming.length === 0)) && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">{t('No schemes found', 'कोई योजना नहीं मिली')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('Complete your profile for better matching', 'बेहतर मिलान के लिए प्रोफ़ाइल पूरा करें')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
