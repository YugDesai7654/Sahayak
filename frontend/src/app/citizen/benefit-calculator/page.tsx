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
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {t('Annual Household Entitlement Overview', 'वार्षिक पारिवारिक सरकारी हक़ विवरण')}
          </h2>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {t(
              'Estimated statutory benefits computed from your certified socioeconomic profile against active central ministries and state department guidelines.',
              'सक्रिय केंद्रीय मंत्रालयों और राज्य विभाग के दिशानिर्देशों के अनुसार आपकी प्रमाणित सामाजिक-आर्थिक प्रोफ़ाइल से गणना किए गए अनुमानित लाभ।'
            )}
          </p>
        </div>

        {/* Total Banner */}
        <div className="bg-primary text-white rounded-xl p-6 mb-6">
          <p className="text-xs uppercase tracking-wider opacity-80 font-medium">
            {t('Total Estimated Direct & Indirect Entitlement', 'कुल अनुमानित प्रत्यक्ष एवं अप्रत्यक्ष सरकारी हक़')}
          </p>
          <p className="text-4xl font-extrabold mt-2 font-mono">₹{totalBenefit.toLocaleString('en-IN')}</p>
          <p className="text-xs mt-2 opacity-80">
            {t('Aggregated across', 'कुल')} {result?.eligible?.length || 0} {t('matched government programs', 'सुपात्र सरकारी योजनाओं से')}
          </p>
        </div>

        {totalBenefit === 0 ? (
          <div className="card p-6 border-l-4 border-l-amber-500 mb-6 bg-amber-50/50">
            <h3 className="font-bold text-gray-900 mb-2 text-base">
              {t('Profile Information Required for Computation', 'गणना के लिए आवश्यक प्रोफ़ाइल जानकारी')}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {t(
                'Your eligibility score could not be determined because essential criteria (annual household income, occupation, land holding, social category) are not yet updated in your profile. Complete these fields to unlock all welfare programs you qualify for.',
                'आपकी पात्रता की गणना नहीं की जा सकी क्योंकि प्रोफ़ाइल में आवश्यक विवरण (वार्षिक पारिवारिक आय, व्यवसाय, भूमि, सामाजिक श्रेणी) अभी तक अपडेट नहीं हैं। जिन योजनाओं के आप पात्र हैं, उन्हें देखने के लिए प्रोफ़ाइल पूरा करें।'
              )}
            </p>
            <Link href="/citizen/profile" className="btn-primary inline-flex items-center gap-2 text-sm">
              {t('Complete Socioeconomic Profile', 'सामाजिक-आर्थिक प्रोफ़ाइल पूरी करें')}
            </Link>
          </div>
        ) : (
          <>
            {/* Category Chart */}
            <div className="card mb-6">
              <h2 className="font-bold text-gray-900 mb-2">{t('Breakdown by Welfare Category', 'कल्याणकारी श्रेणी अनुसार विवरण')}</h2>
              <p className="text-xs text-gray-500 mb-4">
                {t('Distribution of financial assistance across direct benefit transfers, food security, and pensions.', 'प्रत्यक्ष लाभ अंतरण, खाद्य सुरक्षा और पेंशन में वित्तीय सहायता का वितरण।')}
              </p>
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
            <div className="card mb-6">
              <h2 className="font-bold text-gray-900 mb-1">{t('Eligible Schemes Included', 'शामिल सुपात्र योजनाएं')}</h2>
              <p className="text-xs text-gray-500 mb-4">
                {t('Direct welfare schemes currently matching 100% of statutory rules.', 'प्रत्यक्ष योजनाएं जो वर्तमान में 100% वैधानिक नियमों से मेल खाती हैं।')}
              </p>
              <div className="space-y-3">
                {result?.eligible?.map((s: any) => (
                  <div key={s.scheme_id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{s.name?.en || s.scheme_id}</p>
                      <div className="flex gap-1 mt-1">
                        {s.category?.map((c: string) => <span key={c} className="badge-info text-[10px]">{c}</span>)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{s.benefit_amount.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{s.benefit_frequency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link href="/citizen/schemes" className="btn-primary inline-flex items-center gap-2">
                {t('Apply for Matching Schemes', 'पात्र योजनाओं के लिए आवेदन करें')}
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
