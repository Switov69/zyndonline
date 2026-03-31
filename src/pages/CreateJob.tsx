import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image, Crown, ZoomIn, ZoomOut, RotateCw, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { JobCategory, CATEGORY_LABELS } from '../types';

// ── Image editor for premium job photo ──────────────────────────────────────
function ImageEditor({
  src,
  onSave,
  onCancel,
}: {
  src: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const CANVAS_W = 800;
  const CANVAS_H = 300;

  const draw = useCallback((s: number, ox: number, oy: number) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#151821';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const sw = img.naturalWidth * s;
    const sh = img.naturalHeight * s;
    const x = (CANVAS_W - sw) / 2 + ox;
    const y = (CANVAS_H - sh) / 2 + oy;
    ctx.drawImage(img, x, y, sw, sh);
  }, []);

  const update = (s: number, ox: number, oy: number) => {
    setScale(s);
    setOffsetX(ox);
    setOffsetY(oy);
    setTimeout(() => draw(s, ox, oy), 0);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    update(scale, e.clientX - dragStart.x, e.clientY - dragStart.y);
  };
  const onMouseUp = () => setDragging(false);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(scale, offsetX, offsetY);
    onSave(canvas.toDataURL('image/jpeg', 0.88));
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-800 border border-dark-700/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Редактор фото вакансии</h3>
          <button onClick={onCancel} className="text-dark-400 hover:text-white"><X size={20} /></button>
        </div>

        <p className="text-dark-400 text-xs mb-3">Рекомендуемое разрешение: 800 × 300 px (16:6). Перетащите изображение для позиционирования.</p>

        {/* Canvas preview */}
        <div
          className="relative mb-4 rounded-xl overflow-hidden cursor-move border border-dark-600/50"
          style={{ width: '100%', aspectRatio: '800/300' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          <img
            ref={imgRef}
            src={src}
            alt=""
            className="hidden"
            onLoad={() => draw(scale, offsetX, offsetY)}
          />
        </div>

        {/* Scale controls */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => update(Math.max(0.1, scale - 0.1), offsetX, offsetY)}
            className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors"
            title="Уменьшить"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range" min={0.1} max={4} step={0.05} value={scale}
            onChange={(e) => update(parseFloat(e.target.value), offsetX, offsetY)}
            className="flex-1 accent-accent-500"
          />
          <button
            onClick={() => update(Math.min(4, scale + 0.1), offsetX, offsetY)}
            className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors"
            title="Увеличить"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => update(1, 0, 0)}
            className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 transition-colors"
            title="Сбросить"
          >
            <RotateCw size={16} />
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
            <Save size={15} /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main CreateJob ────────────────────────────────────────────────────────────
export default function CreateJob() {
  const { user } = useAuth();
  const { addJob } = useJobs();
  const navigate = useNavigate();
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<JobCategory>('building');
  const [budget, setBudget] = useState('');
  const [jobImageRaw, setJobImageRaw] = useState<string | undefined>(undefined);
  const [jobImageFinal, setJobImageFinal] = useState<string | undefined>(undefined);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasPremium = !!(
    user?.subscription?.active &&
    user.subscription.expiresAt &&
    new Date(user.subscription.expiresAt) > new Date()
  );

  if (user?.blocked) {
    return (
      <div className="text-center py-20">
        <h2 className="text-white text-xl font-semibold mb-2">Доступ ограничен</h2>
        <p className="text-dark-400 text-sm">Ваш профиль заблокирован.</p>
      </div>
    );
  }

  const handleBudgetInput = (val: string) => {
    if (val === 'Договорная') { setBudget(val); return; }
    const clean = val.replace(/[^0-9.]/g, '');
    if ((clean.match(/\./g) || []).length > 1) return;
    setBudget(clean);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Фото слишком большое (макс. 5 МБ)'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setJobImageRaw(reader.result as string);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim() || !budget.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }
    if (!user) return;
    setSubmitting(true);

    const budgetTrimmed = budget.trim();
    const budgetDisplay = budgetTrimmed === 'Договорная'
      ? 'Договорная'
      : /^\d+(\.\d+)?$/.test(budgetTrimmed)
        ? `${budgetTrimmed} кбк`
        : budgetTrimmed;

    try {
      await addJob({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: budgetDisplay,
        authorId: user.id,
        authorName: user.username,
        authorAvatar: user.avatar,
        authorTelegram: user.telegram || '',
        jobImage: hasPremium ? jobImageFinal : undefined,
      });
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Ошибка при создании заказа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {showEditor && jobImageRaw && (
        <ImageEditor
          src={jobImageRaw}
          onSave={(url) => { setJobImageFinal(url); setShowEditor(false); }}
          onCancel={() => { setJobImageRaw(undefined); setShowEditor(false); }}
        />
      )}

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Создать заказ</h1>
        <p className="text-dark-400 text-sm">Опишите, что вам нужно, и найдите исполнителя</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Title */}
        <div>
          <label className="block text-dark-200 text-sm font-medium mb-2">Название</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Постройка замка"
            maxLength={100}
            className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
          />
        </div>

        {/* Description — 256 chars max, smaller textarea */}
        <div>
          <label className="block text-dark-200 text-sm font-medium mb-2">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 256))}
            placeholder="Подробно опишите задачу..."
            rows={3}
            maxLength={256}
            className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all resize-none"
          />
          <p className="text-dark-500 text-xs mt-1 text-right">{description.length}/256</p>
        </div>

        {/* Category + Budget in grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">Категория</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JobCategory)}
                className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all appearance-none cursor-pointer pr-8"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-dark-900 text-white">{v}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">Бюджет (кбк)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={budget}
                onFocus={() => { if (budget === 'Договорная') setBudget(''); }}
                onChange={(e) => handleBudgetInput(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="min-w-0 flex-1 bg-dark-900/50 border border-dark-600/50 rounded-xl px-3 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setBudget('Договорная')}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors border whitespace-nowrap ${
                  budget === 'Договорная'
                    ? 'bg-accent-500/20 border-accent-500/40 text-accent-400'
                    : 'bg-dark-700 hover:bg-dark-600 text-dark-200 border-dark-600/50'
                }`}
              >
                Договорная
              </button>
            </div>
          </div>
        </div>

        {/* Premium image upload */}
        {hasPremium && (
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2 flex items-center gap-2">
              <Image size={14} className="text-purple-400" />
              Фото вакансии
              <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded text-xs">
                <Crown size={10} /> Premium
              </span>
            </label>
            <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            {jobImageFinal ? (
              <div className="relative">
                <img src={jobImageFinal} alt="" className="w-full h-24 object-cover rounded-xl border border-dark-600/50" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setJobImageRaw(jobImageFinal); setShowEditor(true); }}
                    className="bg-dark-900/80 text-dark-200 hover:text-accent-400 rounded-lg p-1.5 transition-colors"
                  >
                    <Image size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setJobImageFinal(undefined); setJobImageRaw(undefined); }}
                    className="bg-dark-900/80 text-dark-200 hover:text-red-400 rounded-lg p-1.5 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageFileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1 py-4 border-2 border-dashed border-dark-600/50 hover:border-purple-500/40 rounded-xl text-dark-400 hover:text-purple-400 text-sm transition-colors"
              >
                <Image size={18} />
                <span>Загрузить фото вакансии</span>
                <span className="text-xs text-dark-600">Рекомендуется 800×300 px</span>
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-accent-500/20 text-sm"
        >
          {submitting ? 'Публикация...' : 'Опубликовать заказ'}
        </button>
      </form>
    </div>
  );
}
