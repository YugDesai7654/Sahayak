'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { adminApi } from '@/lib/api';

export default function AdminOfficersPage() {
  const { user } = useAuthStore();
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', designation: '', office_name: '', office_address: '', department: '' });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => { loadOfficers(); }, []);

  async function loadOfficers() {
    try { const res = await adminApi.listOfficers(); setOfficers(res.officers || []); } catch {}
    setLoading(false);
  }

  const create = async () => {
    setCreating(true);
    try {
      const res = await adminApi.createOfficer(form);
      setMsg(`Officer created! ID: ${res.officer_id}`);
      setTempPassword(res.temp_password);
      setShowCreate(false);
      loadOfficers();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    setCreating(false);
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this officer?')) return;
    try { await adminApi.deactivateOfficer(id); loadOfficers(); } catch {}
  };

  const up = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-4xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800">Manage Officers</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="ml-auto btn-primary text-sm px-4 py-2">+ New Officer</button>
      </div></nav>

      <main className="max-w-4xl mx-auto px-6 py-8 page-enter">
        {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>{msg}</div>}
        {tempPassword && (
          <div className="mb-4 bg-blue-50 border border-blue-200 px-4 py-3 rounded-xl">
            <p className="text-sm font-medium text-blue-800">Temporary Password: <span className="font-mono font-bold">{tempPassword}</span></p>
            <p className="text-xs text-blue-600 mt-1">Share this with the officer securely. They must change it on first login.</p>
          </div>
        )}

        {showCreate && (
          <div className="card mb-6 border-2 border-tricolor-green/20">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Officer</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input value={form.name} onChange={e => up('name', e.target.value)} className="input-field" /></div>
              <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => up('email', e.target.value)} className="input-field" /></div>
              <div><label className="label">Designation</label><input value={form.designation} onChange={e => up('designation', e.target.value)} className="input-field" placeholder="Talati cum Mantri" /></div>
              <div><label className="label">Department</label><input value={form.department} onChange={e => up('department', e.target.value)} className="input-field" placeholder="Revenue" /></div>
              <div><label className="label">Office Name</label><input value={form.office_name} onChange={e => up('office_name', e.target.value)} className="input-field" /></div>
              <div><label className="label">Office Address</label><input value={form.office_address} onChange={e => up('office_address', e.target.value)} className="input-field" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={create} disabled={creating} className="bg-tricolor-green text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50">{creating ? 'Creating...' : 'Create Officer'}</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {officers.map((o: any) => (
            <div key={o.officer_id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{o.name}</h3>
                  <p className="text-sm text-gray-500">{o.designation} • {o.department}</p>
                  <p className="text-xs text-gray-400 mt-1">{o.office_name} • {o.district}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{o.officer_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={o.is_active ? 'badge-success' : 'badge-danger'}>{o.is_active ? 'Active' : 'Inactive'}</span>
                  {o.is_active && <button onClick={() => deactivate(o.officer_id)} className="text-xs text-danger hover:underline">Deactivate</button>}
                </div>
              </div>
            </div>
          ))}
          {officers.length === 0 && (
            <div className="text-center py-16"><div className="text-5xl mb-4">🏛️</div><p className="text-gray-500">No officers created yet</p></div>
          )}
        </div>
      </main>
    </div>
  );
}
