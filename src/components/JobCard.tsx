import { Link } from 'react-router-dom';
import { Coins, ArrowRight, Trash2 } from 'lucide-react';
import { Job, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const { isAdmin } = useAuth();
  const { deleteJob } = useJobs();
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    <div className="relative group animate-fade-in-up">
      <Link
        to={`/job/${job.id}`}
        className="block bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 hover:border-dark-600 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:scale-[1.02]"
      >
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

        <h3 className="text-white font-semibold text-base sm:text-lg mb-2 group-hover:text-accent-300 transition-colors line-clamp-2">
          {job.title}
        </h3>

        <p className="text-dark-300 text-sm leading-relaxed mb-4 line-clamp-2">
          {job.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-accent-400">
            <Coins size={15} />
            <span className="font-medium">{job.budget}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center text-dark-200 text-xs font-bold overflow-hidden">
            {job.authorAvatar ? (
              <img src={job.authorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              job.authorName.charAt(0)
            )}
          </div>
          <span className="text-dark-200 text-sm">{job.authorName}</span>
          <span className="text-dark-500 text-xs ml-auto">{job.createdAt}</span>
        </div>
      </Link>

      {/* Admin delete button */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            confirmDelete
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-dark-800/90 border-dark-600/50 text-dark-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10'
          } backdrop-blur-sm`}
        >
          <Trash2 size={13} />
          {confirmDelete ? 'Точно?' : 'Удалить'}
        </button>
      )}
    </div>
  );
}
