'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { adminApi } from '@/lib/api';

export default function AdminSchemesPage() {
  type FormState = {
    scheme_id: string;
    name: { en: string; hi: string; gu: string };
    description: { en: string; hi: string };
    ministry: string;
    department: string;
    category: string;
    benefit_type: string;
    benefit_amount: string;
    benefit_frequency: string;
    deadline: string;
    required_documents: string[];
    eligibility_rules: any[];
    application_form: { sections: any[] };
  };

  const normalizeAmountInput = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length <= 1) return cleaned;
    return `${parts[0]}.${parts.slice(1).join('')}`;
  };

  const toAmountNumber = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  };

  const { user } = useAuthStore();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Form State
  const initialFormState = {
    scheme_id: '',
    name: { en: '', hi: '', gu: '' },
    description: { en: '', hi: '' },
    ministry: '', department: '', category: '', 
    benefit_type: 'cash', benefit_amount: 0, benefit_frequency: 'annual',
    deadline: '',
    required_documents: [] as string[],
    eligibility_rules: [] as any[],
    application_form: { sections: [] as any[] }
  };
  const [form, setForm] = useState(initialFormState);

  useEffect(() => { loadSchemes(); }, []);

  async function loadSchemes() {
    try {
      const res = await adminApi.listSchemes();
      setSchemes(res.schemes || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const openCreate = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setShowModal(true);
    setMsg('');
  };

  const openEdit = (scheme: any) => {
    setForm({
      scheme_id: scheme.scheme_id,
      name: scheme.name || { en: '', hi: '', gu: '' },
      description: scheme.description || { en: '', hi: '' },
      ministry: scheme.ministry || '',
      department: scheme.department || '',
      category: scheme.category?.join(', ') || '',
      benefit_type: scheme.benefit_type || 'cash',
      benefit_amount: scheme.benefit_amount || 0,
      benefit_frequency: scheme.benefit_frequency || 'annual',
      deadline: scheme.deadline ? scheme.deadline.split('T')[0] : '',
      required_documents: scheme.required_documents || [],
      eligibility_rules: scheme.eligibility_rules || [],
      application_form: scheme.application_form || { sections: [] }
    });
    setIsEditing(true);
    setShowModal(true);
    setMsg('');
  };

  const saveScheme = async () => {
    setSaving(true);
    try {
      const payload = { ...form, category: form.category.split(',').map(s => s.trim()).filter(Boolean) };
      
      if (isEditing) {
        await adminApi.updateScheme(form.scheme_id, payload);
        setMsg('Scheme updated successfully!');
      } else {
        await adminApi.createScheme(payload);
        setMsg('Scheme created successfully!');
      }
      
      setShowModal(false);
      loadSchemes();
    } catch (err: any) { setMsg('Error: ' + err.message); }
    setSaving(false);
  };

  const deleteScheme = async (id: string) => {
    if (!confirm('Deactivate this scheme? Application forms will no longer be available.')) return;
    try { await adminApi.deleteScheme(id); loadSchemes(); } catch (err: any) { alert(err.message); }
  };

  // --- Form Builder Helpers ---
  const addSection = () => {
    setForm(p => ({
      ...p,
      application_form: {
        sections: [...(p.application_form?.sections || []), { 
          section_id: 'sec_' + Date.now(), 
          title: { en: 'New Section', hi: '' }, 
          fields: [] 
        }]
      }
    }));
  };

  const addField = (secIndex: number) => {
    const newSections = [...(form.application_form?.sections || [])];
    newSections[secIndex].fields.push({
      field_id: 'field_' + Date.now(),
      label: { en: 'New Field', hi: '' },
      type: 'text',
      is_required: true,
      requires_offline_verification: false,
      offline_verification_label: ''
    });
    setForm(p => ({ ...p, application_form: { sections: newSections } }));
  };

  const updateField = (secIndex: number, fieldIndex: number, key: string, value: any, isLabel = false) => {
    const newSections = [...(form.application_form?.sections || [])];
    if (isLabel) {
      newSections[secIndex].fields[fieldIndex].label[key] = value;
    } else {
      newSections[secIndex].fields[fieldIndex][key] = value;
    }
    setForm(p => ({ ...p, application_form: { sections: newSections } }));
  };

  const removeField = (secIndex: number, fieldIndex: number) => {
    const newSections = [...(form.application_form?.sections || [])];
    newSections[secIndex].fields.splice(fieldIndex, 1);
    setForm(p => ({ ...p, application_form: { sections: newSections } }));
  };

  // --- Eligibility Builder Helpers ---
  const addRule = () => {
    setForm(p => ({
      ...p,
      eligibility_rules: [...(p.eligibility_rules || []), {
        rule_id: 'rule_' + Date.now(),
        field: 'income_annual',
        operator: 'lte',
        value: 100000,
        label: 'Income must be less than ₹1,00,000'
      }]
    }));
  };
  
  const updateRule = (idx: number, key: string, value: any) => {
    const newRules = [...(form.eligibility_rules || [])];
    newRules[idx][key] = value;
    setForm(p => ({ ...p, eligibility_rules: newRules }));
  };
  
  const removeRule = (idx: number) => {
    const newRules = [...(form.eligibility_rules || [])];
    newRules.splice(idx, 1);
    setForm(p => ({ ...p, eligibility_rules: newRules }));
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-6xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800">Manage Schemes</h1>
        <button onClick={openCreate} className="ml-auto btn-primary text-sm px-4 py-2">+ New Scheme</button>
      </div></nav>

      <main className="max-w-6xl mx-auto px-6 py-8 page-enter">
        {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>{msg}</div>}

        {/* Modal Overlay for Create/Edit */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-6 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl min-h-[50vh] flex flex-col shadow-2xl my-8">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">{isEditing ? `Edit Scheme: ${form.name.en}` : 'Create New Scheme'}</h2>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={saveScheme} disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : 'Save Scheme'}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Basic Details */}
                <section>
                  <h3 className="text-lg font-bold text-primary border-b pb-2 mb-4">1. Basic Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="label">Name (English)</label><input value={form.name.en} onChange={e => setForm(p => ({...p, name: {...p.name, en: e.target.value}}))} className="input-field" /></div>
                    <div><label className="label">Name (Hindi)</label><input value={form.name.hi} onChange={e => setForm(p => ({...p, name: {...p.name, hi: e.target.value}}))} className="input-field" /></div>
                    <div className="md:col-span-2"><label className="label">Description (English)</label><textarea value={form.description.en} onChange={e => setForm(p => ({...p, description: {...p.description, en: e.target.value}}))} className="input-field min-h-[80px]" /></div>
                    <div><label className="label">Ministry</label><input value={form.ministry} onChange={e => setForm(p => ({...p, ministry: e.target.value}))} className="input-field" /></div>
                    <div><label className="label">Department</label><input value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} className="input-field" /></div>
                    <div><label className="label">Categories (comma-separated)</label><input value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className="input-field" placeholder="agriculture, employment" /></div>
                    <div><label className="label">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} className="input-field" /></div>
                  </div>
                </section>

                {/* Benefits */}
                <section>
                  <h3 className="text-lg font-bold text-green-700 border-b pb-2 mb-4">2. Benefits</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div><label className="label">Benefit Type</label>
                      <select value={form.benefit_type} onChange={e => setForm(p => ({...p, benefit_type: e.target.value}))} className="input-field">
                        <option value="cash">Cash</option><option value="subsidy">Subsidy</option><option value="scholarship">Scholarship</option><option value="pension">Pension</option><option value="insurance">Insurance</option><option value="other">Other</option>
                      </select>
                    </div>
                    <div><label className="label">Amount (₹)</label><input type="number" value={form.benefit_amount} onChange={e => setForm(p => ({...p, benefit_amount: parseFloat(e.target.value) || 0}))} className="input-field" /></div>
                    <div><label className="label">Frequency</label>
                      <select value={form.benefit_frequency} onChange={e => setForm(p => ({...p, benefit_frequency: e.target.value}))} className="input-field">
                        <option value="annual">Annual</option><option value="monthly">Monthly</option><option value="one-time">One-time</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Eligibility Builder */}
                <section>
                  <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-bold text-blue-700">3. Eligibility Rules Planner (Citizen App Matching)</h3>
                    <button onClick={addRule} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-200">+ Add Rule</button>
                  </div>
                  {form.eligibility_rules?.length === 0 && <p className="text-gray-400 text-sm">No rules defined. Everyone will be eligible.</p>}
                  
                  <div className="space-y-3">
                    {form.eligibility_rules?.map((rule: any, i: number) => (
                      <div key={rule.rule_id} className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div><label className="text-xs text-blue-800 font-semibold">Profile Field</label>
                            <select value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)} className="input-field mt-1 text-sm">
                              <option value="income_annual">Annual Income</option><option value="age">Age</option><option value="gender">Gender</option><option value="caste_category">Caste</option><option value="is_bpl">Is BPL</option>
                            </select>
                          </div>
                          <div><label className="text-xs text-blue-800 font-semibold">Operator</label>
                            <select value={rule.operator} onChange={e => updateRule(i, 'operator', e.target.value)} className="input-field mt-1 text-sm">
                              <option value="eq">Equals (==)</option><option value="neq">Not Equals (!=)</option><option value="lt">Less Than (&lt;)</option><option value="lte">Less/Equal (&lt;=)</option><option value="gt">Greater Than (&gt;)</option><option value="gte">Greater/Equal (&gt;=)</option>
                            </select>
                          </div>
                          <div><label className="text-xs text-blue-800 font-semibold">Target Value</label><input type="text" value={rule.value} onChange={e => updateRule(i, 'value', e.target.value)} className="input-field mt-1 text-sm" /></div>
                          <div><label className="text-xs text-blue-800 font-semibold">Display Label</label><input type="text" value={rule.label} onChange={e => updateRule(i, 'label', e.target.value)} className="input-field mt-1 text-sm" placeholder="e.g. Income < 1L" /></div>
                        </div>
                        <button onClick={() => removeRule(i)} className="text-red-500 font-bold hover:bg-red-50 p-2 rounded-lg mt-5">✕</button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Dynamic Application Form Builder */}
                <section>
                  <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-bold text-amber-700">4. Application Form Builder</h3>
                    <button onClick={addSection} className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-semibold hover:bg-amber-200">+ Add Form Section</button>
                  </div>
                  
                  {(!form.application_form?.sections || form.application_form.sections.length === 0) && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl text-amber-800 text-sm">
                      <span className="font-bold">⚠️ No Action Required:</span> If you don't build a form, applying for this scheme will just be a 1-click apply.
                    </div>
                  )}

                  <div className="space-y-6">
                    {form.application_form?.sections?.map((sec: any, secIdx: number) => (
                      <div key={sec.section_id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                          <input 
                            value={sec.title.en} 
                            onChange={e => {
                              const newSections = [...form.application_form.sections];
                              newSections[secIdx].title.en = e.target.value;
                              setForm(p => ({ ...p, application_form: { sections: newSections } }));
                            }}
                            className="font-bold bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-primary text-gray-800"
                            placeholder="Section Title"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => addField(secIdx)} className="text-xs text-white bg-gray-800 px-3 py-1 rounded-md">+ Field</button>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          {sec.fields.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No fields in this section.</p>}
                          
                          {sec.fields.map((field: any, fIdx: number) => (
                            <div key={field.field_id} className="bg-white border rounded-lg p-4 shadow-sm relative">
                              <button onClick={() => removeField(secIdx, fIdx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">✕</button>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-semibold text-gray-600 block mb-1">Field Label (Visible to user)</label>
                                  <input value={field.label.en} onChange={e => updateField(secIdx, fIdx, 'en', e.target.value, true)} className="input-field text-sm" placeholder="e.g. Upload Income Certificate" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">Input Type</label>
                                    <select value={field.type} onChange={e => updateField(secIdx, fIdx, 'type', e.target.value)} className="input-field text-sm">
                                      <option value="text">Short Text</option><option value="textarea">Long Text</option><option value="number">Number</option><option value="date">Date</option><option value="file">File Upload</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center mt-6">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                      <input type="checkbox" checked={field.is_required} onChange={e => updateField(secIdx, fIdx, 'is_required', e.target.checked)} className="w-4 h-4 text-primary rounded border-gray-300" />
                                      Required
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {/* Offline Verification Config */}
                              <div className="mt-4 pt-3 border-t bg-amber-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                                <label className="flex items-start gap-2 text-sm text-amber-900 cursor-pointer font-semibold mb-2">
                                  <input type="checkbox" checked={field.requires_offline_verification} onChange={e => updateField(secIdx, fIdx, 'requires_offline_verification', e.target.checked)} className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300" />
                                  Trigger Physical Verfication by Officer
                                </label>
                                {field.requires_offline_verification && (
                                  <div className="pl-6">
                                    <p className="text-xs text-amber-700 mb-1">What should the officer physically verify for this field?</p>
                                    <input 
                                      value={field.offline_verification_label || ''} 
                                      onChange={e => updateField(secIdx, fIdx, 'offline_verification_label', e.target.value)} 
                                      className="w-full px-3 py-2 text-sm rounded border border-amber-300 bg-white" 
                                      placeholder="e.g. Verify original Income Certificate and its seal" 
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
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
                  
                  {/* Status Indicator */}
                  {s.application_form?.sections?.length > 0 ? (
                    <p className="text-xs text-primary font-medium mt-2">📋 Details Form Attached ({s.application_form.sections.reduce((acc: number, sec: any) => acc + sec.fields.length, 0)} fields)</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-2">⚡ 1-Click apply (No form attached)</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-extrabold text-primary">₹{s.benefit_amount?.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.benefit_frequency}</p>
                </div>
              </div>

              {s.can_edit && (
                <div className="flex gap-4 mt-4 pt-3 border-t">
                  <button onClick={() => openEdit(s)} className="text-sm text-primary font-bold hover:underline">✏️ Edit Rules & Form</button>
                  <button onClick={() => deleteScheme(s.scheme_id)} className="text-sm text-danger font-bold hover:underline">🗑️ Deactivate</button>
                </div>
              )}
            </div>
          ))}
          {schemes.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No schemes found in your jurisdiction.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
