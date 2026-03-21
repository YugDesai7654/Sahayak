'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { officerApi, applicationApi } from '@/lib/api';

export default function OfficerScanPage() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'input' | 'result'>('input');
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const handleScan = async (jwt?: string) => {
    const token = jwt || qrInput;
    if (!token.trim()) { setError('Please enter or scan a QR code'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await officerApi.scan(token);
      setScanResult(res);
      setMode('result');
    } catch (err: any) {
      setError(err.message || 'Scan failed — QR may be invalid or expired');
    }
    setLoading(false);
  };

  const verifyField = async (appId: string, fieldId: string, status: string) => {
    setVerifying(fieldId);
    try {
      await applicationApi.verifyField(appId, { field_id: fieldId, status });
      // Refresh
      await handleScan(qrInput);
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
      </div></nav>

      <main className="max-w-4xl mx-auto px-6 py-8 page-enter">
        {mode === 'input' ? (
          <div className="max-w-md mx-auto">
            <div className="card p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-tricolor-green/10 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3">📷</div>
                <h2 className="text-xl font-bold text-gray-900">Scan Citizen QR</h2>
                <p className="text-gray-500 text-sm mt-1">Paste the citizen&apos;s Sahayak QR JWT token below</p>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
              <textarea
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                className="input-field h-32 font-mono text-xs"
                placeholder="Paste QR JWT here..."
              />
              <button onClick={() => handleScan()} disabled={loading} className="w-full mt-4 bg-tricolor-green text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition">
                {loading ? 'Verifying...' : '🔍 Verify QR Code'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scan Result */}
            {scanResult?.valid ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-green-800">QR Code Verified — Authentic & Active</p>
                    <p className="text-sm text-green-600">RS256 signature validated against Sahayak public key</p>
                  </div>
                </div>

                {scanResult.citizen ? (
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Citizen Profile</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        ['Name', scanResult.citizen.name],
                        ['Sahayak ID', scanResult.citizen.sahayak_id],
                        ['Phone', scanResult.citizen.phone],
                        ['State', scanResult.citizen.state],
                        ['District', scanResult.citizen.district],
                        ['Village', scanResult.citizen.village],
                        ['Income', `₹${scanResult.citizen.income_annual?.toLocaleString()}/year`],
                        ['Caste', scanResult.citizen.caste_category],
                        ['BPL', scanResult.citizen.is_bpl ? 'Yes' : 'No'],
                        ['Pincode', scanResult.citizen.pincode],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-gray-400 text-xs">{label}</p>
                          <p className="font-semibold text-gray-800">{value || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card bg-amber-50">
                    <p className="text-amber-700 font-medium">QR is valid but citizen not in database. Offline data from token shown.</p>
                  </div>
                )}

                {/* Pending Verifications */}
                {scanResult.pending_applications?.length > 0 && (
                  <div className="card border-l-4 border-l-amber-400">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Pending Offline Verifications</h3>
                    {scanResult.pending_applications.map((app: any) => (
                      <div key={app.application_id} className="mb-6">
                        <p className="font-bold text-gray-800">{app.scheme_name}</p>
                        <p className="text-xs text-gray-400 mb-3">{app.application_id}</p>
                        <div className="space-y-2">
                          {app.offline_verification_fields?.map((field: any) => (
                            <div key={field.field_id} className={`p-3 rounded-xl border ${field.status === 'verified' ? 'bg-green-50 border-green-200' : field.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm">{field.label}</p>
                                  <p className="text-xs text-gray-500 mt-1">{field.offline_verification_label}</p>
                                </div>
                                <span className={`badge ${field.status === 'verified' ? 'badge-success' : field.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                  {field.status}
                                </span>
                              </div>
                              {field.status === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <button onClick={() => verifyField(app.application_id, field.field_id, 'verified')} disabled={verifying === field.field_id}
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50">
                                    ✅ Verify
                                  </button>
                                  <button onClick={() => verifyField(app.application_id, field.field_id, 'rejected')} disabled={verifying === field.field_id}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50">
                                    ❌ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <span className="text-4xl">🚫</span>
                <p className="font-bold text-danger mt-3">INVALID QR — Token Tampered or Expired</p>
                <p className="text-sm text-red-600 mt-1">Do NOT proceed with this identity. The QR signature does not match.</p>
              </div>
            )}

            <button onClick={() => { setMode('input'); setScanResult(null); setQrInput(''); }} className="btn-secondary">
              ← Scan Another
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
