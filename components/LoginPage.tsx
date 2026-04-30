import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const CREDENTIALS: Record<string, string> = {
  'itsjaigupta': 'familyof4.98',
};

interface Props {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const expectedPassword = CREDENTIALS[username.trim().toLowerCase()];
      if (expectedPassword && expectedPassword === password) {
        onLogin(username.trim().toLowerCase());
      } else {
        setError('Invalid username or password.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-white text-3xl tracking-[0.4em] font-bold mb-1">SARAAB</h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em]">Prop Shop Management</p>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white text-lg font-semibold mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-8">Access your invoice workspace</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-400 transition"
                placeholder="your username"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-400 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold text-[11px] uppercase tracking-widest py-3.5 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-[10px] mt-8 uppercase tracking-widest">
          Saraab Prop Shop · Private Access
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
