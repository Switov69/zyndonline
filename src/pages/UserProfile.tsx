import { useParams, Link } from 'react-router-dom';
import { CalendarDays, Briefcase, Send, ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import JobCard, { StarRating } from '../components/JobCard';
import { useState, useEffect } from 'react';
import { User } from '../types';

export default function UserProfile() {
  const { username: encodedUsername } = useParams<{ username: string }>();
  const username = decodeURIComponent(encodedUsername || '');
  const { getUserByUsername, user: currentUser } = useAuth();
  const { jobs } = useJobs();
  const [tab, setTab] = useState<'info' | 'jobs'>('info');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getUserByUsername(username).then((u) => { setProfileUser(u); setLoading(false); });
  }, [username, getUserByUsername]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
    </div>
  );

  if (!profileUser) return (
    <div className="text-center py-20">
      <h2 className="text-white text-xl font-semibold mb-2">Пользователь не найден</h2>
      <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors mt-4">
        <ArrowLeft size={16} />На главную
      </Link>
    </div>
  );

  if (currentUser && currentUser.id === profileUser.id) return (
    <div className="text-center py-20">
      <p className="text-dark-400 text-sm mb-4">Это ваш профиль</p>
      <Link to="/profile" className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors">
        Перейти в профиль
      </Link>
    </div>
  );

  const userJobs = jobs.filter((j) => j.authorId === profileUser.id && j.status !== 'done');
  const hasPremium = !!(profileUser.subscription?.active && profileUser.subscription?.expiresAt && new Date(profileUser.subscription.expiresAt) > new Date());
  const profileBg = hasPremium ? profileUser.subscription?.profileBg : '';

  const cardStyle: React.CSSProperties = profileBg
    ? profileBg.startsWith('linear') || profileBg.startsWith('radial')
      ? { background: profileBg }
      : { backgroundImage: `url(${profileBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-dark-300 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />Назад
      </Link>

      <div className="border border-dark-700/50 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden" style={cardStyle}>
        {profileBg && <div className="absolute inset-0 bg-dark-900/55 rounded-2xl pointer-events-none" />}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-dark-600 flex items-center justify-center text-dark-200 text-3xl font-bold overflow-hidden border-2 border-dark-500/50 shrink-0">
            {profileUser.avatar
              ? <img src={profileUser.avatar} alt="" className="w-full h-full object-cover" />
              : profileUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left" style={profileBg ? { textShadow: '0 1px 3px rgba(0,0,0,0.7)' } : {}}>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{profileUser.username}</h1>
              {hasPremium && (
                <span className="inline-flex items-center gap-1 bg-purple-500/25 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-md text-xs font-semibold shadow-sm">
                  <Crown size={11} />Premium
                </span>
              )}
              {profileUser.isAdmin && (
                <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-md text-xs font-semibold shadow-sm">Admin</span>
              )}
            </div>
            <div className="mb-1 flex justify-center sm:justify-start"><StarRating rating={profileUser.rating} /></div>
            {profileUser.telegram && (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-accent-400 mb-2">
                <Send size={13} />
                <a href={`https://t.me/${profileUser.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent-300 transition-colors">
                  {profileUser.telegram}
                </a>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-dark-300">
              <span className="flex items-center gap-1.5"><CalendarDays size={14} />С {profileUser.joinedAt}</span>
              <span className="flex items-center gap-1.5"><Briefcase size={14} />{userJobs.length} активных заказов</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-dark-800/30 rounded-xl p-1 mb-6 border border-dark-700/30">
        {(['info', 'jobs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
            {t === 'info' ? 'Информация' : `Заказы ${profileUser.username} (${userJobs.length})`}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-white font-semibold text-lg mb-4">Статистика</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Активных заказов</p><p className="text-2xl font-bold text-white">{userJobs.length}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Рейтинг</p><StarRating rating={profileUser.rating} /></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Дата регистрации</p><p className="text-white font-semibold text-sm">{profileUser.joinedAt}</p></div>
            <div className="bg-dark-700/30 rounded-xl p-4"><p className="text-dark-400 text-xs mb-1">Подписка</p>
              <p className="text-sm font-semibold">{hasPremium ? <span className="text-purple-400">Premium ✓</span> : <span className="text-dark-400">Нет</span>}</p>
            </div>
          </div>
        </div>
      )}
      {tab === 'jobs' && (
        userJobs.length > 0
          ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">{userJobs.map(job => <JobCard key={job.id} job={job} />)}</div>
          : (
            <div className="text-center py-16">
              <Briefcase size={36} className="text-dark-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-1">Нет активных заказов</h3>
              <p className="text-dark-400 text-sm">У пользователя нет открытых заказов</p>
            </div>
          )
      )}
    </div>
  );
}
