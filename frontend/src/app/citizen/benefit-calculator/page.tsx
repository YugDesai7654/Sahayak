'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { citizenApi, schemeApi } from '@/lib/api';
import { matchSchemes } from '@/lib/eligibility-engine';

export default function BenefitCalculator() {
  const { lang } = useAuthStore();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [bundle, profile] = await Promise.all([
        schemeApi.bundle(),
        citizenApi.getProfile(),
      ]);
      const schemes = bundle.schemes || [];
      if (profile?.profile && schemes.length > 0) {
        const r = matchSchemes(profile.profile, schemes);
        setResult(r);
      }
      setLoading(false);
    })();
  }, []);

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-2xl mx-auto"><div className="skeleton h-80 rounded-2xl" /></div></div>;

  const categories: Record<string, number> = {};
  result?.eligible?.forEach((s: any) => {
    const amt = s.benefit_frequency === 'monthly' ? s.benefit_amount * 12 : s.benefit_amount;
    s.category?.forEach((c: string) => { categories[c] = (categories[c] || 0) + amt; });
  });
  const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const totalBenefit = result?.totalAnnualBenefit || 0;
  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/citizen/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-primary">{t('Benefit Calculator', 'लाभ कैलकुलेटर')}</h1>
      </div></nav>

      <main className="max-w-2xl mx-auto px-6 py-8 page-enter">
        {/* Total */}
        <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-2xl p-8 text-center mb-8">
          <p className="text-sm opacity-70">{t('Your Total Annual Government Entitlement', 'आपका कुल वार्षिक सरकारी हक़')}</p>
          <p className="text-5xl font-extrabold mt-2">₹{totalBenefit.toLocaleString('en-IN')}</p>
          <p className="text-sm mt-2 opacity-60">{t('per year from', 'प्रति वर्ष')} {result?.eligible?.length || 0} {t('schemes', 'योजनाओं से')}</p>
        </div>

        {/* Category Chart (Simple bars) */}
        <div className="card mb-6">
          <h2 className="font-bold text-gray-900 mb-4">{t('Breakdown by Category', 'श्रेणी अनुसार विवरण')}</h2>
          <div className="space-y-3">
            {catEntries.map(([cat, amt], i) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 capitalize">{cat}</span>
                  <span className="font-bold text-gray-900">₹{amt.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${totalBenefit > 0 ? (amt / totalBenefit) * 100 : 0}%`,
                    backgroundColor: colors[i % colors.length]
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schemes list */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">{t('Eligible Schemes', 'पात्र योजनाएं')}</h2>
          <div className="space-y-3">
            {result?.eligible?.map((s: any) => (
              <div key={s.scheme_id} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 border">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{s.name?.en || s.scheme_id}</p>
                  <div className="flex gap-1 mt-1">
                    {s.category?.map((c: string) => <span key={c} className="badge-info text-[10px]">{c}</span>)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">₹{s.benefit_amount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-gray-400">{s.benefit_frequency}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {result?.eligible?.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/citizen/schemes" className="btn-primary">
              {t('Claim Your Benefits →', 'अपने लाभ का दावा करें →')}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
