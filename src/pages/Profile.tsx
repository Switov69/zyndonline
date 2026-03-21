import { useState, useRef } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import JobCard from '../components/JobCard';

export default function Profile() {
  const { user, updateUser, logout, changePassword } = useAuth();
  const { jobs, completeJob } = useJobs();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [newTelegram, setNewTelegram] = useState(user?.telegram || '');
  const [tab, setTab] = useState<'info' | 'my_jobs' | 'taken_jobs'>('info');
  const [success, setSuccess] = useState('');

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // Complete job confirm
  const [completeConfirmId, setCompleteConfirmId] = useState<string | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const myJobs = jobs.filter((j) => j.authorId === user.id);
  const takenJobs = jobs.filter((j) => j.takenById === user.id && j.status === 'in_progress');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showMsg('Файл слишком большой (макс. 2 МБ)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      updateUser({ avatar: dataUrl });
      showMsg('Аватарка обновлена!');
    };
    reader.readAsDataURL(file);
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

  const handleCompleteJob = (jobId: string) => {
    completeJob(jobId);
    setCompleteConfirmId(null);
    showMsg('Заказ завершён и удалён!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Profile Header */}
      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8 mb-6">
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
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
                    onClick={() => {
                      setEditMode(false);
                      setNewTelegram(user.telegram);
                    }}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white mb-1">{user.username}</h1>
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
                    onClick={() => {
                      setEditMode(true);
                      setNewTelegram(user.telegram);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors border border-dark-600/50"
                  >
                    <Edit3 size={16} />
                    Редактировать
                  </button>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors border border-dark-600/50"
                  >
                    <Lock size={16} />
                    Сменить пароль
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all border border-dark-700/50 hover:border-red-500/20"
                  >
                    <LogOut size={16} />
                    Выйти
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
                  <button
                    type="button"
                    onClick={() => setShowOldPw(!showOldPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                  >
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
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                  >
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
                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPwError('');
                  }}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/30 rounded-xl p-1 mb-6 border border-dark-700/30">
        <button
          onClick={() => setTab('info')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'info'
              ? 'bg-dark-700 text-white shadow-sm'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          Информация
        </button>
        <button
          onClick={() => setTab('my_jobs')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'my_jobs'
              ? 'bg-dark-700 text-white shadow-sm'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          Мои заказы ({myJobs.length})
        </button>
        <button
          onClick={() => setTab('taken_jobs')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'taken_jobs'
              ? 'bg-dark-700 text-white shadow-sm'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          Взятые ({takenJobs.length})
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'info' ? (
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
              <p className="text-dark-400 text-xs mb-1">ID</p>
              <p className="text-white font-semibold text-sm truncate">{user.id}</p>
            </div>
          </div>
        </div>
      ) : tab === 'my_jobs' ? (
        myJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myJobs.map((job) => (
              <JobCard key={job.id} job={job} />
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
      ) : (
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

                {completeConfirmId === job.id ? (
                  <div className="bg-dark-700/40 border border-dark-600/30 rounded-xl p-4 mt-3">
                    <p className="text-dark-200 text-sm mb-3">
                      Вы уверены, что хотите завершить заказ? Он будет удалён из системы.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompleteJob(job.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        <Check size={15} />
                        Да, завершить
                      </button>
                      <button
                        onClick={() => setCompleteConfirmId(null)}
                        className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-dark-200 rounded-xl text-sm font-medium transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCompleteConfirmId(job.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium transition-all mt-2"
                  >
                    <CheckCircle2 size={15} />
                    Завершить заказ
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
