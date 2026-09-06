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
    let message = 'Request failed';
    if (typeof error.detail === 'string') {
      message = error.detail;
    } else if (Array.isArray(error.detail)) {
      message = error.detail
        .map((d: any) => {
          if (typeof d === 'string') return d;
          const field = Array.isArray(d.loc) ? d.loc.filter((p: any) => p !== 'body').join(' ') : '';
          const msg = d.msg || 'Invalid value';
          return field ? `${field}: ${msg}` : msg;
        })
        .join('; ');
    } else if (error.message && typeof error.message === 'string') {
      message = error.message;
    } else if (error.detail) {
      message = JSON.stringify(error.detail);
    } else {
      message = `HTTP ${res.status}`;
    }
    throw new Error(message);
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
  downloadQRCard: async () => {
    const res = await fetch(`${API_BASE}/citizens/me/qr/card-pdf`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to download QR card');
    return res.blob();
  },
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
  downloadSummary: async (id: string) => {
    const res = await fetch(`${API_BASE}/applications/${id}/pdf`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to download summary');
    return res.blob();
  },
};

// ── Officer ────────────────────────────────────────────────
export const officerApi = {
  scan: (payload: { qr_jwt?: string, sahayak_id?: string, purpose?: string }) =>
    request<any>('/officer/scan', { method: 'POST', body: JSON.stringify(payload) }),
  getCitizen: (sahayakId: string) => request<any>(`/officer/citizen/${sahayakId}`),
  pendingVerifications: () => request<any>('/officer/pending-verifications'),
  dashboard: () => request<any>('/officer/dashboard'),
  applications: () => request<any>('/officer/applications'),
  decideApplication: (appId: string, decision: 'approved' | 'rejected', reason?: string) =>
    request(`/officer/applications/${appId}/decision`, { method: 'PATCH', body: JSON.stringify({ decision, reason }) }),
};

// ── Admin ──────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => request<any>('/admin/dashboard'),

  // Schemes
  listSchemes: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/admin/schemes${qs}`);
  },
  createScheme: (data: any) => request<any>('/admin/schemes', { method: 'POST', body: JSON.stringify(data) }),
  updateScheme: (id: string, data: any) => request(`/admin/schemes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScheme: (id: string) => request(`/admin/schemes/${id}`, { method: 'DELETE' }),

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

// ── Notifications ─────────────────────────────────────────
export const notificationApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/notifications${qs}`);
  },
  unreadCount: () => request<{ unread_count: number }>('/notifications/unread-count'),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  dismiss: (id: string) => request(`/notifications/${id}`, { method: 'DELETE' }),
};

// ── Suggestions ───────────────────────────────────────────
export const suggestionApi = {
  get: () => request<any>('/suggestions'),
  refresh: () => request<any>('/suggestions/refresh', { method: 'POST' }),
};

// ── Public Key ─────────────────────────────────────────────
export const getPublicKey = () => request<{ public_key: string }>('/public-key');
