'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { adminApi } from '@/lib/api';

export default function AdminAdminsPage() {
  const { user } = useAuthStore();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', tier: '', jurisdiction: { state: '', district: '', taluka: '' } });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const tierChain: Record<string, string[]> = { national: ['national', 'state'], state: ['district'], district: ['taluka'], taluka: [] };
  const allowedTiers = tierChain[user?.tier || ''] || [];

  useEffect(() => { loadAdmins(); }, []);

  async function loadAdmins() {
    try { const res = await adminApi.listAdmins(); setAdmins(res.admins || []); } catch {}
    setLoading(false);
  }

  const create = async () => {
    setCreating(true);
    try {
      const res = await adminApi.createAdmin(form);
      setMsg(`Admin created! ID: ${res.admin_id}`);
      setTempPassword(res.temp_password);
      setShowCreate(false);
      loadAdmins();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    setCreating(false);
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this admin?')) return;
    try { await adminApi.deactivateAdmin(id); loadAdmins(); } catch {}
  };

  const tierLabel: Record<string, string> = { national: '🇮🇳 National', state: '📍 State', district: '🏘️ District', taluka: '🌾 Taluka' };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-4xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800">Manage Administrators</h1>
        {allowedTiers.length > 0 && <button onClick={() => setShowCreate(!showCreate)} className="ml-auto btn-accent text-sm px-4 py-2">+ New Admin</button>}
      </div></nav>

      <main className="max-w-4xl mx-auto px-6 py-8 page-enter">
        {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>{msg}</div>}
        {tempPassword && (
          <div className="mb-4 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
            <p className="text-sm font-medium text-amber-800">Temporary Password: <span className="font-mono font-bold">{tempPassword}</span></p>
            <p className="text-xs text-amber-600 mt-1">Share this securely. Must be changed on first login.</p>
          </div>
        )}

        {showCreate && (
          <div className="card mb-6 border-2 border-saffron/20">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Sub-Tier Administrator</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" /></div>
              <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="input-field" /></div>
              <div><label className="label">Tier</label>
                <select value={form.tier} onChange={e => setForm(p => ({...p, tier: e.target.value}))} className="input-field">
                  <option value="">Select tier</option>
                  {allowedTiers.map(t => <option key={t} value={t}>{tierLabel[t]}</option>)}
                </select>
              </div>
              {(form.tier === 'state' || form.tier === 'district' || form.tier === 'taluka') && (
                <div><label className="label">State</label><input value={form.jurisdiction.state} onChange={e => setForm(p => ({...p, jurisdiction: {...p.jurisdiction, state: e.target.value}}))} className="input-field" /></div>
              )}
              {(form.tier === 'district' || form.tier === 'taluka') && (
                <div><label className="label">District</label><input value={form.jurisdiction.district} onChange={e => setForm(p => ({...p, jurisdiction: {...p.jurisdiction, district: e.target.value}}))} className="input-field" /></div>
              )}
              {form.tier === 'taluka' && (
                <div><label className="label">Taluka</label><input value={form.jurisdiction.taluka} onChange={e => setForm(p => ({...p, jurisdiction: {...p.jurisdiction, taluka: e.target.value}}))} className="input-field" /></div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={create} disabled={creating} className="btn-accent disabled:opacity-50">{creating ? 'Creating...' : 'Create Admin'}</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {admins.map((a: any) => (
            <div key={a.admin_id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="badge-info text-[10px]">{tierLabel[a.tier] || a.tier}</span>
                    <h3 className="font-bold text-gray-900">{a.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{a.email}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.jurisdiction?.state}{a.jurisdiction?.district ? ` / ${a.jurisdiction.district}` : ''}{a.jurisdiction?.taluka ? ` / ${a.jurisdiction.taluka}` : ''}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{a.admin_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={a.is_active ? 'badge-success' : 'badge-danger'}>{a.is_active ? 'Active' : 'Inactive'}</span>
                  {a.is_active && <button onClick={() => deactivate(a.admin_id)} className="text-xs text-danger hover:underline">Deactivate</button>}
                </div>
              </div>
            </div>
          ))}
          {admins.length === 0 && (
            <div className="text-center py-16"><div className="text-5xl mb-4">👑</div><p className="text-gray-500">No sub-tier admins found</p></div>
          )}
        </div>
      </main>
    </div>
  );
}
