'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { citizenApi } from '@/lib/api';
import type { FamilyMember } from '@/types';

export default function FamilyWalletPage() {
  const { lang } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', dob: '', gender: '', aadhaar_last4: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const res = await citizenApi.getProfile();
      setMembers(res.family_members || []);
      setProfile(res);
    } catch {}
    setLoading(false);
  }

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const addMember = async () => {
    setSaving(true);
    try {
      await citizenApi.addFamily(form);
      setMsg(t('Family member added!', 'परिवार सदस्य जोड़ दिया गया!'));
      setShowAdd(false);
      setForm({ name: '', relation: '', dob: '', gender: '', aadhaar_last4: '' });
      loadProfile();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    setSaving(false);
  };

  const removeMember = async (id: string) => {
    if (!confirm(t('Remove this family member?', 'इस सदस्य को हटाएं?'))) return;
    try { await citizenApi.removeFamily(id); loadProfile(); } catch {}
  };

  const RELATIONS = ['spouse', 'daughter', 'son', 'father', 'mother', 'sister', 'brother', 'grandparent', 'other'];

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-2xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/citizen/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-primary">{t('Family Wallet', 'परिवार वॉलेट')}</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="ml-auto btn-primary text-sm px-4 py-2">+ {t('Add Member', 'सदस्य जोड़ें')}</button>
      </div></nav>

      <main className="max-w-2xl mx-auto px-6 py-8 page-enter">
        {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>{msg}</div>}

        {showAdd && (
          <div className="card mb-6 border-2 border-primary/20">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('Add Family Member', 'परिवार सदस्य जोड़ें')}</h2>
            <div className="space-y-4">
              <div><label className="label">{t('Full Name', 'पूरा नाम')}</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="input-field" /></div>
              <div><label className="label">{t('Relation', 'संबंध')}</label>
                <select value={form.relation} onChange={e => setForm(p => ({...p, relation: e.target.value}))} className="input-field">
                  <option value="">Select relation</option>
                  {RELATIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="label">{t('Date of Birth', 'जन्म तिथि')}</label><input type="date" value={form.dob} onChange={e => setForm(p => ({...p, dob: e.target.value}))} className="input-field" /></div>
              <div><label className="label">{t('Gender', 'लिंग')}</label>
                <select value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))} className="input-field">
                  <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className="label">{t('Aadhaar Last 4', 'आधार अंतिम 4')}</label><input value={form.aadhaar_last4} onChange={e => setForm(p => ({...p, aadhaar_last4: e.target.value}))} className="input-field" maxLength={4} /></div>
              <div className="flex gap-3">
                <button onClick={addMember} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? t('Adding...', 'जोड़ रहे हैं...') : t('Add Member', 'सदस्य जोड़ें')}</button>
                <button onClick={() => setShowAdd(false)} className="btn-secondary">{t('Cancel', 'रद्द करें')}</button>
              </div>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <p className="text-xl text-gray-600 font-semibold">{t('No family members added', 'कोई सदस्य नहीं जोड़ा')}</p>
            <p className="text-gray-400 mt-2">{t('Add family members to generate QR cards for them too', 'उनके QR कार्ड बनाने के लिए सदस्य जोड़ें')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((m) => (
              <div key={m.member_id} className="card">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary">
                      {m.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{m.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{m.relation} {m.gender ? `• ${m.gender}` : ''}</p>
                      {m.dob && <p className="text-xs text-gray-400">DOB: {new Date(m.dob).toLocaleDateString('en-IN')}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/citizen/qr-card?member=${m.member_id}`} className="text-xs text-primary font-medium hover:underline">View QR</Link>
                    <button onClick={() => removeMember(m.member_id)} className="text-xs text-danger font-medium hover:underline">{t('Remove', 'हटाएं')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
