import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';

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
  adminUpdateUser: (userId: string, data: Partial<User>) => void;
  adminSetBlocked: (userId: string, blocked: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_ACCOUNT = {
  id: 'admin',
  username: 'admin',
  password: 'testadmin',
  avatar: '',
  telegram: '@admin',
  joinedAt: '2025-01-01',
  jobsPosted: 0,
  jobsCompleted: 0,
  isAdmin: true,
  blocked: false,
};

function ensureAdmin() {
  const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
  const hasAdmin = accounts.find((a: { id: string }) => a.id === 'admin');
  if (!hasAdmin) {
    accounts.push({ ...ADMIN_ACCOUNT });
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    ensureAdmin();
    const saved = localStorage.getItem('zynd_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Keep user in sync with accounts (e.g. if admin changed something)
  useEffect(() => {
    if (!user) return;
    const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const acc = accounts.find((a: { id: string }) => a.id === user.id);
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
      };
      // Only update if something changed
      if (JSON.stringify(synced) !== JSON.stringify(user)) {
        setUser(synced);
        localStorage.setItem('zynd_user', JSON.stringify(synced));
      }
    }
  }, []);

  const login = useCallback((username: string, _password: string) => {
    ensureAdmin();
    const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const found = accounts.find(
      (a: { username: string; password: string }) =>
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
    };
    setUser(u);
    localStorage.setItem('zynd_user', JSON.stringify(u));
    return true;
  }, []);

  const register = useCallback((username: string, password: string, telegram: string) => {
    const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const exists = accounts.find(
      (a: { username: string }) => a.username.toLowerCase() === username.toLowerCase()
    );
    if (exists) return false;
    const u: User = {
      id: String(Date.now()),
      username,
      avatar: '',
      telegram,
      joinedAt: new Date().toISOString().split('T')[0],
      jobsPosted: 0,
      jobsCompleted: 0,
      blocked: false,
      isAdmin: false,
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
      const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
      const idx = accounts.findIndex((a: { id: string }) => a.id === updated.id);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...data };
        localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
      }
      // Sync avatar/username/telegram in all jobs
      const jobs = JSON.parse(localStorage.getItem('zynd_jobs') || '[]');
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
    const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('zynd_user') || 'null');
    if (!currentUser) return 'Ошибка авторизации';
    const idx = accounts.findIndex((a: { id: string }) => a.id === currentUser.id);
    if (idx < 0) return 'Аккаунт не найден';
    if (accounts[idx].password !== oldPassword) return 'Неверный текущий пароль';
    if (oldPassword === newPassword) return 'Новый пароль не должен совпадать с текущим';
    accounts[idx].password = newPassword;
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
    return true;
  }, []);

  const getAllUsers = useCallback(() => {
    const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    return accounts;
  }, []);

  const adminUpdateUser = useCallback((userId: string, data: Partial<User & { password?: string }>) => {
    const accounts = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const idx = accounts.findIndex((a: { id: string }) => a.id === userId);
    if (idx < 0) return;
    accounts[idx] = { ...accounts[idx], ...data };
    localStorage.setItem('zynd_accounts', JSON.stringify(accounts));

    // Sync in jobs
    const jobs = JSON.parse(localStorage.getItem('zynd_jobs') || '[]');
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

    // If current logged-in user is that user, update state
    const currentUser = JSON.parse(localStorage.getItem('zynd_user') || 'null');
    if (currentUser && currentUser.id === userId) {
      const updated = { ...currentUser, ...data };
      delete (updated as any).password;
      localStorage.setItem('zynd_user', JSON.stringify(updated));
    }
  }, []);

  const adminSetBlocked = useCallback((userId: string, blocked: boolean) => {
    adminUpdateUser(userId, { blocked });
  }, [adminUpdateUser]);

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
        adminUpdateUser,
        adminSetBlocked,
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
