'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { applicationApi } from '@/lib/api';

export default function ApplicationsPage() {
  const { lang } = useAuthStore();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationApi.list().then(res => { setApps(res.applications || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    pending_offline_verification: 'bg-amber-100 text-amber-700',
    under_review: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-4xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/citizen/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-primary">{t('My Applications', 'मेरे आवेदन')}</h1>
      </div></nav>

      <main className="max-w-4xl mx-auto px-6 py-8 page-enter">
        {apps.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-gray-600 font-semibold">{t('No applications yet', 'अभी कोई आवेदन नहीं')}</p>
            <p className="text-gray-400 mt-2">{t('Browse eligible schemes to get started', 'शुरू करने के लिए पात्र योजनाएं देखें')}</p>
            <Link href="/citizen/schemes" className="btn-primary inline-block mt-6">{t('Browse Schemes', 'योजनाएं देखें')} →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map(app => (
              <Link key={app.application_id} href={`/citizen/applications/${app.application_id}`} className="card block hover:scale-[1.01] transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{app.scheme_name}</h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">{app.application_id}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {app.submitted_at ? `Submitted: ${new Date(app.submitted_at).toLocaleDateString('en-IN')}` : 'Draft'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${statusColor[app.overall_status] || 'badge-neutral'}`}>
                      {app.overall_status.replace(/_/g, ' ')}
                    </span>
                    {app.pending_offline_count > 0 && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        {app.pending_offline_count} {t('items need office verification', 'आइटम कार्यालय सत्यापन चाहिए')}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
