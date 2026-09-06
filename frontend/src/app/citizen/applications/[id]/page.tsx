'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { applicationApi } from '@/lib/api';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { lang } = useAuthStore();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    applicationApi.get(id as string).then(setApp).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const STATUS_CLASS: Record<string, string> = {
    draft: 'status-draft',
    submitted: 'status-submitted',
    pending_offline_verification: 'status-pending_offline_verification',
    under_review: 'status-under_review',
    approved: 'status-approved',
    rejected: 'status-rejected',
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await applicationApi.downloadSummary(id as string);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `application-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
    setDownloading(false);
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="skeleton max-w-3xl mx-auto h-96 rounded-2xl" /></div>;
  if (!app) return <div className="min-h-screen bg-surface flex items-center justify-center"><p className="text-gray-500 text-lg">Application not found</p></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/citizen/applications" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800 truncate">{app.scheme_name}</h1>
        <span className={`ml-auto ${STATUS_CLASS[app.overall_status] || 'badge-neutral'}`}>{app.overall_status?.replace(/_/g, ' ')}</span>
      </div></nav>

      <main className="max-w-3xl mx-auto px-6 py-8 page-enter space-y-6">
        {/* Summary Card */}
        <div className="card">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400 text-xs">Application ID</p><p className="font-mono font-bold text-primary">{app.application_id}</p></div>
            <div><p className="text-gray-400 text-xs">Submitted</p><p className="font-semibold text-gray-800">{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : 'N/A'}</p></div>
            <div><p className="text-gray-400 text-xs">Last Updated</p><p className="font-semibold text-gray-800">{app.last_updated_at ? new Date(app.last_updated_at).toLocaleDateString('en-IN') : 'N/A'}</p></div>
            <div><p className="text-gray-400 text-xs">Status</p><p className="font-semibold capitalize text-gray-800">{app.overall_status?.replace(/_/g, ' ')}</p></div>
          </div>
        </div>

        {/* Rejection reason */}
        {app.overall_status === 'rejected' && app.rejection_reason && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl">
            <p className="font-bold text-red-800">❌ {t('Rejection Reason', 'अस्वीकृति का कारण')}</p>
            <p className="text-red-700 text-sm mt-1">{app.rejection_reason}</p>
          </div>
        )}

        {/* Status Timeline */}
        {app.status_history?.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">📅 {t('Status Timeline', 'स्थिति समयरेखा')}</h3>
            <div className="space-y-3 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
              {app.status_history.map((h: any, i: number) => (
                <div key={i} className="flex gap-3 relative">
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 z-10 ${
                    i === 0 ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                  }`} />
                  <div>
                    <p className="font-semibold text-gray-800 capitalize text-sm">{h.status?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{h.timestamp ? new Date(h.timestamp).toLocaleString('en-IN') : ''}</p>
                    {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Verification Status */}
        {app.offline_verification_fields?.length > 0 && (
          <div className="card border-l-4 border-l-amber-500">
            <h3 className="font-bold text-gray-900 mb-2">🔍 {t('Physical Verification Items', 'भौतिक सत्यापन वस्तुएं')}</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {t(
                'Action Required: This program requires on-site document inspection. Present your original records alongside your sovereign Sahayak QR Card at your nearest Taluka/District Seva Kendra. The designated verification officer will authenticate your documents cryptographically.',
                'आवश्यक कार्रवाई: इस योजना के लिए दस्तावेजों का भौतिक सत्यापन आवश्यक है। अपने निकटतम तालुका/जिला सेवा केंद्र में मूल दस्तावेजों और सहायक क्यूआर कार्ड के साथ उपस्थित हों।'
              )}
            </p>
            <div className="mb-4">
              <Link href="/citizen/qr-card" className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5">
                <span>📱</span> {t('View Sahayak QR Card for Verification', 'सत्यापन के लिए क्यूआर कार्ड देखें')}
              </Link>
            </div>
            <div className="space-y-3">
              {app.offline_verification_fields.map((f: any) => (
                <div key={f.field_id} className={`p-3 rounded-xl border ${
                  f.status === 'verified' ? 'bg-green-50 border-green-200' : 
                  f.status === 'rejected' ? 'bg-red-50 border-red-200' : 
                  'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800 text-sm">{f.label || f.offline_verification_label}</p>
                    <span className={`${
                      f.status === 'verified' ? 'badge-success' : 
                      f.status === 'rejected' ? 'badge-danger' : 
                      'badge-warning'
                    }`}>
                      {f.status}
                    </span>
                  </div>
                  {f.verified_by && <p className="text-xs text-gray-500 mt-1">By: {f.verified_by} {f.verified_at ? `on ${new Date(f.verified_at).toLocaleDateString('en-IN')}` : ''}</p>}
                  {f.note && <p className="text-xs text-gray-500 mt-1">Note: {f.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Digital Form Data */}
        {app.digital_form_data && Object.keys(app.digital_form_data).length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">📋 {t('Submitted Details', 'जमा किए गए विवरण')}</h3>
            <div className="space-y-2">
              {Object.entries(app.digital_form_data).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-semibold text-gray-800">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={downloadPdf} disabled={downloading} className="btn-primary flex-1 disabled:opacity-50">
            📄 {downloading ? t('Downloading...', 'डाउनलोड हो रहा है...') : t('Download Summary PDF', 'सारांश PDF डाउनलोड करें')}
          </button>
          {app.overall_status === 'rejected' && (
            <Link href={`/citizen/schemes/${app.scheme_id}/apply`} className="btn-accent flex-1 text-center">
              🔄 {t('Reapply', 'पुनः आवेदन करें')}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
