import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Briefcase,
  CheckCircle2,
  Camera,
  Save,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Send,
  Edit3,
  Check,
  Star,
  Crown,
  X,
  ZoomIn,
  ZoomOut,
  Image,
  Palette,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import JobCard, { StarRating } from '../components/JobCard';
import { GRADIENT_PRESETS } from '../types';

// ─── Mini avatar cropper ───────────────────────────────────────────────────────
function AvatarCropper({
  src,
  onSave,
  onCancel,
}: {
  src: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const draw = useCallback((s: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const SIZE = 200;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    const img = imgRef.current;
    const dim = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - dim) / 2;
    const sy = (img.naturalHeight - dim) / 2;
    const scaledDim = dim / s;
    const offset = (scaledDim - dim) / 2;
    ctx.drawImage(img, sx - offset * s, sy - offset * s, dim * s, dim * s, 0, 0, SIZE, SIZE);
    ctx.restore();
  }, []);

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    draw(newScale);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(scale);
    onSave(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Настройка аватарки</h3>
          <button onClick={onCancel} className="text-dark-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              className="rounded-full border-2 border-dark-500/50"
              style={{ display: 'block' }}
            />
            <img
              ref={imgRef}
              src={src}
              alt=""
              className="hidden"
              onLoad={() => draw(scale)}
            />
          </div>
        </div>

        {/* Zoom */}
        <div className="mb-5">
          <label className="block text-dark-400 text-xs mb-2">Масштаб</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScaleChange(Math.max(0.5, scale - 0.1))}
              className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="flex-1 accent-accent-500"
            />
            <button
              onClick={() => handleScaleChange(Math.min(3, scale + 0.1))}
              className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={15} />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription payment popup ───────────────────────────────────────────────
function SubscriptionPopup({ onClose }: { onClose: () => void }) {
  const { submitPaymentRequest } = useAuth();
  const [paid, setPaid] = useState(false);

  const handlePaid = () => {
    submitPaymentRequest();
    setPaid(true);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-purple-400" />
            <h3 className="text-white font-bold text-lg">Premium подписка</h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {!paid ? (
          <>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-5">
              <p className="text-purple-300 text-sm font-semibold mb-3">Что входит в Premium:</p>
              <ul className="space-y-1.5 text-sm text-dark-200">
                <li className="flex items-center gap-2"><Star size={13} className="text-purple-400 shrink-0" /> Фиолетовый бейдж «Premium»</li>
                <li className="flex items-center gap-2"><Star size={13} className="text-purple-400 shrink-0" /> Автоподъём вакансий 7 дней</li>
                <li className="flex items-center gap-2"><Star size={13} className="text-purple-400 shrink-0" /> Фото на странице вакансии</li>
                <li className="flex items-center gap-2"><Star size={13} className="text-purple-400 shrink-0" /> Кастомный/градиентный фон профиля</li>
              </ul>
              <p className="text-purple-400 font-bold text-base mt-3">3.5 кбк / 3 недели</p>
            </div>

            <div className="bg-dark-700/40 border border-dark-600/30 rounded-xl p-4 mb-5 space-y-3">
              <p className="text-white text-sm font-semibold">Инструкция по оплате:</p>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <p className="text-dark-200 text-sm">
                  Перейдите в бота{' '}
                  <a
                    href="https://t.me/anorloxbot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 hover:text-accent-300 font-medium"
                  >
                    @anorloxbot
                  </a>
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <p className="text-dark-200 text-sm">Отправьте боту команду <code className="bg-dark-600 px-1.5 py-0.5 rounded text-accent-300">/transfer</code></p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent-500/20 text-accent-400 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <p className="text-dark-200 text-sm">
                  Переведите <strong className="text-white">3.5 кбк</strong> на счёт <strong className="text-white">«Свит»</strong>.
                  В комментарии напишите: <code className="bg-dark-600 px-1.5 py-0.5 rounded text-accent-300">За зинд премиум</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handlePaid}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Я оплатил
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h4 className="text-white font-semibold text-base mb-2">Оплата отправлена на проверку!</h4>
            <p className="text-dark-300 text-sm mb-5">
              Администратор проверит вашу оплату и активирует подписку. Обычно это занимает до 24 часов.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Понятно
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Background picker popup ──────────────────────────────────────────────────
function BgPickerPopup({
  currentBg,
  onSave,
  onClose,
}: {
  currentBg?: string;
  onSave: (bg: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(currentBg || '');
  const bgFileRef = useRef<HTMLInputElement>(null);

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-purple-400" />
            <h3 className="text-white font-bold text-lg">Фон профиля</h3>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-dark-400 text-sm mb-4">Выберите градиент или загрузите своё изображение:</p>

        {/* Gradient presets */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {GRADIENT_PRESETS.map((g) => (
            <button
              key={g.key}
              onClick={() => setSelected(g.value)}
              className={`h-16 rounded-xl border-2 transition-all ${
                selected === g.value ? 'border-white scale-95' : 'border-transparent hover:border-dark-400'
              }`}
              style={{ background: g.value }}
              title={g.label}
            />
          ))}
        </div>

        {/* None option */}
        <button
          onClick={() => setSelected('')}
          className={`w-full mb-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            selected === ''
              ? 'border-white text-white bg-dark-700'
              : 'border-dark-600 text-dark-400 hover:text-dark-200 hover:border-dark-500'
          }`}
        >
          Без фона
        </button>

        {/* Custom upload */}
        <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
        <button
          onClick={() => bgFileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors border border-dark-600/50"
        >
          <Upload size={15} />
          Загрузить своё изображение
        </button>

        {/* Preview */}
        {selected && (
          <div
            className="h-16 rounded-xl mb-5 border border-dark-600/50"
            style={
              selected.startsWith('linear-gradient') || selected.startsWith('radial-gradient')
                ? { background: selected }
                : { backgroundImage: `url(${selected})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            }
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => { onSave(selected); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={15} />
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Star picker ──────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={`transition-colors ${s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-dark-500'}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Main Profile ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser, logout, changePassword, submitPaymentRequest } = useAuth();
  const { jobs, cancelJobTake, completeJob, updateJob } = useJobs();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [newTelegram, setNewTelegram] = useState(user?.telegram || '');
  const [tab, setTab] = useState<'info' | 'my_jobs' | 'taken_jobs'>('info');
  const [success, setSuccess] = useState('');

  // Avatar cropper
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // Cancel/complete confirm
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Subscription popup
  const [showSubPopup, setShowSubPopup] = useState(false);

  // Background picker
  const [showBgPicker, setShowBgPicker] = useState(false);

  // Rating modal (for completed jobs)
  const [ratingModal, setRatingModal] = useState<{ jobId: string; targetUserId: string; targetName: string; role: 'executor' | 'author' } | null>(null);
  const [ratingStars, setRatingStars] = useState(5);

  if (!user) {
    navigate('/login');
    return null;
  }

  const myJobs = jobs.filter((j) => j.authorId === user.id);
  const takenJobs = jobs.filter((j) => j.takenById === user.id && j.status === 'in_progress');
  const completedJobs = jobs.filter((j) => j.status === 'done' && (j.authorId === user.id || j.executorId === user.id));

  const hasPremium = user.subscription?.active &&
    user.subscription?.expiresAt &&
    new Date(user.subscription.expiresAt) > new Date();

  const profileBg = user.subscription?.profileBg;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showMsg('Файл слишком большой (макс. 5 МБ)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = (dataUrl: string) => {
    updateUser({ avatar: dataUrl });
    setCropSrc(null);
    showMsg('Аватарка обновлена!');
  };

  const handleSave = () => {
    if (!newTelegram.trim().startsWith('@') && newTelegram.trim() !== '') {
      showMsg('Telegram должен начинаться с @');
      return;
    }
    updateUser({ telegram: newTelegram.trim() });
    setEditMode(false);
    showMsg('Профиль обновлён!');
  };

  const handlePasswordChange = () => {
    setPwError('');
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPwError('Заполните все поля');
      return;
    }
    if (newPassword.length < 4) {
      setPwError('Новый пароль должен быть не менее 4 символов');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('Пароли не совпадают');
      return;
    }
    const result = changePassword(oldPassword, newPassword);
    if (result !== true) {
      setPwError(result);
      return;
    }
    setShowPasswordChange(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    showMsg('Пароль успешно изменён!');
  };

  const handleCancelTakenJob = (jobId: string) => {
    cancelJobTake(jobId);
    setCancelConfirmId(null);
    showMsg('Вы отказались от заказа');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBgSave = (bg: string) => {
    updateUser({ subscription: { ...user.subscription, active: hasPremium!, profileBg: bg } });
    showMsg('Фон профиля обновлён!');
  };

  const handleRateSubmit = () => {
    if (!ratingModal) return;
    // Save rating to user
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const idx = accounts.findIndex((a: any) => a.id === ratingModal.targetUserId);
    if (idx >= 0) {
      const prev = accounts[idx].rating || { count: 0, total: 0 };
      accounts[idx].rating = { count: prev.count + 1, total: prev.total + ratingStars };
      localStorage.setItem('zynd_accounts', JSON.stringify(accounts));
    }
    // Mark rating done on job
    if (ratingModal.role === 'executor') {
      updateJob(ratingModal.jobId, { ratingForExecutor: ratingStars });
    } else {
      updateJob(ratingModal.jobId, { ratingForAuthor: ratingStars });
    }
    setRatingModal(null);
    showMsg('Оценка отправлена!');
  };

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Profile card style
  const cardStyle: React.CSSProperties = profileBg && hasPremium
    ? profileBg.startsWith('linear-gradient') || profileBg.startsWith('radial-gradient')
      ? { background: profileBg }
      : { backgroundImage: `url(${profileBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Avatar cropper */}
      {cropSrc && (
        <AvatarCropper
          src={cropSrc}
          onSave={handleAvatarSave}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Subscription popup */}
      {showSubPopup && <SubscriptionPopup onClose={() => setShowSubPopup(false)} />}

      {/* Background picker */}
      {showBgPicker && (
        <BgPickerPopup
          currentBg={user.subscription?.profileBg}
          onSave={handleBgSave}
          onClose={() => setShowBgPicker(false)}
        />
      )}

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setRatingModal(null)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Оценить {ratingModal.targetName}</h3>
              <button onClick={() => setRatingModal(null)} className="text-dark-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <p className="text-dark-400 text-sm mb-5">Как оцените работу этого пользователя?</p>
            <div className="flex justify-center mb-6">
              <StarPicker value={ratingStars} onChange={setRatingStars} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRatingModal(null)} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleRateSubmit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Star size={15} /> Отправить оценку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div
        className="border border-dark-700/50 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden"
        style={cardStyle}
      >
        {/* Overlay for readability when bg set */}
        {profileBg && hasPremium && (
          <div className="absolute inset-0 bg-dark-900/60 rounded-2xl pointer-events-none" />
        )}

        <div className="relative z-10">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-dark-600 flex items-center justify-center text-dark-200 text-3xl font-bold overflow-hidden border-2 border-dark-500/50">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={24} className="text-white" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-dark-400 text-xs mb-1">Никнейм</label>
                    <p className="text-white font-semibold text-lg">{user.username}</p>
                    <p className="text-dark-500 text-xs mt-0.5">Никнейм нельзя изменить</p>
                  </div>
                  <div>
                    <label className="block text-dark-400 text-xs mb-1">Telegram</label>
                    <input
                      type="text"
                      value={newTelegram}
                      onChange={(e) => setNewTelegram(e.target.value)}
                      placeholder="@username"
                      className="w-full sm:w-auto bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                    />
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <Save size={16} />
                      Сохранить
                    </button>
                    <button
                      onClick={() => { setEditMode(false); setNewTelegram(user.telegram); }}
                      className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                    <h1 className="text-2xl font-bold text-white">{user.username}</h1>
                    {hasPremium && (
                      <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-xs font-semibold">
                        <Crown size={11} /> Premium
                      </span>
                    )}
                  </div>
                  {/* Rating */}
                  <div className="mb-1 flex justify-center sm:justify-start">
                    <StarRating rating={user.rating} />
                  </div>
                  {user.telegram && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-accent-400 mb-2">
                      <Send size={13} />
                      <span>{user.telegram}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-dark-300 mb-4">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      С {user.joinedAt}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={14} />
                      {myJobs.length} заказов
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      onClick={() => { setEditMode(true); setNewTelegram(user.telegram); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700/80 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors border border-dark-600/50"
                    >
                      <Edit3 size={16} /> Редактировать
                    </button>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700/80 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors border border-dark-600/50"
                    >
                      <Lock size={16} /> Сменить пароль
                    </button>
                    {!hasPremium && (
                      <button
                        onClick={() => setShowSubPopup(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-sm font-medium transition-colors border border-purple-500/30"
                      >
                        <Crown size={16} /> Premium
                      </button>
                    )}
                    {hasPremium && (
                      <button
                        onClick={() => setShowBgPicker(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-sm font-medium transition-colors border border-purple-500/30"
                      >
                        <Palette size={16} /> Фон профиля
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all border border-dark-700/50 hover:border-red-500/20"
                    >
                      <LogOut size={16} /> Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Password change section */}
          {showPasswordChange && (
            <div className="mt-6 pt-6 border-t border-dark-700/50">
              <h3 className="text-white font-semibold text-base mb-4">Смена пароля</h3>
              {pwError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
                  {pwError}
                </div>
              )}
              <div className="space-y-3 max-w-sm">
                <div>
                  <label className="block text-dark-400 text-xs mb-1">Текущий пароль</label>
                  <div className="relative">
                    <input
                      type={showOldPw ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                      {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1">Новый пароль</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-dark-400 text-xs mb-1">Подтвердите новый пароль</label>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handlePasswordChange} className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
                    Сохранить
                  </button>
                  <button
                    onClick={() => { setShowPasswordChange(false); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); setPwError(''); }}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
                  >
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
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {t === 'info' && 'Информация'}
            {t === 'my_jobs' && `Мои заказы (${myJobs.length})`}
            {t === 'taken_jobs' && `Взятые (${takenJobs.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-white font-semibold text-lg mb-4">Статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-700/30 rounded-xl p-4">
              <p className="text-dark-400 text-xs mb-1">Заказов создано</p>
              <p className="text-2xl font-bold text-white">{myJobs.length}</p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-4">
              <p className="text-dark-400 text-xs mb-1">Взято заказов</p>
              <p className="text-2xl font-bold text-white">{takenJobs.length}</p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-4">
              <p className="text-dark-400 text-xs mb-1">Дата регистрации</p>
              <p className="text-white font-semibold text-sm">{user.joinedAt}</p>
            </div>
            <div className="bg-dark-700/30 rounded-xl p-4">
              <p className="text-dark-400 text-xs mb-1">Рейтинг</p>
              <StarRating rating={user.rating} />
            </div>
          </div>

          {/* Completed jobs awaiting rating */}
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
                        <button
                          onClick={() => { setRatingModal({ jobId: job.id, targetUserId: job.executorId!, targetName: job.executorName || 'Исполнитель', role: 'executor' }); setRatingStars(5); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors hover:bg-amber-500/25"
                        >
                          <Star size={12} /> Оценить исполнителя
                        </button>
                      )}
                      {canRateAuthor && (
                        <button
                          onClick={() => { setRatingModal({ jobId: job.id, targetUserId: job.authorId, targetName: job.authorName, role: 'author' }); setRatingStars(5); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium transition-colors hover:bg-amber-500/25"
                        >
                          <Star size={12} /> Оценить заказчика
                        </button>
                      )}
                      {!canRateExecutor && !canRateAuthor && (
                        <span className="text-dark-500 text-xs">Оценено</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'my_jobs' && (
        myJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {myJobs.map((job) => (
              <JobCard key={job.id} job={job} showExecutor={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-dark-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Нет заказов</h3>
            <p className="text-dark-400 text-sm">Вы ещё не создали ни одного заказа</p>
          </div>
        )
      )}

      {tab === 'taken_jobs' && (
        takenJobs.length > 0 ? (
          <div className="space-y-4">
            {takenJobs.map((job) => (
              <div key={job.id} className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1">{job.title}</h3>
                    <p className="text-dark-400 text-sm">Заказчик: <span className="text-dark-200">{job.authorName}</span></p>
                    <p className="text-dark-400 text-sm">Бюджет: <span className="text-accent-400 font-medium">{job.budget}</span></p>
                    {job.authorTelegram && (
                      <p className="text-dark-400 text-sm mt-1">
                        Telegram:{' '}
                        <a
                          href={`https://t.me/${job.authorTelegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-400 hover:text-accent-300 transition-colors"
                        >
                          {job.authorTelegram}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {cancelConfirmId === job.id ? (
                  <div className="bg-dark-700/40 border border-dark-600/30 rounded-xl p-4 mt-3">
                    <p className="text-dark-200 text-sm mb-3">Вы уверены, что хотите отказаться от заказа?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelTakenJob(job.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        <Check size={15} />
                        Да, отказаться
                      </button>
                      <button
                        onClick={() => setCancelConfirmId(null)}
                        className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-dark-200 rounded-xl text-sm font-medium transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCancelConfirmId(job.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-all mt-2"
                  >
                    <X size={15} />
                    Отказаться
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-dark-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Нет взятых заказов</h3>
            <p className="text-dark-400 text-sm">Вы ещё не брали ни одного заказа</p>
          </div>
        )
      )}
    </div>
  );
}
