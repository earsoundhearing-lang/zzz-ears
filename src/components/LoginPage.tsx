import React, { useState } from 'react';
import { Lock, User, AlertCircle, Building2 } from 'lucide-react';
import { EarsoundLogo } from './Common/EarsoundLogo';
import { AppUser } from '../types';
import { DEFAULT_USERS } from '../utils/storage';

interface LoginPageProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
}

export function LoginPage({ users, onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(
      (u) => u.username === username && u.password === password
    ) || DEFAULT_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      if (!user.isActive) {
        setError('Akun Anda dinonaktifkan. Hubungi Administrator.');
      } else {
        onLogin(user);
      }
    } else {
      setError('Username atau Password salah.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#2A2F86] px-6 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-[#2C308E] opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-[#161852] opacity-50 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center">
            <EarsoundLogo size="lg" showSubtitle={true} subtitleText="Management Information System" />
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-slate-800">Login Cabang</h2>
            <p className="text-sm text-slate-500 mt-1">Silakan masuk menggunakan akun cabang Anda</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2A2F86] focus:border-[#2A2F86] transition-all text-slate-800 font-medium"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2A2F86] focus:border-[#2A2F86] transition-all text-slate-800 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#2A2F86] hover:bg-[#23277A] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#2A2F86] focus:ring-offset-2 mt-2"
            >
              <Building2 className="w-5 h-5" />
              <span>Masuk ke Dashboard</span>
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Pusat Alat Bantu Dengar Earsound<br/>
              Akses terbatas hanya untuk staf & manajemen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
