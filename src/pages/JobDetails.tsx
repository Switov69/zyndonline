import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Coins, Tag, User, CalendarDays, MessageCircle,
  LogIn, Send, X, CheckCircle2, Edit3, Save, Image, Star, Crown,
} from 'lucide-react';
import { useJobs } from '../context/JobsContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_LABELS, CATEGORY_COLORS, JobCategory } from '../types';
import { StarRating, StarPicker } from '../components/JobCard';

// ── Image editor for premium job photo ───────────────────────────────────────
function ImageEditor({ src, onSave, onCancel }: { src: string; onSave: (d: string) => void; onCancel: () => void }) {
  const [scale, setScale] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const W = 800, H = 300;

  const draw = (s: number, x: number, y: number) => {
    const c = canvasRef.current, img = imgRef.current;
    if (!c || !img || !img.complete) return;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#151821'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, (W - img.naturalWidth * s) / 2 + x, (H - img.naturalHeight * s) / 2 + y, img.naturalWidth * s, img.naturalHeight * s);
  };

  const update = (s: number, x: number, y: number) => { setScale(s); setOx(x); setOy(y); requestAnimationFrame(() => draw(s, x, y)); };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Редактор фото</h3>
          <button onClick={onCancel} className="text-dark-400 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-dark-500 text-xs mb-3">Рекомендуется 800×300 px. Перетащите для позиционирования.</p>
        <div className="relative mb-4 rounded-xl overflow-hidden border border-dark-600/50 cursor-move"
          style={{ aspectRatio: '800/300' }}
          onMouseDown={(e) => { setDragging(true); setDragStart({ x: e.clientX - ox, y: e.clientY - oy }); }}
          onMouseMove={(e) => { if (dragging) update(scale, e.clientX - dragStart.x, e.clientY - dragStart.y); }}
          onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)}>
          <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: '100%', display: 'block' }} />
          <img ref={imgRef} src={src} alt="" className="hidden" onLoad={() => draw(scale, ox, oy)} />
        </div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => update(Math.max(0.1, scale - 0.1), ox, oy)} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200"><Star size={14} className="rotate-180" /></button>
          <input type="range" min={0.1} max={4} step={0.05} value={scale} onChange={(e) => update(parseFloat(e.target.value), ox, oy)} className="flex-1 accent-accent-500" />
          <button onClick={() => update(Math.min(4, scale + 0.1), ox, oy)} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200"><Star size={14} /></button>
          <button onClick={() => update(1, 0, 0)} className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-300 text-xs">Сброс</button>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
          <button onClick={() => { draw(scale, ox, oy); onSave(canvasRef.current!.toDataURL('image/jpeg', 0.88)); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
            <Save size={14} /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { jobs, getJob, takeJob, updateJob, completeJob, cancelJobTake } = useJobs();
  const { isAuthenticated, isAdmin, user, getUserById, rateUser } = useAuth();
  const navigate = useNavigate();

  const job = getJob(id || '');

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<JobCategory>('building');
  const [editBudget, setEditBudget] = useState('');
  const [editImage, setEditImage] = useState<string | undefined>(undefined);
  const [editImageRaw, setEditImageRaw] = useState<string | undefined>(undefined);
  const [showImgEditor, setShowImgEditor] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ targetUserId: string; targetName: string; role: 'executor' | 'author' } | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const [authorInfo, setAuthorInfo] = useState<any>(null);
  useEffect(() => {
    if (job?.authorId) {
      getUserById(job.authorId).then(u => setAuthorInfo(u));
    }
  }, [job?.authorId, getUserById]);

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-white text-xl font-semibold mb-2">Заказ не найден</h2>
        <p className="text-dark-400 mb-6">Возможно, он был удалён или ссылка неверна</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
          <ArrowLeft size={16} />На главную
        </Link>
      </div>
    );
  }

  const statusColors = {
    open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    done: 'bg-dark-400/30 text-dark-300 border-dark-500/20',
  };
  const statusLabels = { open: 'Открыто', in_progress: 'В работе', done: 'Выполнено' };

  const isOwnJob = user?.id === job.authorId;
  const isExecutor = user?.id === job.takenById;
  const canEdit = isAdmin || isOwnJob;
  const hasPremium = !!(authorInfo?.subscription?.active && authorInfo?.subscription?.expiresAt && new Date(authorInfo.subscription.expiresAt) > new Date());

  const handleTakeJob = async () => {
    if (!user) return;
    setSubmitting(true);
    await takeJob(job.id, user.id, user.username);
    setSubmitting(false);
    setShowConfirm(false);
    setShowSuccess(true);
  };

  const handleCompleteJob = async () => {
    await completeJob(job.id);
    setShowCompleteConfirm(false);
  };

  const handleDeclineJob = async () => {
    await cancelJobTake(job.id);
    setShowDeclineConfirm(false);
    navigate('/profile');
  };

  const handleRateSubmit = async () => {
    if (!ratingModal) return;
    await rateUser(ratingModal.targetUserId, ratingStars, job.id, ratingModal.role);
    // Also update job so rating fields are set
    if (ratingModal.role === 'executor') await updateJob(job.id, { ratingForExecutor: ratingStars });
    else await updateJob(job.id, { ratingForAuthor: ratingStars });
    setRatingModal(null);
  };

  const startEditing = () => {
    setEditTitle(job.title);
    setEditDesc(job.description);
    setEditCategory(job.category);
    setEditBudget(job.budget);
    setEditImage(job.jobImage);
    setEditing(true);
  };

  const saveEdit = async () => {
    await updateJob(job.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      category: editCategory,
      budget: editBudget.trim(),
      jobImage: editImage,
    });
    setEditing(false);
  };

  const handleBudgetInput = (val: string) => {
    if (val === 'Договорная') { setEditBudget(val); return; }
    const clean = val.replace(/[^0-9.]/g, '');
    if ((clean.match(/\./g) || []).length > 1) return;
    setEditBudget(clean);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setEditImageRaw(reader.result as string); setShowImgEditor(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-300 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />Назад
      </button>

      {showImgEditor && editImageRaw && (
        <ImageEditor src={editImageRaw} onSave={(url) => { setEditImage(url); setShowImgEditor(false); }} onCancel={() => { setEditImageRaw(undefined); setShowImgEditor(false); }} />
      )}

      <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl overflow-hidden">
        {/* Premium image banner */}
        {job.jobImage && !editing && (
          <div className="w-full h-40 overflow-hidden">
            <img src={job.jobImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          {editing ? (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-lg">Редактирование заказа</h2>
              <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">Название</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">Описание</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value.slice(0, 256))} rows={3}
                  className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all resize-none" />
                <p className="text-dark-500 text-xs mt-1 text-right">{editDesc.length}/256</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-dark-200 text-sm font-medium mb-2">Категория</label>
                  <div className="relative">
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as JobCategory)}
                      className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-all appearance-none cursor-pointer pr-8">
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-dark-900 text-white">{v}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-dark-200 text-sm font-medium mb-2">Бюджет</label>
                  <div className="flex gap-2">
                    <input type="text" value={editBudget} onFocus={() => { if (editBudget === 'Договорная') setEditBudget(''); }} onChange={(e) => handleBudgetInput(e.target.value)} placeholder="0.00" inputMode="decimal"
                      className="min-w-0 flex-1 bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-all" />
                    <button type="button" onClick={() => setEditBudget('Договорная')}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors border whitespace-nowrap ${editBudget === 'Договорная' ? 'bg-accent-500/20 border-accent-500/40 text-accent-400' : 'bg-dark-700 hover:bg-dark-600 text-dark-200 border-dark-600/50'}`}>
                      Договорная
                    </button>
                  </div>
                </div>
              </div>

              {/* Premium image upload in edit */}
              {hasPremium && (
                <div>
                  <label className="block text-dark-200 text-sm font-medium mb-2 flex items-center gap-2">
                    <Image size={14} className="text-purple-400" />Фото вакансии <span className="text-purple-400 text-xs">(Premium)</span>
                  </label>
                  <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                  {editImage ? (
                    <div className="relative">
                      <img src={editImage} alt="" className="w-full h-24 object-cover rounded-xl border border-dark-600/50" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button type="button" onClick={() => { setEditImageRaw(editImage); setShowImgEditor(true); }}
                          className="bg-dark-900/80 text-dark-200 hover:text-accent-400 rounded-lg p-1.5 transition-colors"><Image size={12} /></button>
                        <button type="button" onClick={() => setEditImage(undefined)}
                          className="bg-dark-900/80 text-dark-200 hover:text-red-400 rounded-lg p-1.5 transition-colors"><X size={12} /></button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => imageFileRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-1 py-4 border-2 border-dashed border-dark-600/50 hover:border-purple-500/40 rounded-xl text-dark-400 hover:text-purple-400 text-sm transition-colors">
                      <Image size={16} /><span>Загрузить фото</span>
                      <span className="text-xs text-dark-600">Рекомендуется 800×300 px</span>
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={saveEdit} className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
                  <Save size={15} />Сохранить
                </button>
                <button onClick={() => setEditing(false)} className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${CATEGORY_COLORS[job.category]}`}>
                  {CATEGORY_LABELS[job.category]}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${statusColors[job.status]}`}>
                  {statusLabels[job.status]}
                </span>
                {hasPremium && <Crown size={13} className="text-purple-400" />}
                {canEdit && job.status === 'open' && (
                  <button onClick={startEditing}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium transition-all">
                    <Edit3 size={12} />Изменить
                  </button>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 break-words">{job.title}</h1>

              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-dark-700/30 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1"><Coins size={13} />Бюджет</div>
                  <p className="text-accent-400 font-semibold">{job.budget}</p>
                </div>
                <div className="bg-dark-700/30 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1"><CalendarDays size={13} />Создан</div>
                  <p className="text-white font-semibold text-sm">{job.createdAt}</p>
                </div>
                <div className="bg-dark-700/30 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-dark-400 text-xs mb-1"><User size={13} />Автор</div>
                  <Link to={`/user/${job.authorId}`} className="text-accent-400 hover:text-accent-300 font-semibold text-sm transition-colors">
                    {job.authorName}
                  </Link>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-white font-semibold text-lg mb-3">Описание</h2>
                <p className="text-dark-200 leading-relaxed whitespace-pre-wrap break-words">{job.description}</p>
              </div>

              {/* Executor — only for author and admin */}
              {job.takenByName && (isOwnJob || isAdmin) && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-400 text-sm">
                    Взят исполнителем:{' '}
                    <Link to={`/user/${job.takenById}`} className="font-semibold hover:text-amber-300 transition-colors">
                      {job.takenByName}
                    </Link>
                  </p>
                </div>
              )}

              {/* Done — rating */}
              {job.status === 'done' && (
                <div className="mb-6 bg-dark-700/30 border border-dark-600/30 rounded-xl p-4 space-y-3">
                  <p className="text-dark-300 text-sm font-semibold">Заказ завершён</p>
                  {isOwnJob && job.executorId && !job.ratingForExecutor && (
                    <button onClick={() => { setRatingModal({ targetUserId: job.executorId!, targetName: job.executorName || 'Исполнитель', role: 'executor' }); setRatingStars(5); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-medium hover:bg-amber-500/25 transition-colors">
                      <Star size={13} />Оценить исполнителя
                    </button>
                  )}
                  {isExecutor && !job.ratingForAuthor && (
                    <button onClick={() => { setRatingModal({ targetUserId: job.authorId, targetName: job.authorName, role: 'author' }); setRatingStars(5); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-medium hover:bg-amber-500/25 transition-colors">
                      <Star size={13} />Оценить заказчика
                    </button>
                  )}
                </div>
              )}

              {/* Author card */}
              <div className="border-t border-dark-700/50 pt-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <Link to={`/user/${job.authorId}`}>
                    <div className="w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center text-dark-200 text-lg font-bold overflow-hidden hover:opacity-80 transition-opacity">
                      {job.authorAvatar ? <img src={job.authorAvatar} alt="" className="w-full h-full object-cover" /> : job.authorName.charAt(0)}
                    </div>
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/user/${job.authorId}`} className="text-white font-semibold hover:text-accent-300 transition-colors">{job.authorName}</Link>
                      {hasPremium && <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-xs"><Crown size={9} />Premium</span>}
                    </div>
                    <p className="text-dark-400 text-sm">Заказчик</p>
                    {authorInfo?.rating && <StarRating rating={authorInfo.rating} />}
                  </div>

                  {/* Action buttons */}
                  {isAuthenticated && job.status === 'open' && !isOwnJob && !user?.blocked && (
                    <button onClick={() => setShowConfirm(true)}
                      className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-accent-500/20">
                      <MessageCircle size={15} />Откликнуться
                    </button>
                  )}
                  {isOwnJob && job.status === 'in_progress' && (
                    <button onClick={() => setShowCompleteConfirm(true)}
                      className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium transition-all">
                      <CheckCircle2 size={15} />Завершить заказ
                    </button>
                  )}
                  {isExecutor && job.status === 'in_progress' && (
                    <button onClick={() => setShowDeclineConfirm(true)}
                      className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-all">
                      <X size={15} />Отказаться
                    </button>
                  )}
                  {isAuthenticated && user?.blocked && job.status === 'open' && !isOwnJob && (
                    <span className="ml-auto text-red-400 text-sm">Ваш профиль заблокирован</span>
                  )}
                  {isOwnJob && job.status === 'open' && (
                    <span className="ml-auto text-dark-400 text-sm italic">Это ваш заказ</span>
                  )}
                  {!isAuthenticated && (
                    <Link to="/login" className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-accent-500/20">
                      <LogIn size={15} />Войти для отклика
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Take job confirm */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Взяться за заказ?</h3>
              <button onClick={() => setShowConfirm(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-dark-300 text-sm mb-2">Вы уверены, что хотите взяться за заказ <span className="text-white font-medium">«{job.title}»</span>?</p>
            <p className="text-dark-300 text-sm mb-6">Бюджет: <span className="text-accent-400 font-medium">{job.budget}</span></p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleTakeJob} disabled={submitting} className="flex-1 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors">
                {submitting ? '...' : 'Да, берусь'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccess(false)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={28} className="text-emerald-400" /></div>
              <h3 className="text-white font-semibold text-lg mb-2">Вы взяли заказ!</h3>
              <p className="text-dark-300 text-sm">Свяжитесь с заказчиком для уточнения деталей.</p>
            </div>
            <div className="bg-dark-700/40 border border-dark-600/30 rounded-xl p-4 mb-5">
              <p className="text-dark-400 text-xs mb-1">Telegram заказчика</p>
              <div className="flex items-center gap-2">
                <Send size={15} className="text-accent-400" />
                <a href={`https://t.me/${job.authorTelegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="text-accent-400 hover:text-accent-300 font-medium text-sm transition-colors">{job.authorTelegram}</a>
              </div>
            </div>
            <button onClick={() => setShowSuccess(false)} className="w-full px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">Понятно</button>
          </div>
        </div>
      )}

      {/* Author complete confirm */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCompleteConfirm(false)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Завершить заказ?</h3>
              <button onClick={() => setShowCompleteConfirm(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-dark-300 text-sm mb-6">Подтвердите завершение «{job.title}». После этого вы сможете оценить исполнителя.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteConfirm(false)} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleCompleteJob} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">Завершить</button>
            </div>
          </div>
        </div>
      )}

      {/* Executor decline confirm */}
      {showDeclineConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeclineConfirm(false)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Отказаться от заказа?</h3>
              <button onClick={() => setShowDeclineConfirm(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-dark-300 text-sm mb-6">Вы уверены? Заказ снова станет открытым.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeclineConfirm(false)} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleDeclineJob} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">Отказаться</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setRatingModal(null)}>
          <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Оценить {ratingModal.targetName}</h3>
              <button onClick={() => setRatingModal(null)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-dark-400 text-sm mb-5">Как оцените работу пользователя?</p>
            <div className="flex justify-center mb-6"><StarPicker value={ratingStars} onChange={setRatingStars} /></div>
            <div className="flex gap-3">
              <button onClick={() => setRatingModal(null)} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">Отмена</button>
              <button onClick={handleRateSubmit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Star size={14} />Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
