import React, { useState } from 'react';
import { AppUser } from '../../types';
import { EarsoundLogo } from '../Common/EarsoundLogo';
import { KeyRound, Shield, LogIn, Lock, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onLogin: (user: AppUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users = [],
  currentUser,
  onLogin,
}) => {
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'HQ_FINANCE' | 'BRANCHES'>('ALL');

  if (!isOpen) return null;

  const filteredList = users.filter((u) => {
    if (filterCategory === 'HQ_FINANCE') {
      return u.role === 'CEO' || u.role === 'FINANCE' || u.role === 'AKUNTAN' || u.role === 'LOGISTIK' || u.branchCode === 'HQ';
    }
    if (filterCategory === 'BRANCHES') {
      return u.role !== 'CEO' && u.role !== 'FINANCE' && u.role !== 'AKUNTAN' && u.branchCode !== 'HQ';
    }
    return true;
  });

  const handleQuickSelect = (user: AppUser) => {
    setSelectedUserId(user.id);
    setEnteredPassword(user.password); // Auto-fill for seamless user experience
    setErrorMessage('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userToLogin = users.find((u) => u.id === selectedUserId);

    if (!userToLogin) {
      setErrorMessage('User tidak ditemukan.');
      return;
    }

    if (userToLogin.password !== enteredPassword) {
      setErrorMessage('Password salah! Silakan periksa kembali.');
      return;
    }

    if (!userToLogin.isActive) {
      setErrorMessage('Akun user ini sedang dinonaktifkan.');
      return;
    }

    onLogin(userToLogin);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#23277A] text-[#F5B438] rounded-2xl">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Login / Ganti Akun User</h3>
              <p className="text-xs text-slate-500">Pilih akun cabang (Yamin, Betahive, dll) atau CEO HQ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Quick Select Grid for Branches + Finance + CEO */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Pilih Akun User:
            </label>
            <span className="text-[10px] text-slate-400 italic">Password otomatis terisi</span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterCategory('ALL')}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                filterCategory === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('HQ_FINANCE')}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                filterCategory === 'HQ_FINANCE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/50'
              }`}
            >
              💼 Pusat & Finance
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('BRANCHES')}
              className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                filterCategory === 'BRANCHES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🏬 Cabang
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50">
            {filteredList.map((u) => {
              const isSelected = selectedUserId === u.id;
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleQuickSelect(u)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#23277A] text-white border-[#23277A] shadow-xs ring-2 ring-[#F5B438]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                      u.role === 'CEO' 
                        ? 'bg-purple-100 text-purple-800' 
                        : u.role === 'FINANCE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : u.role === 'AKUNTAN'
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                            : u.role === 'LOGISTIK'
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'SUPERVISOR'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#F5B438] shrink-0" />}
                  </div>
                  <p className="text-xs font-bold truncate mt-1">{u.fullName}</p>
                  <p className="text-[10px] font-mono opacity-80">@{u.username}</p>
                  {u.role === 'SUPERVISOR' && u.allowedBranches && (
                    <p className="text-[9px] text-blue-600 font-semibold truncate mt-0.5">
                      Cabang: {u.allowedBranches.join(', ')}
                    </p>
                  )}
                  {(u.role === 'FINANCE' || u.role === 'AKUNTAN') && (
                    <p className="text-[9px] text-emerald-600 font-bold truncate mt-0.5">
                      ✨ Akses Keuangan
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2 border-t">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>2. Konfirmasi Password Login:</span>
            </label>
            <input
              type="password"
              required
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              placeholder="Masukkan password akun..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#23277A] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <LogIn className="w-4 h-4 text-[#F5B438]" />
              <span>Masuk Sebagai User Ini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
