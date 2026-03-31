import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays, Briefcase, CheckCircle2, Camera, Save, LogOut,
  Lock, Eye, EyeOff, Send, Edit3, Crown, X, ZoomIn, ZoomOut,
  Palette, Upload, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import JobCard, { StarRating, StarPicker } from '../components/JobCard';
import { GRADIENT_PRESETS, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';

// ── Avatar Cropper (square output, zoom from center) ─────────────────────────
function AvatarCropper({ src, onSave, onCancel }: { src: string; onSave: (d: string) => void; onCancel: () => void }) {
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const SIZE = 256;

  const draw = useCallback((s: number) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#151821';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Scale around center
    const dim = Math.min(img.naturalWidth, img.naturalHeight);
    const scaledDim = dim * s;
    const x = (SIZE - scaledDim) / 2;
    const y = (SIZE - scaledDim) / 2;
    const srcX = (img.naturalWidth - dim) / 2;
    const srcY = (img.naturalHeight - dim) / 2;
    ctx.drawImage(img, srcX, srcY, dim, dim, x, y, scaledDim, scaledDim);
  }, [SIZE]);

  const handleScale = (s: number) => {
    setScale(s);
    requestAnimationFrame(() => draw(s));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Настройка аватарки</h3>
          <button onClick={onCancel} className="text-dark-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Square preview canvas */}
        <div className="flex justify-center mb-5">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="rounded-2xl border-2 border-dark-500/50"
            style={{ width: 200, height: 200, display: 'block' }}
          />
          <img
            ref={imgRef}
            src={src}
            alt=""
            className="hidden"
            onLoad={() => draw(scale)}
          />
        </div>

        {/* Zoom: + increases, - decreases */}
        <div className="mb-5">
          <label className="block text-dark-400 text-xs mb-2">Масштаб</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScale(Math.max(0.3, scale - 0.1))}
              className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors"
              title="Уменьшить"
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range" min={0.3} max={3} step={0.05} value={scale}
              onChange={(e) => handleScale(parseFloat(e.target.value))}
              className="flex-1 accent-accent-500"
            />
            <button
              onClick={() => handleScale(Math.min(3, scale + 0.1))}
              className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors"
              title="Увеличить"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">
            Отмена
          </button>
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              draw(scale);
              onSave(canvas.toDataURL('image/jpeg', 0.9));
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={15} /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subscription popup ────────────────────────────────────────────────────────
function SubscriptionPopup({ onClose }: { onClose: () => void }) {
  const { submitPaymentRequest } = useAuth();
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePaid = async () => {
    setLoading(true);
    try { await submitPaymentRequest(); } catch { /* already pending */ }
    setLoading(false);
    setPaid(true);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-purple-400" />
            <h3 className="text-white font-bold text-lg">Premium подписка</h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white"><X size={20} /></button>
        </div>

        {!paid ? (
          <>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-5">
              <p className="text-purple-300 text-sm font-semibold mb-2">Привилегии:</p>
              <ul className="space-y-1 text-sm text-dark-200">
                {['Фиолетовый бейдж «Premium»','Автоподъём вакансий 7 дней','Фото на карточке вакансии','Кастомный фон профиля'].map(p => (
                  <li key={p} className="flex items-center gap-2"><Star size={11} className="text-purple-400 shrink-0" />{p}</li>
                ))}
              </ul>
              <p className="text-purple-400 font-bold text-base mt-3">3.5 кбк / 3 недели</p>
            </div>
            <div className="bg-dark-700/40 border border-dark-600/30 rounded-xl p-4 mb-5 space-y-3 text-sm text-dark-200">
              <p className="text-white font-semibold">Инструкция по оплате:</p>
              <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span>Перейдите в бота <a href="https://t.me/anorloxbot" target="_blank" rel="noopener noreferrer" className="text-accent-400 hover:text-accent-300 font-medium">@anorloxbot</a></span></div>
              <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span>Отправьте <code className="bg-dark-600 px-1.5 py-0.5 rounded text-accent-300">/transfer</code></span></div>
              <div className="flex gap-2"><span className="w-5 h-5 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span>Переведите <strong className="text-white">3.5 кбк</strong> на счёт <strong className="text-white">«Свит»</strong>, комментарий: <code className="bg-dark-600 px-1.5 py-0.5 rounded text-accent-300">За зинд премиум</code></span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handlePaid} disabled={loading} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors">
                {loading ? '...' : 'Я оплатил'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
            <h4 className="text-white font-semibold mb-2">Оплата на проверке!</h4>
            <p className="text-dark-300 text-sm mb-5">Администратор проверит и активирует подписку.</p>
            <button onClick={onClose} className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">Понятно</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Background picker ─────────────────────────────────────────────────────────
function BgPickerPopup({ currentBg, onSave, onClose }: { currentBg?: string; onSave: (bg: string) => void; onClose: () => void }) {
  const [selected, setSelected] = useState(currentBg || '');
  const bgFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Palette size={17} className="text-purple-400" /><h3 className="text-white font-bold">Фон профиля</h3></div>
          <button onClick={onClose} className="text-dark-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {GRADIENT_PRESETS.map((g) => (
            <button key={g.key} onClick={() => setSelected(g.value)}
              className={`h-14 rounded-xl border-2 transition-all ${selected === g.value ? 'border-white scale-95' : 'border-transparent hover:border-dark-400'}`}
              style={{ background: g.value }} title={g.label} />
          ))}
        </div>
        <button onClick={() => setSelected('')}
          className={`w-full mb-3 py-2 rounded-xl border text-sm font-medium transition-all ${selected === '' ? 'border-white text-white bg-dark-700' : 'border-dark-600 text-dark-400 hover:text-dark-200 hover:border-dark-500'}`}>
          Без фона
        </button>
        <input ref={bgFileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setSelected(r.result as string); r.readAsDataURL(f); }} />
        <button onClick={() => bgFileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors border border-dark-600/50">
          <Upload size={14} /> Загрузить своё изображение
        </button>
        {selected && (
          <div className="h-14 rounded-xl mb-4 border border-dark-600/50"
            style={selected.startsWith('linear') || selected.startsWith('radial') ? { background: selected } : { backgroundImage: `url(${selected})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
          <button onClick={() => { onSave(selected); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Save size={14} /> Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile ──────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser, logout, changePassword, refreshUser, rateUser } = useAuth();
  const { jobs, cancelJobTake, completeJob, updateJob } = useJobs();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevAvatarRef = useRef<string>('');

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [tab, setTab] = useState<'info' | 'my_jobs' | 'taken_jobs'>('info');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [newTelegram, setNewTelegram] = useState(user?.telegram || '');

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [showSubPopup, setShowSubPopup] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ jobId: string; targetUserId: string; targetName: string; role: 'executor' | 'author' } | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [saving, setSaving] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const myJobs = jobs.filter((j) => j.authorId === user.id);
  const takenJobs = jobs.filter((j) => j.takenById === user.id && j.status === 'in_progress');
  const completedJobs = jobs.filter((j) => j.status === 'done' && (j.authorId === user.id || j.executorId === user.id));

  const hasPremium = !!(user.subscription?.active && user.subscription.expiresAt && new Date(user.subscription.expiresAt) > new Date());
  const profileBg = hasPremium ? user.subscription?.profileBg : '';

  // Determine text color from bg for button contrast
  const cardStyle: React.CSSProperties = profileBg
    ? profileBg.startsWith('linear') || profileBg.startsWith('radial')
      ? { background: profileBg }
      : { backgroundImage: `url(${profileBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Allow re-uploading same file by storing previous data separately
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result as string);
      prevAvatarRef.current = user.avatar;
    };
    reader.readAsDataURL(file);
    // Reset input value so same file triggers change event next time
    e.target.value = '';
  };

  const handleAvatarSave = async (dataUrl: string) => {
    setSaving(true);
    try {
      await updateUser({ avatar: dataUrl });
      setCropSrc(null);
      showMsg('Аватарка обновлена!');
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (newTelegram.trim() && !newTelegram.trim().startsWith('@')) { showMsg('Telegram должен начинаться с @'); return; }
    setSaving(true);
    try {
      await updateUser({ telegram: newTelegram.trim() });
      setEditMode(false);
      showMsg('Профиль обновлён!');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (!oldPassword || !newPassword || !confirmNewPassword) { setPwError('Заполните все поля'); return; }
    if (newPassword.length < 4) { setPwError('Новый пароль не менее 4 символов'); return; }
    if (newPassword !== confirmNewPassword) { setPwError('Пароли не совпадают'); return; }
    const result = await changePassword(oldPassword, newPassword);
    if (result !== true) { setPwError(result as string); return; }
    setShowPasswordChange(false);
    setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
    showMsg('Пароль изменён!');
  };

  const handleCancelTakenJob = async (jobId: string) => {
    await cancelJobTake(jobId);
    setCancelConfirmId(null);
    showMsg('Вы отказались от заказа');
  };

  const handleBgSave = async (bg: string) => {
    await updateUser({ subscription: { ...user.subscription, active: true, profileBg: bg } });
    showMsg('Фон обновлён!');
  };

  const handleRateSubmit = async () => {
    if (!ratingModal) return;
    await rateUser(ratingModal.targetUserId, ratingStars, ratingModal.jobId, ratingModal.role);
    setRatingModal(null);
    showMsg('Оценка отправлена!');
  };

  const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  return (
    <div className="max-w-3xl mx-auto">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />

      {cropSrc && <AvatarCropper src={cropSrc} onSave={handleAvatarSave} onCancel={() => setCropSrc(null)} />}
      {showSubPopup && <SubscriptionPopup onClose={() => setShowSubPopup(false)} />}
      {showBgPicker && <BgPickerPopup currentBg={user.subscription?.profileBg} onSave={handleBgSave} onClose={() => setShowBgPicker(false)} />}

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setRatingModal(null)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Оценить {ratingModal.targetName}</h3>
              <button onClick={() => setRatingModal(null)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-dark-400 text-sm mb-5">Как оцените работу этого пользователя?</p>
            <div className="flex justify-center mb-6"><StarPicker value={ratingStars} onChange={setRatingStars} /></div>
            <div className="flex gap-3">
              <button onClick={() => setRatingModal(null)} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleRateSubmit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Star size={14} /> Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Card ── */}
      <div className="border border-dark-700/50 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden" style={cardStyle}>
        {profileBg && <div className="absolute inset-0 bg-dark-900/55 pointer-events-none rounded-2xl" />}
        <div className="relative z-10">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
              <CheckCircle2 size={16} />{success}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-dark-600 flex items-center justify-center text-dark-200 text-3xl font-bold overflow-hidden border-2 border-dark-500/50">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user.username.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="text-white" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-white font-semibold text-lg">{user.username}</p>
                    <p className="text-dark-400 text-xs mt-0.5">Никнейм нельзя изменить</p>
                  </div>
                  <div>
                    <label className="block text-dark-400 text-xs mb-1">Telegram</label>
                    <input type="text" value={newTelegram} onChange={(e) => setNewTelegram(e.target.value)} placeholder="@username"
                      className="w-full sm:w-auto bg-dark-900/60 border border-dark-600/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-all" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors">
                      <Save size={15} /> Сохранить
                    </button>
                    <button onClick={() => { setEditMode(false); setNewTelegram(user.telegram); }}
                      className="px-4 py-2 bg-dark-700/80 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                    <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                    {hasPremium && (
                      <span className="inline-flex items-center gap-1 bg-purple-500/25 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md text-xs font-semibold">
                        <Crown size={11} /> Premium
                      </span>
                    )}
                  </div>
                  <div className="mb-1 flex justify-center sm:justify-start"><StarRating rating={user.rating} /></div>
                  {user.telegram && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-accent-400 mb-2">
                      <Send size={13} /><span>{user.telegram}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-dark-300 mb-4">
                    <span className="flex items-center gap-1.5"><CalendarDays size={14} />С {user.joinedAt}</span>
                    <span className="flex items-center gap-1.5"><Briefcase size={14} />{myJobs.length} заказов</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button onClick={() => { setEditMode(true); setNewTelegram(user.telegram); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors border border-white/20">
                      <Edit3 size={15} /> Редактировать
                    </button>
                    <button onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors border border-white/20">
                      <Lock size={15} /> Сменить пароль
                    </button>
                    {/* Premium button — only show if NOT already premium */}
                    {!hasPremium && (
                      <button onClick={() => setShowSubPopup(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 rounded-xl text-sm font-medium transition-colors border border-purple-500/40">
                        <Crown size={15} /> Premium
                      </button>
                    )}
                    {hasPremium && (
                      <button onClick={() => setShowBgPicker(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 rounded-xl text-sm font-medium transition-colors border border-purple-500/40">
                        <Palette size={15} /> Фон профиля
                      </button>
                    )}
                    <button onClick={() => { logout(); navigate('/login'); }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all border border-white/10 hover:border-red-500/20">
                      <LogOut size={15} /> Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Password change */}
          {showPasswordChange && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-white font-semibold text-base mb-4">Смена пароля</h3>
              {pwError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{pwError}</div>}
              <div className="space-y-3 max-w-sm">
                {[
                  { label: 'Текущий пароль', val: oldPassword, set: setOldPassword, show: showOldPw, toggle: () => setShowOldPw(!showOldPw) },
                  { label: 'Новый пароль', val: newPassword, set: setNewPassword, show: showNewPw, toggle: () => setShowNewPw(!showNewPw) },
                ].map(({ label, val, set, show, toggle }) => (
                  <div key={label}>
                    <label className="block text-dark-400 text-xs mb-1">{label}</label>
                    <div className="relative">
                      <input type={show ? 'text' : 'password'} value={val} onChange={(e) => set(e.target.value)}
                        className="w-full bg-dark-900/60 border border-dark-600/50 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-all" />
                      <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
                <div>
                  <label className="block text-dark-400 text-xs mb-1">Подтвердите пароль</label>
                  <input type={showNewPw ? 'text' : 'password'} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-dark-900/60 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-all" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handlePasswordChange} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">Сохранить</button>
                  <button onClick={() => { setShowPasswordChange(false); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); setPwError(''); }}
                    className="px-4 py-2 bg-dark-700/80 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/30 rounded-xl p-1 mb-6 border border-dark-700/30">
        {(['info','my_jobs','taken_jobs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
            {t === 'info' && 'Информация'}
            {t === 'my_jobs' && `Мои заказы (${myJobs.length})`}
            {t === 'taken_jobs' && `Взятые (${takenJobs.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-white font-semibold text-lg mb-4">Статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Заказов создано</p><p className="text-2xl font-bold text-white">{myJobs.length}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Взято заказов</p><p className="text-2xl font-bold text-white">{takenJobs.length}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Дата регистрации</p><p className="text-white font-semibold text-sm">{user.joinedAt}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Рейтинг</p><StarRating rating={user.rating} /></div>
          </div>
          {completedJobs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-dark-700/50">
              <h3 className="text-white font-semibold text-base mb-3">Завершённые заказы</h3>
              <div className="space-y-3">
                {completedJobs.map((job) => {
                  const isAuthor = job.authorId === user.id;
                  const canRateExecutor = isAuthor && job.executorId && !job.ratingForExecutor;
                  const canRateAuthor = !isAuthor && job.executorId === user.id && !job.ratingForAuthor;
                  return (
                    <div key={job.id} className="bg-dark-700/30 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-white text-sm font-medium">{job.title}</p>
                        <p className="text-dark-500 text-xs">{isAuthor ? `Исполнитель: ${job.executorName || 'н/д'}` : `Заказчик: ${job.authorName}`}</p>
                      </div>
                      {canRateExecutor && (
                        <button onClick={() => { setRatingModal({ jobId: job.id, targetUserId: job.executorId!, targetName: job.executorName || 'Исполнитель', role: 'executor' }); setRatingStars(5); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/25 transition-colors">
                          <Star size={12} /> Оценить исполнителя
                        </button>
                      )}
                      {canRateAuthor && (
                        <button onClick={() => { setRatingModal({ jobId: job.id, targetUserId: job.authorId, targetName: job.authorName, role: 'author' }); setRatingStars(5); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/25 transition-colors">
                          <Star size={12} /> Оценить заказчика
                        </button>
                      )}
                      {!canRateExecutor && !canRateAuthor && <span className="text-dark-600 text-xs">Оценено</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: My Jobs */}
      {tab === 'my_jobs' && (
        myJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {myJobs.map((job) => (
              <div key={job.id} className="flex flex-col">
                <JobCard job={job} showExecutor={true} />
                {job.authorTelegram && (
                  <div className="mt-1.5 px-3 py-2 bg-dark-800/40 border border-dark-700/30 rounded-xl flex items-center gap-2">
                    <Send size={12} className="text-accent-400 shrink-0" />
                    <a href={`https://t.me/${job.authorTelegram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="text-accent-400 hover:text-accent-300 text-xs font-medium transition-colors">
                      {job.authorTelegram}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Briefcase size={36} className="text-dark-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-1">Нет заказов</h3>
            <p className="text-dark-400 text-sm">Вы ещё не создали ни одного заказа</p>
          </div>
        )
      )}

      {/* Tab: Taken Jobs — same card style as My Jobs */}
      {tab === 'taken_jobs' && (
        takenJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {takenJobs.map((job) => (
              <div key={job.id} className="flex flex-col">
                <JobCard job={job} showExecutor={false} />
                {/* Telegram of the job author */}
                {job.authorTelegram && (
                  <div className="mt-1.5 px-3 py-2 bg-dark-800/40 border border-dark-700/30 rounded-xl flex items-center gap-2">
                    <Send size={12} className="text-accent-400 shrink-0" />
                    <a href={`https://t.me/${job.authorTelegram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="text-accent-400 hover:text-accent-300 text-xs font-medium transition-colors">
                      {job.authorTelegram}
                    </a>
                  </div>
                )}
                {/* Refuse button */}
                {cancelConfirmId === job.id ? (
                  <div className="mt-1.5 bg-dark-700/40 border border-dark-600/30 rounded-xl p-3 flex gap-2">
                    <button onClick={() => handleCancelTakenJob(job.id)}
                      className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">
                      Да, отказаться
                    </button>
                    <button onClick={() => setCancelConfirmId(null)}
                      className="flex-1 py-2 bg-dark-600 hover:bg-dark-500 text-dark-200 rounded-lg text-xs font-medium transition-colors">
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setCancelConfirmId(job.id)}
                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors">
                    <X size={13} /> Отказаться
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckCircle2 size={36} className="text-dark-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-1">Нет взятых заказов</h3>
            <p className="text-dark-400 text-sm">Вы ещё не брали ни одного заказа</p>
          </div>
        )
      )}
    </div>
  );
}
