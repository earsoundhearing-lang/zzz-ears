import React, { useState, useMemo, useEffect } from 'react';
import { 
  AppUser, 
  BranchCode, 
  ABDTransaction, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  KasKecilEntry, 
  ManualJournalEntry,
  DoctorFeeRecord,
  WakproSharingRecord,
  MaindealerB2BTransaction,
  MaindealerSupplyTransaction
} from '../../types';
import { BRANCHES } from '../../utils/branches';
import { 
  canAccessFinancialStatement, 
  canManageFinancialBooks,
  getFinancialJournals,
  saveFinancialJournals,
  getDoctorFeeOverrides,
  saveDoctorFeeOverrides,
  getMaindealerB2B,
  saveMaindealerB2B,
  getMaindealerSupply,
  saveMaindealerSupply
} from '../../utils/storage';
import { calculateFinancialStatements } from '../../utils/financialCalculations';
import { BalanceSheetView } from './BalanceSheetView';
import { ProfitLossView } from './ProfitLossView';
import { CashFlowView } from './CashFlowView';
import { EquityChangesView } from './EquityChangesView';
import { DoctorFeeAndWakproView } from './DoctorFeeAndWakproView';
import { MaindealerB2BView } from './MaindealerB2BView';
import { GeneralLedgerView } from './GeneralLedgerView';
import { COAView } from './COAView';
import { 
  Scale, 
  TrendingUp, 
  Wallet, 
  Layers, 
  Stethoscope, 
  Building2, 
  BookOpen, 
  FolderTree, 
  ShieldAlert, 
  Filter, 
  Calendar,
  Building,
  RefreshCw
} from 'lucide-react';

interface FinancialDashboardProps {
  currentUser: AppUser | null;
  abdList: ABDTransaction[];
  aksesorisList: AksesorisTransaction[];
  jasaPeriksaList: JasaPeriksaTransaction[];
  kasKecilList: KasKecilEntry[];
  initialBranch?: BranchCode | 'ALL';
}

type FinancialTab = 
  | 'BALANCE_SHEET'
  | 'PROFIT_LOSS'
  | 'CASH_FLOW'
  | 'EQUITY_CHANGES'
  | 'DOCTOR_FEE'
  | 'MAINDEALER'
  | 'GENERAL_LEDGER'
  | 'COA';

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  currentUser,
  abdList = [],
  aksesorisList = [],
  jasaPeriksaList = [],
  kasKecilList = [],
  initialBranch = 'ALL',
}) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchCode | 'ALL'>(initialBranch);
  const [activeTab, setActiveTab] = useState<FinancialTab>('BALANCE_SHEET');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'MONTH' | 'YEAR'>('ALL');

  // Stored state for financial modules
  const [journals, setJournals] = useState<ManualJournalEntry[]>([]);
  const [doctorOverrides, setDoctorOverrides] = useState<Record<string, any>>({});
  const [b2bList, setB2BList] = useState<MaindealerB2BTransaction[]>([]);
  const [supplyList, setSupplyList] = useState<MaindealerSupplyTransaction[]>([]);

  // Load persistent financial data
  useEffect(() => {
    setJournals(getFinancialJournals());
    setDoctorOverrides(getDoctorFeeOverrides());
    setB2BList(getMaindealerB2B());
    setSupplyList(getMaindealerSupply());
  }, []);

  const hasAccess = canAccessFinancialStatement(currentUser);
  const canManage = canManageFinancialBooks(currentUser);

  // Period Date Range determination
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (periodFilter === 'MONTH') {
      const start = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const end = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return { startDate: start, endDate: end, periodLabel: `Bulan ${monthNames[currentMonth]} ${currentYear}` };
    }

    if (periodFilter === 'YEAR') {
      const start = `${currentYear}-01-01`;
      const end = `${currentYear}-12-31`;
      return { startDate: start, endDate: end, periodLabel: `Tahun ${currentYear}` };
    }

    return { startDate: undefined, endDate: undefined, periodLabel: 'Semua Periode (Akumulatif SAK)' };
  }, [periodFilter]);

  // Compute Full Financial Statements
  const financialReport = useMemo(() => {
    return calculateFinancialStatements({
      branchCode: selectedBranch,
      startDate,
      endDate,
      periodLabel,
      abdList,
      aksesorisList,
      jasaPeriksaList,
      kasKecilList,
      manualJournals: journals,
      b2bList,
      doctorFeeOverrides: doctorOverrides,
    });
  }, [selectedBranch, startDate, endDate, periodLabel, abdList, aksesorisList, jasaPeriksaList, kasKecilList, journals, b2bList, doctorOverrides]);

  // Handlers for Doctor Fee & Wakpro
  const handleUpdateDoctorFee = (
    id: string, 
    updates: { percentageOption?: 10 | 15; status?: 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR'; tanggalDibayar?: string; noBukti?: string; metodePembayaran?: any }
  ) => {
    setDoctorOverrides(prev => {
      const next = {
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          ...updates,
        }
      };
      saveDoctorFeeOverrides(next);
      return next;
    });
  };

  const handleUpdateWakpro = (
    id: string,
    updates: { isPaid?: boolean; tanggalDibayar?: string; isBeraJambiHospitalPaid?: boolean }
  ) => {
    setDoctorOverrides(prev => {
      const next = {
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          ...updates,
        }
      };
      saveDoctorFeeOverrides(next);
      return next;
    });
  };

  // Handlers for B2B & Maindealer
  const handleAddB2B = (tx: MaindealerB2BTransaction) => {
    setB2BList(prev => {
      const next = [tx, ...prev];
      saveMaindealerB2B(next);
      return next;
    });
  };

  const handleUpdateB2BStatus = (id: string, status: 'LUNAS' | 'PIUTANG_BERJALAN' | 'JATUH_TEMPO') => {
    setB2BList(prev => {
      const next = prev.map(item => item.id === id ? { ...item, status } : item);
      saveMaindealerB2B(next);
      return next;
    });
  };

  const handleAddSupply = (tx: MaindealerSupplyTransaction) => {
    setSupplyList(prev => {
      const next = [tx, ...prev];
      saveMaindealerSupply(next);
      return next;
    });
  };

  const handleUpdateSupplyStatus = (id: string, status: 'BELUM_LUNAS' | 'LUNAS' | 'KONSINYASI_TERPAJANG') => {
    setSupplyList(prev => {
      const next = prev.map(item => item.id === id ? { ...item, statusPembayaran: status } : item);
      saveMaindealerSupply(next);
      return next;
    });
  };

  // Handlers for Manual Journals
  const handleAddJournal = (entry: ManualJournalEntry) => {
    setJournals(prev => {
      const next = [entry, ...prev];
      saveFinancialJournals(next);
      return next;
    });
  };

  const handleDeleteJournal = (id: string) => {
    setJournals(prev => {
      const next = prev.filter(j => j.id !== id);
      saveFinancialJournals(next);
      return next;
    });
  };

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Akses Terbatas: Financial Statement</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Menu Financial Statement hanya dapat diakses oleh akun <strong>Finance</strong> dan <strong>Akuntan</strong>, serta dipantau oleh akun <strong>CEO</strong>.
          </p>
          <div className="mt-6 text-xs text-slate-400">
            Akun Anda saat ini login sebagai: <span className="font-semibold text-slate-700">{currentUser?.fullName || currentUser?.username} ({currentUser?.role})</span>
          </div>
        </div>
      </div>
    );
  }

  const navTabs: Array<{ id: FinancialTab; label: string; icon: React.FC<any>; count?: number }> = [
    { id: 'BALANCE_SHEET', label: 'Neraca (Balance Sheet)', icon: Scale },
    { id: 'PROFIT_LOSS', label: 'Laba Rugi (P/L)', icon: TrendingUp },
    { id: 'CASH_FLOW', label: 'Arus Kas (Cash Flow)', icon: Wallet },
    { id: 'EQUITY_CHANGES', label: 'Perubahan Modal', icon: Layers },
    { id: 'DOCTOR_FEE', label: 'Utang Fee Dokter & Wakpro', icon: Stethoscope, count: (financialReport?.doctorFeeRecords || []).filter(f => f.status === 'BELUM_DIBAYAR').length },
    { id: 'MAINDEALER', label: 'Maindealer & B2B Hub', icon: Building2 },
    { id: 'GENERAL_LEDGER', label: 'Buku Besar & Jurnal', icon: BookOpen, count: journals.length },
    { id: 'COA', label: 'Bagan Akun (COA)', icon: FolderTree },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-[#1E2368] via-[#2A2F86] to-[#3B41A3] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-lg text-[11px] font-bold tracking-wide uppercase text-indigo-100">
                EARSOUND FINANCIAL STATEMENTS • SAK COMPLIANT
              </span>
              {currentUser?.role === 'CEO' && (
                <span className="px-2.5 py-1 bg-amber-400/20 text-amber-200 border border-amber-300/30 rounded-lg text-[11px] font-semibold">
                  Mode Pemantauan CEO
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-2">
              Laporan Keuangan Terpadu & Multi-Cabang
            </h1>
            <p className="text-indigo-100/80 text-xs mt-1 max-w-2xl">
              Neraca, Laba Rugi, Arus Kas, Perubahan Modal, Rekap Fee Dokter, Distribusi Maindealer, dan Buku Besar Standar Akuntansi Keuangan.
            </p>
          </div>

          {/* Filter Controls (Branch & Period) */}
          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/15">
            {/* Branch Selector */}
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-200" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as BranchCode | 'ALL')}
                className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-xs"
              >
                <option value="ALL">🌐 Seluruh Cabang (Konsolidasi)</option>
                <option value="HQ">🏢 HQ - Kantor Pusat</option>
                {BRANCHES.map(b => (
                  <option key={b.code} value={b.code}>
                    📍 {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-200" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-xs"
              >
                <option value="ALL">Semua Periode</option>
                <option value="MONTH">Bulan Berjalan</option>
                <option value="YEAR">Tahun 2026</option>
              </select>
            </div>
          </div>
        </div>

        {/* CEO Monitoring Alert Note */}
        {currentUser?.role === 'CEO' && (
          <div className="mt-4 pt-3 border-t border-white/10 text-[11.5px] text-indigo-100/90 flex items-center justify-between">
            <span>ℹ️ Akun CEO memiliki hak akses penuh untuk memantau performa keuangan setiap cabang secara real-time.</span>
            <span className="font-mono text-xs opacity-75">Terkoreksi Otomatis</span>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-[#2A2F86] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab View Render */}
      <div>
        {activeTab === 'BALANCE_SHEET' && (
          <BalanceSheetView report={financialReport} />
        )}

        {activeTab === 'PROFIT_LOSS' && (
          <ProfitLossView report={financialReport} />
        )}

        {activeTab === 'CASH_FLOW' && (
          <CashFlowView report={financialReport} />
        )}

        {activeTab === 'EQUITY_CHANGES' && (
          <EquityChangesView report={financialReport} />
        )}

        {activeTab === 'DOCTOR_FEE' && (
          <DoctorFeeAndWakproView
            doctorFees={financialReport?.doctorFeeRecords || []}
            wakproSharings={financialReport?.wakproSharingRecords || []}
            onUpdateDoctorFee={handleUpdateDoctorFee}
            onUpdateWakpro={handleUpdateWakpro}
            selectedBranch={selectedBranch}
            canManage={canManage}
          />
        )}

        {activeTab === 'MAINDEALER' && (
          <MaindealerB2BView
            b2bTransactions={b2bList}
            supplyTransactions={supplyList}
            onAddB2B={handleAddB2B}
            onUpdateB2BStatus={handleUpdateB2BStatus}
            onAddSupply={handleAddSupply}
            onUpdateSupplyStatus={handleUpdateSupplyStatus}
            canManage={canManage}
          />
        )}

        {activeTab === 'GENERAL_LEDGER' && (
          <GeneralLedgerView
            journals={journals}
            onAddJournal={handleAddJournal}
            onDeleteJournal={handleDeleteJournal}
            selectedBranch={selectedBranch}
            canManage={canManage}
            currentUser={currentUser?.fullName || currentUser?.username || 'Finance'}
          />
        )}

        {activeTab === 'COA' && (
          <COAView />
        )}
      </div>
    </div>
  );
};
