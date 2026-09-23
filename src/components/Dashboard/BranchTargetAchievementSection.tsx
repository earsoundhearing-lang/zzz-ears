import React, { useState, useMemo } from 'react';
import { BRANCHES } from '../../utils/branches';
import { formatRupiah, parseDateParts, isSalesTransaction } from '../../utils/formatters';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Award, 
  ArrowUpRight, 
  Zap, 
  ChevronRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  Building2
} from 'lucide-react';
import { 
  Patient, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  BranchCode 
} from '../../types';
import { 
  getBranchMonthlyTarget2026, 
  getBranchYearlyTarget2026, 
  MONTH_NAMES_INDONESIA,
  TARGETS_2026_BY_MONTH
} from '../../data/branchTargets2026';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  ReferenceLine
} from 'recharts';

interface BranchTargetAchievementSectionProps {
  allAksesoris: AksesorisTransaction[];
  allJasaPeriksa: JasaPeriksaTransaction[];
  allABD: ABDTransaction[];
  activeBranchFilter?: BranchCode;
  onSelectBranch?: (branchCode: BranchCode) => void;
}

export const BranchTargetAchievementSection: React.FC<BranchTargetAchievementSectionProps> = ({
  allAksesoris = [],
  allJasaPeriksa = [],
  allABD = [],
  activeBranchFilter = 'ALL',
  onSelectBranch,
}) => {
  // Current date defaults
  const today = new Date();
  const currentMonthIndex = today.getMonth(); // 0 - 11
  const currentYear = today.getFullYear();

  // State selection (Default: month index or 'FULL_YEAR')
  const [selectedMonth, setSelectedMonth] = useState<number | 'FULL_YEAR'>(currentMonthIndex);

  // Total days in selected month & remaining days
  const daysInSelectedMonth = useMemo(() => {
    if (selectedMonth === 'FULL_YEAR') return 365;
    return new Date(2026, selectedMonth + 1, 0).getDate();
  }, [selectedMonth]);

  const remainingDaysInMonth = useMemo(() => {
    if (selectedMonth === 'FULL_YEAR') {
      const startOfYear = new Date(2026, 0, 1);
      const diffDays = Math.ceil((new Date(2026, 11, 31).getTime() - today.getTime()) / (1000 * 3600 * 24));
      return Math.max(1, diffDays);
    }
    if (selectedMonth < currentMonthIndex) return 0; // Past month
    if (selectedMonth > currentMonthIndex) return daysInSelectedMonth; // Future month
    
    // Current active month
    const todayDate = today.getDate();
    return Math.max(1, daysInSelectedMonth - todayDate + 1);
  }, [selectedMonth, currentMonthIndex, daysInSelectedMonth]);

  // Helper to filter transaction by month/year and branch
  const getBranchRealisasi = (branchCode: string, monthIdx: number | 'FULL_YEAR') => {
    const isSingleBranch = branchCode !== 'ALL' && branchCode !== 'HQ';

    const filterTx = (txList: any[]) => {
      return txList.filter((item) => {
        if (!item?.tanggal) return false;
        if (!isSalesTransaction(item)) return false;
        if (isSingleBranch && item.branchCode !== branchCode) return false;

        const parsed = parseDateParts(String(item.tanggal));
        if (!parsed) return false;

        const { year, month } = parsed;

        if (monthIdx === 'FULL_YEAR') {
          return year === currentYear;
        }
        return month === monthIdx && year === currentYear;
      });
    };

    const filteredAks = filterTx(allAksesoris);
    const filteredJsa = filterTx(allJasaPeriksa);
    const filteredAbd = filterTx(allABD);

    const aksOmset = filteredAks.reduce((s, i) => s + (i.jumlah || 0), 0);
    const jsaOmset = filteredJsa.reduce((s, i) => s + (i.biayaJasaPeriksa || 0), 0);
    const abdOmset = filteredAbd.reduce((s, i) => s + (i.jumlah || 0), 0);

    return aksOmset + jsaOmset + abdOmset;
  };

  // Branch statistics calculation
  const branchAchievements = useMemo(() => {
    return BRANCHES.map((b) => {
      const code = b.code;
      const target = selectedMonth === 'FULL_YEAR' 
        ? getBranchYearlyTarget2026(code)
        : getBranchMonthlyTarget2026(code, selectedMonth);

      const realisasi = getBranchRealisasi(code, selectedMonth);
      const percent = target > 0 ? (realisasi / target) * 100 : 0;
      const selisih = realisasi - target; // Positif jika surplus, negatif jika kurang
      const kekurangan = Math.max(0, target - realisasi);

      // Daily run rate needed
      const dailyNeeded = remainingDaysInMonth > 0 ? Math.ceil(kekurangan / remainingDaysInMonth) : 0;

      return {
        code,
        name: b.name,
        city: b.city,
        target,
        realisasi,
        percent,
        selisih,
        kekurangan,
        dailyNeeded,
        isAchieved: realisasi >= target,
      };
    }).sort((a, b) => b.percent - a.percent); // Sorted by highest % achievement
  }, [allAksesoris, allJasaPeriksa, allABD, selectedMonth, remainingDaysInMonth]);

  // Overall consolidated total stats
  const consolidatedStats = useMemo(() => {
    const isFilteredBranch = activeBranchFilter !== 'ALL' && activeBranchFilter !== 'HQ';
    
    let targetTotal = 0;
    let realisasiTotal = 0;

    if (isFilteredBranch) {
      targetTotal = selectedMonth === 'FULL_YEAR'
        ? getBranchYearlyTarget2026(activeBranchFilter)
        : getBranchMonthlyTarget2026(activeBranchFilter, selectedMonth);
      realisasiTotal = getBranchRealisasi(activeBranchFilter, selectedMonth);
    } else {
      targetTotal = branchAchievements.reduce((s, b) => s + b.target, 0);
      realisasiTotal = branchAchievements.reduce((s, b) => s + b.realisasi, 0);
    }

    const percentTotal = targetTotal > 0 ? (realisasiTotal / targetTotal) * 100 : 0;
    const kekuranganTotal = Math.max(0, targetTotal - realisasiTotal);
    const surplusTotal = Math.max(0, realisasiTotal - targetTotal);
    const dailyNeededTotal = remainingDaysInMonth > 0 ? Math.ceil(kekuranganTotal / remainingDaysInMonth) : 0;

    return {
      targetTotal,
      realisasiTotal,
      percentTotal,
      kekuranganTotal,
      surplusTotal,
      dailyNeededTotal,
      isAchievedTotal: realisasiTotal >= targetTotal,
    };
  }, [branchAchievements, activeBranchFilter, selectedMonth, remainingDaysInMonth]);

  // Chart data prepare
  const chartData = useMemo(() => {
    if (selectedMonth === 'FULL_YEAR') {
      // Monthly trend chart Jan-Dec
      return MONTH_NAMES_INDONESIA.map((mName, mIdx) => {
        const target = activeBranchFilter !== 'ALL' && activeBranchFilter !== 'HQ'
          ? getBranchMonthlyTarget2026(activeBranchFilter, mIdx)
          : Object.values(TARGETS_2026_BY_MONTH[mIdx] || {}).reduce((s, v) => s + v, 0);

        const realisasi = getBranchRealisasi(activeBranchFilter, mIdx);
        return {
          label: mName.slice(0, 3),
          'Target (Jt)': Number((target / 1000000).toFixed(1)),
          'Realisasi (Jt)': Number((realisasi / 1000000).toFixed(1)),
          targetVal: target,
          realisasiVal: realisasi,
          percent: target > 0 ? Number(((realisasi / target) * 100).toFixed(1)) : 0,
        };
      });
    }

    // Branch comparison chart for selected month
    return branchAchievements.map((b) => ({
      label: b.name.replace('Earsound ', ''),
      'Target (Jt)': Number((b.target / 1000000).toFixed(1)),
      'Realisasi (Jt)': Number((b.realisasi / 1000000).toFixed(1)),
      targetVal: b.target,
      realisasiVal: b.realisasi,
      percent: Number(b.percent.toFixed(1)),
    }));
  }, [selectedMonth, branchAchievements, activeBranchFilter]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 w-full max-w-full overflow-hidden">
      {/* Header & Month Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#23277A] text-[#F5B438] rounded-xl shadow-xs">
            <Target className="w-5 h-5 text-[#F5B438]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">Target vs Realisasi Sales 2026</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Target Resmi 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Monitoring pencapaian target omset bulanan & tahunan per cabang beserta analisa kekurangan kuota
            </p>
          </div>
        </div>

        {/* Month Dropdown / Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 p-1 rounded-xl text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMonth(val === 'FULL_YEAR' ? 'FULL_YEAR' : Number(val));
              }}
              className="bg-transparent font-bold text-slate-800 pr-2 py-1 border-none focus:outline-none cursor-pointer"
            >
              <option value="FULL_YEAR">🗓️ Total Setahun (Jan - Des 2026)</option>
              {MONTH_NAMES_INDONESIA.map((mName, idx) => (
                <option key={idx} value={idx}>
                  {mName} 2026 {idx === currentMonthIndex ? '(Bulan Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Consolidated KPI Hero Card */}
      <div className="bg-gradient-to-br from-[#181B57] via-[#23277A] to-[#1E2269] text-white p-5 sm:p-6 rounded-2xl shadow-md border border-[#3B41B2]/40 relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Side: Realisasi vs Target Numbers */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {selectedMonth === 'FULL_YEAR' 
                  ? 'KONSOLIDASI TARGET & SALES TAHUN 2026'
                  : `PENCAPAIAN TARGET BULAN ${MONTH_NAMES_INDONESIA[selectedMonth as number].toUpperCase()} 2026`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Omset */}
              <div className="bg-[#121442]/80 border border-[#3A42A8]/50 p-4 rounded-xl">
                <span className="text-xs text-indigo-200 font-medium block mb-1">Target Sales Dipatok:</span>
                <span className="text-xl sm:text-2xl font-black text-white block">
                  {formatRupiah(consolidatedStats.targetTotal)}
                </span>
                <span className="text-[10px] text-indigo-300/80 mt-1 block">
                  {activeBranchFilter === 'ALL' || activeBranchFilter === 'HQ' 
                    ? 'Total gabungan 8 cabang Earsound' 
                    : `Target khusus cabang ${activeBranchFilter}`}
                </span>
              </div>

              {/* Realisasi Omset */}
              <div className="bg-[#121442]/80 border border-[#3A42A8]/50 p-4 rounded-xl">
                <span className="text-xs text-indigo-200 font-medium block mb-1">Realisasi Sales Terbukukan:</span>
                <span className="text-xl sm:text-2xl font-black text-[#F5B438] block">
                  {formatRupiah(consolidatedStats.realisasiTotal)}
                </span>
                <span className="text-[10px] text-indigo-300/80 mt-1 block">
                  Hasil omset ABD, Aksesoris, & Jasa
                </span>
              </div>
            </div>

            {/* Gap Analysis Message */}
            <div className="p-3.5 bg-[#0e1035]/90 border border-amber-500/30 rounded-xl text-xs flex items-start gap-3">
              {consolidatedStats.isAchievedTotal ? (
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div className="space-y-0.5">
                {consolidatedStats.isAchievedTotal ? (
                  <>
                    <p className="font-bold text-emerald-300 text-sm">
                      🎉 TARGET SUDAH TERCAPAI! (Surplus {formatRupiah(consolidatedStats.surplusTotal)})
                    </p>
                    <p className="text-indigo-200 text-[11px]">
                      Pencapaian penjualan telah melampaui target yang ditetapkan sebesar <strong>{consolidatedStats.percentTotal.toFixed(1)}%</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-amber-300 text-sm">
                      Sisa Kekurangan Omset: {formatRupiah(consolidatedStats.kekuranganTotal)}
                    </p>
                    <p className="text-indigo-200 text-[11px]">
                      Sisa waktu: <strong>{remainingDaysInMonth} hari</strong> lagi. Dibutuhkan rata-rata omset sebesar{' '}
                      <strong className="text-amber-300">{formatRupiah(consolidatedStats.dailyNeededTotal)} / hari</strong> untuk mencapai 100% target.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Visual Circular Progress Gauge & Percentage */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-[#121442]/60 border border-[#3A42A8]/40 rounded-xl text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Persentase Pencapaian
            </span>

            <div className="relative inline-flex items-center justify-center">
              {/* Circular percentage display */}
              <div className="w-32 h-32 rounded-full border-8 border-indigo-900/80 flex flex-col items-center justify-center relative shadow-inner bg-[#181B57]">
                <span className={`text-2xl sm:text-3xl font-black ${
                  consolidatedStats.isAchievedTotal ? 'text-emerald-400' : 'text-[#F5B438]'
                }`}>
                  {consolidatedStats.percentTotal.toFixed(1)}%
                </span>
                <span className="text-[10px] text-indigo-200 font-semibold uppercase">Pencapaian</span>
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full space-y-1">
              <div className="w-full bg-indigo-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-indigo-800">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    consolidatedStats.isAchievedTotal 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : 'bg-gradient-to-r from-amber-500 to-yellow-300'
                  }`}
                  style={{ width: `${Math.min(100, consolidatedStats.percentTotal)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-indigo-300 font-medium">
                <span>0%</span>
                <span>50%</span>
                <span>100% Target</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Bar Comparison Chart */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#23277A]" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {selectedMonth === 'FULL_YEAR' 
                ? 'Grafik Target vs Realisasi per Bulan (Januari - Desember 2026)' 
                : `Grafik Target vs Realisasi per Cabang (${MONTH_NAMES_INDONESIA[selectedMonth as number]} 2026)`}
            </span>
          </div>
          <span className="text-xs text-slate-500">Nilai disajikan dalam Juta Rupiah (Rp)</span>
        </div>

        <div className="h-72 w-full pt-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200/80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
                angle={selectedMonth === 'FULL_YEAR' ? 0 : -20} 
                textAnchor={selectedMonth === 'FULL_YEAR' ? 'middle' : 'end'} 
                interval={0} 
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit=" Jt" />
              <Tooltip 
                formatter={(val: any, name: any) => [`Rp ${val} Juta`, name]}
                labelFormatter={(lbl) => `Kategori: ${lbl}`}
                contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Target (Jt)" fill="#23277A" radius={[4, 4, 0, 0]} name="Target (Juta)" />
              <Bar dataKey="Realisasi (Jt)" fill="#F5B438" radius={[4, 4, 0, 0]} name="Realisasi Sales (Juta)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Cards of 8 Branches Achievements */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#23277A]" />
            Rincian Pencapaian Target 8 Cabang Earsound
          </span>
          <span className="text-xs text-slate-500 font-normal">
            Diurutkan berdasarkan persentase pencapaian tertinggi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {branchAchievements.map((b, idx) => {
            const isSelected = activeBranchFilter === b.code;

            return (
              <div
                key={b.code}
                onClick={() => onSelectBranch && onSelectBranch(b.code)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-[#23277A] bg-indigo-50/40 shadow-xs ring-1 ring-[#23277A]/20' 
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Header: Rank + Branch Name + % Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        idx === 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-white'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">{b.city} • Kode: {b.code}</span>
                  </div>

                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    b.isAchieved 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : b.percent >= 75 
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {b.percent.toFixed(1)}%
                  </span>
                </div>

                {/* Metrics */}
                <div className="mt-3 space-y-1.5 pt-2.5 border-t border-slate-100 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Target:</span>
                    <span className="font-semibold text-slate-800">{formatRupiah(b.target)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500">Realisasi:</span>
                    <span className="font-bold text-[#23277A]">{formatRupiah(b.realisasi)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        b.isAchieved 
                          ? 'bg-emerald-500' 
                          : b.percent >= 75 
                          ? 'bg-[#F5B438]' 
                          : 'bg-[#23277A]'
                      }`}
                      style={{ width: `${Math.min(100, b.percent)}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Status: Deficiency / Surplus */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                  {b.isAchieved ? (
                    <div className="text-emerald-700 font-bold flex items-center justify-between">
                      <span>Status:</span>
                      <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Target Tercapai! (+{formatRupiah(b.selisih)})
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Kurang Omset:</span>
                        <span className="font-bold text-amber-700">{formatRupiah(b.kekurangan)}</span>
                      </div>
                      {selectedMonth !== 'FULL_YEAR' && b.dailyNeeded > 0 && (
                        <div className="text-[10px] text-slate-500 text-right italic">
                          Butuh ~{formatRupiah(b.dailyNeeded)} / hari
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
