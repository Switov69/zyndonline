import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Tag, User, CalendarDays, MessageCircle, LogIn, Send, X, CheckCircle2, Edit3, Save } from 'lucide-react';
import { useJobs } from '../context/JobsContext';
import { CATEGORY_LABELS, CATEGORY_COLORS, JobCategory } from '../types';
import { useAuth } from '../context/AuthContext';

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { getJob, takeJob, updateJob } = useJobs();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const job = getJob(id || '');

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Admin edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<JobCategory>('building');
  const [editBudget, setEditBudget] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-white text-xl font-semibold mb-2">Заказ не найден</h2>
        <p className="text-dark-400 mb-6">Возможно, он был удалён или ссылка неверна</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          На главную
        </Link>
      </div>
    );
  }

  const statusColors = {
    open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    done: 'bg-dark-400/30 text-dark-300 border-dark-500/20',
  };

  const statusLabels = {
    open: 'Открыто',
    in_progress: 'В работе',
    done: 'Выполнено',
  };

  const handleTakeJob = () => {
    if (!user) return;
    if (user.blocked) return;
    takeJob(job.id, user.id, user.username);
    setShowConfirm(false);
    setShowSuccess(true);
  };

  const isOwnJob = user?.id === job.authorId;
  const alreadyTaken = job.status !== 'open';
  const isBlocked = user?.blocked;

  const startEditing = () => {
    setEditTitle(job.title);
    setEditDesc(job.description);
    setEditCategory(job.category);
    setEditBudget(job.budget);
    setEditTags([...job.tags]);
    setEditing(true);
  };

  const saveEdit = () => {
    updateJob(job.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      category: editCategory,
      budget: editBudget.trim(),
      tags: editTags,
    });
    setEditing(false);
  };

  const addEditTag = () => {
    const tag = editTagInput.trim().toLowerCase();
    if (tag && !editTags.includes(tag) && editTags.length < 5) {
      setEditTags([...editTags, tag]);
      setEditTagInput('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-dark-300 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Назад
      </button>

      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8">
        {editing ? (
          /* Admin Edit Mode */
          <div className="space-y-5">
            <h2 className="text-white font-semibold text-lg mb-2">Редактирование заказа</h2>

            <div>
              <label className="block text-dark-200 text-sm font-medium mb-2">Название</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-dark-200 text-sm font-medium mb-2">Описание</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={5}
                className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">Категория</label>
                <div className="relative">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as JobCategory)}
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all appearance-none cursor-pointer pr-10"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k} className="bg-dark-900 text-white py-2">{v}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">Бюджет</label>
                <input
                  type="text"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-dark-200 text-sm font-medium mb-2">Теги</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditTag(); } }}
                  placeholder="Добавить тег"
                  className="flex-1 bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
                />
                <button type="button" onClick={addEditTag} className="px-4 py-3 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">
                  Добавить
                </button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {editTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 bg-dark-700/40 text-dark-200 px-3 py-1 rounded-lg text-sm border border-dark-600/30">
                      #{tag}
                      <button onClick={() => setEditTags(editTags.filter(t => t !== tag))} className="text-dark-400 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Save size={16} />
                Сохранить
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${CATEGORY_COLORS[job.category]}`}>
                {CATEGORY_LABELS[job.category]}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${statusColors[job.status]}`}>
                {statusLabels[job.status]}
              </span>
              {isAdmin && (
                <button
                  onClick={startEditing}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium transition-all"
                >
                  <Edit3 size={13} />
                  Изменить
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">{job.title}</h1>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-dark-700/30 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1">
                  <Coins size={14} />
                  Бюджет
                </div>
                <p className="text-accent-400 font-semibold">{job.budget}</p>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1">
                  <CalendarDays size={14} />
                  Создан
                </div>
                <p className="text-white font-semibold text-sm">{job.createdAt}</p>
              </div>
              <div className="bg-dark-700/30 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1">
                  <User size={14} />
                  Автор
                </div>
                <p className="text-white font-semibold text-sm">{job.authorName}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-white font-semibold text-lg mb-3">Описание</h2>
              <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Tags */}
            {job.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
                  <Tag size={16} />
                  Теги
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <span key={tag} className="bg-dark-700/40 text-dark-200 px-3 py-1 rounded-lg text-sm border border-dark-600/30">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Taken by */}
            {job.takenByName && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-amber-400 text-sm">
                  Взят исполнителем: <span className="font-semibold">{job.takenByName}</span>
                </p>
              </div>
            )}

            {/* Author card */}
            <div className="border-t border-dark-700/50 pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center text-dark-200 text-lg font-bold overflow-hidden">
                  {job.authorAvatar ? (
                    <img src={job.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    job.authorName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold">{job.authorName}</p>
                  <p className="text-dark-400 text-sm">Заказчик</p>
                </div>
                {isAuthenticated && job.status === 'open' && !isOwnJob && !isBlocked && (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-accent-500/20"
                  >
                    <MessageCircle size={16} />
                    Откликнуться
                  </button>
                )}
                {isAuthenticated && isBlocked && job.status === 'open' && !isOwnJob && (
                  <span className="ml-auto text-red-400 text-sm">Ваш профиль заблокирован</span>
                )}
                {isAuthenticated && isOwnJob && (
                  <span className="ml-auto text-dark-400 text-sm italic">Это ваш заказ</span>
                )}
                {isAuthenticated && alreadyTaken && !isOwnJob && !isBlocked && (
                  <span className="ml-auto text-amber-400 text-sm">Заказ уже взят</span>
                )}
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-accent-500/20"
                  >
                    <LogIn size={16} />
                    Войти для отклика
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Взяться за заказ?</h3>
              <button onClick={() => setShowConfirm(false)} className="text-dark-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-dark-300 text-sm mb-2">
              Вы уверены, что хотите взяться за заказ <span className="text-white font-medium">«{job.title}»</span>?
            </p>
            <p className="text-dark-300 text-sm mb-6">
              Бюджет: <span className="text-accent-400 font-medium">{job.budget}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleTakeJob}
                className="flex-1 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Да, берусь
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccess(false)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Вы взяли заказ!</h3>
              <p className="text-dark-300 text-sm mb-1">
                Не задерживайте с выполнением заказа.
              </p>
              <p className="text-dark-300 text-sm">
                Свяжитесь с заказчиком для уточнения деталей.
              </p>
            </div>
            <div className="bg-dark-700/40 border border-dark-600/30 rounded-xl p-4 mb-5">
              <p className="text-dark-400 text-xs mb-1">Telegram заказчика</p>
              <div className="flex items-center gap-2">
                <Send size={16} className="text-accent-400" />
                <a
                  href={`https://t.me/${job.authorTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-400 hover:text-accent-300 font-medium text-sm transition-colors"
                >
                  {job.authorTelegram}
                </a>
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
