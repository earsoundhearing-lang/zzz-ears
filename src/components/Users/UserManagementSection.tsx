import React, { useState } from 'react';
import { AppUser, BranchCode, UserRole } from '../../types';
import { BRANCHES } from '../../utils/branches';
import { getEditTransactionPin, saveEditTransactionPin } from '../../utils/storage';
import { 
  Users, 
  UserPlus, 
  Key, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  LogIn,
  Search,
  Sparkles,
  Lock,
  Save
} from 'lucide-react';

interface UserManagementSectionProps {
  users: AppUser[];
  currentUser: AppUser;
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (id: string) => void;
  onSwitchUserSession: (user: AppUser) => void;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  users = [],
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUserSession,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<{ [id: string]: boolean }>({});

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [branchCode, setBranchCode] = useState<BranchCode>('YM');
  const [allowedBranches, setAllowedBranches] = useState<BranchCode[]>(['YM']);
  const [isActive, setIsActive] = useState(true);

  const isCEO = currentUser?.role === 'CEO' || currentUser?.branchCode === 'HQ' || currentUser?.branchCode === 'ALL';
  if (!isCEO) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-sm text-slate-500 mt-2">Anda tidak memiliki hak akses untuk membuka halaman Manajemen User.<br/>Hanya akun CEO (Kantor Pusat) yang diizinkan untuk mengelola hak akses cabang.</p>
      </div>
    );
  }

  const handleOpenModal = (user?: AppUser) => {
    if (user) {
      setEditingUser(user);
      setUsername(user.username);
      setPassword(user.password);
      setFullName(user.fullName);
      setRole(user.role);
      setBranchCode(user.branchCode);
      setAllowedBranches(user.allowedBranches || [user.branchCode]);
      setIsActive(user.isActive);
    } else {
      setEditingUser(null);
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('STAFF');
      setBranchCode('YM');
      setAllowedBranches(['YM']);
      setIsActive(true);
    }
    setShowModal(true);
  };

  const toggleBranchSelection = (code: BranchCode) => {
    if (allowedBranches.includes(code)) {
      if (allowedBranches.length > 1) {
        setAllowedBranches(allowedBranches.filter(b => b !== code));
      }
    } else {
      setAllowedBranches([...allowedBranches, code]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      alert('Mohon isi semua field yang wajib.');
      return;
    }

    const newUser: AppUser = {
      id: editingUser ? editingUser.id : `USR-${Date.now().toString().slice(-6)}`,
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      role,
      branchCode: role === 'SUPERVISOR' ? (allowedBranches[0] || branchCode) : branchCode,
      allowedBranches: role === 'CEO' || role === 'LOGISTIK' 
        ? ['ALL', 'YM', 'PB', 'JB', 'BJ', 'PK', 'LS', 'ST', 'BT', 'MD'] 
        : role === 'SUPERVISOR' 
          ? allowedBranches 
          : [branchCode],
      isActive,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveUser(newUser);
    setShowModal(false);
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branchCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#181B57] via-[#23277A] to-[#181B57] text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#F5B438] font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Hak Akses & Manajemen User Earsound</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Akun Cabang & Kantor Pusat</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Kelola data akun, password, dan hak akses untuk 8 cabang (Yamin, Bulan, Jambi, Binjai, Pakam, Langsa, Siantar, Betahive) serta Kantor Pusat CEO.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#F5B438] hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-md transition-all text-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun User Baru</span>
        </button>
      </div>

      {/* Account Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-[#23277A] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">🔒 Total Terdaftar</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-slate-900">{users.length}</div>
          <span className="text-xs text-slate-500">Akun CEO, Cabang & Maindealer</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-blue-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">🏪 Akun Cabang & Gudang</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {users.filter((u) => u.branchCode !== 'HQ' && u.branchCode !== 'ALL').length}
          </div>
          <span className="text-xs text-slate-500">Database Cabang & Gudang Maindealer</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">👤 Akun Aktif Saat Ini</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">{currentUser.fullName}</div>
          <span className="text-xs text-[#23277A] font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            Role: {currentUser.role} ({currentUser.branchCode})
          </span>
        </div>
      </div>

      {/* Filter and User List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari user, nama, cabang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#23277A] outline-none"
            />
          </div>

          <p className="text-xs text-slate-500 italic">
            * Klik <strong className="text-[#23277A]">Login Sebagai</strong> untuk berganti akun cabang secara instant.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200 text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Nama Lengkap & User</th>
                <th className="px-4 py-3">Role & Akses</th>
                <th className="px-4 py-3">Cabang Database</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi & Switch Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const branchObj = BRANCHES.find((b) => b.code === u.branchCode);
                const isCurrentSession = currentUser.id === u.id;

                return (
                  <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrentSession ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#23277A] text-[#F5B438] font-bold flex items-center justify-center text-xs">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === 'CEO' 
                          ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                          : u.role === 'LOGISTIK'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : u.role === 'SUPERVISOR'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : u.branchCode === 'MD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : u.role === 'BRANCH_MANAGER'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {u.role === 'CEO' 
                          ? '👑 Kantor Pusat / CEO' 
                          : u.role === 'LOGISTIK'
                          ? '📦 Logistik Pusat'
                          : u.role === 'SUPERVISOR'
                          ? '👔 Supervisor Area'
                          : u.branchCode === 'MD'
                          ? '📦 Gudang Maindealer'
                          : u.role === 'BRANCH_MANAGER'
                          ? '👔 Kepala Cabang'
                          : '🏬 Staf Operasional'}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.role === 'CEO' || u.role === 'LOGISTIK' || u.branchCode === 'HQ' || u.branchCode === 'ALL' ? (
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-xs">
                          🌐 Semua Cabang (Pusat)
                        </span>
                      ) : u.role === 'SUPERVISOR' && u.allowedBranches && u.allowedBranches.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.allowedBranches.map(b => (
                            <span key={b} className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[10px]">
                              {b} ({BRANCHES.find(br=>br.code===b)?.name || b})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                          [{u.branchCode}] {branchObj?.name || u.branchCode}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>{showPasswords[u.id] ? u.password : '••••••••'}</span>
                        <button
                          onClick={() => toggleShowPassword(u.id)}
                          className="text-slate-400 hover:text-slate-600"
                          title="Lihat Password"
                        >
                          {showPasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-500 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isCurrentSession ? (
                          <span className="text-[10px] font-bold text-[#23277A] bg-indigo-100 px-2.5 py-1 rounded-lg">
                            Sedang Sesi Ini
                          </span>
                        ) : (
                          <button
                            onClick={() => onSwitchUserSession(u)}
                            className="flex items-center gap-1 bg-[#23277A] hover:bg-[#181B57] text-[#F5B438] text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                            title="Login sebagai user ini"
                          >
                            <LogIn className="w-3 h-3 text-[#F5B438]" />
                            <span>Login Akun</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {u.username !== 'ceo_earsound' && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus akun user @${u.username}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                            title="Hapus User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      
      {/* PIN Management Section (CEO Only) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mt-6 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Pengaturan PIN Otorisasi</h2>
            <p className="text-sm text-slate-500 font-medium">Ubah PIN untuk mengizinkan edit/hapus data dan transaksi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="password"
            maxLength={8}
            placeholder="PIN Baru"
            id="newPinInput"
            className="w-full max-w-xs p-3 border border-slate-300 rounded-xl font-mono text-lg text-center tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button
            onClick={() => {
              const input = document.getElementById('newPinInput') as HTMLInputElement;
              if (input && input.value.trim().length >= 4) {
                saveEditTransactionPin(input.value.trim());
                alert('PIN Otorisasi berhasil diperbarui!');
                input.value = '';
              } else {
                alert('PIN harus terdiri dari minimal 4 digit.');
              }
            }}
            className="px-6 py-3 bg-slate-900 text-amber-400 font-bold rounded-xl hover:bg-slate-800 shadow-md transition-all whitespace-nowrap"
          >
            Simpan PIN Baru
          </button>
        </div>
      </div>


      {/* Modal Form User */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#23277A]" />
                <span>{editingUser ? 'Edit Akun User' : 'Tambah Akun User Baru'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap User *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staf Admin Yamin / Bpk CEO"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. staff_yamin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23277A] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yamin123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23277A] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Akun</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setRole(newRole);
                      if (newRole === 'CEO' || newRole === 'LOGISTIK') {
                        setBranchCode('HQ');
                      }
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23277A] outline-none font-semibold text-slate-800"
                  >
                    <option value="STAFF">🏬 Staf Operasional Cabang</option>
                    <option value="SUPERVISOR">👔 Supervisor Area (Multi-Cabang)</option>
                    <option value="LOGISTIK">📦 Logistik (Akses Semua Cabang)</option>
                    <option value="BRANCH_MANAGER">👔 Kepala Cabang</option>
                    <option value="CEO">👑 CEO (Kantor Pusat)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {role === 'SUPERVISOR' ? 'Cabang Utama' : 'Database Cabang'}
                  </label>
                  <select
                    value={branchCode}
                    disabled={role === 'CEO' || role === 'LOGISTIK'}
                    onChange={(e) => setBranchCode(e.target.value as BranchCode)}
                    className={`w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23277A] outline-none font-medium ${
                      role === 'CEO' || role === 'LOGISTIK' ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-800'
                    }`}
                  >
                    {role === 'CEO' || role === 'LOGISTIK' ? (
                      <option value="HQ">🌐 Semua Cabang (Pusat)</option>
                    ) : (
                      BRANCHES.map((b) => (
                        <option key={b.code} value={b.code}>
                          [{b.code}] {b.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {role === 'SUPERVISOR' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                  <label className="block font-bold text-blue-900 text-xs">
                    Pilih Cabang yang Dapat Diakses SPV Ini:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {BRANCHES.map((b) => {
                      const isChecked = allowedBranches.includes(b.code);
                      return (
                        <label key={b.code} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBranchSelection(b.code)}
                            className="w-3.5 h-3.5 text-blue-600 rounded-xs focus:ring-blue-500"
                          />
                          <span>[{b.code}] {b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#23277A] rounded-xs focus:ring-[#23277A]"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-slate-700">
                  Status Akun Aktif (Dapat Login & Input Transaksi)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#23277A] hover:bg-[#181B57] text-[#F5B438] font-bold rounded-xl shadow-md transition-colors"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
