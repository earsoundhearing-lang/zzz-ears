import React, { useState, useMemo } from 'react';
import { EarsoundLogo } from './Common/EarsoundLogo';
import { NavTab } from './Header';
import { 
  Patient, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  KasKecilEntry,
  EarmouldReport,
  ReparasiService,
  ABDInventoryEntry,
  AksesorisInventoryEntry,
  AppUser,
  BranchCode
} from '../types';
import { BRANCHES } from '../utils/branches';
import { formatRupiah, formatIndoDate, getTodayDateString, parseDateParts, isSalesTransaction } from '../utils/formatters';
import { 
  Users, 
  ShoppingBag, 
  Stethoscope, 
  Volume2, 
  DollarSign, 
  Wallet, 
  ArrowRight, 
  UserPlus, 
  Activity, 
  CheckCircle2, 
  Disc,
  BarChart3,
  PieChart as PieIcon,
  Building2,
  Calendar,
  ShoppingCart,
  Clock,
  Package,
  Share2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';

import { BranchPerformanceSection } from './Dashboard/BranchPerformanceSection';
import { BranchTargetAchievementSection } from './Dashboard/BranchTargetAchievementSection';
import { StockConditionSection } from './Dashboard/StockConditionSection';
import { OutstandingWorkSection } from './Dashboard/OutstandingWorkSection';
import { ReferalBreakdownSection } from './Dashboard/ReferalBreakdownSection';
import { ProductSalesBreakdownSection } from './Dashboard/ProductSalesBreakdownSection';

interface DashboardOverviewProps {
  setActiveTab: (tab: NavTab) => void;
  patients: Patient[];
  aksesoris: AksesorisTransaction[];
  jasaPeriksa: JasaPeriksaTransaction[];
  abd: ABDTransaction[];
  kasKecil: KasKecilEntry[];
  earmould?: EarmouldReport[];
  reparasi?: ReparasiService[];
  allPatients?: Patient[];
  allAksesoris?: AksesorisTransaction[];
  allJasaPeriksa?: JasaPeriksaTransaction[];
  allABD?: ABDTransaction[];
  allEarmould?: EarmouldReport[];
  allReparasi?: ReparasiService[];
  inventoryABD?: ABDInventoryEntry[];
  inventoryAksesoris?: AksesorisInventoryEntry[];
  currentUser?: AppUser;
  selectedBranch?: BranchCode;
  onAddPatient: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  setActiveTab,
  patients = [],
  aksesoris = [],
  jasaPeriksa = [],
  abd = [],
  kasKecil = [],
  earmould = [],
  reparasi = [],
  allPatients = [],
  allAksesoris = [],
  allJasaPeriksa = [],
  allABD = [],
  allEarmould = [],
  allReparasi = [],
  inventoryABD = [],
  inventoryAksesoris = [],
  currentUser,
  selectedBranch = 'ALL',
  onAddPatient,
}) => {
  const safeAksesoris = aksesoris || [];
  const safeJasaPeriksa = jasaPeriksa || [];
  const safeABD = abd || [];
  const safeKasKecil = kasKecil || [];
  const safeEarmould = earmould || [];
  const safeReparasi = reparasi || [];

  const [dateFilter, setDateFilter] = useState<'all'|'today'|'week'|'month'|'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filtering function
  const isDateInRange = (dateStr: string) => {
    if (dateFilter === 'all') return true;
    if (!dateStr) return false;
    
    const parsed = parseDateParts(dateStr);
    if (!parsed) return false;

    const { year, month, day } = parsed;
    const targetDate = new Date(year, month, day);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (dateFilter === 'today') {
      const todayStr = getTodayDateString();
      const cleanDateStr = String(dateStr).split('T')[0].trim();
      return cleanDateStr === todayStr;
    }
    
    if (dateFilter === 'week') {
      const todayZero = new Date(currentYear, currentMonth, today.getDate());
      const weekAgo = new Date(todayZero);
      weekAgo.setDate(todayZero.getDate() - 7);
      return targetDate >= weekAgo && targetDate <= todayZero;
    }
    
    if (dateFilter === 'month') {
      return year === currentYear && month === currentMonth;
    }
    
    if (dateFilter === 'custom') {
      if (!customStartDate || !customEndDate) return true;
      const startParts = parseDateParts(customStartDate);
      const endParts = parseDateParts(customEndDate);
      if (!startParts || !endParts) return true;
      const start = new Date(startParts.year, startParts.month, startParts.day, 0, 0, 0);
      const end = new Date(endParts.year, endParts.month, endParts.day, 23, 59, 59);
      return targetDate >= start && targetDate <= end;
    }
    
    return true;
  };

  const filteredAksesoris = useMemo(() => safeAksesoris.filter(i => isSalesTransaction(i) && isDateInRange(i.tanggal)), [safeAksesoris, dateFilter, customStartDate, customEndDate]);
  const filteredJasaPeriksa = useMemo(() => safeJasaPeriksa.filter(i => isSalesTransaction(i) && isDateInRange(i.tanggal)), [safeJasaPeriksa, dateFilter, customStartDate, customEndDate]);
  const filteredABD = useMemo(() => safeABD.filter(i => isSalesTransaction(i) && isDateInRange(i.tanggal)), [safeABD, dateFilter, customStartDate, customEndDate]);
  const filteredKasKecil = useMemo(() => safeKasKecil.filter(i => isDateInRange(i.tanggal)), [safeKasKecil, dateFilter, customStartDate, customEndDate]);
  const filteredEarmould = useMemo(() => safeEarmould.filter(i => isDateInRange(i.tanggalCetak || i.tanggalOrder || '')), [safeEarmould, dateFilter, customStartDate, customEndDate]);
  const filteredReparasi = useMemo(() => safeReparasi.filter(i => isDateInRange(i.tanggalMasuk || '')), [safeReparasi, dateFilter, customStartDate, customEndDate]);
  const filteredPatients = useMemo(() => patients.filter(i => isDateInRange(i.createdAt)), [patients, dateFilter, customStartDate, customEndDate]);

  // Calculations for Filtered Period
  const totalAksesorisOmset = filteredAksesoris.reduce((acc, curr) => acc + (curr?.jumlah || 0), 0);
  const totalJasaOmset = filteredJasaPeriksa.reduce((acc, curr) => acc + (curr?.biayaJasaPeriksa || 0), 0);
  const totalAbdOmset = filteredABD.reduce((acc, curr) => acc + (curr?.jumlah || 0), 0);
  const totalOmset = totalAksesorisOmset + totalJasaOmset + totalAbdOmset;
  const totalTxCount = filteredAksesoris.length + filteredJasaPeriksa.length + filteredABD.length;

  // Real-time "Hari Ini" calculations
  const todayStr = getTodayDateString();
  const isTodayDate = (d?: string) => {
    if (!d) return false;
    const cleanD = String(d).split('T')[0].trim();
    return cleanD === todayStr;
  };

  const todayAksesoris = useMemo(() => safeAksesoris.filter(i => isSalesTransaction(i) && isTodayDate(i.tanggal)), [safeAksesoris]);
  const todayJasa = useMemo(() => safeJasaPeriksa.filter(i => isSalesTransaction(i) && isTodayDate(i.tanggal)), [safeJasaPeriksa]);
  const todayABD = useMemo(() => safeABD.filter(i => isSalesTransaction(i) && isTodayDate(i.tanggal)), [safeABD]);
  const todayPatients = useMemo(() => patients.filter(i => isTodayDate(i.createdAt)), [patients]);

  const todayTxCount = todayAksesoris.length + todayJasa.length + todayABD.length;
  const todayAksesorisOmset = todayAksesoris.reduce((acc, curr) => acc + (curr?.jumlah || 0), 0);
  const todayJasaOmset = todayJasa.reduce((acc, curr) => acc + (curr?.biayaJasaPeriksa || 0), 0);
  const todayAbdOmset = todayABD.reduce((acc, curr) => acc + (curr?.jumlah || 0), 0);
  const todayOmset = todayAksesorisOmset + todayJasaOmset + todayAbdOmset;

  // Active branch label
  const isHQ = currentUser?.branchCode === 'HQ' || currentUser?.role === 'CEO' || currentUser?.branchCode === 'ALL';
  const activeBranchName = isHQ 
    ? (selectedBranch === 'ALL' ? 'Semua 8 Cabang (Konsolidasi Pusat)' : `Cabang ${BRANCHES.find(b=>b.code===selectedBranch)?.name || selectedBranch}`)
    : `Cabang ${BRANCHES.find(b=>b.code===currentUser?.branchCode)?.name || currentUser?.branchCode}`;

  // Compute latest petty cash balance
  let currentKasBalance = 0;
  [...filteredKasKecil]
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .forEach((e) => {
      currentKasBalance = currentKasBalance + (e.penambahanKas || 0) - (e.pengeluaran || 0);
    });

  // Data for Category Revenue Pie Chart
  const categoryRevenueData = [
    { name: 'Alat Bantu Dengar (ABD)', value: totalAbdOmset, color: '#23277A' },
    { name: 'Aksesoris & Baterai', value: totalAksesorisOmset, color: '#FFB800' },
    { name: 'Jasa Periksa Audiometri', value: totalJasaOmset, color: '#0D9488' },
  ].filter((item) => item.value > 0);

  // Daily Revenue Trend Data for Area Chart
  const datesMap: { [date: string]: number } = {};
  [...filteredAksesoris, ...filteredJasaPeriksa, ...filteredABD].forEach((item) => {
    const d = item.tanggal;
    const amount = 'jumlah' in item ? item.jumlah : 'biayaJasaPeriksa' in item ? item.biayaJasaPeriksa : 0;
    datesMap[d] = (datesMap[d] || 0) + amount;
  });

  const revenueTrendData = Object.keys(datesMap)
    .sort()
    .map((date) => ({
      tanggal: date.slice(5),
      omset: datesMap[date],
    }));

  // Recent transactions
  const recentActivities = [
    ...filteredAksesoris.map((a) => ({
      id: a.id,
      tanggal: a.tanggal,
      title: `Pembelian Aksesoris (${a.category})`,
      subtitle: `${a.namaCustomer} - Qty: ${a.qty}`,
      amount: a.jumlah,
      type: 'Aksesoris',
    })),
    ...filteredJasaPeriksa.map((j) => {
      const jpName = Array.isArray(j.jenisPemeriksaan) ? j.jenisPemeriksaan[0] : (j.jenisPemeriksaan || 'Periksa');
      return {
        id: j.id,
        tanggal: j.tanggal,
        title: `Jasa Periksa (${jpName})`,
        subtitle: `${j.namaCustomer} - Audiometris: ${j.audiometris}`,
        amount: j.biayaJasaPeriksa,
        type: 'Jasa',
      };
    }),
    ...filteredABD.map((b) => ({
      id: b.id,
      tanggal: b.tanggal,
      title: `Penjualan ABD (${b.tipeABD})`,
      subtitle: `${b.namaPasien} - Fitting: ${b.fittingType}`,
      amount: b.jumlah,
      type: 'ABD',
    })),
  ]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner - Earsound Brand Styled */}
      <div className="bg-[#181B57] text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden border border-[#2B3182]">
        <div className="relative z-10 max-w-3xl space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#23277A] text-[#F5B438] border border-[#3A42A8] rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F5B438]" />
              <span>Sistem Manajemen Klinik Earsound</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#121544] text-indigo-100 border border-[#2B3182] rounded-full text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-[#F5B438]" />
              <span>{activeBranchName}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            Dashboard Manajemen Operasional & Penjualan
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
            Ringkasan harian dan performa periode untuk transaksi kasir, omset uang masuk, pasien, layanan audiometri, stok inventori, serta status order lab dan servis.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F5B438] hover:bg-[#e0a22a] text-[#181B57] font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-[#181B57]" />
              <span>Buka Kasir POS</span>
            </button>

            <button
              onClick={onAddPatient}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#23277A] hover:bg-[#2e339c] text-white font-bold text-xs rounded-xl border border-[#3A42A8] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#F5B438]" />
              <span>+ Registrasi Pasien</span>
            </button>

            <button
              onClick={() => setActiveTab('uang_masuk')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#121544]/80 hover:bg-[#121544] text-indigo-200 hover:text-white font-medium text-xs rounded-xl border border-[#2B3182] transition-all cursor-pointer"
            >
              <span>Laporan Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F5B438]" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter Controls - Minimalist Segmented Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs w-full max-w-full">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 font-medium w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">Filter Periode:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {(['all', 'today', 'week', 'month', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDateFilter(mode)}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  dateFilter === mode 
                    ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {mode === 'all' && 'Semua'}
                {mode === 'today' && 'Hari Ini'}
                {mode === 'week' && '7 Hari'}
                {mode === 'month' && 'Bulan Ini'}
                {mode === 'custom' && 'Kustom'}
              </button>
            ))}
          </div>
        </div>
        
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-800 text-slate-800 bg-white"
            />
            <span className="text-slate-400 font-normal text-xs">s/d</span>
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-800 text-slate-800 bg-white"
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. KEY MANAGEMENT QUESTIONS 1 - 4: EXECUTIVE KPI MATRIX   */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#23277A]" />
              <span>Ringkasan Transaksi & Keuangan</span>
            </h2>
            <p className="text-xs text-slate-500 font-normal">Metrik operasional kasir, uang masuk, pasien, dan kas kecil</p>
          </div>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Periode: {dateFilter === 'today' ? 'Hari Ini' : dateFilter === 'all' ? 'Semua Waktu' : 'Filter Aktif'}
          </span>
        </div>

        {/* 4 Main Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Transaksi Hari Ini & Periode */}
          <div 
            onClick={() => setActiveTab('uang_masuk')}
            className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-400 hover:bg-white transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">1. Transaksi Hari Ini</span>
              <div className="p-2 bg-slate-900 text-white rounded-lg">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{todayTxCount}</span>
                <span className="text-xs text-slate-500 font-medium">Transaksi Hari Ini</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 flex justify-between">
                <span>Total Periode:</span>
                <span className="font-semibold text-slate-900">{totalTxCount} Transaksi</span>
              </div>
            </div>
          </div>

          {/* Card 2: Uang Masuk Hari Ini & Total */}
          <div 
            onClick={() => setActiveTab('uang_masuk')}
            className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-[#23277A] hover:bg-white transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">2. Uang Masuk</span>
              <div className="p-2 bg-[#23277A] text-white rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-[#23277A]">{formatRupiah(todayOmset)}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Uang Masuk Hari Ini</span>
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 flex justify-between">
                <span>Total Periode:</span>
                <span className="font-semibold text-[#23277A]">{formatRupiah(totalOmset)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Jumlah Pasien */}
          <div 
            onClick={() => setActiveTab('pasien')}
            className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-400 hover:bg-white transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">3. Jumlah Pasien</span>
              <div className="p-2 bg-slate-900 text-white rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{patients.length}</span>
                <span className="text-xs text-slate-500 font-medium">Total Terdaftar</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 flex justify-between">
                <span>Pasien Baru Hari Ini:</span>
                <span className="font-semibold text-slate-900">+{todayPatients.length} Pasien</span>
              </div>
            </div>
          </div>

          {/* Card 4: Saldo Kas Kecil Operasional */}
          <div 
            onClick={() => setActiveTab('kas_kecil')}
            className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-400 hover:bg-white transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">4. Kas Kecil Klinik</span>
              <div className="p-2 bg-slate-800 text-white rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatRupiah(currentKasBalance)}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Saldo Terkini</span>
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 flex justify-between">
                <span>Status Kas:</span>
                <span className="font-semibold text-slate-800">Operasional</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BREAKDOWN KUANTITAS: PEMERIKSAAN, PENJUALAN ABD & AKSESORIS */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Breakdown Kategori Layanan & Produk
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Pemeriksaan Jasa */}
            <div 
              onClick={() => setActiveTab('jasa_periksa')}
              className="p-4 bg-slate-50/60 hover:bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Pemeriksaan Audiometri</span>
                    <span className="text-[11px] text-slate-500 font-normal">Jasa Tes Pendengaran</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900 block">{filteredJasaPeriksa.length} Sesi</span>
                  <span className="text-xs font-medium text-slate-600">{formatRupiah(totalJasaOmset)}</span>
                </div>
              </div>
            </div>

            {/* Penjualan ABD */}
            <div 
              onClick={() => setActiveTab('abd')}
              className="p-4 bg-slate-50/60 hover:bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Penjualan ABD</span>
                    <span className="text-[11px] text-slate-500 font-normal">Unit Hearing Aid</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900 block">{filteredABD.length} Unit</span>
                  <span className="text-xs font-medium text-slate-600">{formatRupiah(totalAbdOmset)}</span>
                </div>
              </div>
            </div>

            {/* Penjualan Aksesoris */}
            <div 
              onClick={() => setActiveTab('aksesoris')}
              className="p-4 bg-slate-50/60 hover:bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Penjualan Aksesoris</span>
                    <span className="text-[11px] text-slate-500 font-normal">Baterai & Sparepart</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-900 block">{filteredAksesoris.length} Transaksi</span>
                  <span className="text-xs font-medium text-slate-600">{formatRupiah(totalAksesorisOmset)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TARGET EARSOUND 2026 BULANAN SETIAP CABANG               */}
      {/* ======================================================== */}
      <BranchTargetAchievementSection
        allAksesoris={allAksesoris.length > 0 ? allAksesoris : safeAksesoris}
        allJasaPeriksa={allJasaPeriksa.length > 0 ? allJasaPeriksa : safeJasaPeriksa}
        allABD={allABD.length > 0 ? allABD : safeABD}
        activeBranchFilter={selectedBranch}
      />

      {/* ======================================================== */}
      {/* 2. QUESTION 9: PERFORMA & PERBANDINGAN 8 CABANG EARSOUND */}
      {/* ======================================================== */}
      <BranchPerformanceSection
        allPatients={filteredPatients}
        allAksesoris={filteredAksesoris}
        allJasaPeriksa={filteredJasaPeriksa}
        allABD={filteredABD}
        allEarmould={filteredEarmould}
        allReparasi={filteredReparasi}
        activeBranchFilter={selectedBranch}
      />

      {/* ======================================================== */}
      {/* 3. QUESTION 8: PEKERJAAN SERVICE / LAB OUTSTANDING       */}
      {/* ======================================================== */}
      <OutstandingWorkSection
        earmould={filteredEarmould}
        reparasi={filteredReparasi}
        setActiveTab={setActiveTab}
      />

      {/* ======================================================== */}
      {/* 4. QUESTION 7: KONDISI & KESEHATAN STOK INVENTORI        */}
      {/* ======================================================== */}
      <StockConditionSection
        inventoryABD={inventoryABD}
        inventoryAksesoris={inventoryAksesoris}
        setActiveTab={setActiveTab}
      />

      {/* ======================================================== */}
      {/* 5. QUESTIONS 5 & 6: PERSENTASE REFERAL & PRODUK TERJUAL   */}
      {/* ======================================================== */}
      <div className="space-y-6">
        {/* 5. Persentase Sumber Referal & Analisis Efektivitas Marketing */}
        <ReferalBreakdownSection
          patients={filteredPatients}
          jasaPeriksa={filteredJasaPeriksa}
          abd={filteredABD}
          aksesoris={filteredAksesoris}
          earmould={filteredEarmould}
          reparasi={filteredReparasi}
        />

        {/* 6. Persentase Produk Fisik Terjual */}
        <ProductSalesBreakdownSection
          aksesoris={filteredAksesoris}
          abd={filteredABD}
        />
      </div>

      {/* ======================================================== */}
      {/* 6. CHARTS & RECENT TRANSACTIONS STREAM                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Trend Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#23277A]" />
                <span>Grafik Trend Pendapatan Harian</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal">Perkembangan transaksi penjualan & jasa per hari</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              Trend Real-time
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23277A" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#23277A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  formatter={(val: any) => [formatRupiah(Number(val)), 'Pendapatan']}
                  labelFormatter={(lbl) => `Tanggal: ${lbl}`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                />
                <Area type="monotone" dataKey="omset" stroke="#23277A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOmset)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Feed Transaksi Terakhir */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Aktivitas Transaksi Terakhir</h3>
              <p className="text-xs text-slate-500 font-normal">Aktivitas penjualan & jasa terbaru</p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              5 Terbaru
            </span>
          </div>

          <div className="space-y-2.5">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada riwayat transaksi.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{act.title}</span>
                      <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">{act.type}</span>
                    </div>
                    <span className="text-slate-500 block text-[11px] mt-0.5">{act.subtitle}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{formatIndoDate(act.tanggal)}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">{formatRupiah(act.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

