import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const POLL_INTERVAL_MS = 20_000; // poll every 20 seconds
const LS_KEY = 'zynd_last_notif_ts';

function fireBrowserNotif(text: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification('Zynd.online', {
      body: text,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });
  } catch { /* some browsers restrict this outside service worker */ }
}

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const poll = async () => {
      if (Notification.permission !== 'granted') return;
      const since = localStorage.getItem(LS_KEY) || new Date(0).toISOString();
      try {
        const { notifications } = await api.user.getNotifications(user.id, since);
        if (notifications && notifications.length > 0) {
          // Update timestamp to now so next poll only fetches newer ones
          localStorage.setItem(LS_KEY, new Date().toISOString());
          notifications.forEach((n: { text: string }) => {
            fireBrowserNotif(n.text);
          });
        }
      } catch {
        // silently fail — don't disrupt the UI
      }
    };

    // Poll immediately, then on interval
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, user?.id]);
}
