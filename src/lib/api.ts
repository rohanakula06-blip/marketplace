const BASE = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  }

  return data as T;
}

export const api = {
  health: () => request<{ status: string; database: string; stats: { users: number; workers: number; jobs: number; bookings: number } }>('/api/health'),

  auth: {
    me: () => request<{ user: Record<string, unknown> | null }>('/api/auth/me'),
    login: (email: string, password: string, rememberMe?: boolean) =>
      request<{ user: Record<string, unknown> }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe: !!rememberMe }),
      }),
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      request<{ user: Record<string, unknown>; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
    register: (data: Record<string, unknown>) =>
      request<{ user: Record<string, unknown> }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    registerWorker: (data: Record<string, unknown>) =>
      request<{ user: Record<string, unknown> }>('/api/auth/register/worker', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
    sendOtp: (phone: string) =>
      request<{ success: boolean; phone: string; expiresIn: number; smsProvider: string; realSms: boolean }>(
        '/api/auth/otp/send',
        { method: 'POST', body: JSON.stringify({ phone }) }
      ),
    verifyOtp: (phone: string, code: string, data?: { name?: string; journey?: string }) =>
      request<{ user: Record<string, unknown> }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code, ...data }),
      }),
    sendEmailOtp: (email: string) =>
      request<{ success: boolean; email: string; expiresIn: number; emailProvider: string }>(
        '/api/auth/email-otp/send',
        { method: 'POST', body: JSON.stringify({ email }) }
      ),
    verifyEmailOtp: (email: string, code: string, data?: { name?: string; journey?: string }) =>
      request<{ user: Record<string, unknown> }>('/api/auth/email-otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code, ...data }),
      }),
    emailStatus: () => request<{ configured: boolean; provider: string | null }>('/api/auth/email-otp/send'),
  },

  location: {
    update: (data: { location?: string; latitude?: number; longitude?: number }) =>
      request<{ location: string; latitude: number; longitude: number }>('/api/user/location', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    get: () => request<{ location: string; latitude: number; longitude: number }>('/api/user/location'),
  },

  workers: {
    list: (params: { lat: number; lng: number; category?: string; sort?: string; search?: string }) => {
      const q = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
        ...(params.category && { category: params.category }),
        ...(params.sort && { sort: params.sort }),
        ...(params.search && { search: params.search }),
      });
      return request<{ workers: Record<string, unknown>[] }>(`/api/workers?${q}`);
    },
    get: (id: string) => request<{ worker: Record<string, unknown> }>(`/api/workers/${id}`),
    createProfile: (id: string, data: Record<string, unknown>) =>
      request<{ profile: Record<string, unknown> }>(`/api/workers/${id}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ profile: Record<string, unknown> }>(`/api/workers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  jobs: {
    list: (params: { lat: number; lng: number; status?: string; category?: string }) => {
      const q = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
        ...(params.status && { status: params.status }),
        ...(params.category && { category: params.category }),
      });
      return request<{ jobs: Record<string, unknown>[] }>(`/api/jobs?${q}`);
    },
    mine: (status = 'all') =>
      request<{ jobs: Record<string, unknown>[] }>(`/api/jobs?mine=true&status=${status}`),
    create: (data: Record<string, unknown>) =>
      request<{ job: Record<string, unknown> }>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
  },

  bookings: {
    list: (role: 'customer' | 'worker') =>
      request<{ bookings: Record<string, unknown>[] }>(`/api/bookings?role=${role}`),
    create: (data: Record<string, unknown>) =>
      request<{ booking: Record<string, unknown> }>('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, status: string) =>
      request<{ booking: Record<string, unknown> }>('/api/bookings', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      }),
  },

  applications: {
    create: (data: Record<string, unknown>) =>
      request<{ application: Record<string, unknown> }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  messages: {
    list: (params?: { partnerId?: string; bookingId?: string }) => {
      const q = new URLSearchParams();
      if (params?.partnerId) q.set('partnerId', params.partnerId);
      if (params?.bookingId) q.set('bookingId', params.bookingId);
      return request<{ messages: Record<string, unknown>[] }>(`/api/messages?${q}`);
    },
    send: (data: { receiverId: string; message: string; bookingId?: string }) =>
      request<{ message: Record<string, unknown> }>('/api/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  notifications: {
    list: () => request<{ notifications: Record<string, unknown>[] }>('/api/notifications'),
    markAllRead: () =>
      request<{ success: boolean }>('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllRead: true }),
      }),
  },

  contact: {
    send: (data: { name: string; email: string; subject: string; message: string }) =>
      request<{ success: boolean; emailSent: boolean }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  ai: {
    analyze: (description: string, location?: string) =>
      request<{ analysis: Record<string, unknown>; availableWorkers: number; workers: Record<string, unknown>[] }>(
        '/api/ai/analyze',
        { method: 'POST', body: JSON.stringify({ description, location }) }
      ),
  },

  payments: {
    create: (data: { bookingId: string; amount: string; method: string }) =>
      request<{ payment: Record<string, unknown>; receipt: Record<string, unknown> }>('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
