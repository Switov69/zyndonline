import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Menu, X, Shield } from 'lucide-react';
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

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-transparent backdrop-blur-none border-b border-transparent'
          : 'bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-3">

          {/* Logo — visible when not scrolled OR user not authenticated (center for unauth) */}
          {!isAuthenticated ? (
            /* Unauthenticated: logo centered */
            <div className="flex-1 flex justify-center">
              <Link
                to="/"
                className="flex items-center gap-1.5 bg-dark-800/90 border border-dark-700/50 rounded-xl px-4 py-2 hover:border-dark-600 transition-colors backdrop-blur-sm"
              >
                <span className="text-lg font-bold text-white tracking-tight">Zynd</span>
                <span className="text-sm text-accent-400 font-medium">.online</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Logo block - slides out on scroll */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  scrolled ? 'max-w-0 opacity-0 mr-0' : 'max-w-[200px] opacity-100'
                }`}
              >
                <Link
                  to="/"
                  className="flex items-center gap-1.5 bg-dark-800/90 border border-dark-700/50 rounded-xl px-4 py-2 hover:border-dark-600 transition-colors shrink-0 backdrop-blur-sm whitespace-nowrap"
                >
                  <span className="text-lg font-bold text-white tracking-tight">Zynd</span>
                  <span className="text-sm text-accent-400 font-medium">.online</span>
                </Link>
              </div>

              {/* Desktop center nav */}
              <div className="hidden md:flex items-center flex-1">
                <div className={`flex items-center gap-1 bg-dark-800/90 border border-dark-700/50 rounded-xl px-1.5 py-1.5 backdrop-blur-sm transition-all duration-500 ${scrolled ? 'ml-0' : ''}`}>
                  {/* Logo inside nav on scroll */}
                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      scrolled ? 'max-w-[160px] opacity-100 mr-1' : 'max-w-0 opacity-0 mr-0'
                    }`}
                  >
                    <Link
                      to="/"
                      className="flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap"
                    >
                      <span className="text-base font-bold text-white tracking-tight">Zynd</span>
                      <span className="text-xs text-accent-400 font-medium">.online</span>
                    </Link>
                  </div>

                  <Link to="/" className={linkClass('/')} onClick={() => setMobileOpen(false)}>
                    <Home size={17} />
                    <span>Главная</span>
                  </Link>
                  <Link to="/create" className={linkClass('/create')} onClick={() => setMobileOpen(false)}>
                    <PlusCircle size={17} />
                    <span>Создать</span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className={linkClass('/admin')} onClick={() => setMobileOpen(false)}>
                      <Shield size={17} />
                      <span>Админ</span>
                    </Link>
                  )}

                  {/* Avatar/username inside nav on scroll */}
                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      scrolled ? 'max-w-[200px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'
                    }`}
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors whitespace-nowrap"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 text-xs font-bold overflow-hidden shrink-0">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium text-dark-200">{user?.username}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Desktop right side avatar — visible when not scrolled */}
              <div className="hidden md:flex items-center">
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    scrolled ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'
                  }`}
                >
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 bg-dark-800/90 border border-dark-700/50 rounded-xl px-4 py-2 hover:border-dark-600 transition-colors backdrop-blur-sm whitespace-nowrap"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 text-xs font-bold overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-dark-200">{user?.username}</span>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Login button for unauthenticated */}
          {!isAuthenticated && (
            <div className="absolute right-4 sm:right-6">
              <Link
                to="/login"
                className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl px-5 py-2 text-sm font-medium transition-colors"
              >
                Вход
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden ml-auto p-2 rounded-xl text-dark-200 hover:text-white hover:bg-dark-700 transition-colors bg-dark-800/90 border border-dark-700/50 backdrop-blur-sm"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-dark-900/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1 border-t border-dark-700/50">
          <Link to="/" className={linkClass('/')} onClick={() => setMobileOpen(false)}>
            <Home size={17} />
            <span>Главная</span>
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/create" className={linkClass('/create')} onClick={() => setMobileOpen(false)}>
                <PlusCircle size={17} />
                <span>Создать</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className={linkClass('/admin')} onClick={() => setMobileOpen(false)}>
                  <Shield size={17} />
                  <span>Админ-панель</span>
                </Link>
              )}
              <Link to="/profile" className={linkClass('/profile')} onClick={() => setMobileOpen(false)}>
                <div className="w-6 h-6 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-400 text-xs font-bold overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <span>{user?.username}</span>
              </Link>
            </>
          ) : (
            <Link to="/login" className={linkClass('/login')} onClick={() => setMobileOpen(false)}>
              Вход
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
