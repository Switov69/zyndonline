import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Briefcase } from 'lucide-react';
import { useJobs } from '../context/JobsContext';
import { JobCategory, CATEGORY_LABELS } from '../types';
import JobCard from '../components/JobCard';

export default function Home() {
  const { jobs, loading } = useJobs();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (j.status === 'done') return false; // hide completed
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'all' || j.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [jobs, search, selectedCategory]);

  const categories: { value: JobCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Все' },
    ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
      value: k as JobCategory,
      label: v,
    })),
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 bg-accent-500/10 text-accent-400 border border-accent-500/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Briefcase size={15} />
          Minecraft КБ
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
          Найди работу на{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">
            Zynd
          </span>
        </h1>
        <p className="text-dark-300 text-base sm:text-lg max-w-xl mx-auto">
          Ищи заказы, предлагай услуги и зарабатывай на любимом сервере
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-800/60 border border-dark-700/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              showFilters
                ? 'bg-accent-500/15 border-accent-500/30 text-accent-400'
                : 'bg-dark-800/60 border-dark-700/50 text-dark-300 hover:text-white hover:border-dark-600'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Фильтры</span>
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 p-4 bg-dark-800/40 border border-dark-700/30 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-accent-500/15 border-accent-500/30 text-accent-400'
                    : 'bg-dark-700/30 border-dark-600/30 text-dark-300 hover:text-white hover:border-dark-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-dark-400 text-sm">
          Найдено: <span className="text-dark-200">{filtered.length}</span> заказов
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-dark-800/40 border border-dark-700/30 rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-dark-500" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Ничего не найдено</h3>
          <p className="text-dark-400 text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      )}
    </div>
  );
}
