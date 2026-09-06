'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAuthHydrated } from '@/hooks/useAuthHydrated';
import { authApi, citizenApi, schemeApi, applicationApi, notificationApi, suggestionApi } from '@/lib/api';
import { matchSchemes } from '@/lib/eligibility-engine';

export default function CitizenDashboard() {
  const { user, logout, lang, setLang, isOffline } = useAuthStore();
  const authHydrated = useAuthHydrated();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!authHydrated) return;
    if (!user || user.role !== 'citizen') {
      router.push('/citizen/auth/login');
      return;
    }
    loadData();
  }, [user, authHydrated]);

  async function loadData() {
    try {
      const [prof, schemes, appList, notifs, sugg] = await Promise.all([
        citizenApi.getProfile().catch(() => null),
        schemeApi.list().catch(() => []),
        applicationApi.list().catch(() => []),
        notificationApi.list().catch(() => []),
        suggestionApi.get().catch(() => ({ suggestions: [] })),
      ]);

      if (prof) setProfile(prof);
      setApps(Array.isArray(appList) ? appList : []);
      if (Array.isArray(notifs)) {
        setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
      }
      setSuggestions(sugg?.suggestions || []);

      if (prof?.profile && Array.isArray(schemes)) {
        const result = matchSchemes(prof.profile, schemes);
        setMatchResult(result);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    router.push('/citizen/auth/login');
  };

  if (!authHydrated || loading) {
    return (
      <div className="min-h-[100dvh] bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="bezel-shell max-w-sm w-full">
          <div className="bezel-core p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#0f1e36] border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#0f1e36]">Loading Citizen Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const annualBenefit = matchResult?.totalAnnualBenefit || 0;
  const eligibleCount = matchResult?.eligible?.length || 0;
  const nearMissCount = matchResult?.nearMiss?.length || 0;

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Delicate Sovereign Tricolor Thread */}
      <div className="civic-tricolor-thread fixed top-0 left-0 right-0 z-50" />

      {isOffline && (
        <div className="fixed top-1 left-0 right-0 z-50 bg-amber-500 text-white text-center py-1.5 font-semibold text-xs tracking-wide shadow-md">
          📡 Offline Mode - All records cached locally on your device
        </div>
      )}

      {/* Floating Island Navigation */}
      <header className="pt-6 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between py-3 px-5 sm:px-6 rounded-full bg-white/85 backdrop-blur-md shadow-[0_4px_25px_rgba(15,30,54,0.04)] ring-1 ring-black/[0.06]">
          <Link href="/citizen/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#0f1e36] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              स
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#0f1e36]">SAHAYAK</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-widest uppercase text-[#c25e00] bg-amber-500/10 px-2 py-0.5 rounded-full">
                CITIZEN DESK
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/[0.03] hover:bg-black/[0.06] text-[#0f1e36] transition-colors"
            >
              {lang === 'en' ? 'हिन्दी' : 'English'}
            </button>

            <Link
              href="/citizen/notifications"
              className="relative p-2 rounded-full hover:bg-black/[0.04] text-gray-700 transition-colors"
              title="Notifications"
            >
              <span className="text-base leading-none">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors"
            >
              {t('Sign Out', 'लॉग आउट')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Asymmetrical Bento Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Profile Headline & Sahayak ID Badge */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="eyebrow-pill">Verified Sovereign Dossier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0f1e36]">
              {t('Namaste,', 'नमस्ते,')} {profile?.profile?.name || user?.name || 'Citizen'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Sahayak ID:
              </span>
              <span className="font-mono text-xs font-bold text-[#0f1e36] tracking-wider">
                {profile?.sahayak_id || user?.sahayak_id || 'PENDING'}
              </span>
            </div>
            <Link
              href="/citizen/qr-card"
              className="btn-island-primary !py-2 !px-4 text-xs group"
            >
              <span>{t('View QR Card', 'क्यूआर कार्ड')}</span>
              <span className="btn-island-icon !w-6 !h-6 text-xs">→</span>
            </Link>
          </div>
        </div>

        {/* Bento Grid Layer 1: Entitlement Hero & Smart Wallet Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Entitlement Hero Card (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="bezel-shell h-full">
              <div className="bezel-core p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {t('Calculated Annual Entitlement', 'वार्षिक अनुमानित लाभ')}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#0d7a53] ring-1 ring-emerald-500/20">
                      {eligibleCount} {t('Schemes Matched', 'योजनाएं मेल खाई')}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0f1e36]">
                      ₹{annualBenefit.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">
                      / {t('year in direct statutory benefits', 'वर्ष प्रत्यक्ष लाभ')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Composite evaluation across Direct Benefit Transfer (DBT), educational grants, healthcare insurance (PM-JAY), and subsidized rations (NFSA).',
                      'प्रत्यक्ष लाभ अंतरण (DBT), छात्रवृत्ति, स्वास्थ्य बीमा और खाद्य सुरक्षा का समग्र मूल्यांकन।'
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                  <div className="p-3 rounded-2xl bg-[#f8f9fa] space-y-1">
                    <div className="text-lg font-extrabold text-[#0d7a53]">{eligibleCount}</div>
                    <div className="text-[11px] font-medium text-gray-500">{t('Fully Eligible', 'पूर्ण पात्र')}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f8f9fa] space-y-1">
                    <div className="text-lg font-extrabold text-[#c25e00]">{nearMissCount}</div>
                    <div className="text-[11px] font-medium text-gray-500">{t('Near Match', 'समीप पात्र')}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f8f9fa] space-y-1">
                    <div className="text-lg font-extrabold text-[#0f1e36]">{apps.length}</div>
                    <div className="text-[11px] font-medium text-gray-500">{t('Active Applications', 'सक्रिय आवेदन')}</div>
                  </div>
                </div>

                <div>
                  <Link
                    href="/citizen/schemes"
                    className="btn-island-primary w-full group cursor-pointer"
                  >
                    <span>{t('Explore Matched Schemes & Apply', 'पात्र योजनाएं देखें और आवेदन करें')}</span>
                    <span className="btn-island-icon">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Offline Sovereign Wallet Card (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bezel-shell h-full">
              <div className="bezel-core p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0f1e36]">
                        {t('Sovereign Identity Card', 'नागरिक पहचान पत्र')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      RS256 ENCRYPTED
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-black/[0.04] space-y-2">
                    <div className="text-xs font-semibold text-gray-500">
                      {t('Verification Protocol', 'सत्यापन प्रोटोकॉल')}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {t(
                        'Present your QR card at any Seva Kendra or Taluka inspection desk. Officers verify your cryptographic signature offline without relying on central database uptime.',
                        'सेवा केंद्र पर अपना क्यूआर दिखाएं। अधिकारी बिना इंटरनेट के आपके डिजिटल हस्ताक्षर का सत्यापन करते हैं।'
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/citizen/qr-card"
                    className="btn-island-secondary w-full group !justify-between"
                  >
                    <span>{t('Open Offline QR Card', 'ऑफ़लाइन क्यूआर खोलें')}</span>
                    <span className="text-sm font-bold text-gray-400 group-hover:text-[#0f1e36] transition-colors">↗</span>
                  </Link>

                  <Link
                    href="/citizen/benefit-calculator"
                    className="btn-island-secondary w-full group !justify-between !bg-transparent !shadow-none !ring-0 hover:!bg-black/[0.03]"
                  >
                    <span className="text-xs text-gray-600">{t('Open Benefit Calculator', 'लाभ कैलकुलेटर खोलें')}</span>
                    <span className="text-xs font-semibold text-[#c25e00]">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bento Grid Layer 2: Core Navigation Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-[#0f1e36]">
              {t('Civic Services & Dossier Portals', 'नागरिक सेवाएं और रिकॉर्ड पोर्टल')}
            </h2>
            <span className="text-xs text-gray-500">All services 100% paperless</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                href: '/citizen/schemes',
                tag: 'DISCOVERY',
                title: t('Scheme Directory', 'योजना निर्देशिका'),
                desc: t('Browse 15+ central and state schemes with automated rule evaluation.', 'स्वचालित पात्रता मूल्यांकन के साथ योजनाएं देखें।'),
              },
              {
                href: '/citizen/applications',
                tag: 'TRACKING',
                title: t('Application Dossier', 'आवेदन रिकॉर्ड'),
                desc: t('Real-time timeline, offline verification status, and signed sanction letters.', 'सत्यापन स्थिति और स्वीकृत आदेश ट्रैक करें।'),
              },
              {
                href: '/citizen/profile',
                tag: 'IDENTITY',
                title: t('Socioeconomic Profile', 'सामाजिक-आर्थिक प्रोफ़ाइल'),
                desc: t('Update income, occupation, land ownership, and statutory caste category.', 'आय, पेशा और श्रेणी विवरण अपडेट करें।'),
              },
              {
                href: '/citizen/family',
                tag: 'HOUSEHOLD',
                title: t('Family Wallet', 'परिवार वॉलेट'),
                desc: t('Link dependents to unlock pooled schemes like PM-JAY and Ayushman Bharat.', 'परिवार के सदस्यों को जोड़कर समग्र लाभ पाएं।'),
              },
              {
                href: '/citizen/benefit-calculator',
                tag: 'ENTITLEMENT',
                title: t('Benefit Calculator', 'लाभ कैलकुलेटर'),
                desc: t('Simulate potential welfare increments before updating profile documents.', 'दस्तावेज़ जमा करने से पहले संभावित लाभ जानें।'),
              },
              {
                href: '/citizen/qr-card',
                tag: 'CREDENTIAL',
                title: t('Digital QR Credential', 'डिजिटल क्यूआर प्रमाण पत्र'),
                desc: t('Save or print your sovereign identity card with offline verifiable signature.', 'ऑफ़लाइन सत्यापन योग्य पहचान पत्र प्रिंट करें।'),
              },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="group p-5 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] hover:shadow-[0_12px_28px_rgba(15,30,54,0.06)] hover:-translate-y-0.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                      {item.tag}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-[#0f1e36] group-hover:translate-x-0.5 transition-all duration-300">
                      ↗
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#0f1e36] group-hover:text-[#c25e00] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Recommendations Section */}
        {suggestions.length > 0 && (
          <div className="bezel-shell">
            <div className="bezel-core p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="eyebrow-pill">Automated Scheme Intelligence</span>
                  <h2 className="text-xl font-bold tracking-tight text-[#0f1e36] mt-1">
                    {t('Priority Recommendations', 'प्राथमिकता अनुशंसाएं')}
                  </h2>
                </div>
                <Link
                  href="/citizen/schemes"
                  className="text-xs font-semibold text-[#0f1e36] hover:underline"
                >
                  {t('View All Schemes →', 'सभी योजनाएं देखें →')}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.slice(0, 3).map((s: any) => (
                  <Link
                    key={s.scheme_id}
                    href={`/citizen/schemes/${s.scheme_id}`}
                    className="p-5 rounded-2xl bg-[#f8f9fa] hover:bg-white ring-1 ring-black/[0.04] hover:ring-black/[0.08] hover:shadow-md transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0d7a53]">
                          {Math.round(s.combined_score * 100)}% {t('Match', 'मिलान')}
                        </span>
                        {s.benefit_amount > 0 && (
                          <span className="text-xs font-bold text-[#c25e00]">
                            ₹{s.benefit_amount.toLocaleString('en-IN')}/{s.benefit_frequency}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-[#0f1e36] line-clamp-1">
                        {s.name?.en || 'Statutory Scheme'}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {s.description?.en || ''}
                      </p>
                    </div>

                    {s.match_reasons?.[0] && (
                      <div className="pt-2 border-t border-gray-200/50 text-[11px] font-medium text-gray-600">
                        💡 {s.match_reasons[0]}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Subtle Civic Footer */}
      <footer className="py-6 px-4 text-center text-xs text-gray-400 border-t border-gray-100">
        Sahayak Civic Access Infrastructure • Government of India Digital Welfare Stack
      </footer>
    </div>
  );
}
