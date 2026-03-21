'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { citizenApi, schemeApi, applicationApi, notificationApi, suggestionApi } from '@/lib/api';
import { matchSchemes } from '@/lib/eligibility-engine';

export default function CitizenDashboard() {
  const { user, logout, lang, setLang, isOffline } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'citizen') { router.push('/citizen/auth/login'); return; }
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [profileRes, appsRes, unreadRes] = await Promise.all([
        citizenApi.getProfile(),
        applicationApi.list(),
        notificationApi.unreadCount().catch(() => ({ unread_count: 0 }))
      ]);
      setProfile(profileRes);
      setApps(appsRes.applications || []);
      setUnreadCount(unreadRes.unread_count || 0);

      // Load AI suggestions
      try {
        const sugRes = await suggestionApi.get();
        setSuggestions(sugRes.suggestions || []);
      } catch { /* ignore if suggestions fail */ }

      const bundle = await schemeApi.bundle();
      const schemes = bundle.schemes || [];
      if (schemes.length > 0 && profileRes.profile) {
        const result = matchSchemes(profileRes.profile, schemes);
        setMatchResult(result);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try { await import('@/lib/api').then(m => m.authApi.logout()); } catch {}
    logout();
    router.push('/citizen/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  return (
    <div className="min-h-screen bg-surface">
      {isOffline && <div className="offline-banner">📡 Offline Mode — Changes will sync when connected</div>}
      <div className="tricolor-gradient" />

      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-bold text-primary text-lg">Sahayak</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="text-sm font-medium text-gray-600 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-gray-100">
              {lang === 'en' ? 'हिंदी' : 'English'}
            </button>
            <Link href="/citizen/notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
              🔔
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-white text-[10px] flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-danger font-medium">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 page-enter">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {t('Welcome back,', 'वापसी पर स्वागत,')} {profile?.profile?.name || user?.name || 'Citizen'}
          </h1>
          <p className="text-gray-500 mt-1">{t('Sahayak ID:', 'सहायक आईडी:')} <span className="font-mono font-bold text-primary">{profile?.sahayak_id || user?.sahayak_id}</span></p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-extrabold text-success">{matchResult?.eligible?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{t('Eligible Schemes', 'पात्र योजनाएं')}</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-extrabold text-accent">₹{((matchResult?.totalAnnualBenefit || 0) / 1000).toFixed(0)}K</p>
            <p className="text-sm text-gray-500 mt-1">{t('Annual Benefit', 'वार्षिक लाभ')}</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-extrabold text-primary">{apps.length}</p>
            <p className="text-sm text-gray-500 mt-1">{t('Applications', 'आवेदन')}</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-extrabold text-warning">{matchResult?.nearMiss?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{t('Near Miss', 'लगभग पात्र')}</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/citizen/schemes', icon: '🎯', title: t('Browse Schemes', 'योजनाएं ब्राउज़ करें'), desc: t('View eligible schemes & apply', 'पात्र योजनाएं देखें'), color: 'bg-blue-50 border-blue-200' },
            { href: '/citizen/qr-card', icon: '📱', title: t('QR ID Card', 'क्यूआर पहचान पत्र'), desc: t('Your civic identity card', 'आपका नागरिक पहचान'), color: 'bg-green-50 border-green-200' },
            { href: '/citizen/profile', icon: '👤', title: t('My Profile', 'मेरी प्रोफ़ाइल'), desc: t('Complete your profile for matching', 'मिलान के लिए प्रोफ़ाइल पूरा करें'), color: 'bg-purple-50 border-purple-200' },
            { href: '/citizen/applications', icon: '📋', title: t('My Applications', 'मेरे आवेदन'), desc: t('Track application status', 'आवेदन स्थिति ट्रैक करें'), color: 'bg-amber-50 border-amber-200' },
            { href: '/citizen/benefit-calculator', icon: '💰', title: t('Benefit Calculator', 'लाभ कैलकुलेटर'), desc: t('Calculate your total entitlement', 'कुल हक़ जानें'), color: 'bg-emerald-50 border-emerald-200' },
            { href: '/citizen/family', icon: '👨‍👩‍👧‍👦', title: t('Family Wallet', 'परिवार वॉलेट'), desc: t('Manage family members', 'परिवार के सदस्य'), color: 'bg-rose-50 border-rose-200' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className={`card ${item.color} border-2 hover:scale-[1.02] transition-transform`}>
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* AI Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="card mb-8 border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">🤖 {t('AI Scheme Suggestions', 'AI योजना सुझाव')}</h2>
              <Link href="/citizen/notifications" className="text-sm text-primary font-medium hover:underline">{t('View All', 'सभी देखें')} →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.slice(0, 6).map((s: any) => (
                <Link key={s.scheme_id} href={`/citizen/schemes/${s.scheme_id}`} className="bg-white rounded-xl p-4 border hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm leading-tight">{s.name?.en || 'Scheme'}</h4>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.is_eligible ? 'bg-green-100 text-green-700' : s.is_near_miss ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {Math.round(s.combined_score * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{s.description?.en || ''}</p>
                  {s.benefit_amount > 0 && (
                    <p className="text-sm font-bold text-success">₹{s.benefit_amount.toLocaleString('en-IN')}/{s.benefit_frequency}</p>
                  )}
                  {s.match_reasons?.[0] && <p className="text-xs text-indigo-600 mt-1">💡 {s.match_reasons[0]}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Applications */}
        {apps.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('Recent Applications', 'हाल के आवेदन')}</h2>
            <div className="space-y-3">
              {apps.slice(0, 5).map(app => (
                <Link key={app.application_id} href={`/citizen/applications/${app.application_id}`} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-800">{app.scheme_name}</p>
                    <p className="text-xs text-gray-500">{app.application_id}</p>
                  </div>
                  <span className={`status-${app.overall_status}`}>{app.overall_status.replace(/_/g, ' ')}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
