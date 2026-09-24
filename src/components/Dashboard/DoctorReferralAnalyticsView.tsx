import React, { useState, useMemo } from 'react';
import { Patient } from '../../types';
import { formatRupiah, formatIndoDate } from '../../utils/formatters';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Stethoscope, 
  Building2, 
  Search, 
  X, 
  Award, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  CheckCircle2, 
  ChevronRight, 
  Filter, 
  PieChart as PieIcon, 
  BarChart3, 
  Layers, 
  MapPin, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export interface DoctorChannelItem {
  key: string;
  name: string;
  category: 'Dokter & RS';
  doctorName?: string;
  hospitalName?: string;
  patientCount: number;
  salesCount: number;
  totalOmset: number;
  aov: number;
  conversionRate: number;
  color: string;
  patientsList: {
    patient: Patient;
    spending: number;
    transactions: Array<{
      type: string;
      fakturOrId: string;
      date: string;
      amount: number;
      label: string;
      branchCode?: string;
    }>;
  }[];
  monthlyStats: { [monthKey: string]: { omset: number; sales: number; patients: number } };
}

interface DoctorReferralAnalyticsViewProps {
  doctorChannelsList: DoctorChannelItem[];
  grandTotalOmset: number;
  metricMode: 'omset' | 'sales' | 'patients' | 'aov';
  onSelectDoctor: (ch: DoctorChannelItem) => void;
  selectedMonthLabel?: string;
  onOpenMeetingReport?: () => void;
}

type DoctorChartViewType = 'bar' | 'donut' | 'region' | 'tier';
type DoctorRegionFilter = 'ALL' | 'SU' | 'JB' | 'PB' | 'BT' | 'PK' | 'LS' | 'BJ' | 'ST';

const PALETTE_COLORS = [
  '#23277A', '#0D9488', '#F59E0B', '#6366F1', '#EC4899', 
  '#0284C7', '#8B5CF6', '#10B981', '#E11D48', '#D97706',
  '#3B82F6', '#14B8A6', '#6D28D9', '#BE185D', '#047857'
];

export const DoctorReferralAnalyticsView: React.FC<DoctorReferralAnalyticsViewProps> = ({
  doctorChannelsList = [],
  grandTotalOmset,
  metricMode,
  onSelectDoctor,
  selectedMonthLabel = 'Semua Periode',
  onOpenMeetingReport,
}) => {
  // View states
  const [chartView, setChartView] = useState<DoctorChartViewType>('bar');
  const [barLimit, setBarLimit] = useState<10 | 15 | 25 | 100>(10);
  const [regionFilter, setRegionFilter] = useState<DoctorRegionFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ZERO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract region from doctor name or hospital (e.g. "(SU)", "(JB)", "Medan", "Jambi")
  const extractRegion = (docName: string, hospName?: string): string => {
    const text = `${docName} ${hospName || ''}`.toUpperCase();
    if (text.includes('(SU)') || text.includes('SUMUT') || text.includes('MEDAN')) return 'SU';
    if (text.includes('(JB)') || text.includes('JAMBI')) return 'JB';
    if (text.includes('(PB)') || text.includes('PADANG') || text.includes('BULAN')) return 'PB';
    if (text.includes('(BT)') || text.includes('BATAM') || text.includes('BETAHIVE')) return 'BT';
    if (text.includes('(PK)') || text.includes('PAKAM') || text.includes('PEKANBARU')) return 'PK';
    if (text.includes('(LS)') || text.includes('LANGSA') || text.includes('LAMPUNG')) return 'LS';
    if (text.includes('(BJ)') || text.includes('BINJAI')) return 'BJ';
    if (text.includes('(ST)') || text.includes('SIANTAR')) return 'ST';
    return 'SU'; // Default to SU for local doctors
  };

  // Helper to get region badge label
  const getRegionBadge = (regionCode: string) => {
    const map: Record<string, { label: string; color: string }> = {
      SU: { label: 'SU (Medan / Sumut)', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      JB: { label: 'JB (Jambi)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      PB: { label: 'PB (Padang)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      BT: { label: 'BT (Batam)', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
      PK: { label: 'PK (Pekanbaru)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      LS: { label: 'LS (Lampung)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      BJ: { label: 'BJ (Binjai)', color: 'bg-teal-100 text-teal-800 border-teal-200' },
      ST: { label: 'ST (Siantar)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    };
    return map[regionCode] || { label: regionCode, color: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  // Summary Metrics
  const summary = useMemo(() => {
    const totalDoctors = doctorChannelsList.length;
    const activeDoctors = doctorChannelsList.filter(d => d.totalOmset > 0);
    const zeroDoctors = doctorChannelsList.filter(d => d.totalOmset === 0);
    const totalOmset = doctorChannelsList.reduce((sum, d) => sum + d.totalOmset, 0);
    const totalPatients = doctorChannelsList.reduce((sum, d) => sum + d.patientCount, 0);
    const totalSales = doctorChannelsList.reduce((sum, d) => sum + d.salesCount, 0);
    const closingPercent = totalDoctors > 0 ? Number(((activeDoctors.length / totalDoctors) * 100).toFixed(1)) : 0;
    const avgOmsetPerActive = activeDoctors.length > 0 ? Math.round(totalOmset / activeDoctors.length) : 0;

    return {
      totalDoctors,
      activeDoctorsCount: activeDoctors.length,
      zeroDoctorsCount: zeroDoctors.length,
      totalOmset,
      totalPatients,
      totalSales,
      closingPercent,
      avgOmsetPerActive,
    };
  }, [doctorChannelsList]);

  // Filtered Doctors List
  const filteredDoctors = useMemo(() => {
    let list = [...doctorChannelsList];

    // Status filter
    if (statusFilter === 'ACTIVE') {
      list = list.filter(d => d.totalOmset > 0);
    } else if (statusFilter === 'ZERO') {
      list = list.filter(d => d.totalOmset === 0);
    }

    // Region filter
    if (regionFilter !== 'ALL') {
      list = list.filter(d => extractRegion(d.name, d.hospitalName) === regionFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        d.name.toLowerCase().includes(q) || 
        (d.hospitalName && d.hospitalName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => b.totalOmset - a.totalOmset || b.salesCount - a.salesCount || b.patientCount - a.patientCount);
  }, [doctorChannelsList, statusFilter, regionFilter, searchQuery]);

  // Data for Horizontal Bar Chart (Top Doctors)
  const barChartData = useMemo(() => {
    const subset = filteredDoctors.slice(0, barLimit);
    return subset.map((d, index) => {
      // Create concise display name for axis
      const cleanName = d.name.replace(/^dr\.\s*/i, '').replace(/,\s*Sp\.?\s*THT.*/i, '').trim();
      const region = extractRegion(d.name, d.hospitalName);
      
      let metricVal = d.totalOmset;
      if (metricMode === 'sales') metricVal = d.salesCount;
      if (metricMode === 'patients') metricVal = d.patientCount;
      if (metricMode === 'aov') metricVal = d.aov;

      return {
        rank: index + 1,
        raw: d,
        name: d.name,
        shortName: `#${index + 1} ${cleanName} (${region})`,
        value: metricVal,
        omset: d.totalOmset,
        sales: d.salesCount,
        patients: d.patientCount,
        aov: d.aov,
        hospital: d.hospitalName || 'Poli THT / Medis',
        color: index === 0 ? '#F59E0B' : index === 1 ? '#475569' : index === 2 ? '#B45309' : PALETTE_COLORS[index % PALETTE_COLORS.length],
      };
    });
  }, [filteredDoctors, barLimit, metricMode]);

  // Data for Donut Chart (Top 7 + Dokter Lainnya)
  const cleanDonutData = useMemo(() => {
    const sorted = [...filteredDoctors].filter(d => d.totalOmset > 0);
    if (sorted.length === 0) return [];

    const totalVal = sorted.reduce((sum, d) => sum + (metricMode === 'omset' ? d.totalOmset : metricMode === 'sales' ? d.salesCount : d.patientCount), 0);
    const topLimit = 6;
    const topItems = sorted.slice(0, topLimit);
    const others = sorted.slice(topLimit);

    const result = topItems.map((d, idx) => {
      const val = metricMode === 'omset' ? d.totalOmset : metricMode === 'sales' ? d.salesCount : d.patientCount;
      return {
        key: d.key,
        name: d.name,
        value: val,
        percent: totalVal > 0 ? Number(((val / totalVal) * 100).toFixed(1)) : 0,
        color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
        doctor: d,
      };
    });

    if (others.length > 0) {
      const otherVal = others.reduce((sum, d) => sum + (metricMode === 'omset' ? d.totalOmset : metricMode === 'sales' ? d.salesCount : d.patientCount), 0);
      result.push({
        key: 'OTHERS_DOC',
        name: `Dokter Lainnya (${others.length} Dokter)`,
        value: otherVal,
        percent: totalVal > 0 ? Number(((otherVal / totalVal) * 100).toFixed(1)) : 0,
        color: '#94A3B8',
        doctor: null as any,
      });
    }

    return result;
  }, [filteredDoctors, metricMode]);

  // Regional Distribution Data
  const regionData = useMemo(() => {
    const regionMap: Record<string, { region: string; label: string; count: number; omset: number; patients: number; sales: number }> = {
      SU: { region: 'SU', label: 'Sumatera Utara (Medan)', count: 0, omset: 0, patients: 0, sales: 0 },
      JB: { region: 'JB', label: 'Jambi', count: 0, omset: 0, patients: 0, sales: 0 },
      PB: { region: 'PB', label: 'Padang / Sumbar', count: 0, omset: 0, patients: 0, sales: 0 },
      BT: { region: 'BT', label: 'Batam / Kepri', count: 0, omset: 0, patients: 0, sales: 0 },
      PK: { region: 'PK', label: 'Pekanbaru / Pakam', count: 0, omset: 0, patients: 0, sales: 0 },
      LS: { region: 'LS', label: 'Lampung / Langsa', count: 0, omset: 0, patients: 0, sales: 0 },
      BJ: { region: 'BJ', label: 'Binjai', count: 0, omset: 0, patients: 0, sales: 0 },
      ST: { region: 'ST', label: 'Siantar', count: 0, omset: 0, patients: 0, sales: 0 },
    };

    doctorChannelsList.forEach(d => {
      const reg = extractRegion(d.name, d.hospitalName);
      if (regionMap[reg]) {
        regionMap[reg].count += 1;
        regionMap[reg].omset += d.totalOmset;
        regionMap[reg].patients += d.patientCount;
        regionMap[reg].sales += d.salesCount;
      }
    });

    return Object.values(regionMap).filter(r => r.count > 0).sort((a, b) => b.omset - a.omset);
  }, [doctorChannelsList]);

  // Tier Matrix Grouping
  const tierGroups = useMemo(() => {
    const tier1 = filteredDoctors.filter(d => d.totalOmset >= 10000000); // VIP (>10 Juta)
    const tier2 = filteredDoctors.filter(d => d.totalOmset >= 3000000 && d.totalOmset < 10000000); // Solid (3-10 Juta)
    const tier3 = filteredDoctors.filter(d => d.totalOmset > 0 && d.totalOmset < 3000000); // Emerging (<3 Juta)
    const tier4 = filteredDoctors.filter(d => d.totalOmset === 0); // Leads (Belum closing)

    return { tier1, tier2, tier3, tier4 };
  }, [filteredDoctors]);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Executive KPI Matrix for Doctors */}
      <div className="bg-gradient-to-br from-[#181B57] via-[#23277A] to-[#121544] text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-[#2B3182]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 text-[#F5B438] flex items-center justify-center font-bold border border-white/15 shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Evaluasi Kemitraan & Performa Dokter Spesialis THT
                </h3>
                <span className="text-[11px] font-bold bg-[#F5B438] text-[#181B57] px-2.5 py-0.5 rounded-full shadow-xs">
                  {summary.totalDoctors} Dokter Bekerjasama
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Diagram analitik mendalam untuk mengevaluasi volume rujukan, closing penjualan, dan kontribusi omset per dokter.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenMeetingReport && (
              <button
                onClick={onOpenMeetingReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5B438] hover:bg-[#e0a22a] text-[#181B57] text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Cetak Bahan Meeting</span>
              </button>
            )}
            <span className="text-xs font-medium text-indigo-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              Periode: {selectedMonthLabel}
            </span>
          </div>
        </div>

        {/* 4-KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-indigo-200 font-medium block">Total Omset dari Dokter</span>
            <span className="text-lg sm:text-xl font-black text-[#F5B438] block mt-0.5 font-mono">
              {formatRupiah(summary.totalOmset)}
            </span>
            <span className="text-[10px] text-indigo-300 block mt-1">
              Kontribusi {grandTotalOmset > 0 ? ((summary.totalOmset / grandTotalOmset) * 100).toFixed(1) : 0}% omset klinik
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-indigo-200 font-medium block">Dokter Aktif Closing</span>
            <span className="text-lg sm:text-xl font-black text-white block mt-0.5">
              {summary.activeDoctorsCount} <span className="text-xs font-normal text-indigo-300">/ {summary.totalDoctors} Dokter</span>
            </span>
            <span className="text-[10px] text-emerald-300 block mt-1 font-semibold">
              ✓ {summary.closingPercent}% Dokter Aktif Berkontribusi
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-indigo-200 font-medium block">Total Pasien Rujukan Medis</span>
            <span className="text-lg sm:text-xl font-black text-white block mt-0.5">
              {summary.totalPatients} <span className="text-xs font-normal text-indigo-300">Pasien</span>
            </span>
            <span className="text-[10px] text-indigo-300 block mt-1">
              {summary.totalSales} Closing Transaksi Kasir
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] text-indigo-200 font-medium block">Rata-rata per Dokter Aktif</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 block mt-0.5 font-mono">
              {formatRupiah(summary.avgOmsetPerActive)}
            </span>
            <span className="text-[10px] text-indigo-300 block mt-1">
              Nilai perputaran kemitraan
            </span>
          </div>
        </div>
      </div>

      {/* 2. Diagram View Mode Selector & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
            <button
              onClick={() => setChartView('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'bar' ? 'bg-[#23277A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>1. Peringkat Batang (Bar Chart)</span>
            </button>

            <button
              onClick={() => setChartView('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'donut' ? 'bg-[#23277A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>2. Proporsi Top Dokter (Pie Chart)</span>
            </button>

            <button
              onClick={() => setChartView('region')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'region' ? 'bg-[#23277A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>3. Distribusi Wilayah</span>
            </button>

            <button
              onClick={() => setChartView('tier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === 'tier' ? 'bg-[#23277A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4. Matriks Tier Kemitraan</span>
            </button>
          </div>

          {/* Bar Chart limit controls (Only if in Bar chart mode) */}
          {chartView === 'bar' && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
              <span className="text-[11px] text-slate-500 pl-2">Tampilkan:</span>
              {([10, 15, 25] as const).map(lim => (
                <button
                  key={lim}
                  onClick={() => setBarLimit(lim)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    barLimit === lim ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Top {lim}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Row: Region Filter + Status Filter + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Region Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Wilayah:</span>
            </span>
            {(['ALL', 'SU', 'JB', 'PB', 'BT', 'PK', 'LS', 'BJ', 'ST'] as const).map(reg => (
              <button
                key={reg}
                onClick={() => setRegionFilter(reg)}
                className={`px-2 py-0.5 text-[11px] rounded-md font-semibold transition-colors cursor-pointer ${
                  regionFilter === reg 
                    ? 'bg-[#23277A] text-white font-bold' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg === 'ALL' ? 'Semua' : reg}
              </button>
            ))}
          </div>

          {/* Status filter & Search Bar */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Dokter ({doctorChannelsList.length})</option>
              <option value="ACTIVE">Ada Closing ({summary.activeDoctorsCount})</option>
              <option value="ZERO">Belum Closing ({summary.zeroDoctorsCount})</option>
            </select>

            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokter / rumah sakit..."
                className="w-full bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#23277A] text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Chart & Analytics Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: The Specialized Diagram View */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 min-h-[460px]">
          
          {/* ============================================================ */}
          {/* MODE 1: HORIZONTAL BAR CHART (RECOMMENDED FOR DOCTORS)       */}
          {/* ============================================================ */}
          {chartView === 'bar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#23277A]" />
                    <span>Diagram Peringkat Dokter Teratas</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Menampilkan Top {barChartData.length} dokter rujukan dengan kontribusi omset tertinggi
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#23277A] bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  {filteredDoctors.length} Dokter Terdata
                </span>
              </div>

              {barChartData.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 italic">
                  Tidak ditemukan dokter yang sesuai dengan filter.
                </div>
              ) : (
                <div style={{ height: Math.max(380, barChartData.length * 36) }} className="w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 10, fill: '#64748B' }} 
                        tickFormatter={(v) => metricMode === 'omset' || metricMode === 'aov' ? `${v/1000000}M` : `${v}`} 
                      />
                      <YAxis 
                        type="category" 
                        dataKey="shortName" 
                        tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }} 
                        width={160} 
                      />
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => {
                          const raw = item.payload.raw as DoctorChannelItem;
                          return [
                            <div key="tip" className="space-y-1 text-xs">
                              <div className="font-bold text-slate-900">{raw.name}</div>
                              <div className="text-slate-500">{raw.hospitalName || 'Poli THT'}</div>
                              <div className="text-[#23277A] font-black text-sm">{formatRupiah(raw.totalOmset)}</div>
                              <div className="text-slate-600 font-medium">
                                👥 {raw.patientCount} Pasien &middot; 🛍️ {raw.salesCount} Sales ({raw.conversionRate}% closing)
                              </div>
                            </div>,
                            ''
                          ];
                        }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #CBD5E1', 
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          backgroundColor: '#FFFFFF',
                          padding: '10px 14px'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 8, 8, 0]} 
                        barSize={20}
                        onClick={(entry: any) => onSelectDoctor(entry.raw)}
                        className="cursor-pointer"
                      >
                        {barChartData.map((entry, index) => (
                          <Cell key={`bar-cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 2: CLEAN DONUT CHART (TOP 6 + LAINNYA)                  */}
          {/* ============================================================ */}
          {chartView === 'donut' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-[#23277A]" />
                    <span>Diagram Proporsi Pangsa Omset Top Dokter</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Proporsi kontribusi omset per dokter utama dibanding total omset rujukan
                  </p>
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {cleanDonutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cleanDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {cleanDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${formatRupiah(Number(val))} (${item.payload.percent}%)`,
                          item.payload.name
                        ]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-slate-400 italic">Belum ada data dokter aktif.</span>
                )}
              </div>

              {/* Clean Legend list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {cleanDonutData.map(item => (
                  <div 
                    key={item.name} 
                    onClick={() => item.doctor && onSelectDoctor(item.doctor)}
                    className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors ${
                      item.doctor ? 'hover:bg-slate-50 cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-800 font-semibold truncate block">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 block font-mono">{formatRupiah(item.value)}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{item.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 3: REGIONAL DISTRIBUTION                               */}
          {/* ============================================================ */}
          {chartView === 'region' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#23277A]" />
                    <span>Distribusi Rujukan Dokter Berdasarkan Wilayah Cabang</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sebaran jaringan dokter spesialis THT per wilayah operasional Earsound
                  </p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v/1000000}M`} />
                    <Tooltip 
                      formatter={(val: any, name: any, item: any) => [
                        `${formatRupiah(Number(val))} (${item.payload.count} Dokter Bekerjasama, ${item.payload.patients} Pasien)`,
                        item.payload.label
                      ]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                    />
                    <Bar dataKey="omset" fill="#23277A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                {regionData.map(r => (
                  <div key={r.region} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-[11px] font-bold text-slate-700 block">{r.label}</span>
                    <span className="text-xs font-black text-[#181B57] block mt-0.5 font-mono">{formatRupiah(r.omset)}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {r.count} Dokter &middot; {r.patients} Pasien
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 4: TIER MATRIX CARDS                                   */}
          {/* ============================================================ */}
          {chartView === 'tier' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#23277A]" />
                    <span>Matriks Evaluasi Kemitraan (Tier Matrix)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Pengelompokan mitra dokter berdasarkan skala perolehan omset
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tier 1 */}
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <span>👑 Tier 1: VIP Partner</span>
                    </span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      {tierGroups.tier1.length} Dokter (&gt;Rp 10 Jt)
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {tierGroups.tier1.map(d => (
                      <div 
                        key={d.key} 
                        onClick={() => onSelectDoctor(d)}
                        className="p-2 bg-white rounded-lg border border-amber-200/60 flex items-center justify-between hover:bg-amber-100/50 cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 truncate">{d.name}</span>
                        <span className="font-mono font-bold text-amber-800 text-[11px]">{formatRupiah(d.totalOmset)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#181B57] flex items-center gap-1.5">
                      <span>🌟 Tier 2: Regular Partner</span>
                    </span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                      {tierGroups.tier2.length} Dokter (Rp 3-10 Jt)
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {tierGroups.tier2.map(d => (
                      <div 
                        key={d.key} 
                        onClick={() => onSelectDoctor(d)}
                        className="p-2 bg-white rounded-lg border border-indigo-200/60 flex items-center justify-between hover:bg-indigo-100/50 cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 truncate">{d.name}</span>
                        <span className="font-mono font-bold text-indigo-800 text-[11px]">{formatRupiah(d.totalOmset)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier 3 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>🌱 Tier 3: Emerging Partner</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                      {tierGroups.tier3.length} Dokter (&lt;Rp 3 Jt)
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {tierGroups.tier3.map(d => (
                      <div 
                        key={d.key} 
                        onClick={() => onSelectDoctor(d)}
                        className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                      >
                        <span className="font-medium text-slate-800 truncate">{d.name}</span>
                        <span className="font-mono font-semibold text-slate-700 text-[11px]">{formatRupiah(d.totalOmset)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier 4 */}
                <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                      <span>⏳ Perlu Follow-up (0 Closing)</span>
                    </span>
                    <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                      {tierGroups.tier4.length} Dokter
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {tierGroups.tier4.map(d => (
                      <div 
                        key={d.key} 
                        onClick={() => onSelectDoctor(d)}
                        className="p-2 bg-white rounded-lg border border-rose-200 flex items-center justify-between hover:bg-rose-100/50 cursor-pointer"
                      >
                        <span className="font-medium text-slate-800 truncate">{d.name}</span>
                        <span className="text-[10px] text-rose-600 font-semibold">{d.patientCount} Pasien Dirujuk</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Complete Ranked Doctor List & Patient Rekap */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <span>Daftar Evaluasi Dokter ({filteredDoctors.length})</span>
            <span className="text-[11px] text-slate-500 font-normal">Klik untuk rincian pasien & faktur</span>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-400 italic">
              Tidak ada data dokter yang sesuai filter.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredDoctors.map((doc, idx) => {
                const reg = extractRegion(doc.name, doc.hospitalName);
                const regBadge = getRegionBadge(reg);
                const shareOmset = summary.totalOmset > 0 ? ((doc.totalOmset / summary.totalOmset) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={doc.key}
                    onClick={() => onSelectDoctor(doc)}
                    className="p-3 bg-slate-50/60 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 ${
                          idx === 0 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' 
                            : idx === 1 
                            ? 'bg-slate-200 text-slate-800 border border-slate-300' 
                            : idx === 2 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-[#181B57] block truncate">
                            {doc.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${regBadge.color}`}>
                              {reg}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate font-normal">
                              {doc.hospitalName || 'Poli THT / Medis'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#181B57] block font-mono">
                          {formatRupiah(doc.totalOmset)}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span>{doc.patientCount} Pasien</span>
                          <span>&middot;</span>
                          <span className="font-semibold text-slate-700">{doc.salesCount} Closing</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Doctor's Share */}
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-2 overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-700' : idx === 2 ? 'bg-amber-600' : 'bg-[#23277A]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, Number(shareOmset)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
