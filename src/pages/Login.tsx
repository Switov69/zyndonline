import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }
    const ok = login(username.trim(), password);
    if (ok) {
      navigate('/');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-500/20">
            <LogIn size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Вход в аккаунт</h1>
          <p className="text-dark-400 text-sm">
            Войдите, чтобы создавать заказы и откликаться
          </p>
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
            <label className="block text-dark-200 text-sm font-medium mb-2">Никнейм</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ваш никнейм"
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-dark-200 text-sm font-medium mb-2">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ваш пароль"
                className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-accent-500/20 text-sm"
          >
            Войти
          </button>

          <p className="text-center text-dark-400 text-sm">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-accent-400 hover:text-accent-300 transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
