import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User, PaymentRequest } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string, telegram: string) => boolean;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  changePassword: (oldPassword: string, newPassword: string) => string | true;
  getAllUsers: () => (User & { password: string })[];
  getUserById: (id: string) => (User & { password?: string }) | undefined;
  adminUpdateUser: (userId: string, data: Partial<User & { password?: string }>) => void;
  adminSetBlocked: (userId: string, blocked: boolean) => void;
  // Subscription / payment
  getPaymentRequests: () => PaymentRequest[];
  submitPaymentRequest: () => void;
  approvePayment: (requestId: string) => void;
  rejectPayment: (requestId: string) => void;
  // Rating
  rateUser: (userId: string, stars: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_ID = 'admin_markizow_001';

const ADMIN_ACCOUNT = {
  id: ADMIN_ID,
  username: 'Markizow',
  password: 'testadmin',
  avatar: '',
  telegram: '@markizuw',
  joinedAt: '2026-04-01',
  jobsPosted: 0,
  jobsCompleted: 0,
  isAdmin: true,
  blocked: false,
  rating: { count: 0, total: 0 },
  subscription: { active: false },
};

function ensureAdmin() {
  const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
  const hasAdmin = accounts.find((a: any) => a.isAdmin);
  if (!hasAdmin) {
    accounts.push({ ...ADMIN_ACCOUNT });
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
  } else {
    // Update admin data if outdated
    const idx = accounts.findIndex((a: any) => a.isAdmin);
    if (idx >= 0) {
      accounts[idx] = {
        ...accounts[idx],
        username: 'Markizow',
        telegram: '@markizuw',
        joinedAt: '2026-04-01',
        id: accounts[idx].id === 'admin' ? ADMIN_ID : accounts[idx].id,
      };
      localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    ensureAdmin();
    const saved = localStorage.getItem('zynd_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!user) return;
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const acc = accounts.find((a: any) => a.id === user.id);
    if (acc) {
      const synced: User = {
        id: acc.id,
        username: acc.username,
        avatar: acc.avatar || '',
        telegram: acc.telegram || '',
        joinedAt: acc.joinedAt,
        jobsPosted: acc.jobsPosted || 0,
        jobsCompleted: acc.jobsCompleted || 0,
        blocked: acc.blocked || false,
        isAdmin: acc.isAdmin || false,
        rating: acc.rating || { count: 0, total: 0 },
        subscription: acc.subscription || { active: false },
      };
      if (JSON.stringify(synced) !== JSON.stringify(user)) {
        setUser(synced);
        localStorage.setItem('zynd_user', JSON.stringify(synced));
      }
    }
  }, []);

  const login = useCallback((username: string, _password: string) => {
    ensureAdmin();
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const found = accounts.find(
      (a: any) =>
        a.username.toLowerCase() === username.toLowerCase() && a.password === _password
    );
    if (!found) return false;
    const u: User = {
      id: found.id,
      username: found.username,
      avatar: found.avatar || '',
      telegram: found.telegram || '',
      joinedAt: found.joinedAt,
      jobsPosted: found.jobsPosted || 0,
      jobsCompleted: found.jobsCompleted || 0,
      blocked: found.blocked || false,
      isAdmin: found.isAdmin || false,
      rating: found.rating || { count: 0, total: 0 },
      subscription: found.subscription || { active: false },
    };
    setUser(u);
    localStorage.setItem('zynd_user', JSON.stringify(u));
    return true;
  }, []);

  const register = useCallback((username: string, password: string, telegram: string) => {
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const exists = accounts.find(
      (a: any) => a.username.toLowerCase() === username.toLowerCase()
    );
    if (exists) return false;
    const u: User = {
      id: 'u_' + Date.now() + '_' + Math.floor(Math.random() * 9000 + 1000),
      username,
      avatar: '',
      telegram,
      joinedAt: new Date().toISOString().split('T')[0],
      jobsPosted: 0,
      jobsCompleted: 0,
      blocked: false,
      isAdmin: false,
      rating: { count: 0, total: 0 },
      subscription: { active: false },
    };
    accounts.push({ ...u, password });
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
    setUser(u);
    localStorage.setItem('zynd_user', JSON.stringify(u));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('zynd_user');
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('zynd_user', JSON.stringify(updated));
      const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
      const idx = accounts.findIndex((a: any) => a.id === updated.id);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...data };
        localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
      }
      // Sync avatar/username/telegram in all jobs
      const jobs: any[] = JSON.parse(localStorage.getItem('zynd_jobs') || '[]');
      let jobsChanged = false;
      const updatedJobs = jobs.map((j: any) => {
        let changed = false;
        const jCopy = { ...j };
        if (j.authorId === updated.id) {
          if (data.username !== undefined) { jCopy.authorName = data.username; changed = true; }
          if (data.avatar !== undefined) { jCopy.authorAvatar = data.avatar; changed = true; }
          if (data.telegram !== undefined) { jCopy.authorTelegram = data.telegram; changed = true; }
        }
        if (j.takenById === updated.id && data.username !== undefined) {
          jCopy.takenByName = data.username;
          changed = true;
        }
        if (changed) jobsChanged = true;
        return changed ? jCopy : j;
      });
      if (jobsChanged) {
        localStorage.setItem('zynd_jobs', JSON.stringify(updatedJobs));
        window.dispatchEvent(new Event('zynd_jobs_updated'));
      }
      return updated;
    });
  }, []);

  const changePassword = useCallback((oldPassword: string, newPassword: string): string | true => {
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('zynd_user') || 'null');
    if (!currentUser) return 'Ошибка авторизации';
    const idx = accounts.findIndex((a: any) => a.id === currentUser.id);
    if (idx < 0) return 'Аккаунт не найден';
    if (accounts[idx].password !== oldPassword) return 'Неверный текущий пароль';
    if (oldPassword === newPassword) return 'Новый пароль не должен совпадать с текущим';
    accounts[idx].password = newPassword;
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
    return true;
  }, []);

  const getAllUsers = useCallback((): any[] => {
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    return accounts;
  }, []);

  const getUserById = useCallback((id: string) => {
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    return accounts.find((a: any) => a.id === id);
  }, []);

  const adminUpdateUser = useCallback((userId: string, data: Partial<User & { password?: string }>) => {
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const idx = accounts.findIndex((a: any) => a.id === userId);
    if (idx < 0) return;
    accounts[idx] = { ...accounts[idx], ...data };
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));

    const jobs: any[] = JSON.parse(localStorage.getItem('zynd_jobs') || '[]');
    let jobsChanged = false;
    const updatedJobs = jobs.map((j: any) => {
      let changed = false;
      const jCopy = { ...j };
      if (j.authorId === userId) {
        if (data.username !== undefined) { jCopy.authorName = data.username; changed = true; }
        if (data.avatar !== undefined) { jCopy.authorAvatar = data.avatar; changed = true; }
        if (data.telegram !== undefined) { jCopy.authorTelegram = data.telegram; changed = true; }
      }
      if (j.takenById === userId && data.username !== undefined) {
        jCopy.takenByName = data.username;
        changed = true;
      }
      if (changed) jobsChanged = true;
      return changed ? jCopy : j;
    });
    if (jobsChanged) {
      localStorage.setItem('zynd_jobs', JSON.stringify(updatedJobs));
      window.dispatchEvent(new Event('zynd_jobs_updated'));
    }

    const currentUser = JSON.parse(localStorage.getItem('zynd_user') || 'null');
    if (currentUser && currentUser.id === userId) {
      const updated = { ...currentUser, ...data };
      delete (updated as any).password;
      localStorage.setItem('zynd_user', JSON.stringify(updated));
      setUser(updated);
    }
  }, []);

  const adminSetBlocked = useCallback((userId: string, blocked: boolean) => {
    adminUpdateUser(userId, { blocked });
  }, [adminUpdateUser]);

  // Payment requests
  const getPaymentRequests = useCallback((): PaymentRequest[] => {
    return JSON.parse(localStorage.getItem('zynd_payments') || '[]');
  }, []);

  const submitPaymentRequest = useCallback(() => {
    if (!user) return;
    const requests: PaymentRequest[] = JSON.parse(localStorage.getItem('zynd_payments') || '[]');
    // Prevent duplicate pending
    const alreadyPending = requests.find(r => r.userId === user.id && r.status === 'pending');
    if (alreadyPending) return;
    const newReq: PaymentRequest = {
      id: 'pay_' + Date.now(),
      userId: user.id,
      username: user.username,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    requests.push(newReq);
    localStorage.setItem('zynd_payments', JSON.stringify(requests));
    window.dispatchEvent(new Event('zynd_payments_updated'));
  }, [user]);

  const approvePayment = useCallback((requestId: string) => {
    const requests: PaymentRequest[] = JSON.parse(localStorage.getItem('zynd_payments') || '[]');
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx < 0) return;
    requests[idx].status = 'approved';
    localStorage.setItem('zynd_payments', JSON.stringify(requests));
    // Grant subscription for 3 weeks
    const userId = requests[idx].userId;
    const expiresAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const aIdx = accounts.findIndex((a: any) => a.id === userId);
    if (aIdx >= 0) {
      accounts[aIdx].subscription = { active: true, expiresAt, profileBg: accounts[aIdx].subscription?.profileBg || '' };
      localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
    }
    window.dispatchEvent(new Event('zynd_payments_updated'));
  }, []);

  const rejectPayment = useCallback((requestId: string) => {
    const requests: PaymentRequest[] = JSON.parse(localStorage.getItem('zynd_payments') || '[]');
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx < 0) return;
    requests[idx].status = 'rejected';
    localStorage.setItem('zynd_payments', JSON.stringify(requests));
    window.dispatchEvent(new Event('zynd_payments_updated'));
  }, []);

  const rateUser = useCallback((userId: string, stars: number) => {
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const idx = accounts.findIndex((a: any) => a.id === userId);
    if (idx < 0) return;
    const prev = accounts[idx].rating || { count: 0, total: 0 };
    accounts[idx].rating = { count: prev.count + 1, total: prev.total + stars };
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
        login,
        register,
        logout,
        updateUser,
        changePassword,
        getAllUsers,
        getUserById,
        adminUpdateUser,
        adminSetBlocked,
        getPaymentRequests,
        submitPaymentRequest,
        approvePayment,
        rejectPayment,
        rateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
