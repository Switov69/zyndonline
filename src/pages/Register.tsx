import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Bell, BellOff, Smartphone, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [telegram, setTelegram] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Post-registration popup flow: pwa → notifications → done
  const [showPwaPopup, setShowPwaPopup] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalling, setPwaInstalling] = useState(false);
  // Track whether the browser permission dialog is currently pending
  const [notifPending, setNotifPending] = useState(false);

  // Capture PWA install event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim() || !confirmPassword.trim() || !telegram.trim()) {
      setError('Заполните все поля'); return;
    }
    if (username.trim().length < 3) { setError('Никнейм не менее 3 символов'); return; }
    if (!telegram.trim().startsWith('@')) { setError('Telegram должен начинаться с @'); return; }
    if (password.length < 4) { setError('Пароль не менее 4 символов'); return; }
    if (password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    const result = await register(username.trim(), password, telegram.trim());
    setLoading(false);
    if (result === true) {
      if (deferredPrompt) {
        setShowPwaPopup(true);
      } else {
        setShowNotifPopup(true);
      }
    } else {
      setError(result as string);
    }
  };

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    setPwaInstalling(true);
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch { /* ignore */ }
    setDeferredPrompt(null);
    setPwaInstalling(false);
    setShowPwaPopup(false);
    setShowNotifPopup(true);
  };

  const handleSkipPwa = () => {
    setShowPwaPopup(false);
    setShowNotifPopup(true);
  };

  // KEY FIX: requestPermission() MUST be called synchronously inside the
  // click handler (i.e. not after any preceding `await`). Browsers treat
  // async functions that have already yielded as "not a user gesture" and
  // silently block the permission dialog.
  // Solution: call requestPermission() at the very top of the handler
  // (synchronously), then .then() chain for the async response.
  const handleEnableNotifs = () => {
    setNotifPending(true);

    const finish = () => {
      setNotifPending(false);
      setShowNotifPopup(false);
      navigate('/');
    };

    if (!('Notification' in window)) {
      // Browser doesn't support notifications — just proceed
      finish();
      return;
    }

    if (Notification.permission === 'granted') {
      // Already granted — fire welcome notif and move on
      try {
        new Notification('Zynd.online', {
          body: 'Уведомления уже включены!',
          icon: '/favicon.ico',
        });
      } catch { /* ignore */ }
      finish();
      return;
    }

    if (Notification.permission === 'denied') {
      // Browser blocked — we can't ask again, just proceed
      finish();
      return;
    }

    // permission === 'default': ask the user.
    // IMPORTANT: Notification.requestPermission() is called synchronously
    // here — no prior await — so the browser accepts it as a genuine
    // user-gesture-triggered call.
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        try {
          new Notification('Zynd.online', {
            body: 'Уведомления включены! Теперь вы будете в курсе всех событий.',
            icon: '/favicon.ico',
          });
        } catch { /* ignore */ }
      }
      finish();
    }).catch(() => {
      finish();
    });
  };

  const handleSkipNotifs = () => {
    setShowNotifPopup(false);
    navigate('/');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-500/20">
            <UserPlus size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Регистрация</h1>
          <p className="text-dark-400 text-sm">Создайте аккаунт, чтобы начать работать</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">Никнейм</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Придумайте никнейм"
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">Telegram</label>
            <input
              type="text" value={telegram} onChange={(e) => setTelegram(e.target.value)}
              placeholder="@username"
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Придумайте пароль"
                className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">Повторите пароль</label>
            <input
              type={showPassword ? 'text' : 'password'} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль"
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-accent-500/20 text-sm"
          >
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </button>
          <p className="text-center text-dark-400 text-sm">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-accent-400 hover:text-accent-300 transition-colors">Войти</Link>
          </p>
        </form>
      </div>

      {/* ── PWA Install Popup ── */}
      {showPwaPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          <div
            className="relative bg-dark-800/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 max-w-sm w-full shadow-2xl"
            style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}
          >
            <button onClick={handleSkipPwa} className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors">
              <X size={18} />
            </button>
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
                <Smartphone size={28} className="text-white" />
              </div>
            </div>
            <h3 className="text-white font-bold text-xl text-center mb-2">Добавить на экран</h3>
            <p className="text-white/60 text-sm text-center mb-6 leading-relaxed">
              Добавьте Zynd.online на главный экран для быстрого доступа без браузера
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePwaInstall}
                disabled={pwaInstalling}
                className="w-full py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 disabled:opacity-60 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-accent-500/25"
              >
                {pwaInstalling ? 'Устанавливаем...' : 'Добавить на главный экран'}
              </button>
              <button
                onClick={handleSkipPwa}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white/70 hover:text-white rounded-2xl text-sm font-medium transition-all border border-white/10"
              >
                Пропустить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications Popup ── */}
      {showNotifPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          <div
            className="relative bg-dark-800/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 max-w-sm w-full shadow-2xl"
            style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}
          >
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
                <Bell size={28} className="text-accent-400" />
              </div>
            </div>
            <h3 className="text-white font-bold text-xl text-center mb-2">Добро пожаловать!</h3>
            <p className="text-white/60 text-sm text-center mb-6 leading-relaxed">
              Включите уведомления, чтобы узнавать когда кто-то берёт ваш заказ или оставляет оценку
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEnableNotifs}
                disabled={notifPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 disabled:opacity-70 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-accent-500/25"
              >
                <Bell size={16} />
                {notifPending ? 'Ожидаем разрешение...' : 'Включить уведомления'}
              </button>
              <button
                onClick={handleSkipNotifs}
                disabled={notifPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white/70 hover:text-white rounded-2xl text-sm font-medium transition-all border border-white/10"
              >
                <BellOff size={16} /> Пропустить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
