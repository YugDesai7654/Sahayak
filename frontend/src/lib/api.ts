const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ───────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; confirm_password: string; phone: string; state: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  officerLogin: (email: string, password: string) =>
    request<any>('/auth/officer/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  adminLogin: (email: string, password: string) =>
    request<any>('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  refresh: () => request<any>('/auth/refresh', { method: 'POST' }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token: string, new_password: string) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
};

// ── Citizens ───────────────────────────────────────────────
export const citizenApi = {
  getProfile: () => request<any>('/citizens/me'),
  updateProfile: (data: Record<string, any>) =>
    request('/citizens/me', { method: 'PUT', body: JSON.stringify(data) }),

  getQR: () => request<any>('/citizens/me/qr'),
  refreshQR: () => request<any>('/citizens/me/qr/refresh', { method: 'POST' }),

  addFamily: (data: any) =>
    request('/citizens/me/family', { method: 'POST', body: JSON.stringify(data) }),
  updateFamily: (id: string, data: any) =>
    request(`/citizens/me/family/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeFamily: (id: string) =>
    request(`/citizens/me/family/${id}`, { method: 'DELETE' }),
};

// ── Schemes ────────────────────────────────────────────────
export const schemeApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/schemes${qs}`);
  },
  get: (id: string) => request<any>(`/schemes/${id}`),
  match: () => request<any>('/schemes/match'),
  bundle: () => request<any>('/schemes/bundle'),
};

// ── Applications ───────────────────────────────────────────
export const applicationApi = {
  list: () => request<any>('/applications'),
  create: (data: { scheme_id: string; digital_form_data: Record<string, any> }) =>
    request<any>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => request<any>(`/applications/${id}`),
  update: (id: string, data: any) =>
    request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyField: (appId: string, data: { field_id: string; status: string; note?: string }) =>
    request(`/applications/${appId}/verify-field`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Officer ────────────────────────────────────────────────
export const officerApi = {
  scan: (qr_jwt: string, purpose: string = 'verification') =>
    request<any>('/officer/scan', { method: 'POST', body: JSON.stringify({ qr_jwt, purpose }) }),
  getCitizen: (sahayakId: string) => request<any>(`/officer/citizen/${sahayakId}`),
  pendingVerifications: () => request<any>('/officer/pending-verifications'),
  dashboard: () => request<any>('/officer/dashboard'),
};

// ── Admin ──────────────────────────────────────────────────
export const adminApi = {
  listSchemes: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/admin/schemes${qs}`);
  },
  createScheme: (data: any) =>
    request<any>('/admin/schemes', { method: 'POST', body: JSON.stringify(data) }),
  updateScheme: (id: string, data: any) =>
    request(`/admin/schemes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScheme: (id: string) =>
    request(`/admin/schemes/${id}`, { method: 'DELETE' }),

  createAdmin: (data: any) =>
    request<any>('/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
  listAdmins: () => request<any>('/admin/admins'),
  deactivateAdmin: (id: string) =>
    request(`/admin/admins/${id}/deactivate`, { method: 'PATCH' }),

  createOfficer: (data: any) =>
    request<any>('/admin/officers', { method: 'POST', body: JSON.stringify(data) }),
  listOfficers: () => request<any>('/admin/officers'),
  updateOfficer: (id: string, data: any) =>
    request(`/admin/officers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateOfficer: (id: string) =>
    request(`/admin/officers/${id}/deactivate`, { method: 'PATCH' }),

  schemeAnalytics: () => request<any>('/admin/analytics/schemes'),
  citizenAnalytics: () => request<any>('/admin/analytics/citizens'),
  verificationAnalytics: () => request<any>('/admin/analytics/verifications'),
};

// ── Public Key ─────────────────────────────────────────────
export const getPublicKey = () => request<{ public_key: string }>('/public-key');
