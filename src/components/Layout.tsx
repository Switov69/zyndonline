import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-dark-800/50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-dark-400 text-sm font-semibold">Zynd</span>
            <span className="text-accent-500/60 text-sm">.online</span>
            <span className="text-dark-600 text-sm ml-1">· Поиск работы на КБ</span>
          </div>
          <p className="text-dark-600 text-xs">
            © 2025 Zynd. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}
