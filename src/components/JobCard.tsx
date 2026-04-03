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

const STATUS_COLORS = {
  open: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  done: 'bg-dark-400/30 text-dark-300 border-dark-500/20',
};
const STATUS_LABELS = { open: 'Открыто', in_progress: 'В работе', done: 'Выполнено' };

// Category tint for cards without images
const CATEGORY_TINT: Record<string, string> = {
  building: 'bg-emerald-900/20',
  redstone: 'bg-red-900/20',
  terraforming: 'bg-amber-900/20',
  interior: 'bg-purple-900/20',
  pixel_art: 'bg-pink-900/20',
  other: 'bg-dark-700/20',
};

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
        style={{ minHeight: 220 }}
      >
        {/* Top banner — fixed h-24 whether image or plain tint */}
        <div className="relative w-full h-24 shrink-0 overflow-hidden">
          {job.jobImage ? (
            <>
              <img src={job.jobImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
            </>
          ) : (
            <div className={`w-full h-full ${CATEGORY_TINT[job.category] ?? CATEGORY_TINT.other} relative`}>
              {/* Subtle diagonal pattern */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)',
                  backgroundSize: '10px 10px',
                }}
              />
            </div>
          )}

          {/* Badges: category + status */}
          <div className="absolute bottom-2 left-3 flex gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border shadow-sm ${CATEGORY_COLORS[job.category]}`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
              {CATEGORY_LABELS[job.category]}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border shadow-sm ${STATUS_COLORS[job.status]}`}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
              {STATUS_LABELS[job.status]}
            </span>
          </div>

          {job.authorPremium && (
            <div className="absolute top-2 right-2">
              <Crown size={13} className="text-purple-300 drop-shadow-md" />
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="text-white font-semibold text-base mb-1.5 line-clamp-2 leading-snug">
            {job.title}
          </h3>

          <p className="text-dark-300 text-sm leading-relaxed mb-3 line-clamp-2 flex-1 break-words">
            {job.description}
          </p>

          {showExecutor && job.takenByName && (
            <div className="mb-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
              <p className="text-amber-400 text-xs shadow-sm">
                Взят: <span className="font-semibold">{job.takenByName}</span>
              </p>
            </div>
          )}

          {/* Budget + meta */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-dark-700/30">
            <div className="flex items-center gap-1.5 text-accent-400" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              <Coins size={14} />
              <span className="font-semibold text-sm">{job.budget}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 text-xs font-bold overflow-hidden shrink-0">
                {job.authorAvatar
                  ? <img src={job.authorAvatar} alt="" className="w-full h-full object-cover" />
                  : job.authorName.charAt(0)}
              </div>
              <span className="text-dark-400 text-xs hidden sm:inline">{job.createdAt}</span>
              <ArrowRight size={14} className="text-dark-500 shrink-0" />
            </div>
          </div>
        </div>
      </Link>

      {/* Admin delete — below card, in flow */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          className={`mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border shadow-sm ${
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

// ── Star rating display ────────────────────────────────────────────────────────
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

// ── StarPicker — fixed:
//   • initial value=0 → all stars empty
//   • hover fills stars 1..N instantly (NO CSS transition = no flash)
//   • click fixes the selection; mouse-leave resets hover preview
// ─────────────────────────────────────────────────────────────────────────────
export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  // When mouse is over stars, show hover state; otherwise show committed value
  const displayed = hover > 0 ? hover : value;

  return (
    <div
      className="flex gap-1.5"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onClick={() => { onChange(s); setHover(0); }}
          className="p-0.5 focus:outline-none active:scale-110 transition-transform duration-100"
        >
          {/*
            No transition on color/fill — instant swap is required to prevent
            the "flash all yellow then correct" bug that occurs when transitions
            cause intermediate states across multiple siblings simultaneously.
          */}
          <Star
            size={26}
            className={s <= displayed ? 'text-amber-400 fill-amber-400' : 'text-dark-600'}
          />
        </button>
      ))}
    </div>
  );
}
