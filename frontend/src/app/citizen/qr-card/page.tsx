'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { citizenApi } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCardPage() {
  const { user, lang } = useAuthStore();
  const [qrData, setQrData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('me');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadQR();
  }, []);

  async function loadQR() {
    try {
      const [qr, prof] = await Promise.all([citizenApi.getQR(), citizenApi.getProfile()]);
      setQrData(qr);
      setProfile(prof);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="skeleton w-80 h-[500px] rounded-2xl" /></div>;

  const name = profile?.profile?.name || 'Citizen';
  const sahayakId = qrData?.sahayak_id || profile?.sahayak_id || '';
  const state = profile?.profile?.state || '';
  const category = profile?.profile?.caste_category || '';
  const issuedAt = qrData?.issued_at ? new Date(qrData.issued_at).toLocaleDateString('en-IN') : '';
  const expiresAt = qrData?.expires_at ? new Date(qrData.expires_at).toLocaleDateString('en-IN') : '';

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/citizen/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
          <h1 className="font-bold text-lg text-primary">{t('Sahayak ID Card', 'सहायक पहचान पत्र')}</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col items-center page-enter">
        {/* Tabs for family members */}
        {profile?.family_members?.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('me')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'me' ? 'bg-primary text-white' : 'bg-white border'}`}>
              {t('My Card', 'मेरा कार्ड')}
            </button>
            {profile.family_members.map((m: any) => (
              <button key={m.member_id} onClick={() => setActiveTab(m.member_id)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === m.member_id ? 'bg-primary text-white' : 'bg-white border'}`}>
                {m.name}
              </button>
            ))}
          </div>
        )}

        {/* QR Card */}
        <div className="qr-card w-full max-w-sm print:shadow-none" id="qr-card">
          {/* Tricolor header */}
          <div className="h-2 bg-gradient-to-r from-saffron via-white to-tricolor-green" />

          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-xs tracking-widest opacity-60 uppercase">Government of India</p>
              <p className="text-sm font-bold tracking-wider mt-0.5">SAHAYAK CIVIC IDENTITY</p>
              <p className="text-[10px] opacity-50 mt-0.5">सहायक नागरिक पहचान पत्र</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG
                  value={qrData?.signed_jwt || 'no-data'}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1e3a5f"
                />
              </div>
            </div>

            {/* Details */}
            <div className="text-center space-y-1">
              {/* Avatar */}
              <div className="w-14 h-14 mx-auto bg-white/20 rounded-full flex items-center justify-center text-xl font-bold mb-2">
                {name.charAt(0).toUpperCase()}
              </div>
              <p className="text-xl font-bold">{name.toUpperCase()}</p>
              <p className="text-sm opacity-70 font-mono">{sahayakId}</p>
            </div>

            {/* Footer info */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex justify-between text-xs">
                <div>
                  <p className="opacity-50">State</p>
                  <p className="font-semibold">{state}</p>
                </div>
                <div className="text-center">
                  <p className="opacity-50">Category</p>
                  <p className="font-semibold">{category}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-50">Version</p>
                  <p className="font-semibold">v{qrData?.token_version || 1}</p>
                </div>
              </div>
              <div className="flex justify-between text-[10px] mt-3 opacity-50">
                <span>Issued: {issuedAt}</span>
              </div>
            </div>
          </div>

          <div className="h-1 bg-gradient-to-r from-saffron via-white to-tricolor-green" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button onClick={async () => {
            setDownloading(true);
            try {
              const blob = await citizenApi.downloadQRCard();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sahayak-card-${sahayakId}.pdf`;
              a.click();
              window.URL.revokeObjectURL(url);
            } catch (err) { alert('Download failed'); }
            setDownloading(false);
          }} disabled={downloading} className="btn-primary text-sm px-6 py-3 disabled:opacity-50">
            📄 {downloading ? t('Downloading...', 'डाउनलोड हो रहा है...') : t('Download PDF', 'PDF डाउनलोड करें')}
          </button>
          <button onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'Sahayak ID Card', text: `Sahayak ID: ${sahayakId}` });
            }
          }} className="btn-secondary text-sm px-6 py-3">
            📤 {t('Share', 'शेयर करें')}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center max-w-sm">
          {t('This card is digitally signed using RS256. Verify its authenticity by scanning the QR code at any government office.',
             'यह कार्ड RS256 से डिजिटल रूप से हस्ताक्षरित है। किसी भी सरकारी कार्यालय में QR स्कैन करके इसकी प्रामाणिकता जांचें।')}
        </p>
      </main>
    </div>
  );
}
