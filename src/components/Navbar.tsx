import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Menu, X, Shield, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-accent-500/15 text-accent-400'
        : 'text-dark-200 hover:text-white hover:bg-dark-700/50'
    }`;

  const hasPremium = !!(
    user?.subscription?.active &&
    user.subscription.expiresAt &&
    new Date(user.subscription.expiresAt) > new Date()
  );

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300
        bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50
        ${scrolled ? 'md:bg-transparent md:backdrop-blur-none md:border-transparent' : ''}
      `}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Desktop ── */}
        <div className="hidden md:flex items-center h-16 relative">

          {/* Logo — absolute left, slides out on scroll */}
          <div className={`absolute left-0 transition-all duration-500 ease-in-out ${
            scrolled ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'
          }`}>
            <Link
              to="/"
              className="flex items-center gap-1.5 bg-dark-800/90 border border-dark-700/50 rounded-xl px-4 py-2 hover:border-dark-600 transition-colors backdrop-blur-sm whitespace-nowrap"
            >
              <span className="text-lg font-bold text-white tracking-tight">Zynd</span>
              <span className="text-sm text-accent-400 font-medium">.online</span>
            </Link>
          </div>

          {/* Center nav pill — always centered */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1 bg-dark-800/90 border border-dark-700/50 rounded-xl px-1.5 py-1.5 backdrop-blur-sm">

              {/* Logo inside pill on scroll */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                scrolled ? 'max-w-[140px] opacity-100 mr-1' : 'max-w-0 opacity-0 mr-0 pointer-events-none'
              }`}>
                <Link to="/" className="flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap">
                  <span className="text-base font-bold text-white">Zynd</span>
                  <span className="text-xs text-accent-400 font-medium">.online</span>
                </Link>
              </div>

              <Link to="/" className={linkClass('/')}>
                <Home size={17} /><span>Главная</span>
              </Link>
              {isAuthenticated && (
                <Link to="/create" className={linkClass('/create')}>
                  <PlusCircle size={17} /><span>Создать</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className={linkClass('/admin')}>
                  <Shield size={17} /><span>Админ</span>
                </Link>
              )}

              {/* Avatar inside pill on scroll */}
              {isAuthenticated && (
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  scrolled ? 'max-w-[180px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0 pointer-events-none'
                }`}>
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors whitespace-nowrap">
                    <div className="w-6 h-6 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 text-xs font-bold overflow-hidden shrink-0">
                      {user?.avatar
                        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        : user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-dark-200">{user?.username}</span>
                    {hasPremium && <Crown size={11} className="text-purple-400 shrink-0" />}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Avatar — absolute right, slides out on scroll */}
          {isAuthenticated && (
            <div className={`absolute right-0 transition-all duration-500 ease-in-out ${
              scrolled ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-100 translate-x-0'
            }`}>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 bg-dark-800/90 border border-dark-700/50 rounded-xl px-4 py-2 hover:border-dark-600 transition-colors backdrop-blur-sm whitespace-nowrap"
              >
                <div className="w-7 h-7 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 text-xs font-bold overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-dark-200">{user?.username}</span>
                {hasPremium && <Crown size={12} className="text-purple-400" />}
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile — solid background ALWAYS (no transparency even on scroll) ── */}
        <div className="md:hidden flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-white tracking-tight">Zynd</span>
            <span className="text-sm text-accent-400 font-medium">.online</span>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 bg-dark-800/90 border border-dark-700/50 rounded-xl px-3 py-1.5"
              >
                <div className="w-6 h-6 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 text-xs font-bold overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-dark-200 max-w-[100px] truncate">{user?.username}</span>
                {hasPremium && <Crown size={10} className="text-purple-400" />}
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-xl text-dark-200 hover:text-white hover:bg-dark-700 transition-colors bg-dark-800/90 border border-dark-700/50"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && isAuthenticated && (
        <div className="md:hidden bg-dark-900 border-t border-dark-700/50 px-4 py-3 flex flex-col gap-1">
          <Link to="/" className={linkClass('/')} onClick={() => setMobileOpen(false)}>
            <Home size={17} /><span>Главная</span>
          </Link>
          <Link to="/create" className={linkClass('/create')} onClick={() => setMobileOpen(false)}>
            <PlusCircle size={17} /><span>Создать</span>
          </Link>
          {isAdmin && (
            <Link to="/admin" className={linkClass('/admin')} onClick={() => setMobileOpen(false)}>
              <Shield size={17} /><span>Админ-панель</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
