import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const LAST_NOTIF_KEY = 'zynd_last_notif_ts';

export default function Layout() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      if (Notification.permission !== 'granted') return;
      try {
        const since = localStorage.getItem(LAST_NOTIF_KEY) || new Date(0).toISOString();
        const { notifications } = await api.user.getNotifications(user.id, since);
        if (notifications && notifications.length > 0) {
          localStorage.setItem(LAST_NOTIF_KEY, new Date().toISOString());
          notifications.forEach((n: { text: string }) => {
            new Notification('Zynd.online', {
              body: n.text,
              icon: '/favicon.ico',
            });
          });
        }
      } catch { /* ignore network errors */ }
    };

    // Check immediately, then every 30s
    checkNotifications();
    intervalRef.current = setInterval(checkNotifications, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-dark-800/50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-dark-400 text-sm font-semibold">Zynd</span>
            <span className="text-accent-500/60 text-sm">.online</span>
            <span className="text-dark-600 text-sm ml-1">· Поиск работы на КБ</span>
          </div>
          <p className="text-dark-600 text-xs">© 2026 Zynd. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
