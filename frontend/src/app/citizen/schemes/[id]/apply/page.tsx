'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { schemeApi, citizenApi, applicationApi } from '@/lib/api';

export default function ApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useAuthStore();
  
  const [scheme, setScheme] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [sch, prof] = await Promise.all([
        schemeApi.get(id as string),
        citizenApi.getProfile()
      ]);
      setScheme(sch);
      setProfile(prof);
      
      // Auto-fill from profile
      const initialData: any = {};
      if (sch.application_form?.sections) {
        for (const sec of sch.application_form.sections) {
          for (const f of sec.fields) {
            if (!f.requires_offline_verification && f.maps_to_profile && prof.profile[f.maps_to_profile] !== undefined) {
              initialData[f.field_id] = prof.profile[f.maps_to_profile];
            }
          }
        }
      }
      setFormData(initialData);
    } catch (err) {
      console.error(err);
      setError('Failed to load scheme details');
    }
    setLoading(false);
  }

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await applicationApi.create({ scheme_id: id as string, digital_form_data: formData });
      setSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Application failed');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="skeleton max-w-3xl mx-auto h-96 rounded-2xl" /></div>;
  if (!scheme) return <div className="p-6 text-center text-red-500">Scheme not found</div>;

  const form = scheme.application_form;
  const offlineFields: any[] = [];
  const digitalFields: any[] = [];

  if (form?.sections) {
    form.sections.forEach((sec: any) => {
      sec.fields.forEach((f: any) => {
        if (f.requires_offline_verification) offlineFields.push(f);
        else digitalFields.push({ ...f, section: sec.title.en });
      });
    });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 page-enter">
        <div className="card max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('Application Submitted!', 'आवेदन जमा हो गया!')}</h2>
          <p className="text-gray-500 mb-4">{t('Your application ID is:', 'आपका आवेदन आईडी है:')}</p>
          <div className="bg-gray-100 py-3 rounded-lg font-mono text-lg font-bold text-primary mb-6">{success.application_id}</div>
          
          {success.has_offline_verification ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left mb-6">
              <p className="font-bold text-amber-800 mb-2">⚠️ {t('Physical Verification Required', 'भौतिक सत्यापन आवश्यक')}</p>
              <p className="text-sm text-amber-700">
                {t('Please visit your nearest government office with your Sahayak QR Card and original documents for physical verification.', 
                   'कृपया भौतिक सत्यापन के लिए अपने सहायक QR कार्ड और मूल दस्तावेजों के साथ अपने निकटतम सरकारी कार्यालय जाएं।')}
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-800 mb-6">
              {t('Your application is completely digital and is now under review.', 'आपका आवेदन पूरी तरह से डिजिटल है और अब समीक्षा के अधीन है।')}
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/citizen/applications" className="btn-primary w-full flex-1">
              {t('View Applications', 'आवेदन देखें')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href={`/citizen/schemes`} className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800 truncate">{lang === 'hi' ? scheme.name.hi : scheme.name.en}</h1>
      </div></nav>

      <main className="max-w-3xl mx-auto px-6 py-8 page-enter">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-2">{t('Apply for Scheme', 'योजना के लिए आवेदन करें')}</h2>
          <p className="text-gray-500">{t('Review pre-filled details and complete any missing information.', 'पहले से भरे गए विवरणों की समीक्षा करें और कोई भी छूटी हुई जानकारी पूरी करें।')}</p>
        </div>

        {error && <div className="bg-red-50 text-danger p-4 rounded-xl mb-6">{error}</div>}

        {offlineFields.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl mb-8">
            <h3 className="font-bold text-amber-800">{t('Following items will be verified when you visit the office:', 'जब आप कार्यालय जाएंगे तो निम्नलिखित वस्तुओं का सत्यापन किया जाएगा:')}</h3>
            <ul className="list-disc ml-5 mt-2 text-sm text-amber-700 space-y-1">
              {offlineFields.map(f => (
                <li key={f.field_id}>{f.offline_verification_label || (lang === 'hi' ? f.label.hi : f.label.en)}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {form?.sections?.map((sec: any) => {
            const fields = sec.fields.filter((f: any) => !f.requires_offline_verification);
            if (fields.length === 0) return null;

            return (
              <div key={sec.section_id} className="card">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">{lang === 'hi' ? sec.title.hi : sec.title.en}</h3>
                <div className="space-y-4">
                  {fields.map((field: any) => (
                    <div key={field.field_id}>
                      <label className="label">
                        {lang === 'hi' ? field.label.hi : field.label.en}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'select' ? (
                        <select 
                          className="input-field" 
                          required={field.is_required}
                          value={formData[field.field_id] || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.field_id]: e.target.value }))}
                        >
                          <option value="">Select option...</option>
                          {field.options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          className="input-field min-h-[100px]"
                          required={field.is_required}
                          value={formData[field.field_id] || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.field_id]: e.target.value }))}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="input-field"
                          required={field.is_required}
                          value={formData[field.field_id] || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.field_id]: e.target.value }))}
                          min={field.validation?.min}
                          max={field.validation?.max}
                          pattern={field.validation?.pattern}
                        />
                      )}
                      {field.maps_to_profile && formData[field.field_id] && (
                        <p className="text-xs text-green-600 mt-1">✓ {t('Auto-filled from profile', 'प्रोफाइल से ऑटो-फिल किया गया')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="card bg-blue-50 border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">{t('Declaration', 'घोषणा')}</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required className="mt-1 w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
              <span className="text-sm text-blue-800">
                {t('I hereby declare that all the information provided above is true to the best of my knowledge.', 'मैं एतद्द्वारा घोषणा करता हूं कि ऊपर दी गई सभी जानकारी मेरे सर्वोत्तम ज्ञान के अनुसार सत्य है।')}
              </span>
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full text-lg shadow-lg disabled:opacity-50">
            {submitting ? t('Submitting...', 'जमा हो रहा है...') : t('Submit Application', 'आवेदन जमा करें')}
          </button>
        </form>
      </main>
    </div>
  );
}
