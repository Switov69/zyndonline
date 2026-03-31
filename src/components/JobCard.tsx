import { Link } from 'react-router-dom';
import { Coins, ArrowRight, Trash2, Star, Crown } from 'lucide-react';
import { Job, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  showExecutor?: boolean;
}

export default function JobCard({ job, showExecutor = false }: JobCardProps) {
  const { isAdmin } = useAuth();
  const { deleteJob } = useJobs();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteJob(job.id);
  };

  return (
    <div className="flex flex-col animate-fade-in-up">
      <Link
        to={`/job/${job.id}`}
        className="flex flex-col flex-1 bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 hover:border-dark-600 rounded-2xl transition-all duration-300 hover:scale-[1.01] overflow-hidden"
      >
        {/* Top banner: premium image OR colored category bar */}
        {job.jobImage ? (
          <div className="relative w-full h-24 overflow-hidden shrink-0">
            <img src={job.jobImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
            <div className="absolute bottom-2 left-3 flex gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${CATEGORY_COLORS[job.category]}`}>
                {CATEGORY_LABELS[job.category]}
              </span>
            </div>
          </div>
        ) : (
          <div className={`px-4 pt-3 pb-2 flex items-center gap-2 border-b border-dark-700/30`}>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${CATEGORY_COLORS[job.category]}`}>
              {CATEGORY_LABELS[job.category]}
            </span>
            {job.status === 'in_progress' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-amber-500/15 text-amber-400 border-amber-500/20">
                В работе
              </span>
            )}
            {job.authorPremium && (
              <Crown size={12} className="text-purple-400 ml-auto" />
            )}
          </div>
        )}

        <div className="flex flex-col flex-1 p-4">
          {/* Title */}
          <h3 className="text-white font-semibold text-base mb-1.5 line-clamp-2 group-hover:text-accent-300 transition-colors">
            {job.title}
          </h3>

          {/* Description — compact, 2 lines */}
          <p className="text-dark-300 text-sm leading-relaxed mb-3 line-clamp-2 flex-1 break-words">
            {job.description}
          </p>

          {/* Executor info — only for author/admin */}
          {showExecutor && job.takenByName && (
            <div className="mb-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
              <p className="text-amber-400 text-xs">
                Взят: <span className="font-semibold">{job.takenByName}</span>
              </p>
            </div>
          )}

          {/* Budget + date */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-dark-700/30">
            <div className="flex items-center gap-1.5 text-accent-400">
              <Coins size={14} />
              <span className="font-semibold text-sm">{job.budget}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 text-xs font-bold overflow-hidden shrink-0">
                {job.authorAvatar
                  ? <img src={job.authorAvatar} alt="" className="w-full h-full object-cover" />
                  : job.authorName.charAt(0)}
              </div>
              <span className="text-dark-400 text-xs">{job.createdAt}</span>
              <ArrowRight size={14} className="text-dark-500 shrink-0" />
            </div>
          </div>
        </div>
      </Link>

      {/* Delete button — below card in flow, not overlapping */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          className={`mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
            confirmDelete
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-dark-800/90 border-dark-600/50 text-dark-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10'
          }`}
        >
          <Trash2 size={12} />
          {confirmDelete ? 'Точно удалить?' : 'Удалить'}
        </button>
      )}
    </div>
  );
}

// Star rating display
export function StarRating({ rating }: { rating?: { count: number; total: number } }) {
  if (!rating || rating.count === 0) {
    return <span className="text-dark-500 text-xs">Нет оценок</span>;
  }
  const avg = rating.total / rating.count;
  return (
    <div className="flex items-center gap-1">
      <Star size={12} className="text-amber-400 fill-amber-400" />
      <span className="text-amber-400 text-xs font-medium">{avg.toFixed(1)}</span>
      <span className="text-dark-500 text-xs">({rating.count})</span>
    </div>
  );
}

// Interactive star picker — fixed hover logic
export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover > 0 ? hover : value;
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={24}
            className={`transition-colors duration-100 ${
              s <= active ? 'text-amber-400 fill-amber-400' : 'text-dark-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
