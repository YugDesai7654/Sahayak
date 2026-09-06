'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { officerApi, applicationApi } from '@/lib/api';

function normalizeQrInput(raw: string) {
  const value = (raw || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      const queryKeys = ['sahayak_id', 'id', 'data', 'q', 'token', 'qr_jwt', 'jwt'];
      for (const key of queryKeys) {
        const value = url.searchParams.get(key);
        if (value) return value.trim();
      }
      const pathPart = url.pathname.split('/').filter(Boolean).pop();
      if (pathPart) return pathPart.trim();
    } catch {}
  }
  return value;
}

export default function OfficerScanPage() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'input' | 'camera' | 'result'>('input');
  const [qrInput, setQrInput] = useState('');
  const [sahayakIdInput, setSahayakIdInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);

  const startCamera = async () => {
    setMode('camera');
    setError('');
    // Dynamic import to avoid SSR issues
    const { Html5Qrcode } = await import('html5-qrcode');

    // Wait for DOM
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 300);
    await promise;
    if (!videoRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText: string) => {
          if (scannerRef.current) {
            try {
              await scannerRef.current.stop();
            } catch {}
            scannerRef.current = null;
          }
          setQrInput(decodedText);
          handleScan(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setError('Camera initialization failed. Please use manual Sahayak ID lookup below.');
      setMode('input');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setMode('input');
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleScan = async (qrValue?: string, sahayakId?: string) => {
    const payload: any = {};
    if (qrValue || qrInput) payload.qr_jwt = normalizeQrInput(qrValue || qrInput);
    else if (sahayakId || sahayakIdInput) payload.sahayak_id = (sahayakId || sahayakIdInput).trim().toUpperCase();
    else {
      setError('Please provide a QR token or Sahayak ID to verify.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await officerApi.scan(payload);
      setScanResult(res);
      setMode('result');
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : 'Verification failed. Record not found.');
      setMode('input');
    } finally {
      setLoading(false);
    }
  };

  const verifyField = async (appId: string, fieldId: string, status: string) => {
    if (status === 'rejected' && !rejectNotes[fieldId]?.trim()) {
      setShowRejectInput(fieldId);
      return;
    }
    setVerifying(fieldId);
    try {
      await applicationApi.verifyField(appId, {
        field_id: fieldId,
        status,
        note: rejectNotes[fieldId] || undefined,
      });
      setShowRejectInput(null);
      setRejectNotes(p => ({ ...p, [fieldId]: '' }));
      if (qrInput || sahayakIdInput) {
        await handleScan(qrInput, sahayakIdInput);
      }
    } catch (err: any) {
      setError(err.message || 'Verification update failed.');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] text-[#0f1e36] flex flex-col justify-between relative [background-image:radial-gradient(rgba(15,30,54,0.06)_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Sovereign Tricolor Accent Thread */}
      <div className="civic-tricolor-thread fixed top-0 left-0 right-0 z-50" />

      {/* Floating Island Header */}
      <header className="pt-6 px-4 sm:px-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between py-3 px-5 sm:px-6 rounded-full bg-white/85 backdrop-blur-md shadow-[0_4px_25px_rgba(15,30,54,0.04)] ring-1 ring-black/[0.06]">
          <Link href="/officer/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-[#0f1e36] text-xs font-bold transition-transform duration-300 group-hover:-translate-x-0.5">
              ←
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#0f1e36]">
                Field Verification Terminal
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-widest uppercase text-[#0d7a53] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                OFFICER DESK
              </span>
            </div>
          </Link>

          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-[#0d7a53]">
            {user?.name || 'Officer'}
          </span>
        </div>
      </header>

      {/* Main Terminal Workspace */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 w-full space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-sm font-medium border border-rose-200/80 flex items-start gap-3">
            <span className="text-base leading-none">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Mode: Input Selection */}
        {mode === 'input' && (
          <div className="max-w-xl mx-auto space-y-6">
            
            {/* Camera Viewfinder Trigger */}
            <div className="bezel-shell !p-2">
              <div className="bezel-core p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0d7a53]/10 text-[#0d7a53] flex items-center justify-center text-2xl mx-auto">
                  📷
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-[#0f1e36]">Scan Citizen QR Code</h2>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Point your camera at the physical or digital Sahayak Identity Card for instant offline verification.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-island-primary !bg-[#0d7a53] hover:!bg-[#0b6645] !shadow-[0_10px_25px_-5px_rgba(13,122,83,0.3)] !px-8 !py-3 group cursor-pointer"
                >
                  <span>Launch Camera Scanner</span>
                  <span className="btn-island-icon">→</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
              <div className="flex-1 h-px bg-gray-200" />
              <span>OR USE MANUAL DISPATCH</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Direct Sahayak ID Lookup */}
            <div className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-4">
                <div>
                  <span className="eyebrow-pill">Fallback Lookup</span>
                  <h3 className="text-base font-bold text-[#0f1e36] mt-1">Direct Sahayak ID Search</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    If physical card is damaged or camera scanner is unavailable, verify via citizen ID.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sahayakIdInput}
                    onChange={e => setSahayakIdInput(e.target.value)}
                    className="input-field font-mono uppercase tracking-widest text-xs"
                    placeholder="e.g. SAH-GU-00001"
                    maxLength={18}
                  />
                  <button
                    type="button"
                    onClick={() => handleScan(undefined, sahayakIdInput)}
                    disabled={loading}
                    className="btn-island-primary !py-2 !px-5 text-xs group cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <span>{loading ? 'Searching...' : 'Search Record'}</span>
                    <span className="btn-island-icon !w-6 !h-6 text-xs">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hardware Barcode Scanner Input */}
            <div className="bezel-shell !p-1.5">
              <div className="bezel-core p-6 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0f1e36]">Hardware 2D Barcode Scanner Input</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    For USB or Bluetooth handheld 2D scanners, paste or scan the raw token payload below.
                  </p>
                </div>

                <textarea
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  className="input-field h-20 font-mono text-xs"
                  placeholder="Paste scanned QR raw string or URL..."
                />

                <button
                  type="button"
                  onClick={() => handleScan(qrInput)}
                  disabled={loading}
                  className="btn-island-secondary w-full group cursor-pointer disabled:opacity-50 text-xs"
                >
                  <span>{loading ? 'Verifying...' : 'Validate Raw QR Data'}</span>
                  <span className="text-xs font-semibold text-[#0f1e36]">→</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Mode: Camera Viewfinder */}
        {mode === 'camera' && (
          <div className="max-w-md mx-auto">
            <div className="bezel-shell !p-2">
              <div className="bezel-core p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-[#0f1e36]">Optical Viewfinder Active</h3>
                  </div>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>

                <div
                  id="qr-reader"
                  ref={videoRef}
                  className="rounded-2xl overflow-hidden ring-1 ring-black/[0.08] shadow-inner"
                  style={{ minHeight: '300px' }}
                />

                <p className="text-center text-xs text-gray-400">
                  Align citizen QR code within the framing reticle
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mode: Verification Result */}
        {mode === 'result' && (
          <div className="space-y-6">
            {scanResult?.valid ? (
              <>
                {/* Cryptographic Verification Status Banner */}
                <div className="bezel-shell !p-1.5">
                  <div className="bezel-core p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#0d7a53] flex items-center justify-center text-2xl font-bold">
                        ✓
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-extrabold text-[#0f1e36]">
                            Cryptographic Signature Valid
                          </h2>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0d7a53]">
                            RS256 CONFIRMED
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Citizen credential belongs to verified sovereign register.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('input');
                        setScanResult(null);
                        setQrInput('');
                        setSahayakIdInput('');
                      }}
                      className="text-xs font-semibold px-4 py-2 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-[#0f1e36] transition-colors"
                    >
                      Scan Next Citizen →
                    </button>
                  </div>
                </div>

                {/* Citizen Profile Details */}
                {scanResult.citizen && (
                  <div className="bezel-shell !p-1.5">
                    <div className="bezel-core p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="eyebrow-pill">Citizen Identity Dossier</span>
                        <span className="font-mono text-xs font-bold text-[#c25e00]">
                          {scanResult.citizen.sahayak_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        {[
                          ['Legal Name', scanResult.citizen.name],
                          ['Phone', scanResult.citizen.phone],
                          ['State', scanResult.citizen.state],
                          ['District', scanResult.citizen.district],
                          ['Taluka', scanResult.citizen.taluka],
                          ['Village', scanResult.citizen.village],
                          ['Annual Income', scanResult.citizen.income_annual ? `₹${Number(scanResult.citizen.income_annual).toLocaleString('en-IN')}` : 'N/A'],
                          ['Category', scanResult.citizen.caste_category],
                        ].map(([label, val]) => (
                          <div key={label} className="p-3 rounded-xl bg-[#f8f9fa] space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
                            <p className="font-bold text-[#0f1e36] truncate">{val || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Offline Field Verifications */}
                {scanResult.pending_applications?.length > 0 && (
                  <div className="bezel-shell !p-1.5">
                    <div className="bezel-core p-6 space-y-6">
                      <div>
                        <span className="eyebrow-pill">Required Field Action</span>
                        <h3 className="text-base font-bold text-[#0f1e36] mt-1">
                          Pending Physical Document Inspections
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Inspect original certificates and mark each statutory clause verified or rejected.
                        </p>
                      </div>

                      {scanResult.pending_applications.map((app: any) => (
                        <div key={app.application_id} className="p-5 rounded-2xl bg-[#f8f9fa] space-y-4 border border-black/[0.04]">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-[#0f1e36]">{app.scheme_name}</h4>
                              <p className="font-mono text-[11px] text-gray-400">{app.application_id}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-[#c25e00]">
                              {app.overall_status}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {app.offline_verification_fields?.map((field: any) => (
                              <div
                                key={field.field_id}
                                className="p-4 rounded-xl bg-white ring-1 ring-black/[0.06] space-y-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-xs text-[#0f1e36]">
                                      {field.label || field.offline_verification_label}
                                    </p>
                                    {field.offline_verification_label && field.offline_verification_label !== field.label && (
                                      <p className="text-[11px] text-gray-500 mt-0.5">
                                        {field.offline_verification_label}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      field.status === 'verified'
                                        ? 'bg-emerald-50 text-[#0d7a53]'
                                        : field.status === 'rejected'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-amber-50 text-[#c25e00]'
                                    }`}
                                  >
                                    {field.status === 'verified' ? '✓ Verified' : field.status === 'rejected' ? '✕ Rejected' : 'Pending'}
                                  </span>
                                </div>

                                {field.status === 'pending' && (
                                  <div className="space-y-2 pt-2 border-t border-gray-100">
                                    {showRejectInput === field.field_id && (
                                      <textarea
                                        placeholder="Specify statutory rejection reason (e.g. 'Income certificate expired on 31-03-2026', 'Survey number mismatch with 7/12 record')..."
                                        className="input-field text-xs h-20"
                                        value={rejectNotes[field.field_id] || ''}
                                        onChange={e => setRejectNotes(p => ({ ...p, [field.field_id]: e.target.value }))}
                                      />
                                    )}
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => verifyField(app.application_id, field.field_id, 'verified')}
                                        disabled={verifying === field.field_id}
                                        className="flex-1 py-2 px-3 rounded-full bg-[#0d7a53] text-white text-xs font-bold hover:bg-[#0b6645] transition-colors disabled:opacity-50"
                                      >
                                        {verifying === field.field_id ? 'Verifying...' : '✓ Approve Clause'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => verifyField(app.application_id, field.field_id, 'rejected')}
                                        disabled={verifying === field.field_id}
                                        className="flex-1 py-2 px-3 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                                      >
                                        {verifying === field.field_id ? 'Updating...' : '✕ Reject Clause'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bezel-shell !p-2">
                <div className="bezel-core p-10 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-3xl mx-auto">
                    🚫
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-rose-700">Invalid or Untrusted Credential</h2>
                    <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                      The presented QR token could not be verified by the cryptographic public key or does not match any registered sovereign citizen account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('input');
                      setScanResult(null);
                      setQrInput('');
                      setSahayakIdInput('');
                    }}
                    className="btn-island-secondary text-xs"
                  >
                    ← Return to Scanner Desk
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Subtle Civic Footer */}
      <footer className="py-6 px-4 text-center text-xs text-gray-400 border-t border-gray-100">
        Sahayak Civic Access Infrastructure • Field Officer Terminal
      </footer>
    </div>
  );
}
