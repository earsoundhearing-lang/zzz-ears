import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Download, 
  Filter, 
  RotateCcw, 
  FileSpreadsheet, 
  Printer, 
  ChevronDown,
  Clock,
  Building2,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { formatIndoDate, formatRupiah } from '../../utils/formatters';
import { BRANCHES } from '../../utils/branches';
import { BranchCode } from '../../types';

export type DateFilterPreset = 'all' | 'today' | 'last7' | 'this_month' | 'specific_month' | 'custom';

export interface DateRangeState {
  preset: DateFilterPreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  selectedMonth: number; // 0-11
  selectedYear: number;
}

interface ReportFilterToolbarProps {
  title?: string;
  totalRecords: number;
  filteredRecordsCount: number;
  totalAmount?: number;
  amountLabel?: string;
  onFilterChange: (startDate: string | null, endDate: string | null, periodLabel: string) => void;
  onExportCSV: (periodLabel: string) => void;
  onPrintReport?: () => void;
  selectedBranch?: string;
  onBranchChange?: (branchCode: string) => void;
  showBranchFilter?: boolean;
  extraActions?: React.ReactNode;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ReportFilterToolbar: React.FC<ReportFilterToolbarProps> = ({
  title = 'Filter & Unduh Laporan',
  totalRecords,
  filteredRecordsCount,
  totalAmount,
  amountLabel = 'Total Nominal',
  onFilterChange,
  onExportCSV,
  onPrintReport,
  selectedBranch,
  onBranchChange,
  showBranchFilter = false,
  extraActions,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [filterState, setFilterState] = useState<DateRangeState>({
    preset: 'all',
    startDate: '',
    endDate: '',
    selectedMonth: currentMonth,
    selectedYear: currentYear,
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Generate Year options (5 years before to 2 years ahead)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 4; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Compute period label and calculate bounds
  const applyPreset = (
    preset: DateFilterPreset, 
    customStart?: string, 
    customEnd?: string, 
    month?: number, 
    year?: number
  ) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let start: string | null = null;
    let end: string | null = null;
    let label = 'Semua Periode';

    const selMonth = month !== undefined ? month : filterState.selectedMonth;
    const selYear = year !== undefined ? year : filterState.selectedYear;

    if (preset === 'today') {
      start = todayStr;
      end = todayStr;
      label = `Hari Ini (${formatIndoDate(todayStr)})`;
    } else if (preset === 'last7') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      start = past7.toISOString().split('T')[0];
      end = todayStr;
      label = `7 Hari Terakhir (${formatIndoDate(start)} - ${formatIndoDate(end)})`;
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start = firstDay.toISOString().split('T')[0];
      end = lastDay.toISOString().split('T')[0];
      label = `Bulan Ini (${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()})`;
    } else if (preset === 'specific_month') {
      const firstDay = new Date(selYear, selMonth, 1);
      const lastDay = new Date(selYear, selMonth + 1, 0);
      start = firstDay.toISOString().split('T')[0];
      end = lastDay.toISOString().split('T')[0];
      label = `Bulan ${MONTH_NAMES[selMonth]} ${selYear}`;
    } else if (preset === 'custom') {
      const s = customStart !== undefined ? customStart : filterState.startDate;
      const e = customEnd !== undefined ? customEnd : filterState.endDate;
      start = s || null;
      end = e || null;
      if (start && end) {
        label = `Periode ${formatIndoDate(start)} s/d ${formatIndoDate(end)}`;
      } else if (start) {
        label = `Mulai dari ${formatIndoDate(start)}`;
      } else if (end) {
        label = `Sampai dengan ${formatIndoDate(end)}`;
      } else {
        label = 'Kustom (Semua Tanggal)';
      }
    } else {
      // 'all'
      start = null;
      end = null;
      label = 'Semua Periode';
    }

    setFilterState(prev => ({
      ...prev,
      preset,
      startDate: start || '',
      endDate: end || '',
      selectedMonth: selMonth,
      selectedYear: selYear,
    }));

    onFilterChange(start, end, label);
  };

  const getActivePeriodLabel = (): string => {
    if (filterState.preset === 'today') {
      return `Hari Ini`;
    }
    if (filterState.preset === 'last7') {
      return `7 Hari Terakhir`;
    }
    if (filterState.preset === 'this_month') {
      return `Bulan Ini (${MONTH_NAMES[currentMonth]} ${currentYear})`;
    }
    if (filterState.preset === 'specific_month') {
      return `${MONTH_NAMES[filterState.selectedMonth]} ${filterState.selectedYear}`;
    }
    if (filterState.preset === 'custom') {
      if (filterState.startDate && filterState.endDate) {
        return `${filterState.startDate} s/d ${filterState.endDate}`;
      }
      return 'Kustom';
    }
    return 'Semua Data';
  };

  const handleExport = () => {
    onExportCSV(getActivePeriodLabel());
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#23277A] text-white rounded-xl shadow-xs">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#23277A] border border-indigo-200">
                {getActivePeriodLabel()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-800">{filteredRecordsCount}</span> dari {totalRecords} transaksi
              {totalAmount !== undefined && (
                <> • {amountLabel}: <span className="font-black text-[#23277A]">{formatRupiah(totalAmount)}</span></>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2 flex-wrap">
          {extraActions}

          {onPrintReport && (
            <button
              onClick={onPrintReport}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              title="Cetak format cetak / print"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>
          )}

          <button
            onClick={handleExport}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#23277A] hover:bg-[#1A1D60] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Download Laporan Excel / CSV sesuai periode"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-3.5 bg-white space-y-3">
        {/* Preset Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Periode:
          </span>

          <button
            type="button"
            onClick={() => applyPreset('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterState.preset === 'all'
                ? 'bg-[#23277A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Semua
          </button>

          <button
            type="button"
            onClick={() => applyPreset('today')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterState.preset === 'today'
                ? 'bg-[#23277A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Hari Ini
          </button>

          <button
            type="button"
            onClick={() => applyPreset('last7')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterState.preset === 'last7'
                ? 'bg-[#23277A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            7 Hari Terakhir
          </button>

          <button
            type="button"
            onClick={() => applyPreset('this_month')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterState.preset === 'this_month'
                ? 'bg-[#23277A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Bulan Ini ({MONTH_NAMES[currentMonth]})
          </button>

          <button
            type="button"
            onClick={() => applyPreset('specific_month')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterState.preset === 'specific_month'
                ? 'bg-[#23277A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Pilih Bulan...
          </button>

          <button
            type="button"
            onClick={() => applyPreset('custom')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterState.preset === 'custom'
                ? 'bg-[#23277A] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Rentang Tanggal (Kustom)...
          </button>

          {/* Reset button if filtered */}
          {filterState.preset !== 'all' && (
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Dynamic Secondary Filter Details */}
        {filterState.preset === 'specific_month' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-[#23277A]" />
              <span>Pilih Bulan & Tahun Transaksi:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={filterState.selectedMonth}
                onChange={(e) => {
                  const m = parseInt(e.target.value, 10);
                  applyPreset('specific_month', undefined, undefined, m, filterState.selectedYear);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={filterState.selectedYear}
                onChange={(e) => {
                  const y = parseInt(e.target.value, 10);
                  applyPreset('specific_month', undefined, undefined, filterState.selectedMonth, y);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] focus:outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-500 ml-auto font-medium">
              Menyaring seluruh transaksi bulan <strong>{MONTH_NAMES[filterState.selectedMonth]} {filterState.selectedYear}</strong>
            </div>
          </div>
        )}

        {filterState.preset === 'custom' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-[#23277A]" />
              <span>Sortir Rentang Tanggal:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Dari:</span>
                <input
                  type="date"
                  value={filterState.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    applyPreset('custom', newStart, filterState.endDate);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#23277A] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-500">Sampai:</span>
                <input
                  type="date"
                  value={filterState.endDate}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    applyPreset('custom', filterState.startDate, newEnd);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#23277A] focus:outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 ml-auto font-medium">
              {filterState.startDate && filterState.endDate ? (
                <span>Periode: <strong>{formatIndoDate(filterState.startDate)}</strong> s/d <strong>{formatIndoDate(filterState.endDate)}</strong></span>
              ) : (
                <span>Silakan pilih batas tanggal awal dan akhir.</span>
              )}
            </div>
          </div>
        )}

        {/* Optional Branch Filter if supported */}
        {showBranchFilter && onBranchChange && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Cabang:
            </span>
            <button
              type="button"
              onClick={() => onBranchChange('ALL')}
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                selectedBranch === 'ALL' || !selectedBranch
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Semua Cabang
            </button>
            {BRANCHES.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => onBranchChange(b.code)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedBranch === b.code
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
