'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { schemeApi } from '@/lib/api';

export default function SchemeDetailPage() {
  const { id } = useParams();
  const { lang } = useAuthStore();
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schemeApi.get(id as string).then(setScheme).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="skeleton max-w-3xl mx-auto h-96 rounded-2xl" /></div>;
  if (!scheme) return <div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-gray-500 text-lg">Scheme not found</p></div>;

  const name = lang === 'hi' && scheme.name?.hi ? scheme.name.hi : scheme.name?.en || scheme.name;
  const desc = lang === 'hi' && scheme.description?.hi ? scheme.description.hi : scheme.description?.en || scheme.description;

  const CATEGORY_COLORS: Record<string, string> = {
    agriculture: 'badge-success', housing: 'badge-info', education: 'badge-warning',
    health: 'badge-danger', pension: 'badge-neutral', disability: 'badge-info',
    'women & girl child': 'badge-warning', employment: 'badge-success'
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/citizen/schemes" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800 truncate">{name}</h1>
      </div></nav>

      <main className="max-w-3xl mx-auto px-6 py-8 page-enter space-y-6">
        {/* Header Card */}
        <div className="card">
          <div className="flex flex-wrap gap-2 mb-3">
            {scheme.category?.map((c: string) => (
              <span key={c} className={CATEGORY_COLORS[c.toLowerCase()] || 'badge-neutral'}>{c}</span>
            ))}
            <span className="badge-info">{scheme.scope}</span>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3">{name}</h2>
          <p className="text-gray-600 leading-relaxed">{desc}</p>
        </div>

        {/* Benefits */}
        <div className="card bg-green-50 border-green-100">
          <h3 className="font-bold text-green-800 mb-3">💰 {t('Benefits', 'लाभ')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-700">₹{Number(scheme.benefit_amount || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-green-600">{t('Amount', 'राशि')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-700 capitalize">{scheme.benefit_frequency || 'annual'}</p>
              <p className="text-xs text-green-600">{t('Frequency', 'आवृत्ति')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-700 capitalize">{scheme.benefit_type || 'cash'}</p>
              <p className="text-xs text-green-600">{t('Type', 'प्रकार')}</p>
            </div>
          </div>
        </div>

        {/* Ministry / Dept */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3">🏛️ {t('Ministry / Department', 'मंत्रालय / विभाग')}</h3>
          <p className="text-gray-600">{scheme.ministry || 'N/A'}</p>
          {scheme.department && <p className="text-gray-500 text-sm">{scheme.department}</p>}
        </div>

        {/* Eligibility */}
        {scheme.eligibility_rules?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">📋 {t('Eligibility Criteria', 'पात्रता मानदंड')}</h3>
            <ul className="space-y-2">
              {scheme.eligibility_rules.map((r: any) => (
                <li key={r.rule_id} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-gray-700">{r.label || `${r.field} ${r.operator} ${r.value}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Documents */}
        {scheme.required_documents?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-1">📄 {t('Required Supporting Documents', 'आवश्यक दस्तावेज')}</h3>
            <p className="text-xs text-gray-500 mb-3">
              {t(
                'Zero-Paperwork Guarantee: Keep original records available for physical inspection. Physical photocopies, notary attestations, and court stamps are not required.',
                'शून्य-कागजी कार्रवाई गारंटी: भौतिक निरीक्षण के लिए मूल दस्तावेज तैयार रखें। फोटोकॉपी या नोटरी सत्यापन की आवश्यकता नहीं है।'
              )}
            </p>
            <ul className="space-y-2">
              {scheme.required_documents.map((doc: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 mt-0.5">📎</span>
                  <span className="text-gray-700 font-medium">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verification Protocol Notice */}
        <div className="card border-l-4 border-l-primary bg-blue-50/40">
          <h3 className="font-bold text-gray-900 mb-1">🏛️ {t('Statutory Application Protocol', 'वैधानिक आवेदन प्रक्रिया')}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t(
              'Applications submitted via Sahayak are digitally transmitted to the respective department portal. If the scheme mandates field inspection (e.g. land measurement, crop verification, asset check), an authorized district officer will scan your Sahayak QR Card directly in the field.',
              'सहायक के माध्यम से जमा किए गए आवेदन सीधे संबंधित विभाग को भेजे जाते हैं। यदि योजना में भौतिक निरीक्षण अनिवार्य है, तो अधिकृत अधिकारी सीधे आपके सहायक क्यूआर कोड को स्कैन करेंगे।'
            )}
          </p>
        </div>

        {/* Deadline */}
        {scheme.deadline && (
          <div className="card bg-amber-50 border-amber-100">
            <h3 className="font-bold text-amber-800 mb-1">⏰ {t('Application Deadline', 'आवेदन की अंतिम तिथि')}</h3>
            <p className="text-amber-700">{new Date(scheme.deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        )}

        {/* Apply Button */}
        <div className="sticky bottom-4">
          <Link href={`/citizen/schemes/${id}/apply`} className="btn-primary w-full text-center text-lg shadow-xl block py-4">
            {t('Apply Now →', 'अभी आवेदन करें →')}
          </Link>
        </div>
      </main>
    </div>
  );
}
