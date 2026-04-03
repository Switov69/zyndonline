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

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: (username: string, password: string) =>
      req<{ user: User }>('/auth?action=login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    register: (username: string, password: string, telegram: string) =>
      req<{ user: User }>('/auth?action=register', {
        method: 'POST',
        body: JSON.stringify({ username, password, telegram }),
      }),
  },

  // ── User ─────────────────────────────────────────────────────────────────
  user: {
    me: (userId: string) =>
      req<{ user: User }>(`/user?action=me&userId=${userId}`),

    getByUsername: (username: string) =>
      req<{ user: User }>(`/user?action=by-username&username=${encodeURIComponent(username)}`),

    getAllUsers: (adminId: string) =>
      req<{ users: (User & { password: string })[] }>(`/user?action=all&adminId=${adminId}`),

    update: (userId: string, data: Partial<User & { subscription?: any }>) =>
      req<{ user: User }>('/user?action=update', {
        method: 'PATCH',
        body: JSON.stringify({ userId, ...data }),
      }),

    changePassword: (userId: string, oldPassword: string, newPassword: string) =>
      req<{ ok: boolean }>('/user?action=change-password', {
        method: 'POST',
        body: JSON.stringify({ userId, oldPassword, newPassword }),
      }),

    rate: (targetUserId: string, stars: number, jobId: string, role: 'executor' | 'author', raterName: string) =>
      req<{ ok: boolean }>('/user?action=rate', {
        method: 'POST',
        body: JSON.stringify({ targetUserId, stars, jobId, role, raterName }),
      }),

    adminUpdate: (adminId: string, targetUserId: string, data: any) =>
      req<{ ok: boolean }>('/user?action=admin-update', {
        method: 'POST',
        body: JSON.stringify({ adminId, targetUserId, data }),
      }),

    block: (adminId: string, targetUserId: string, blocked: boolean) =>
      req<{ ok: boolean }>('/user?action=admin-update', {
        method: 'POST',
        body: JSON.stringify({ adminId, targetUserId, blocked }),
      }),

    deleteUser: (adminId: string, targetUserId: string) =>
      req<{ ok: boolean }>('/user?action=delete', {
        method: 'DELETE',
        body: JSON.stringify({ adminId, targetUserId }),
      }),

    getNotifications: (userId: string, since: string) =>
      req<{ notifications: { id: string; text: string; created_at: string }[] }>(
        `/user?action=notifications&userId=${userId}&since=${encodeURIComponent(since)}`
      ),
  },

  // ── Jobs ─────────────────────────────────────────────────────────────────
  jobs: {
    list: () =>
      req<{ jobs: Job[] }>('/jobs'),

    get: (id: string) =>
      req<{ job: Job }>(`/jobs?id=${id}`),

    create: (data: {
      title: string; description: string; category: string; budget: string;
      authorId: string; authorName: string; authorAvatar: string;
      authorTelegram: string; jobImage?: string;
    }) =>
      req<{ job: Job }>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Job>) =>
      req<{ job: Job }>(`/jobs?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      req<{ ok: boolean }>(`/jobs?id=${id}`, { method: 'DELETE' }),

    take: (jobId: string, userId: string, userName: string) =>
      req<{ job: Job; authorId: string }>('/jobs?action=take', {
        method: 'POST',
        body: JSON.stringify({ jobId, userId, userName }),
      }),

    complete: (jobId: string) =>
      req<{ job: Job }>('/jobs?action=complete', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),

    cancel: (jobId: string) =>
      req<{ job: Job }>('/jobs?action=cancel', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  payments: {
    list: (adminId: string) =>
      req<{ payments: PaymentRequest[] }>(`/payments?action=list&adminId=${adminId}`),

    submit: (userId: string, username: string) =>
      req<{ payment: PaymentRequest }>('/payments?action=submit', {
        method: 'POST',
        body: JSON.stringify({ userId, username }),
      }),

    approve: (adminId: string, requestId: string) =>
      req<{ ok: boolean; expiresAt: string }>('/payments?action=approve', {
        method: 'POST',
        body: JSON.stringify({ adminId, requestId }),
      }),

    reject: (adminId: string, requestId: string) =>
      req<{ ok: boolean }>('/payments?action=reject', {
        method: 'POST',
        body: JSON.stringify({ adminId, requestId }),
      }),
  },
};
