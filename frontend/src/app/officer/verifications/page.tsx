'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { officerApi } from '@/lib/api';

export default function PendingVerificationsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officerApi.pendingVerifications().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-3xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div></div>;

  const apps = data?.applications || [];

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/officer/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800">Pending Verifications</h1>
        <span className="badge-warning ml-auto">{apps.length} pending</span>
      </div></nav>

      <main className="max-w-3xl mx-auto px-6 py-8 page-enter">
        {apps.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-xl text-gray-600 font-semibold">No pending verifications</p>
            <p className="text-gray-400 mt-2">All offline verification items have been actioned.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app: any) => (
              <div key={app.application_id} className="card border-l-4 border-l-amber-400">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{app.scheme_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{app.application_id}</p>
                  </div>
                  <span className="badge-warning">{app.pending_count || app.offline_verification_fields?.filter((f: any) => f.status === 'pending').length} items</span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <p><span className="font-medium">Citizen:</span> {app.citizen_name || 'N/A'}</p>
                  <p><span className="font-medium">Sahayak ID:</span> {app.sahayak_id || 'N/A'}</p>
                  {app.submitted_at && <p><span className="font-medium">Submitted:</span> {new Date(app.submitted_at).toLocaleDateString('en-IN')}</p>}
                </div>

                <div className="space-y-2 mb-3">
                  {app.offline_verification_fields?.map((f: any) => (
                    <div key={f.field_id} className={`text-sm px-3 py-2 rounded-lg ${
                      f.status === 'verified' ? 'bg-green-50 text-green-700' : 
                      f.status === 'rejected' ? 'bg-red-50 text-red-700' : 
                      'bg-amber-50 text-amber-700'
                    }`}>
                      <span className="mr-2">{f.status === 'verified' ? '✅' : f.status === 'rejected' ? '❌' : '⏳'}</span>
                      {f.offline_verification_label || f.label}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400">To verify, ask the citizen to show their QR code and use the scanner.</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
