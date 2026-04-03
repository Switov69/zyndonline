import {
  createContext, useContext, useState, ReactNode, useCallback, useEffect,
} from 'react';
import { User, PaymentRequest } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | true>;
  register: (username: string, password: string, telegram: string) => Promise<string | true>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<string | true>;
  refreshUser: () => Promise<void>;
  getAllUsers: () => Promise<(User & { password: string })[]>;
  getUserById: (id: string) => Promise<User | null>;
  getUserByUsername: (username: string) => Promise<User | null>;
  adminUpdateUser: (userId: string, data: any) => Promise<void>;
  adminSetBlocked: (userId: string, blocked: boolean) => Promise<void>;
  adminDeleteUser: (userId: string) => Promise<void>;
  getPaymentRequests: () => Promise<PaymentRequest[]>;
  submitPaymentRequest: () => Promise<void>;
  approvePayment: (requestId: string) => Promise<void>;
  rejectPayment: (requestId: string) => Promise<void>;
  rateUser: (userId: string, stars: number, jobId: string, role: 'executor' | 'author') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const USER_KEY = 'zynd_uid';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(USER_KEY);
    if (!storedId) { setLoading(false); return; }
    api.user.me(storedId)
      .then(({ user: u }) => setUser(u))
      .catch(() => localStorage.removeItem(USER_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | true> => {
    try {
      const { user: u } = await api.auth.login(username, password);
      setUser(u);
      localStorage.setItem(USER_KEY, u.id);
      return true;
    } catch (e: any) { return e.message || 'Ошибка входа'; }
  }, []);

  const register = useCallback(async (username: string, password: string, telegram: string): Promise<string | true> => {
    try {
      const { user: u } = await api.auth.register(username, password, telegram);
      setUser(u);
      localStorage.setItem(USER_KEY, u.id);
      return true;
    } catch (e: any) { return e.message || 'Ошибка регистрации'; }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('zynd_last_notif_ts');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const { user: u } = await api.user.me(user.id);
      setUser(u);
    } catch { /* ignore */ }
  }, [user]);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    const { user: u } = await api.user.update(user.id, data);
    setUser(u);
  }, [user]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<string | true> => {
    if (!user) return 'Не авторизован';
    try {
      await api.user.changePassword(user.id, oldPassword, newPassword);
      return true;
    } catch (e: any) { return e.message || 'Ошибка смены пароля'; }
  }, [user]);

  const getAllUsers = useCallback(async () => {
    if (!user?.isAdmin) return [];
    try { const { users } = await api.user.getAllUsers(user.id); return users; }
    catch { return []; }
  }, [user]);

  const getUserById = useCallback(async (id: string): Promise<User | null> => {
    try { const { user: u } = await api.user.me(id); return u; }
    catch { return null; }
  }, []);

  const getUserByUsername = useCallback(async (username: string): Promise<User | null> => {
    try { const { user: u } = await api.user.getByUsername(username); return u; }
    catch { return null; }
  }, []);

  const adminUpdateUser = useCallback(async (userId: string, data: any) => {
    if (!user?.isAdmin) return;
    await api.user.adminUpdate(user.id, userId, data);
  }, [user]);

  const adminSetBlocked = useCallback(async (userId: string, blocked: boolean) => {
    if (!user?.isAdmin) return;
    await api.user.block(user.id, userId, blocked);
  }, [user]);

  const adminDeleteUser = useCallback(async (userId: string) => {
    if (!user?.isAdmin) return;
    await api.user.deleteUser(user.id, userId);
  }, [user]);

  const getPaymentRequests = useCallback(async (): Promise<PaymentRequest[]> => {
    if (!user?.isAdmin) return [];
    try { const { payments } = await api.payments.list(user.id); return payments; }
    catch { return []; }
  }, [user]);

  const submitPaymentRequest = useCallback(async () => {
    if (!user) return;
    await api.payments.submit(user.id, user.username);
  }, [user]);

  const approvePayment = useCallback(async (requestId: string) => {
    if (!user?.isAdmin) return;
    await api.payments.approve(user.id, requestId);
  }, [user]);

  const rejectPayment = useCallback(async (requestId: string) => {
    if (!user?.isAdmin) return;
    await api.payments.reject(user.id, requestId);
  }, [user]);

  // Pass current user's name as raterName so the rated user knows who rated them
  const rateUser = useCallback(async (userId: string, stars: number, jobId: string, role: 'executor' | 'author') => {
    await api.user.rate(userId, stars, jobId, role, user?.username || '');
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isAdmin: !!user?.isAdmin, loading,
      login, register, logout, updateUser, changePassword, refreshUser,
      getAllUsers, getUserById, getUserByUsername,
      adminUpdateUser, adminSetBlocked, adminDeleteUser,
      getPaymentRequests, submitPaymentRequest, approvePayment, rejectPayment, rateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
