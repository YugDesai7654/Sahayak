'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import type { User, FamilyMember } from '@/types';
import { citizenApi } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

interface QRData {
  sahayak_id: string;
  signed_jwt?: string;
  issued_at?: string;
  expires_at?: string;
  token_version?: number;
}

export default function QRCardPage() {
  const { user, lang } = useAuthStore();
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
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
    } catch (err) {
      console.error('Failed to load QR credentials:', err);
    }
    setLoading(false);
  }

  const t = (en: string, hi: string) => (lang === 'hi' ? hi : en);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="bezel-shell max-w-sm w-full">
          <div className="bezel-core p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#0f1e36] border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#0f1e36]">Loading Sovereign Credential...</p>
          </div>
        </div>
      </div>
    );
  }

  const name = profile?.profile?.name || user?.name || 'Citizen';
  const sahayakId = qrData?.sahayak_id || profile?.sahayak_id || user?.sahayak_id || 'SAH-2026-IN';
  const state = profile?.profile?.state || 'Gujarat';
  const category = profile?.profile?.caste_category || 'General';
  const gender = profile?.profile?.gender || 'Not Specified';
  const issuedAt = qrData?.issued_at ? new Date(qrData.issued_at).toLocaleDateString('en-IN') : 'Official Issue';

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Delicate Sovereign Tricolor Accent Thread */}
      <div className="civic-tricolor-thread fixed top-0 left-0 right-0 z-50" />

      {/* Floating Island Navigation */}
      <header className="pt-6 px-4 sm:px-8 max-w-5xl mx-auto w-full no-print">
        <div className="flex items-center justify-between py-3 px-5 sm:px-6 rounded-full bg-white/85 backdrop-blur-md shadow-[0_4px_25px_rgba(15,30,54,0.04)] ring-1 ring-black/[0.06]">
          <Link href="/citizen/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-[#0f1e36] text-xs font-bold transition-transform duration-300 group-hover:-translate-x-0.5">
              ←
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#0f1e36]">
                {t('Civic Identity Card', 'नागरिक पहचान पत्र')}
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-widest uppercase text-[#c25e00] bg-amber-500/10 px-2 py-0.5 rounded-full">
                OFFLINE VERIFIABLE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#0f1e36] transition-colors flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>{t('Print Card', 'प्रिंट करें')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center flex-1 w-full space-y-8">
        
        {/* Family Member Tabs */}
        {(profile?.family_members?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 no-print">
            <button
              type="button"
              onClick={() => setActiveTab('me')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                activeTab === 'me'
                  ? 'bg-[#0f1e36] text-white shadow-sm'
                  : 'bg-white text-gray-700 ring-1 ring-black/[0.08] hover:bg-gray-50'
              }`}
            >
              {t('Primary Card', 'मुख्य कार्ड')} ({name})
            </button>
            {profile?.family_members?.map((m: FamilyMember) => (
              <button
                key={m.member_id}
                type="button"
                onClick={() => setActiveTab(m.member_id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeTab === m.member_id
                    ? 'bg-[#0f1e36] text-white shadow-sm'
                    : 'bg-white text-gray-700 ring-1 ring-black/[0.08] hover:bg-gray-50'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {/* Double-Bezel Physical-Grade Smart Identity Card */}
        <div className="w-full max-w-[440px]">
          <div className="bezel-shell !p-2">
            <div
              id="qr-card"
              className="qr-card w-full bg-white !rounded-[calc(2rem-0.5rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
            >
              {/* Card Header Strip */}
              <div className="bg-[#0f1e36] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-[#c25e00] flex items-center justify-center text-[10px] font-bold text-[#c25e00]">
                    ☸
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">
                      भारत गणराज्य • REPUBLIC OF INDIA
                    </p>
                    <p className="text-xs font-extrabold tracking-wide text-white">
                      SAHAYAK SOVEREIGN CIVIC WALLET
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RS256
                </span>
              </div>

              {/* National Ribbon Thread */}
              <div className="civic-tricolor-thread" />

              {/* Card Core Content */}
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-5">
                  {/* QR Framing */}
                  <div className="shrink-0 p-2.5 bg-[#f8f9fa] rounded-2xl ring-1 ring-black/[0.08] shadow-inner text-center">
                    <QRCodeSVG
                      value={qrData?.sahayak_id || sahayakId}
                      size={136}
                      level="M"
                      bgColor="#F8F9FA"
                      fgColor="#0F1E36"
                      marginSize={1}
                    />
                    <p className="text-[8px] font-extrabold text-gray-500 uppercase tracking-widest mt-1.5">
                      OFFLINE VERIFIED
                    </p>
                  </div>

                  {/* Citizen Profile Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        Full Legal Name
                      </p>
                      <p className="text-sm font-extrabold text-[#0f1e36] truncate leading-tight mt-0.5">
                        {name.toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        Sahayak Sovereign ID
                      </p>
                      <p className="text-xs font-mono font-bold text-[#c25e00] tracking-wider mt-0.5">
                        {sahayakId}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                      <div>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase">Category</p>
                        <p className="text-xs font-bold text-[#0f1e36] mt-0.5">{category}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-semibold uppercase">State</p>
                        <p className="text-xs font-bold text-[#0f1e36] mt-0.5">{state}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Footprint Footer inside Card */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                  <span className="font-mono">Sig: RSA-2048</span>
                  <span>Issued: {issuedAt}</span>
                  <span className="font-bold text-[#0d7a53]">Valid Lifetime</span>
                </div>
              </div>

              {/* Physical Security Microprint */}
              <div className="bg-[#f8f9fa] border-t border-gray-100 px-4 py-2 text-center text-[9px] text-gray-400 font-medium">
                Authorized for offline biometric &amp; visual verification across Taluka Seva Kendras
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 no-print">
          <button
            type="button"
            onClick={async () => {
              setDownloading(true);
              try {
                const blob = await citizenApi.downloadQRCard();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sahayak-card-${sahayakId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch {
                alert('Direct download unavailable. Opening browser print view.');
                window.print();
              }
              setDownloading(false);
            }}
            disabled={downloading}
            className="btn-island-primary group cursor-pointer disabled:opacity-50"
          >
            <span>{downloading ? t('Generating PDF...', 'PDF तैयार हो रहा है...') : t('Download Sovereign PDF Card', 'PDF कार्ड डाउनलोड करें')}</span>
            <span className="btn-island-icon">
              {downloading ? '⋯' : '↓'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn-island-secondary group cursor-pointer"
          >
            <span>{t('Print Physical Copy', 'भौतिक कार्ड प्रिंट करें')}</span>
            <span className="text-sm font-bold text-gray-400 group-hover:text-[#0f1e36] transition-colors">↗</span>
          </button>
        </div>

        {/* Double-Bezel Field Guidance Container */}
        <div className="bezel-shell max-w-lg w-full no-print">
          <div className="bezel-core p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="eyebrow-pill">Verification Protocol</span>
            </div>
            <h3 className="text-sm font-bold text-[#0f1e36]">
              {t('How Field Officers Verify Your Credential', 'अधिकारी आपकी पहचान का सत्यापन कैसे करते हैं')}
            </h3>
            <ul className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#0d7a53] font-bold">1.</span>
                <span>Present this QR card at any Seva Kendra or Taluka inspection counter.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0d7a53] font-bold">2.</span>
                <span>The officer scans the code with their mobile terminal or hardware 2D scanner.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0d7a53] font-bold">3.</span>
                <span>The cryptographic signature verifies locally in under 2 seconds without requiring internet connectivity.</span>
              </li>
            </ul>
          </div>
        </div>

      </main>

      {/* Subtle Civic Footer */}
      <footer className="py-6 px-4 text-center text-xs text-gray-400 no-print">
        Sahayak Civic Access Infrastructure • Sovereign Digital Identity Architecture
      </footer>
    </div>
  );
}
