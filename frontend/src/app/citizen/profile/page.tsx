'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { citizenApi } from '@/lib/api';

const STEPS = ['Identity', 'Location', 'Financial', 'Social', 'Family'];
const STATES = ['Gujarat', 'Rajasthan', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'West Bengal', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Odisha', 'Punjab', 'Haryana'];
const CASTES = [{ value: 'general', label: 'General' }, { value: 'OBC', label: 'OBC' }, { value: 'SC', label: 'SC' }, { value: 'ST', label: 'ST' }];
const RATION = [{ value: 'APL', label: 'APL' }, { value: 'BPL', label: 'BPL' }, { value: 'AAY', label: 'AAY' }];

const STATE_DISTRICTS: Record<string, string[]> = {
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur', 'Bhilwara', 'Sikar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davangere', 'Ballari', 'Vijayapura', 'Shivamogga'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Ranipet', 'Vellore', 'Erode'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Ghaziabad', 'Bareilly', 'Aligarh', 'Moradabad'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol', 'Kharagpur', 'Haldia', 'Malda', 'Baharampur', 'Bardhaman'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Alappuzha', 'Palakkad', 'Kannur', 'Kottayam', 'Malappuram'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Balangir'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Mohali', 'Batala', 'Pathankot', 'Moga'],
  'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula']
};

const Field = ({ label, field, type = 'text', options, form, up }: any) => (
  <div>
    <label className="label">{label}</label>
    {options ? (
      <select value={form[field] || ''} onChange={e => up(field, e.target.value)} className="input-field">
        <option value="">Select...</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : type === 'checkbox' ? (
      <label className="flex items-center gap-2"><input type="checkbox" checked={form[field] || false} onChange={e => up(field, e.target.checked)} className="w-5 h-5" /> Yes</label>
    ) : (
      <input type={type} value={form[field] || ''} onChange={e => up(field, type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)} className="input-field" />
    )}
  </div>
);

export default function ProfilePage() {
  const { lang } = useAuthStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    citizenApi.getProfile().then(res => {
      setForm(res.profile || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const up = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const saveStep = async () => {
    setSaving(true);
    try {
      await citizenApi.updateProfile(form);
      setMsg(t('Saved!', 'सेव हो गया!'));
      setTimeout(() => setMsg(''), 2000);
      if (step < STEPS.length - 1) setStep(s => s + 1);
    } catch (err: any) { setMsg('Error: ' + err.message); }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-surface p-6"><div className="max-w-2xl mx-auto space-y-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div></div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/citizen/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-primary">{t('My Profile', 'मेरी प्रोफ़ाइल')}</h1>
      </div></nav>

      <main className="max-w-2xl mx-auto px-6 py-8 page-enter">
        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} className={`flex-1 h-2 rounded-full transition ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-6">Step {step + 1} of {STEPS.length}: <span className="font-semibold text-primary">{STEPS[step]}</span></p>

        {msg && <div className={`mb-4 px-4 py-2 rounded-xl text-sm font-medium ${msg.includes('Error') ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>{msg}</div>}

        <div className="card space-y-4">
          {step === 0 && <>
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-gray-900 text-base">{t('Personal Identity Record', 'व्यक्तिगत पहचान रिकॉर्ड')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('Official identity details matching your official records. Used to generate your offline sovereign QR card.', 'आधिकारिक पहचान विवरण। आपके ऑफ़लाइन संप्रभु क्यूआर कार्ड को जनरेट करने के लिए उपयोग किया जाता है।')}</p>
            </div>
            <Field form={form} up={up} label={t('Full Name', 'पूरा नाम')} field="name" />
            <Field form={form} up={up} label={t('Date of Birth', 'जन्म तिथि')} field="dob" type="date" />
            <Field form={form} up={up} label={t('Gender', 'लिंग')} field="gender" options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]} />
            <Field form={form} up={up} label={t('Aadhaar Last 4', 'आधार अंतिम 4')} field="aadhaar_last4" />
            <Field form={form} up={up} label={t('Phone', 'फ़ोन')} field="phone" />
          </>}
          {step === 1 && <>
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-gray-900 text-base">{t('Residential Jurisdiction', 'निवास क्षेत्राधिकार')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('Geographic boundaries determine state and district specific welfare schemes and allocate your field verification officer.', 'भौगोलिक क्षेत्राधिकार राज्य और जिला विशिष्ट कल्याणकारी योजनाएं निर्धारित करता है।')}</p>
            </div>
            <Field form={form} up={up} label={t('State', 'राज्य')} field="state" options={STATES.map(s => ({value:s,label:s}))} />
            <Field form={form} up={up} label={t('District', 'जिला')} field="district" options={(STATE_DISTRICTS[form.state] || []).map((d: string) => ({value:d,label:d}))} />
            <Field form={form} up={up} label={t('Taluka', 'तहसील')} field="taluka" />
            <Field form={form} up={up} label={t('Village', 'गाँव')} field="village" />
            <Field form={form} up={up} label={t('Pincode', 'पिनकोड')} field="pincode" />
          </>}
          {step === 2 && <>
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-gray-900 text-base">{t('Financial & Ration Information', 'वित्तीय एवं राशन जानकारी')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('Required for Direct Benefit Transfer (DBT) subsidies, food rations, and BPL social security programs.', 'प्रत्यक्ष लाभ अंतरण (DBT) सब्सिडी, खाद्य राशन और सामाजिक सुरक्षा कार्यक्रमों के लिए आवश्यक।')}</p>
            </div>
            <Field form={form} up={up} label={t('Annual Income (₹)', 'वार्षिक आय (₹)')} field="income_annual" type="number" />
            <Field form={form} up={up} label={t('Income Source', 'आय स्रोत')} field="income_source" />
            <Field form={form} up={up} label={t('BPL Status', 'बीपीएल स्थिति')} field="is_bpl" type="checkbox" />
            <Field form={form} up={up} label={t('BPL Card Number', 'बीपीएल कार्ड नंबर')} field="bpl_card_number" />
            <Field form={form} up={up} label={t('Ration Card Type', 'राशन कार्ड प्रकार')} field="ration_card_type" options={RATION} />
            <Field form={form} up={up} label={t('Bank Account Last 4', 'बैंक खाता अंतिम 4')} field="bank_account_number_last4" />
            <Field form={form} up={up} label={t('IFSC Code', 'IFSC कोड')} field="ifsc_code" />
          </>}
          {step === 3 && <>
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-gray-900 text-base">{t('Socioeconomic & Occupational Profile', 'सामाजिक-आर्थिक एवं व्यावसायिक प्रोफ़ाइल')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('Used to identify agricultural subsidies, artisan credit schemes, student scholarships, and affirmative benefits.', 'कृषि सब्सिडी, कारीगर ऋण योजनाएं, छात्रवृत्ति और लक्षित लाभों की पहचान के लिए आवश्यक।')}</p>
            </div>
            <Field form={form} up={up} label={t('Caste Category', 'जाति श्रेणी')} field="caste_category" options={CASTES} />
            <Field form={form} up={up} label={t('Religion', 'धर्म')} field="religion" />
            <Field form={form} up={up} label={t('Occupation', 'व्यवसाय')} field="occupation" />
            <Field form={form} up={up} label={t('Land Holding (acres)', 'भूमि (एकड़)')} field="land_holding_acres" type="number" />
            <Field form={form} up={up} label={t('Disability Type', 'विकलांगता प्रकार')} field="disability_type" />
            <Field form={form} up={up} label={t('Disability %', 'विकलांगता %')} field="disability_percentage" type="number" />
            <Field form={form} up={up} label={t('Minority Status', 'अल्पसंख्यक')} field="is_minority" type="checkbox" />
            <Field form={form} up={up} label={t('Education Level', 'शिक्षा स्तर')} field="education_level" />
          </>}
          {step === 4 && <>
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-gray-900 text-base">{t('Household Registry Sync', 'पारिवारिक पंजी समन्वय')}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('Pooled welfare programs like Ayushman Bharat evaluate composite family data.', 'आयुष्मान भारत जैसे सामूहिक कल्याणकारी कार्यक्रम समग्र पारिवारिक डेटा का मूल्यांकन करते हैं।')}</p>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{t('Register dependents, spouse, or elderly family members in your Family Wallet to calculate collective household entitlement and generate sub-credentials.', 'पारिवारिक वॉलेट में आश्रितों, जीवनसाथी या बुजुर्ग परिजनों को जोड़ें ताकि समग्र लाभों की गणना की जा सके।')}</p>
            <div className="pt-2">
              <Link href="/citizen/family" className="btn-primary inline-flex items-center gap-2 text-sm">{t('Open Family Wallet Registry', 'पारिवारिक पंजी खोलें')}</Link>
            </div>
          </>}

          <div className="flex gap-3 pt-4">
            {step > 0 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">{t('Previous', 'पिछला')}</button>}
            <button onClick={saveStep} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? t('Saving...', 'सेव हो रहा है...') : step < STEPS.length - 1 ? t('Save & Next', 'सेव और अगला') : t('Complete Profile', 'प्रोफ़ाइल पूर्ण करें')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
