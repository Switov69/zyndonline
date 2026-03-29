import { Link } from 'react-router-dom';
import { Coins, ArrowRight, Trash2, Star } from 'lucide-react';
import { Job, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  showExecutor?: boolean; // show "Взят исполнителем" — only for author/admin
}

export default function JobCard({ job, showExecutor = false }: JobCardProps) {
  const { isAdmin } = useAuth();
  const { deleteJob } = useJobs();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const DESC_LIMIT = 120;
  const isLong = job.description.length > DESC_LIMIT;
  const displayDesc = descExpanded || !isLong
    ? job.description
    : job.description.slice(0, DESC_LIMIT) + '…';

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
    <div className="relative animate-fade-in-up flex flex-col h-full">
      <Link
        to={`/job/${job.id}`}
        className="flex flex-col flex-1 bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 hover:border-dark-600 rounded-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
      >
        {/* Premium job image */}
        {job.jobImage && (
          <div className="w-full h-28 overflow-hidden shrink-0">
            <img src={job.jobImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex flex-col flex-1 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${CATEGORY_COLORS[job.category]}`}
              >
                {CATEGORY_LABELS[job.category]}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[job.status]}`}
              >
                {statusLabels[job.status]}
              </span>
            </div>
            <ArrowRight
              size={18}
              className="text-dark-500 group-hover:text-accent-400 transition-colors shrink-0 mt-0.5"
            />
          </div>

          <h3 className="text-white font-semibold text-base sm:text-lg mb-2 line-clamp-2">
            {job.title}
          </h3>

          {/* Description with collapse - click to expand */}
          <div
            className="text-dark-300 text-sm leading-relaxed mb-3 flex-1"
            onClick={isLong ? (e) => { e.preventDefault(); setDescExpanded(v => !v); } : undefined}
            style={isLong ? { cursor: 'pointer' } : {}}
          >
            <span className="break-words whitespace-pre-wrap">{displayDesc}</span>
            {isLong && (
              <span className="text-accent-400 ml-1 text-xs">{descExpanded ? ' Скрыть' : ' Читать далее'}</span>
            )}
          </div>

          {/* Executor info — only for author/admin */}
          {showExecutor && job.takenByName && (
            <div className="mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
              <p className="text-amber-400 text-xs">
                Взят исполнителем: <span className="font-semibold">{job.takenByName}</span>
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-auto">
            <div className="flex items-center gap-1.5 text-accent-400">
              <Coins size={15} />
              <span className="font-medium">{job.budget}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 text-xs font-bold overflow-hidden shrink-0">
              {job.authorAvatar ? (
                <img src={job.authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                job.authorName.charAt(0)
              )}
            </div>
            <span className="text-dark-200 text-sm truncate">{job.authorName}</span>
            <span className="text-dark-500 text-xs ml-auto shrink-0">{job.createdAt}</span>
          </div>
        </div>
      </Link>

      {/* Admin delete button — inside card flow */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          className={`mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
            confirmDelete
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-dark-800/90 border-dark-600/50 text-dark-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10'
          }`}
        >
          <Trash2 size={13} />
          {confirmDelete ? 'Точно удалить?' : 'Удалить'}
        </button>
      )}
    </div>
  );
}

// Star rating display helper
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
