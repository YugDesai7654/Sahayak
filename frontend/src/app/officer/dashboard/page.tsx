'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { officerApi } from '@/lib/api';

export default function OfficerDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'officer') { router.push('/officer/auth/login'); return; }
    officerApi.dashboard().then(res => { setDashboard(res); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const handleLogout = async () => { try { await authApi(); } catch {} logout(); router.push('/officer/auth/login'); };
  async function authApi() { const { authApi } = await import('@/lib/api'); await authApi.logout(); }

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-6xl mx-auto space-y-6">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-tricolor-green rounded-lg flex items-center justify-center text-white font-bold text-sm">🏛️</div>
            <span className="font-bold text-gray-800">Officer Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-danger">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 page-enter">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome, {dashboard?.officer?.name || user?.name}</h1>
        <p className="text-gray-500 mb-8">{dashboard?.officer?.office_name} • {dashboard?.officer?.district}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-extrabold text-primary">{dashboard?.today_scan_count || 0}</p>
            <p className="text-sm text-gray-500">Today&apos;s Scans</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-extrabold text-warning">{dashboard?.pending_verifications_count || 0}</p>
            <p className="text-sm text-gray-500">Pending Verifications</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-extrabold text-success">{dashboard?.recent_scans?.length || 0}</p>
            <p className="text-sm text-gray-500">Recent Scans</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link href="/officer/scan" className="card bg-gradient-to-r from-tricolor-green to-emerald-600 text-white hover:scale-[1.02] transition-transform">
            <div className="text-4xl mb-3">📷</div>
            <h3 className="text-xl font-bold">Scan QR Code</h3>
            <p className="text-sm mt-1 opacity-80">Scan citizen&apos;s Sahayak QR to verify identity & process verifications</p>
          </Link>
          <Link href="/officer/verifications" className="card bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-[1.02] transition-transform">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold">Pending Verifications</h3>
            <p className="text-sm mt-1 opacity-80">View and process offline field verifications for applications</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Scan Activity</h2>
          {dashboard?.recent_scans?.length ? (
            <div className="space-y-3">
              {dashboard.recent_scans.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{s.metadata?.sahayak_id || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{s.metadata?.purpose || 'verification'}</p>
                  </div>
                  <span className="text-xs text-gray-400">{s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN') : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No recent scans</p>
          )}
        </div>
      </main>
    </div>
  );
}
