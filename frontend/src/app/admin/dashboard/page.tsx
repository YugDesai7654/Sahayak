'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { adminApi } from '@/lib/api';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>({});
  const [citizenStats, setCitizenStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/admin/auth/login'); return; }
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [scheme, citizen] = await Promise.all([
        adminApi.schemeAnalytics(),
        adminApi.citizenAnalytics()
      ]);
      setAnalytics(scheme);
      setCitizenStats(citizen);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const handleLogout = async () => {
    try { const { authApi } = await import('@/lib/api'); await authApi.logout(); } catch {}
    logout();
    router.push('/admin/auth/login');
  };

  const tierLabel = (t?: string) => {
    const labels: Record<string, string> = { national: '🇮🇳 National', state: '📍 State', district: '🏘️ District', taluka: '🌾 Taluka' };
    return labels[t || ''] || t || '';
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-6xl mx-auto space-y-6">{[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-saffron rounded-lg flex items-center justify-center text-white font-bold text-sm">⚙️</div>
            <span className="font-bold text-gray-800">Admin Panel</span>
            <span className="badge-info text-[10px]">{tierLabel(user?.tier)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            {user?.jurisdiction?.state && <span className="text-xs text-gray-400">{user.jurisdiction.state}{user.jurisdiction.district ? ` / ${user.jurisdiction.district}` : ''}</span>}
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-danger">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 page-enter">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">{tierLabel(user?.tier)} Administrator {user?.jurisdiction?.state ? `• ${user.jurisdiction.state}` : ''}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { val: analytics.total_schemes || 0, label: 'Total Schemes', icon: '📋', color: 'text-primary' },
            { val: citizenStats.total_citizens || 0, label: 'Total Citizens', icon: '👥', color: 'text-blue-600' },
            { val: analytics.total_applications || 0, label: 'Applications', icon: '📝', color: 'text-amber-600' },
            { val: `${analytics.approval_rate || 0}%`, label: 'Approval Rate', icon: '✅', color: 'text-green-600' },
          ].map((s, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* App status breakdown */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card border-l-4 border-l-green-400">
            <p className="text-2xl font-extrabold text-green-600">{analytics.approved || 0}</p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
          <div className="card border-l-4 border-l-red-400">
            <p className="text-2xl font-extrabold text-red-600">{analytics.rejected || 0}</p>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
          <div className="card border-l-4 border-l-amber-400">
            <p className="text-2xl font-extrabold text-amber-600">{analytics.pending_verification || 0}</p>
            <p className="text-sm text-gray-500">Pending Verification</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/schemes" className="card bg-gradient-to-r from-primary to-primary-light text-white hover:scale-[1.02] transition-transform">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold text-lg">Manage Schemes</h3>
            <p className="text-sm opacity-80 mt-1">Create, edit, and manage government schemes</p>
          </Link>
          {user?.tier === 'district' && (
            <Link href="/admin/officers" className="card bg-gradient-to-r from-tricolor-green to-emerald-600 text-white hover:scale-[1.02] transition-transform">
              <div className="text-3xl mb-2">🏛️</div>
              <h3 className="font-bold text-lg">Manage Officers</h3>
              <p className="text-sm opacity-80 mt-1">Create and manage district officers</p>
            </Link>
          )}
          {['national', 'state', 'district'].includes(user?.tier || '') && (
            <Link href="/admin/admins" className="card bg-gradient-to-r from-saffron to-orange-500 text-white hover:scale-[1.02] transition-transform">
              <div className="text-3xl mb-2">👑</div>
              <h3 className="font-bold text-lg">Manage Admins</h3>
              <p className="text-sm opacity-80 mt-1">Create sub-tier administrators</p>
            </Link>
          )}
        </div>

        {/* State Breakdown */}
        {citizenStats.state_breakdown?.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Citizens by State</h2>
            <div className="space-y-2">
              {citizenStats.state_breakdown.slice(0, 10).map((s: any) => (
                <div key={s.state} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-32">{s.state}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(s.count / citizenStats.total_citizens) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-600 w-10 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
