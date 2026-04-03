import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Briefcase, CheckCircle2, Camera, Save, LogOut,
  Lock, Eye, EyeOff, Send, Edit3, Crown, X, ZoomIn, ZoomOut,
  Palette, Upload, Star, Archive,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import JobCard, { StarRating, StarPicker } from '../components/JobCard';
import { GRADIENT_PRESETS } from '../types';

// ── Gradient preset → accent color mapping ────────────────────────────────────
const PRESET_STYLES: Record<string, {
  btn: string;
  btnPremium: string;
  btnDanger: string;
  badge: string;
  input: string;
}> = {
  purple: {
    btn: 'bg-purple-500/25 hover:bg-purple-400/40 text-white border-purple-300/35 shadow-md shadow-purple-900/30',
    btnPremium: 'bg-purple-500/40 hover:bg-purple-400/55 text-purple-100 border-purple-300/50 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-purple-400/35 text-purple-100 border-purple-300/45',
    input: 'bg-purple-950/35 border-purple-400/35 text-white placeholder:text-purple-200/50 focus:border-purple-300/60',
  },
  ocean: {
    btn: 'bg-sky-500/25 hover:bg-sky-400/40 text-white border-sky-300/35 shadow-md shadow-sky-900/30',
    btnPremium: 'bg-sky-500/40 hover:bg-sky-400/55 text-sky-100 border-sky-300/50 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-sky-400/35 text-sky-100 border-sky-300/45',
    input: 'bg-sky-950/35 border-sky-400/35 text-white placeholder:text-sky-200/50 focus:border-sky-300/60',
  },
  sunset: {
    btn: 'bg-orange-500/25 hover:bg-orange-400/40 text-white border-orange-300/35 shadow-md shadow-orange-900/30',
    btnPremium: 'bg-orange-500/40 hover:bg-orange-400/55 text-orange-100 border-orange-300/50 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-orange-400/35 text-orange-100 border-orange-300/45',
    input: 'bg-orange-950/35 border-orange-400/35 text-white placeholder:text-orange-200/50 focus:border-orange-300/60',
  },
  forest: {
    btn: 'bg-emerald-500/25 hover:bg-emerald-400/40 text-white border-emerald-300/35 shadow-md shadow-emerald-900/30',
    btnPremium: 'bg-emerald-500/40 hover:bg-emerald-400/55 text-emerald-100 border-emerald-300/50 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-emerald-400/35 text-emerald-100 border-emerald-300/45',
    input: 'bg-emerald-950/35 border-emerald-400/35 text-white placeholder:text-emerald-200/50 focus:border-emerald-300/60',
  },
  midnight: {
    btn: 'bg-slate-400/20 hover:bg-slate-300/30 text-white border-slate-300/30 shadow-md shadow-slate-900/30',
    btnPremium: 'bg-slate-400/35 hover:bg-slate-300/50 text-slate-100 border-slate-300/45 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-slate-400/30 text-slate-100 border-slate-300/40',
    input: 'bg-slate-900/40 border-slate-400/30 text-white placeholder:text-slate-200/50 focus:border-slate-300/55',
  },
  rose: {
    btn: 'bg-rose-500/25 hover:bg-rose-400/40 text-white border-rose-300/35 shadow-md shadow-rose-900/30',
    btnPremium: 'bg-rose-500/40 hover:bg-rose-400/55 text-rose-100 border-rose-300/50 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-rose-400/35 text-rose-100 border-rose-300/45',
    input: 'bg-rose-950/35 border-rose-400/35 text-white placeholder:text-rose-200/50 focus:border-rose-300/60',
  },
  gold: {
    btn: 'bg-amber-500/25 hover:bg-amber-400/40 text-white border-amber-300/35 shadow-md shadow-amber-900/30',
    btnPremium: 'bg-amber-500/40 hover:bg-amber-400/55 text-amber-100 border-amber-300/50 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-amber-400/35 text-amber-100 border-amber-300/45',
    input: 'bg-amber-950/35 border-amber-400/35 text-white placeholder:text-amber-200/50 focus:border-amber-300/60',
  },
  cyber: {
    btn: 'bg-teal-500/25 hover:bg-teal-400/40 text-white border-teal-300/35 shadow-md shadow-teal-900/30',
    btnPremium: 'bg-teal-500/40 hover:bg-teal-400/55 text-teal-100 border-teal-300/50 shadow-md',
    btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
    badge: 'bg-teal-400/35 text-teal-100 border-teal-300/45',
    input: 'bg-teal-950/35 border-teal-400/35 text-white placeholder:text-teal-200/50 focus:border-teal-300/60',
  },
};

const DEFAULT_STYLES = {
  btn: 'bg-dark-700/80 hover:bg-dark-600 text-dark-200 border-dark-600/50 shadow-sm',
  btnPremium: 'bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border-purple-500/35 shadow-sm',
  btnDanger: 'text-dark-300 hover:text-red-400 hover:bg-red-500/10 border-dark-700/50 hover:border-red-500/20',
  badge: 'bg-purple-500/25 text-purple-300 border-purple-500/40',
  input: 'bg-dark-900/60 border-dark-600/50 text-white placeholder:text-dark-500 focus:border-accent-500/50',
};

const GLASS_STYLES = {
  btn: 'bg-white/12 hover:bg-white/22 text-white border-white/20 shadow-md shadow-black/20',
  btnPremium: 'bg-white/15 hover:bg-white/25 text-white border-white/25 shadow-md',
  btnDanger: 'text-white/70 hover:text-red-300 hover:bg-red-500/20 border-white/15 hover:border-red-400/30',
  badge: 'bg-white/18 text-white border-white/28',
  input: 'bg-black/25 border-white/20 text-white placeholder:text-white/45 focus:border-white/40',
};

function getBgStyles(profileBg: string | undefined) {
  if (!profileBg) return DEFAULT_STYLES;
  const preset = GRADIENT_PRESETS.find(g => g.value === profileBg);
  if (preset) return PRESET_STYLES[preset.key] || GLASS_STYLES;
  return GLASS_STYLES; // custom image
}

// ── Avatar Cropper (square, zoom from center, correct zoom direction) ─────────
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
        <div className="flex justify-center mb-5">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="border-2 border-dark-500/50 rounded-2xl"
            style={{ width: 200, height: 200, display: 'block' }}
          />
          <img ref={imgRef} src={src} alt="" className="hidden" onLoad={() => draw(scale)} />
        </div>
        <div className="mb-5">
          <label className="block text-dark-400 text-xs mb-2">Масштаб (увеличить → вправо)</label>
          <div className="flex items-center gap-3">
            {/* ZoomOut = уменьшить (меньше значение) */}
            <button onClick={() => handleScale(Math.max(0.3, scale - 0.1))} className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors" title="Уменьшить">
              <ZoomOut size={16} />
            </button>
            <input type="range" min={0.3} max={3} step={0.05} value={scale}
              onChange={(e) => handleScale(parseFloat(e.target.value))}
              className="flex-1 accent-accent-500" />
            {/* ZoomIn = увеличить (больше значение) */}
            <button onClick={() => handleScale(Math.min(3, scale + 0.1))} className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors" title="Увеличить">
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
          <button
            onClick={() => { const c = canvasRef.current; if (!c) return; draw(scale); onSave(c.toDataURL('image/jpeg', 0.9)); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={15} />Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subscription popup ─────────────────────────────────────────────────────────
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
          <div className="flex items-center gap-2"><Crown size={20} className="text-purple-400" /><h3 className="text-white font-bold text-lg">Premium подписка</h3></div>
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

// ── Background picker ──────────────────────────────────────────────────────────
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
        <button onClick={() => setSelected('')} className={`w-full mb-3 py-2 rounded-xl border text-sm font-medium transition-all ${selected === '' ? 'border-white text-white bg-dark-700' : 'border-dark-600 text-dark-400 hover:text-dark-200 hover:border-dark-500'}`}>
          Без фона
        </button>
        <input ref={bgFileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onloadend = () => setSelected(r.result as string); r.readAsDataURL(f); }} />
        <button onClick={() => bgFileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors border border-dark-600/50">
          <Upload size={14} />Загрузить своё изображение
        </button>
        {selected && (
          <div className="h-14 rounded-xl mb-4 border border-dark-600/50"
            style={selected.startsWith('linear') || selected.startsWith('radial') ? { background: selected } : { backgroundImage: `url(${selected})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
          <button onClick={() => { onSave(selected); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Save size={14} />Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile ───────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser, logout, changePassword, rateUser } = useAuth();
  const { jobs, cancelJobTake, completeJob, updateJob } = useJobs();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [tab, setTab] = useState<'info' | 'my_jobs' | 'taken_jobs'>('info');
  // Sub-tab for taken jobs: active or archive
  const [takenTab, setTakenTab] = useState<'active' | 'archive'>('active');
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
  // ratingStars starts at 0 = nothing selected
  const [ratingModal, setRatingModal] = useState<{ jobId: string; targetUserId: string; targetName: string; role: 'executor' | 'author' } | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [saving, setSaving] = useState(false);

  if (!user) { navigate('/login'); return null; }

  const myJobs = jobs.filter((j) => j.authorId === user.id);
  const takenJobs = jobs.filter((j) => j.takenById === user.id && j.status === 'in_progress');
  // Archive = completed jobs where current user was the executor
  const archivedJobs = jobs.filter((j) => j.status === 'done' && j.executorId === user.id);

  const hasPremium = !!(user.subscription?.active && user.subscription.expiresAt && new Date(user.subscription.expiresAt) > new Date());
  const profileBg = hasPremium ? user.subscription?.profileBg : '';

  // Compute adaptive styles based on background
  const S = getBgStyles(profileBg || undefined);
  const hasBg = !!profileBg;
  const textShadow: React.CSSProperties = hasBg ? { textShadow: '0 1px 4px rgba(0,0,0,0.65)' } : {};
  const dropShadow: React.CSSProperties = hasBg ? { filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' } : {};

  const cardStyle: React.CSSProperties = profileBg
    ? profileBg.startsWith('linear') || profileBg.startsWith('radial')
      ? { background: profileBg }
      : { backgroundImage: `url(${profileBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset so same file can re-trigger
    e.target.value = '';
  };

  const handleAvatarSave = async (dataUrl: string) => {
    setSaving(true);
    try { await updateUser({ avatar: dataUrl }); setCropSrc(null); showMsg('Аватарка обновлена!'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (newTelegram.trim() && !newTelegram.trim().startsWith('@')) { showMsg('Telegram должен начинаться с @'); return; }
    setSaving(true);
    try { await updateUser({ telegram: newTelegram.trim() }); setEditMode(false); showMsg('Профиль обновлён!'); }
    finally { setSaving(false); }
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
    if (!ratingModal || ratingStars === 0) return;
    await rateUser(ratingModal.targetUserId, ratingStars, ratingModal.jobId, ratingModal.role);
    if (ratingModal.role === 'executor') await updateJob(ratingModal.jobId, { ratingForExecutor: ratingStars });
    else await updateJob(ratingModal.jobId, { ratingForAuthor: ratingStars });
    setRatingModal(null);
    showMsg('Оценка отправлена!');
  };

  const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  // Input class helper (with bg adaptation)
  const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all border ${S.input}`;

  return (
    <div className="max-w-3xl mx-auto">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />

      {cropSrc && <AvatarCropper src={cropSrc} onSave={handleAvatarSave} onCancel={() => setCropSrc(null)} />}
      {showSubPopup && <SubscriptionPopup onClose={() => setShowSubPopup(false)} />}
      {showBgPicker && <BgPickerPopup currentBg={user.subscription?.profileBg} onSave={handleBgSave} onClose={() => setShowBgPicker(false)} />}

      {/* Rating modal — initial=0 */}
      {ratingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setRatingModal(null)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Оценить {ratingModal.targetName}</h3>
              <button onClick={() => setRatingModal(null)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-dark-400 text-sm mb-5">Как оцените работу пользователя?</p>
            <div className="flex justify-center mb-4">
              <StarPicker value={ratingStars} onChange={setRatingStars} />
            </div>
            {ratingStars === 0 && <p className="text-dark-500 text-xs text-center mb-4">Выберите оценку</p>}
            <div className="flex gap-3">
              <button onClick={() => setRatingModal(null)} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleRateSubmit} disabled={ratingStars === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                <Star size={14} />Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Card ── */}
      <div className="border border-dark-700/50 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden" style={cardStyle}>
        {hasBg && <div className="absolute inset-0 bg-dark-900/50 pointer-events-none rounded-2xl" />}
        <div className="relative z-10">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
              <CheckCircle2 size={16} />{success}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-dark-600 flex items-center justify-center text-dark-200 text-3xl font-bold overflow-hidden border-2 border-dark-500/50" style={dropShadow}>
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
                    <p className="text-white font-semibold text-lg" style={textShadow}>{user.username}</p>
                    <p className="text-xs mt-0.5" style={{ ...textShadow, color: hasBg ? 'rgba(255,255,255,0.55)' : undefined }}>Никнейм нельзя изменить</p>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ ...textShadow, color: hasBg ? 'rgba(255,255,255,0.6)' : undefined }}>Telegram</label>
                    <input type="text" value={newTelegram} onChange={(e) => setNewTelegram(e.target.value)} placeholder="@username"
                      className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btn}`} style={dropShadow}>
                      <Save size={15} />Сохранить
                    </button>
                    <button onClick={() => { setEditMode(false); setNewTelegram(user.telegram); }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btn}`} style={dropShadow}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                    <h1 className="text-2xl font-bold text-white" style={textShadow}>{user.username}</h1>
                    {hasPremium && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${S.badge}`} style={dropShadow}>
                        <Crown size={11} />Premium
                      </span>
                    )}
                  </div>
                  <div className="mb-1 flex justify-center sm:justify-start">
                    <StarRating rating={user.rating} />
                  </div>
                  {user.telegram && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-accent-400 mb-2" style={textShadow}>
                      <Send size={13} /><span>{user.telegram}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm mb-4" style={{ ...textShadow, color: hasBg ? 'rgba(255,255,255,0.65)' : undefined }}>
                    <span className="flex items-center gap-1.5"><CalendarDays size={14} />С {user.joinedAt}</span>
                    <span className="flex items-center gap-1.5"><Briefcase size={14} />{myJobs.length} заказов</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button onClick={() => { setEditMode(true); setNewTelegram(user.telegram); }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btn}`} style={dropShadow}>
                      <Edit3 size={15} />Редактировать
                    </button>
                    <button onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btn}`} style={dropShadow}>
                      <Lock size={15} />Сменить пароль
                    </button>
                    {/* Premium button — only show if NOT already premium */}
                    {!hasPremium && (
                      <button onClick={() => setShowSubPopup(true)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btnPremium}`} style={dropShadow}>
                        <Crown size={15} />Premium
                      </button>
                    )}
                    {hasPremium && (
                      <button onClick={() => setShowBgPicker(true)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btnPremium}`} style={dropShadow}>
                        <Palette size={15} />Фон профиля
                      </button>
                    )}
                    <button onClick={() => { logout(); navigate('/login'); }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${S.btnDanger}`} style={dropShadow}>
                      <LogOut size={15} />Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Password change */}
          {showPasswordChange && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: hasBg ? 'rgba(255,255,255,0.1)' : undefined }}>
              <h3 className="text-white font-semibold text-base mb-4" style={{ ...textShadow }}>Смена пароля</h3>
              {pwError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{pwError}</div>}
              <div className="space-y-3 max-w-sm">
                <div>
                  <label className="block text-xs mb-1" style={{ ...textShadow, color: hasBg ? 'rgba(255,255,255,0.6)' : undefined }}>Текущий пароль</label>
                  <div className="relative">
                    <input type={showOldPw ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                      className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                      {showOldPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ ...textShadow, color: hasBg ? 'rgba(255,255,255,0.6)' : undefined }}>Новый пароль</label>
                  <div className="relative">
                    <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputCls} pr-10`} />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ ...textShadow, color: hasBg ? 'rgba(255,255,255,0.6)' : undefined }}>Подтвердите пароль</label>
                  <input type={showNewPw ? 'text' : 'password'} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={inputCls} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handlePasswordChange}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btn}`} style={dropShadow}>
                    Сохранить
                  </button>
                  <button onClick={() => { setShowPasswordChange(false); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); setPwError(''); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${S.btn}`} style={dropShadow}>
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/30 rounded-xl p-1 mb-6 border border-dark-700/30">
        {(['info', 'my_jobs', 'taken_jobs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
            {t === 'info' && 'Информация'}
            {t === 'my_jobs' && `Мои заказы (${myJobs.length})`}
            {t === 'taken_jobs' && `Взятые (${takenJobs.length})`}
          </button>
        ))}
      </div>

      {/* ── Info tab — no "completed jobs" section, only stats ── */}
      {tab === 'info' && (
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-white font-semibold text-lg mb-4">Статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Заказов создано</p><p className="text-2xl font-bold text-white">{myJobs.length}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Взято заказов</p><p className="text-2xl font-bold text-white">{takenJobs.length}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Дата регистрации</p><p className="text-white font-semibold text-sm">{user.joinedAt}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Рейтинг</p><StarRating rating={user.rating} /></div>
          </div>
        </div>
      )}

      {/* ── My Jobs tab ── */}
      {tab === 'my_jobs' && (
        myJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {myJobs.map((job) => (
              <div key={job.id} className="flex flex-col">
                <JobCard job={job} showExecutor={true} />
                {job.authorTelegram && (
                  <div className="mt-1.5 px-3 py-2 bg-dark-800/40 border border-dark-700/30 rounded-xl flex items-center gap-2">
                    <Send size={12} className="text-accent-400 shrink-0" />
                    <a href={`https://t.me/${job.authorTelegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-accent-400 hover:text-accent-300 text-xs font-medium transition-colors">{job.authorTelegram}</a>
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

      {/* ── Taken Jobs tab with archive sub-tab ── */}
      {tab === 'taken_jobs' && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-dark-800/20 rounded-xl p-1 mb-5 border border-dark-700/20">
            <button onClick={() => setTakenTab('active')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${takenTab === 'active' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
              Активные ({takenJobs.length})
            </button>
            <button onClick={() => setTakenTab('archive')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${takenTab === 'archive' ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
              <Archive size={14} />Архив ({archivedJobs.length})
            </button>
          </div>

          {/* Active taken jobs */}
          {takenTab === 'active' && (
            takenJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {takenJobs.map((job) => (
                  <div key={job.id} className="flex flex-col">
                    <JobCard job={job} showExecutor={false} />
                    {job.authorTelegram && (
                      <div className="mt-1.5 px-3 py-2 bg-dark-800/40 border border-dark-700/30 rounded-xl flex items-center gap-2">
                        <Send size={12} className="text-accent-400 shrink-0" />
                        <a href={`https://t.me/${job.authorTelegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                          className="text-accent-400 hover:text-accent-300 text-xs font-medium transition-colors">{job.authorTelegram}</a>
                      </div>
                    )}
                    {cancelConfirmId === job.id ? (
                      <div className="mt-1.5 bg-dark-700/40 border border-dark-600/30 rounded-xl p-3 flex gap-2">
                        <button onClick={() => handleCancelTakenJob(job.id)}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">Да, отказаться</button>
                        <button onClick={() => setCancelConfirmId(null)}
                          className="flex-1 py-2 bg-dark-600 hover:bg-dark-500 text-dark-200 rounded-lg text-xs font-medium transition-colors">Отмена</button>
                      </div>
                    ) : (
                      <button onClick={() => setCancelConfirmId(job.id)}
                        className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors">
                        <X size={13} />Отказаться
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle2 size={36} className="text-dark-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-1">Нет взятых заказов</h3>
                <p className="text-dark-400 text-sm">Вы не выполняете ни одного заказа</p>
              </div>
            )
          )}

          {/* Archive — completed taken jobs with rating option */}
          {takenTab === 'archive' && (
            archivedJobs.length > 0 ? (
              <div className="space-y-3">
                {archivedJobs.map((job) => (
                  <div key={job.id} className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-base mb-1 truncate">{job.title}</h3>
                        <p className="text-dark-400 text-sm">Заказчик: <span className="text-dark-200">{job.authorName}</span></p>
                        <p className="text-dark-400 text-sm">Бюджет: <span className="text-accent-400 font-medium">{job.budget}</span></p>
                        <p className="text-dark-500 text-xs mt-1">{job.createdAt}</p>
                      </div>
                      {/* Rating button — only if not yet rated */}
                      {!job.ratingForAuthor ? (
                        <button
                          onClick={() => { setRatingModal({ jobId: job.id, targetUserId: job.authorId, targetName: job.authorName, role: 'author' }); setRatingStars(0); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-medium hover:bg-amber-500/25 transition-colors shrink-0"
                        >
                          <Star size={12} />Оценить заказчика
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-amber-400 text-xs">Оценено: {job.ratingForAuthor}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Archive size={36} className="text-dark-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold text-lg mb-1">Архив пуст</h3>
                <p className="text-dark-400 text-sm">Здесь будут отображаться завершённые заказы</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
