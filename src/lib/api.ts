import { User, Job, PaymentRequest } from '../types';

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (username: string, password: string) =>
      req<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    register: (username: string, password: string, telegram: string) =>
      req<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, telegram }),
      }),

    me: (userId: string) =>
      req<{ user: User }>(`/auth/me?userId=${userId}`),

    update: (userId: string, data: Partial<User & { subscription?: any }>) =>
      req<{ user: User }>('/auth/update', {
        method: 'PATCH',
        body: JSON.stringify({ userId, ...data }),
      }),

    changePassword: (userId: string, oldPassword: string, newPassword: string) =>
      req<{ ok: boolean }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ userId, oldPassword, newPassword }),
      }),

    getAllUsers: (adminId: string) =>
      req<{ users: (User & { password: string })[] }>(`/auth/users?adminId=${adminId}`),

    getUserById: (id: string) =>
      req<{ user: User }>(`/auth/me?userId=${id}`),

    deleteUser: (adminId: string, targetUserId: string) =>
      req<{ ok: boolean }>('/auth/delete', {
        method: 'DELETE',
        body: JSON.stringify({ adminId, targetUserId }),
      }),

    block: (adminId: string, targetUserId: string, blocked: boolean) =>
      req<{ ok: boolean }>('/auth/block', {
        method: 'POST',
        body: JSON.stringify({ adminId, targetUserId, blocked }),
      }),

    adminUpdate: (adminId: string, targetUserId: string, data: any) =>
      req<{ ok: boolean }>('/auth/block', {
        method: 'POST',
        body: JSON.stringify({ adminId, targetUserId, data }),
      }),

    rate: (targetUserId: string, stars: number, jobId: string, role: 'executor' | 'author') =>
      req<{ ok: boolean }>('/auth/rate', {
        method: 'POST',
        body: JSON.stringify({ targetUserId, stars, jobId, role }),
      }),
  },

  // ─── Jobs ──────────────────────────────────────────────────────────────────
  jobs: {
    list: () =>
      req<{ jobs: Job[] }>('/jobs/index'),

    get: (id: string) =>
      req<{ job: Job }>(`/jobs/${id}`),

    create: (data: {
      title: string;
      description: string;
      category: string;
      budget: string;
      authorId: string;
      authorName: string;
      authorAvatar: string;
      authorTelegram: string;
      jobImage?: string;
    }) =>
      req<{ job: Job }>('/jobs/index', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Job>) =>
      req<{ job: Job }>(`/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      req<{ ok: boolean }>(`/jobs/${id}`, { method: 'DELETE' }),

    take: (jobId: string, userId: string, userName: string) =>
      req<{ job: Job; authorId: string }>('/jobs/take', {
        method: 'POST',
        body: JSON.stringify({ jobId, userId, userName }),
      }),

    complete: (jobId: string) =>
      req<{ job: Job }>('/jobs/complete', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),

    cancel: (jobId: string) =>
      req<{ job: Job }>('/jobs/cancel', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),
  },

  // ─── Payments ──────────────────────────────────────────────────────────────
  payments: {
    list: (adminId: string) =>
      req<{ payments: PaymentRequest[] }>(`/payments/index?adminId=${adminId}`),

    submit: (userId: string, username: string) =>
      req<{ payment: PaymentRequest }>('/payments/index', {
        method: 'POST',
        body: JSON.stringify({ userId, username }),
      }),

    approve: (adminId: string, requestId: string) =>
      req<{ ok: boolean; expiresAt: string }>('/payments/approve', {
        method: 'POST',
        body: JSON.stringify({ adminId, requestId }),
      }),

    reject: (adminId: string, requestId: string) =>
      req<{ ok: boolean }>('/payments/reject', {
        method: 'POST',
        body: JSON.stringify({ adminId, requestId }),
      }),
  },
};
