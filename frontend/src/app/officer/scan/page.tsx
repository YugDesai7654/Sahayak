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
    
    // Wait for the DOM element to be available
    await new Promise(r => setTimeout(r, 300));
    
    if (!videoRef.current) return;
    
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // QR scanned successfully
          if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch (err) {}
            scannerRef.current = null;
          }
          setQrInput(decodedText);
          handleScan(decodedText);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      setError('Camera access denied or not available. Please paste the QR code instead.');
      setMode('input');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setMode('input');
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  const [sahayakIdInput, setSahayakIdInput] = useState('');

  const handleScan = async (qrValue?: string, sahayakId?: string) => {
    const payload: any = {};
    if (qrValue || qrInput) payload.qr_jwt = normalizeQrInput(qrValue || qrInput);
    else if (sahayakId || sahayakIdInput) payload.sahayak_id = sahayakId || sahayakIdInput;
    else { setError('Please enter a QR code or Sahayak ID'); return; }
    
    setLoading(true);
    setError('');
    try {
      const res = await officerApi.scan(payload);
      setScanResult(res);
      setMode('result');
    } catch (err: any) {
      setError(err.message || 'Verification failed — check input or QR code');
      setMode('input');
    }
    setLoading(false);
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
        note: rejectNotes[fieldId] || undefined
      });
      setShowRejectInput(null);
      setRejectNotes(p => ({ ...p, [fieldId]: '' }));
      // Refresh scan result
      if (qrInput) await handleScan(qrInput);
    } catch (err: any) {
      setError(err.message);
    }
    setVerifying(null);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="tricolor-gradient" />
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40"><div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/officer/dashboard" className="text-gray-400 hover:text-primary text-xl">←</Link>
        <h1 className="font-bold text-lg text-gray-800">QR Verification</h1>
        <span className="badge-info ml-auto">{user?.designation || 'Officer'}</span>
      </div></nav>

      <main className="max-w-4xl mx-auto px-6 py-8 page-enter">
        {error && <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}

        {mode === 'input' && (
          <div className="max-w-md mx-auto space-y-4">
            {/* Camera Scan Button */}
            <button onClick={startCamera} className="w-full bg-tricolor-green text-white px-6 py-6 rounded-2xl font-semibold hover:opacity-90 transition flex flex-col items-center gap-3 shadow-lg">
              <span className="text-4xl">📷</span>
              <span className="text-xl">Scan QR Code with Camera</span>
              <span className="text-sm opacity-75">Point your camera at the citizen&apos;s QR code</span>
            </button>

            <div className="text-center text-gray-400 text-sm font-semibold">— OR —</div>

            {/* Sahayak ID Input */}
            <div className="card p-6 border-l-4 border-l-blue-500">
              <h3 className="font-bold text-gray-900 mb-3 block">Enter Sahayak ID Manually</h3>
              <p className="text-xs text-gray-500 mb-3">If the citizen&apos;s camera or QR is broken, you can verify using their ID directly.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sahayakIdInput}
                  onChange={e => setSahayakIdInput(e.target.value)}
                  className="input-field flex-1 font-mono uppercase tracking-widest placeholder-gray-400"
                  placeholder="e.g. SAH-123456"
                  maxLength={17}
                />
                <button onClick={() => handleScan()} disabled={loading} className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap">
                  {loading ? 'Wait...' : 'Look Up 🔍'}
                </button>
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm font-semibold">— OR —</div>

            {/* Manual QR data Input */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-3 block">Paste QR Data Manually</h3>
              <textarea
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                className="input-field h-20 font-mono text-xs"
                placeholder="Paste scanned QR value here..."
              />
              <button onClick={() => handleScan()} disabled={loading} className="w-full mt-3 bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900 disabled:opacity-50 transition">
                {loading ? 'Verifying...' : 'Verify QR Data'}
              </button>
            </div>
          </div>
        )}

        {mode === 'camera' && (
          <div className="max-w-md mx-auto">
            <div className="card p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">📷 Camera Scanner</h3>
                <button onClick={stopCamera} className="text-sm text-danger font-semibold">✕ Close</button>
              </div>
              <div id="qr-reader" ref={videoRef} className="rounded-xl overflow-hidden" style={{ minHeight: '300px' }} />
              <p className="text-center text-gray-400 text-sm mt-3">Point the camera at the citizen&apos;s QR code</p>
            </div>
          </div>
        )}

        {mode === 'result' && (
          <div className="space-y-6">
            {scanResult?.valid ? (
              <>
                {/* Valid QR Banner */}
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-3xl">✅</span>
                  <div>
                    <p className="font-bold text-green-800">QR Code Verified</p>
                    <p className="text-sm text-green-600">Citizen ID found in database</p>
                  </div>
                </div>

                {/* Citizen Profile */}
                {scanResult.citizen && (
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">👤 Citizen Profile</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      {[
                        ['Name', scanResult.citizen.name],
                        ['Sahayak ID', scanResult.citizen.sahayak_id],
                        ['Phone', scanResult.citizen.phone],
                        ['State', scanResult.citizen.state],
                        ['District', scanResult.citizen.district],
                        ['Taluka', scanResult.citizen.taluka],
                        ['Village', scanResult.citizen.village],
                        ['Income', scanResult.citizen.income_annual ? `₹${Number(scanResult.citizen.income_annual).toLocaleString('en-IN')}/year` : 'N/A'],
                        ['Caste', scanResult.citizen.caste_category],
                        ['BPL', scanResult.citizen.is_bpl ? 'Yes ✓' : 'No'],
                        ['Aadhaar (Last 4)', scanResult.citizen.aadhaar_last4 ? `****${scanResult.citizen.aadhaar_last4}` : 'N/A'],
                        ['Gender', scanResult.citizen.gender],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-gray-400 text-xs">{label}</p>
                          <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Enrolled Schemes */}
                    {scanResult.citizen.enrolled_schemes?.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="font-bold text-gray-700 mb-2">Enrolled Schemes</h4>
                        <div className="flex flex-wrap gap-2">
                          {scanResult.citizen.enrolled_schemes.map((s: any, idx: number) => (
                            <span key={`${s.scheme_id || s}-${idx}`} className="badge-info">{s.scheme_name || s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Offline Verifications */}
                {scanResult.pending_applications?.length > 0 && (
                  <div className="card border-l-4 border-l-amber-400">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">📋 Items Pending Your Verification</h3>
                    <p className="text-sm text-gray-500 mb-4">Verify each item after physically checking the citizen&apos;s original documents.</p>

                    {scanResult.pending_applications.map((app: any) => (
                      <div key={app.application_id} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <p className="font-bold text-gray-800">{app.scheme_name}</p>
                          <span className="badge-warning">{app.overall_status}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 font-mono">{app.application_id}</p>

                        <div className="space-y-3">
                          {app.offline_verification_fields?.map((field: any) => (
                            <div key={field.field_id} className={`p-4 rounded-xl border-2 ${
                              field.status === 'verified' ? 'bg-green-50 border-green-200' : 
                              field.status === 'rejected' ? 'bg-red-50 border-red-200' : 
                              'bg-white border-gray-200'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">{field.label || field.offline_verification_label}</p>
                                  {field.offline_verification_label && field.offline_verification_label !== field.label && (
                                    <p className="text-sm text-gray-500 mt-1">{field.offline_verification_label}</p>
                                  )}
                                </div>
                                <span className={`${
                                  field.status === 'verified' ? 'badge-success' : 
                                  field.status === 'rejected' ? 'badge-danger' : 
                                  'badge-warning'
                                }`}>
                                  {field.status === 'verified' ? '✅ Verified' : field.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                </span>
                              </div>

                              {field.status === 'verified' && field.verified_by && (
                                <p className="text-xs text-green-600 mt-2">Verified by {field.verified_by} on {field.verified_at ? new Date(field.verified_at).toLocaleDateString('en-IN') : ''}</p>
                              )}
                              {field.status === 'rejected' && field.note && (
                                <p className="text-xs text-red-600 mt-2">Reason: {field.note}</p>
                              )}

                              {field.status === 'pending' && (
                                <div className="mt-3">
                                  {showRejectInput === field.field_id && (
                                    <div className="mb-3">
                                      <textarea
                                        placeholder="Reason for rejection (required)..."
                                        className="input-field text-sm h-20"
                                        value={rejectNotes[field.field_id] || ''}
                                        onChange={e => setRejectNotes(p => ({ ...p, [field.field_id]: e.target.value }))}
                                      />
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => verifyField(app.application_id, field.field_id, 'verified')} 
                                      disabled={verifying === field.field_id}
                                      className="bg-green-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50 flex-1"
                                    >
                                      {verifying === field.field_id ? '...' : '✅ Verify'}
                                    </button>
                                    <button 
                                      onClick={() => verifyField(app.application_id, field.field_id, 'rejected')} 
                                      disabled={verifying === field.field_id}
                                      className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 flex-1"
                                    >
                                      {verifying === field.field_id ? '...' : '❌ Reject'}
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
                )}

                {(!scanResult.pending_applications || scanResult.pending_applications.length === 0) && (
                  <div className="card bg-blue-50 border-blue-100 text-center py-8">
                    <p className="text-blue-800 font-semibold">No pending offline verifications for this citizen.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center">
                <span className="text-6xl">🚫</span>
                <p className="font-bold text-danger text-2xl mt-4">INVALID QR</p>
                <p className="text-lg text-red-700 mt-2">Do NOT accept this identity.</p>
                <p className="text-sm text-red-600 mt-2">Scanned ID was not found in the government database.</p>
              </div>
            )}

            <button onClick={() => { setMode('input'); setScanResult(null); setQrInput(''); setError(''); }} className="btn-secondary w-full">
              ← Scan Another Citizen
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
