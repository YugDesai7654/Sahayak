'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { officerApi } from '@/lib/api';

export default function OfficerApplicationsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      const res = await officerApi.applications();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDecision = async (appId: string, decision: 'approved' | 'rejected') => {
    const reason = decision === 'rejected' ? prompt('Please provide a reason for rejection:') : undefined;
    if (decision === 'rejected' && !reason) return;

    if (decision === 'approved' && !confirm('Are you sure you want to approve this application?')) return;

    setProcessing(appId);
    try {
      await officerApi.decideApplication(appId, decision, reason || undefined);
      await loadApplications();
      alert(`Application ${decision} successfully`);
    } catch (err: any) {
      alert(err.message || 'Failed to process application');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-4xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div></div>;

  const apps = data?.applications || [];

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/officer/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
          <h1 className="font-bold text-lg text-gray-800">All District Applications</h1>
          <span className="badge-primary ml-auto">{apps.length} Total</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 page-enter">
        {apps.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 font-semibold">No Applications Found</p>
            <p className="text-gray-400 mt-2">No citizens in your district have applied yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app: any) => (
              <div key={app.application_id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{app.scheme_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{app.application_id}</p>
                  </div>
                  <div>
                    {app.overall_status === 'submitted' && <span className="badge-info">Ready for Review</span>}
                    {app.overall_status === 'pending_offline_verification' && <span className="badge-warning">Physical Check Req.</span>}
                    {app.overall_status === 'under_review' && <span className="badge-info">Reviewing</span>}
                    {app.overall_status === 'approved' && <span className="badge-success">Approved</span>}
                    {app.overall_status === 'rejected' && <span className="badge-danger">Rejected</span>}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-4 grid grid-cols-2 gap-2">
                  <p><span className="font-medium">Citizen:</span> {app.citizen_name}</p>
                  <p><span className="font-medium">Sahayak ID:</span> {app.sahayak_id}</p>
                  <p><span className="font-medium">Submitted:</span> {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>

                {['submitted', 'under_review'].includes(app.overall_status) && (
                  <div className="flex gap-3 pt-3 border-t">
                    <button 
                      onClick={() => handleDecision(app.application_id, 'approved')} 
                      disabled={processing === app.application_id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                    >
                      {processing === app.application_id ? 'Wait...' : 'Approve Application'}
                    </button>
                    <button 
                      onClick={() => handleDecision(app.application_id, 'rejected')} 
                      disabled={processing === app.application_id}
                      className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {app.overall_status === 'pending_offline_verification' && (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm flex justify-between items-center mt-3 border border-amber-200">
                    <div>
                      <span className="font-bold">Action Required:</span> Physical Verification Pending
                    </div>
                    <Link href="/officer/verifications" className="text-amber-700 font-bold hover:underline">
                      Go to Verifications &rarr;
                    </Link>
                  </div>
                )}
                
                {app.has_pending_offline && ['submitted'].includes(app.overall_status) && (
                  <p className="text-xs text-amber-600 mt-2 font-semibold">⚠️ Note: This application contains offline fields that must be verified first.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
