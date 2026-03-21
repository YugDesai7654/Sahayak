'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { adminApi } from '@/lib/api';

export default function AdminSchemesPage() {
  const { user } = useAuthStore();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: { en: '', hi: '', gu: '' }, description: { en: '', hi: '' },
    ministry: '', department: '', category: '', benefit_type: 'cash', benefit_amount: 0, benefit_frequency: 'annual',
  });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadSchemes(); }, []);

  async function loadSchemes() {
    try {
      const res = await adminApi.listSchemes();
      setSchemes(res.schemes || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const createScheme = async () => {
    setCreating(true);
    try {
      const data = {
        ...form,
        category: form.category.split(',').map(s => s.trim()).filter(Boolean),
      };
      await adminApi.createScheme(data);
      setMsg('Scheme created successfully!');
      setShowCreate(false);
      loadSchemes();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    setCreating(false);
  };

  const deleteScheme = async (id: string) => {
    if (!confirm('Deactivate this scheme?')) return;
    try { await adminApi.deleteScheme(id); loadSchemes(); } catch {}
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-6xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800">Manage Schemes</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="ml-auto btn-primary text-sm px-4 py-2">+ New Scheme</button>
      </div></nav>

      <main className="max-w-6xl mx-auto px-6 py-8 page-enter">
        {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>{msg}</div>}

        {showCreate && (
          <div className="card mb-6 border-2 border-primary/20">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Scheme</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="label">Name (English)</label><input value={form.name.en} onChange={e => setForm(p => ({...p, name: {...p.name, en: e.target.value}}))} className="input-field" /></div>
              <div><label className="label">Name (Hindi)</label><input value={form.name.hi} onChange={e => setForm(p => ({...p, name: {...p.name, hi: e.target.value}}))} className="input-field" /></div>
              <div className="md:col-span-2"><label className="label">Description (English)</label><textarea value={form.description.en} onChange={e => setForm(p => ({...p, description: {...p.description, en: e.target.value}}))} className="input-field h-20" /></div>
              <div><label className="label">Ministry</label><input value={form.ministry} onChange={e => setForm(p => ({...p, ministry: e.target.value}))} className="input-field" /></div>
              <div><label className="label">Department</label><input value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} className="input-field" /></div>
              <div><label className="label">Categories (comma-separated)</label><input value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className="input-field" placeholder="agriculture, employment" /></div>
              <div><label className="label">Benefit Type</label>
                <select value={form.benefit_type} onChange={e => setForm(p => ({...p, benefit_type: e.target.value}))} className="input-field">
                  <option value="cash">Cash</option><option value="subsidy">Subsidy</option><option value="scholarship">Scholarship</option><option value="pension">Pension</option><option value="insurance">Insurance</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className="label">Benefit Amount (₹)</label><input type="number" value={form.benefit_amount} onChange={e => setForm(p => ({...p, benefit_amount: parseFloat(e.target.value) || 0}))} className="input-field" /></div>
              <div><label className="label">Frequency</label>
                <select value={form.benefit_frequency} onChange={e => setForm(p => ({...p, benefit_frequency: e.target.value}))} className="input-field">
                  <option value="annual">Annual</option><option value="monthly">Monthly</option><option value="one-time">One-time</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createScheme} disabled={creating} className="btn-primary disabled:opacity-50">{creating ? 'Creating...' : 'Create Scheme'}</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Scheme List */}
        <div className="space-y-4">
          {schemes.map((s: any) => (
            <div key={s.scheme_id} className="card hover:scale-[1.005] transition-transform">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex gap-2 mb-1">
                    {s.category?.map((c: string) => <span key={c} className="badge-info text-[10px]">{c}</span>)}
                    <span className="badge-neutral text-[10px]">{s.scope}</span>
                    {!s.is_active && <span className="badge-danger text-[10px]">Inactive</span>}
                  </div>
                  <h3 className="font-bold text-gray-900">{s.name?.en || s.scheme_id}</h3>
                  <p className="text-sm text-gray-500 mt-1">{s.ministry} • {s.department}</p>
                  {s.scope_state && <p className="text-xs text-gray-400 mt-1">Scope: {s.scope_state}{s.scope_district ? ` / ${s.scope_district}` : ''}{s.scope_taluka ? ` / ${s.scope_taluka}` : ''}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-primary">₹{s.benefit_amount?.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{s.benefit_frequency}</p>
                </div>
              </div>
              {s.can_edit && (
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <button className="text-sm text-primary font-medium hover:underline">Edit</button>
                  <button onClick={() => deleteScheme(s.scheme_id)} className="text-sm text-danger font-medium hover:underline">Deactivate</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
