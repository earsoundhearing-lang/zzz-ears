import React, { useState, useEffect } from 'react';
import { EarsoundLogo } from './Common/EarsoundLogo';
import { BrandLogoModal } from './Common/BrandLogoModal';
import { AppUser, BranchCode } from '../types';
import { BRANCHES } from '../utils/branches';
import { 
  Users, 
  ShoppingBag, 
  Stethoscope, 
  Volume2, 
  DollarSign, 
  Disc, 
  Wrench, 
  Wallet,
  LayoutDashboard,
  Menu,
  X,
  Clock,
  UserCheck,
  ShieldCheck,
  Building2,
  LogOut,
  FileSpreadsheet,
  ShoppingCart,
  ReceiptText,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

export type NavTab =
  | 'pos'
  | 'dashboard'
  | 'crm_care'
  | 'pasien'
  | 'aksesoris'
  | 'jasa_periksa'
  | 'abd'
  | 'uang_masuk'
  | 'earmould'
  | 'reparasi'
  | 'kas_kecil'
  | 'users'
  | 'inventori';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  totalOmset: number;
  totalPatients: number;
  currentUser: AppUser;
  selectedBranch: BranchCode;
  onSelectBranch: (branch: BranchCode) => void;
  onOpenLoginModal: () => void;
  onAddPatient?: () => void;
}

interface NavSection {
  category: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalPatients,
  currentUser,
  selectedBranch,
  onSelectBranch,
  onOpenLoginModal,
  onAddPatient,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      };
      const dateStr = now.toLocaleDateString('id-ID', options);
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setTimeString(`${dateStr} • ${timeStr} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const isCEO = currentUser.role === 'CEO' || currentUser.branchCode === 'HQ' || currentUser.branchCode === 'ALL';
  const isFinance = currentUser.role === 'FINANCE';
  const isAkuntan = currentUser.role === 'AKUNTAN';
  const isFinanceOrAkuntan = isFinance || isAkuntan;
  const isLogistik = currentUser.role === 'LOGISTIK';
  const isSupervisor = currentUser.role === 'SUPERVISOR';
  const allowedBranches = currentUser.allowedBranches && currentUser.allowedBranches.length > 0 
    ? currentUser.allowedBranches 
    : [currentUser.branchCode || 'YM'];

  const navSections: NavSection[] = isLogistik
    ? [
        {
          category: 'MANAJEMEN STOK & INVENTORI',
          items: [
            { id: 'inventori' as NavTab, label: 'Stok & Inventori Cabang & Pusat', icon: <FileSpreadsheet className="w-4 h-4 text-amber-400" /> },
          ],
        },
      ]
    : [
        {
          category: 'KASIR & POINT OF SALES',
          items: [
            { id: 'pos' as NavTab, label: 'Point of Sales (POS)', icon: <ShoppingCart className="w-4 h-4 text-amber-300" />, badge: 'KASIR' },
          ],
        },
        {
          category: 'REGISTRASI & MEDIS',
          items: [
            { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'crm_care' as NavTab, label: 'CRM & Layanan Pasien', icon: <HeartHandshake className="w-4 h-4 text-emerald-400" /> },
            { id: 'pasien', label: 'Data & History Pasien', icon: <Users className="w-4 h-4" />, badge: `${totalPatients}` },
            { id: 'jasa_periksa', label: 'Jasa Periksa', icon: <Stethoscope className="w-4 h-4" /> },
          ],
        },
        {
          category: 'TRANSAKSI PENJUALAN',
          items: [
            { id: 'abd', label: 'Alat Bantu Dengar (ABD)', icon: <Volume2 className="w-4 h-4" /> },
            { id: 'aksesoris', label: 'Aksesoris', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'inventori', label: 'Stok & Inventori', icon: <FileSpreadsheet className="w-4 h-4" /> },
          ],
        },
        {
          category: 'LAPORAN & KAS',
          items: [
            { id: 'uang_masuk', label: 'Dashboard Omset', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'kas_kecil', label: 'Kas Kecil Klinik', icon: <Wallet className="w-4 h-4" /> },
            { id: 'earmould', label: 'Lab Earmould', icon: <Disc className="w-4 h-4" /> },
            { id: 'reparasi', label: 'Reparasi & Service', icon: <Wrench className="w-4 h-4" /> },
          ],
        },
        ...(isCEO ? [{
          category: 'MANAJEMEN HAK AKSES',
          items: [
            { id: 'users' as NavTab, label: 'User & Password Cabang', icon: <ShieldCheck className="w-4 h-4 text-amber-400" /> },
          ],
        }] : []),
      ];

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'pos': return 'Point of Sales (POS) - Kasir & Transaksi Cepat';
      case 'dashboard': return 'Dashboard Overview earsound';
      case 'crm_care': return 'CRM & Layanan Pasien (Customer Care & Follow-Up)';
      case 'pasien': return 'Data Spesifik & Histori Transaksi Pasien';
      case 'aksesoris': return 'Penjualan Aksesoris';
      case 'jasa_periksa': return 'Jasa Periksa Examination';
      case 'abd': return 'Penjualan Alat Bantu Dengar (ABD)';
      case 'uang_masuk': return 'Laporan Omset Pendapatan';
      case 'earmould': return 'Laporan Cetak & Lab Earmould';
      case 'reparasi': return 'Laporan Service & Reparasi';
      case 'kas_kecil': return 'Laporan Kas Kecil (Petty Cash)';
      case 'users': return 'Manajemen Akun User & Password Cabang & Gudang';
      default: return 'Pusat Earsound';
    }
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#181B57] text-indigo-100">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#262C7F] space-y-3">
        <div className="flex items-center justify-between min-h-[42px] py-0.5">
          <EarsoundLogo variant="dark" size="md" />
          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="p-1.5 text-indigo-300 hover:text-[#F5B438] hover:bg-[#252B7C] rounded-lg transition-colors group flex items-center gap-1 cursor-pointer shrink-0"
            title="Pengaturan & Upload Logo Brand"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300 group-hover:text-[#F5B438] transition-colors" />
          </button>
        </div>

        {/* Branch Selector for CEO / Finance / Akuntan / Logistik / Supervisor or Branch badge for Staff */}
        {(isCEO || isLogistik || isFinanceOrAkuntan) ? (
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F5B438]" />
              <span>{isCEO ? 'Filter Cabang (CEO):' : isFinanceOrAkuntan ? 'Filter Cabang (Keuangan):' : 'Akses Cabang (Logistik):'}</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => onSelectBranch(e.target.value as BranchCode)}
              className="w-full bg-[#121544] text-white font-semibold text-xs p-2.5 rounded-xl border border-[#2B3182] focus:outline-none focus:border-[#F5B438] focus:ring-1 focus:ring-[#F5B438] transition-colors"
            >
              <option value="ALL">🌐 Semua 8 Cabang (Pusat)</option>
              {BRANCHES.map((b) => (
                <option key={b.code} value={b.code}>
                  [{b.code}] {b.name}
                </option>
              ))}
            </select>
          </div>
        ) : isSupervisor ? (
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F5B438]" />
              <span>Pilih Cabang (Area SPV):</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => onSelectBranch(e.target.value as BranchCode)}
              className="w-full bg-[#121544] text-white font-semibold text-xs p-2.5 rounded-xl border border-[#2B3182] focus:outline-none focus:border-[#F5B438] focus:ring-1 focus:ring-[#F5B438] transition-colors"
            >
              {BRANCHES.filter(b => allowedBranches.includes(b.code)).map((b) => (
                <option key={b.code} value={b.code}>
                  [{b.code}] {b.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="pt-1">
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-[#121544] text-indigo-100 rounded-xl text-xs font-medium border border-[#2B3182] w-full">
              <Building2 className="w-4 h-4 text-[#F5B438] shrink-0" />
              <span className="truncate">Cabang: {currentUser.branchCode} ({BRANCHES.find(b=>b.code===currentUser.branchCode)?.name})</span>
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin">
        {navSections.map((sec) => (
          <div key={sec.category}>
            <div className="px-3 mb-2 text-[10px] font-bold text-indigo-300/80 uppercase tracking-wider">
              {sec.category}
            </div>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#242A7C] text-white font-bold shadow-xs border-l-4 border-[#F5B438]'
                        : 'text-indigo-100/75 hover:bg-[#252B7C] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={isActive ? 'text-[#F5B438]' : 'text-indigo-300'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-[#F5B438] text-[#181B57]' : 'bg-[#121544] text-indigo-200 border border-[#2B3182]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom User Account Card & Switch Session */}
      <div className="p-4 border-t border-[#262C7F] space-y-2 bg-[#121544]/60">
        <div className="bg-[#121544] rounded-xl p-3 text-xs text-indigo-100 border border-[#2B3182] flex justify-between items-center">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <UserCheck className="w-3.5 h-3.5 text-[#F5B438] shrink-0" />
              <p className="font-bold text-white truncate max-w-[130px]">{currentUser.fullName}</p>
            </div>
            <p className="text-[11px] text-indigo-300 font-mono">@{currentUser.username}</p>
          </div>

          <button
            onClick={onOpenLoginModal}
            className="p-2 bg-[#252B7C] hover:bg-[#32399E] text-white rounded-lg transition-colors cursor-pointer"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 lg:w-72 bg-[#181B57] hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[#262C7F] shadow-sm z-20">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" 
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-64 bg-[#181B57] flex flex-col h-full shadow-xl z-10">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 text-indigo-200 hover:text-white p-1.5 rounded-lg bg-[#252B7C]"
            >
              <X className="w-4 h-4" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Top Header Bar (Only visible on mobile screens for menu drawer toggle) */}
      <header className="flex md:hidden h-14 bg-[#181B57] border-b border-[#262C7F] items-center justify-between px-4 shrink-0 sticky top-0 z-20 text-white">
        <div className="flex items-center space-x-3 overflow-hidden">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-indigo-200 hover:text-white hover:bg-[#252B7C] rounded-xl"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5 text-indigo-200" />
          </button>

          <div className="flex items-center gap-2">
            <EarsoundLogo variant="dark" size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="p-1.5 text-indigo-200 hover:text-[#F5B438] rounded-lg text-xs"
            title="Pengaturan Logo"
          >
            <Sparkles className="w-4 h-4 text-[#F5B438]" />
          </button>
          {onAddPatient && !isLogistik && (
            <button
              onClick={onAddPatient}
              className="px-3.5 py-1.5 bg-[#F5B438] hover:bg-[#EEA32F] text-[#181B57] rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>+ Pasien</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile & Tablet Quick Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#181B57]/95 backdrop-blur-md border-t border-[#262C7F] z-30 px-1.5 py-1.5 flex items-center justify-around w-full max-w-full">
        {isLogistik ? (
          <>
            <button
              onClick={() => setActiveTab('inventori')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'inventori' ? 'text-[#F5B438] bg-[#242A7C]' : 'text-indigo-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 mb-0.5" />
              <span className="text-[11px]">Stok & Inventori</span>
            </button>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-xs font-medium text-indigo-200"
            >
              <Menu className="w-4 h-4 mb-0.5" />
              <span className="text-[11px]">Menu Logistik</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'pos' ? 'text-[#F5B438] bg-[#242A7C]' : 'text-indigo-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mb-0.5" />
              <span>Kasir</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'dashboard' ? 'text-[#F5B438] bg-[#242A7C]' : 'text-indigo-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('pasien')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'pasien' ? 'text-[#F5B438] bg-[#242A7C]' : 'text-indigo-200'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span>Pasien</span>
            </button>

            <button
              onClick={() => setActiveTab('abd')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'abd' ? 'text-[#F5B438] bg-[#242A7C]' : 'text-indigo-200'
              }`}
            >
              <Volume2 className="w-4 h-4 mb-0.5" />
              <span>ABD</span>
            </button>

            <button
              onClick={() => setActiveTab('uang_masuk')}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'uang_masuk' ? 'text-[#F5B438] bg-[#242A7C]' : 'text-indigo-200'
              }`}
            >
              <DollarSign className="w-4 h-4 mb-0.5" />
              <span>Laporan</span>
            </button>

            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-medium text-indigo-200"
            >
              <Menu className="w-4 h-4 mb-0.5" />
              <span>Menu</span>
            </button>
          </>
        )}
      </div>

      {/* Brand Logo Upload & Customizer Modal */}
      <BrandLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />
    </>
  );
};


