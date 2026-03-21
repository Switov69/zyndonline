import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { JobCategory, CATEGORY_LABELS } from '../types';

export default function CreateJob() {
  const { user } = useAuth();
  const { addJob } = useJobs();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<JobCategory>('building');
  const [budget, setBudget] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Check if blocked
  if (user?.blocked) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <PlusCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">Доступ ограничен</h2>
        <p className="text-dark-400 text-sm">Ваш профиль заблокирован. Создание заказов недоступно.</p>
      </div>
    );
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim() || !budget.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }
    if (!user) return;

    const budgetValue = budget.trim().replace(/\s/g, '');
    const budgetDisplay = /^\d+$/.test(budgetValue) ? `${budgetValue} кбк` : budget.trim();

    addJob({
      title: title.trim(),
      description: description.trim(),
      category,
      budget: budgetDisplay,
      authorId: user.id,
      authorName: user.username,
      authorAvatar: user.avatar,
      authorTelegram: user.telegram || '',
      tags,
    });
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-500/20">
          <PlusCircle size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Создать заказ</h1>
        <p className="text-dark-400 text-sm">Опишите, что вам нужно, и найдите исполнителя</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8 space-y-5"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-dark-200 text-sm font-medium mb-2">
            Название <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Постройка замка"
            maxLength={100}
            className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-dark-200 text-sm font-medium mb-2">
            Описание <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробно опишите задачу..."
            rows={5}
            maxLength={2000}
            className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all resize-none"
          />
          <p className="text-dark-500 text-xs mt-1">{description.length}/2000</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">
              Категория <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JobCategory)}
                className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all appearance-none cursor-pointer pr-10"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-dark-900 text-white py-2">
                    {v}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">
              Бюджет (кбк) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Например: 10"
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-dark-200 text-sm font-medium mb-2">
            Теги <span className="text-dark-500">(до 5)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Добавить тег"
              className="flex-1 bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-3 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-xl text-sm font-medium transition-colors"
            >
              Добавить
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 bg-dark-700/40 text-dark-200 px-3 py-1 rounded-lg text-sm border border-dark-600/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-dark-400 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-accent-500/20 text-sm"
        >
          Опубликовать заказ
        </button>
      </form>
    </div>
  );
}
