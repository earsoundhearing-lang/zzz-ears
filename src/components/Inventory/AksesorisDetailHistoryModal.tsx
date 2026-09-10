import React, { useState, useMemo } from 'react';
import { 
  X, Package, ArrowRightLeft, Undo2, ShoppingCart, Plus, 
  Calendar, Warehouse, Download, Search, Filter, Edit3, Trash2, 
  FileSpreadsheet, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle
} from 'lucide-react';
import { AksesorisInventoryEntry } from '../../types';
import { MutationActionType } from './TransferMutationModal';
import { BRANCHES } from '../../utils/branches';

interface AksesorisDetailHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    kategori: string;
    tipe: string;
    sku?: string;
    totalMasuk: number;
    totalKeluar: number;
    sisaStok: number;
    latestBranch: string;
    rawEntries: AksesorisInventoryEntry[];
  } | null;
  activeBranchFilter: string;
  onOpenTransfer: (action: MutationActionType, availableStock: number) => void;
  onOpenRestock: () => void;
  onEditEntry: (entry: AksesorisInventoryEntry) => void;
  onDeleteEntry: (entry: AksesorisInventoryEntry) => void;
}

export const AksesorisDetailHistoryModal: React.FC<AksesorisDetailHistoryModalProps> = ({
  isOpen,
  onClose,
  item,
  activeBranchFilter,
  onOpenTransfer,
  onOpenRestock,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'MASUK' | 'KELUAR_RETUR' | 'KELUAR_TERJUAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // Default newest first

  // Compute chronological mutations and running balance unconditionally
  const computedEntriesWithBalance = useMemo(() => {
    if (!item?.rawEntries) return [];

    // Sort chronological (oldest to newest) to calculate running balance correctly
    const chronological = [...item.rawEntries].sort((a, b) => {
      const timeDiff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });

    let runningBalance = 0;
    const withBalance = chronological.map(entry => {
      const qty = Number(entry.qty) || 0;
      if (entry.type === 'MASUK') {
        runningBalance += qty;
      } else {
        runningBalance -= qty;
      }
      return {
        ...entry,
        runningBalance,
      };
    });

    // Sort according to user preference
    if (!sortAsc) {
      withBalance.reverse(); // Newest first
    }

    return withBalance;
  }, [item?.rawEntries, sortAsc]);

  // Filtered entries based on filter type & search term unconditionally
  const displayedEntries = useMemo(() => {
    return computedEntriesWithBalance.filter(entry => {
      if (filterType !== 'ALL' && entry.type !== filterType) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches = 
          (entry.tanggal || '').toLowerCase().includes(term) ||
          (entry.sumberTujuan || '').toLowerCase().includes(term) ||
          (entry.cabangTujuan || '').toLowerCase().includes(term) ||
          (entry.keterangan || '').toLowerCase().includes(term) ||
          (entry.namaCustomer || '').toLowerCase().includes(term) ||
          (entry.noInvoice || '').toLowerCase().includes(term) ||
          (entry.branchCode || '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [computedEntriesWithBalance, filterType, searchTerm]);

  if (!isOpen || !item) return null;

  const currentBranchObj = BRANCHES.find(b => b.code === activeBranchFilter);
  const branchTitle = activeBranchFilter === 'ALL' 
    ? 'Semua Cabang' 
    : (activeBranchFilter === 'MD' ? 'Gudang Maindealer (Pusat)' : (currentBranchObj?.name || activeBranchFilter));

  // Export single item CSV
  const handleDownloadItemCSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'Jenis Mutasi',
      'Kategori',
      'SKU',
      'Produk',
      'Cabang',
      'Perubahan (Qty)',
      'Saldo Berjalan',
      'Sumber / Tujuan / Pasien',
      'Nomor Faktur',
      'Keterangan'
    ];

    const rows = displayedEntries.map((e, idx) => {
      const qtySign = e.type === 'MASUK' ? `+${e.qty}` : `-${e.qty}`;
      const partner = e.type === 'KELUAR_TERJUAL'
        ? (e.namaCustomer || '-')
        : (e.sumberTujuan || e.cabangTujuan || '-');

      return [
        idx + 1,
        `"${e.tanggal}"`,
        `"${e.type}"`,
        `"${e.kategori}"`,
        `"${e.sku || item.sku || '-'}"`,
        `"${e.tipe}"`,
        `"${e.branchCode}"`,
        `"${qtySign}"`,
        e.runningBalance,
        `"${partner}"`,
        `"${e.noInvoice || '-'}"`,
        `"${(e.keterangan || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kartu_Stok_${(item?.tipe || 'Item').replace(/[^a-zA-Z0-9]/g, '_')}_${activeBranchFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50/80 to-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#23277A] text-[#F5B438] shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-800">{item.tipe}</h2>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-[#23277A] border border-indigo-200 font-mono text-xs font-black">
                  SKU: {item.sku || '-'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                  {item.kategori}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1">
                  <Warehouse className="w-3.5 h-3.5" />
                  {branchTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kartu Stok & Riwayat Mutasi Lengkap Setiap Transaksi
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Summary Metric Cards & Quick Action Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Stat Counters */}
            <div className="lg:col-span-7 grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Total Masuk
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-1">+{item.totalMasuk} <span className="text-xs font-bold text-emerald-600">pcs</span></div>
                <div className="text-[10px] text-emerald-600 font-medium">Stok awal & penerimaan</div>
              </div>

              <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50">
                <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Total Keluar
                </div>
                <div className="text-2xl font-black text-rose-700 mt-1">-{item.totalKeluar} <span className="text-xs font-bold text-rose-600">pcs</span></div>
                <div className="text-[10px] text-rose-600 font-medium">Terjual & mutasi cabang</div>
              </div>

              <div className={`p-3.5 rounded-2xl border ${
                item.sisaStok <= 0 
                  ? 'border-rose-300 bg-rose-50' 
                  : item.sisaStok <= 3 
                    ? 'border-amber-300 bg-amber-50' 
                    : 'border-indigo-300 bg-indigo-50'
              }`}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Sisa Saldo Stok
                </div>
                <div className={`text-2xl font-black mt-1 ${
                  item.sisaStok <= 0 ? 'text-rose-700' : item.sisaStok <= 3 ? 'text-amber-700' : 'text-[#23277A]'
                }`}>
                  {item.sisaStok} <span className="text-xs font-bold">pcs</span>
                </div>
                <div className="mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    item.sisaStok <= 0 
                      ? 'bg-rose-200 text-rose-900' 
                      : item.sisaStok <= 3 
                        ? 'bg-amber-200 text-amber-900' 
                        : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {item.sisaStok <= 0 ? 'Stok Habis' : item.sisaStok <= 3 ? 'Stok Menipis' : 'Stok Tersedia'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons on This Item */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between gap-2.5">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>Aksi Cepat Produk Ini</span>
                <span className="text-[10px] text-slate-400 font-normal">Otomatis update saldo</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenRestock}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Tambah Stok Masuk / Penerimaan Baru"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Stok Masuk</span>
                </button>

                <button
                  disabled={item.sisaStok <= 0}
                  onClick={() => onOpenTransfer('MUTASI_CABANG', item.sisaStok)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Mutasi Stok ke Cabang Lain"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Mutasi Cabang</span>
                </button>

                <button
                  disabled={item.sisaStok <= 0}
                  onClick={() => onOpenTransfer('RETUR_MAINDEALER', item.sisaStok)}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Mutasi / Retur ke Gudang Maindealer (Pusat)"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Mutasi ke MD</span>
                </button>

                <button
                  disabled={item.sisaStok <= 0}
                  onClick={() => onOpenTransfer('CATAT_TERJUAL', item.sisaStok)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Catat Penjualan Manual ke Pasien"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Catat Terjual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter, Search, & Sort Controls */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filter Jenis Mutasi */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Mutasi:
              </span>
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Semua ({item.rawEntries.length})
              </button>
              <button
                onClick={() => setFilterType('MASUK')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'MASUK'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Masuk ({item.rawEntries.filter(e => e.type === 'MASUK').length})
              </button>
              <button
                onClick={() => setFilterType('KELUAR_RETUR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'KELUAR_RETUR'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Mutasi Keluar ({item.rawEntries.filter(e => e.type === 'KELUAR_RETUR').length})
              </button>
              <button
                onClick={() => setFilterType('KELUAR_TERJUAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'KELUAR_TERJUAL'
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Terjual ({item.rawEntries.filter(e => e.type === 'KELUAR_TERJUAL').length})
              </button>
            </div>

            {/* Search & Download */}
            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari faktur, pasien, sumber..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>

              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Ubah urutan tanggal"
              >
                {sortAsc ? 'Terlama' : 'Terbaru'}
              </button>

              <button
                onClick={handleDownloadItemCSV}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#23277A] rounded-xl border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Unduh Kartu Stok CSV Produk Ini"
              >
                <Download className="w-3.5 h-3.5 text-[#23277A]" />
                <span className="hidden sm:inline">Download CSV</span>
              </button>
            </div>
          </div>

          {/* Kartu Stok & Riwayat Mutasi Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="max-h-[380px] overflow-auto relative scrollbar-thin">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 z-30 bg-slate-100 text-slate-700 text-[11px] uppercase font-black tracking-wider shadow-xs">
                  <tr>
                    <th className="p-3 border-b border-slate-200 text-center w-12">No</th>
                    <th className="p-3 border-b border-slate-200">Tanggal</th>
                    <th className="p-3 border-b border-slate-200">Jenis Mutasi</th>
                    <th className="p-3 border-b border-slate-200 text-center">Perubahan (Qty)</th>
                    <th className="p-3 border-b border-slate-200 text-center bg-indigo-50/70 text-[#23277A]">Saldo Berjalan</th>
                    <th className="p-3 border-b border-slate-200">Sumber / Tujuan / Pasien</th>
                    <th className="p-3 border-b border-slate-200">Keterangan / Faktur</th>
                    <th className="p-3 border-b border-slate-200 text-center">Cabang</th>
                    <th className="p-3 border-b border-slate-200 text-center sticky right-0 z-30 bg-slate-100">Aksi (PIN)</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {displayedEntries.map((entry, idx) => {
                    const isMasuk = entry.type === 'MASUK';
                    const isRetur = entry.type === 'KELUAR_RETUR';
                    const isTerjual = entry.type === 'KELUAR_TERJUAL';

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-700 font-semibold">{entry.tanggal}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                            isMasuk 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : (isRetur ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                          }`}>
                            {isMasuk && <ArrowDownLeft className="w-3 h-3" />}
                            {isRetur && <ArrowRightLeft className="w-3 h-3" />}
                            {isTerjual && <ShoppingCart className="w-3 h-3" />}
                            {isMasuk ? 'MASUK' : (isRetur ? 'MUTASI CABANG / RETUR' : 'TERJUAL')}
                          </span>
                        </td>
                        
                        {/* Qty Changed */}
                        <td className="p-3 text-center font-black text-sm">
                          <span className={isMasuk ? 'text-emerald-700' : 'text-rose-700'}>
                            {isMasuk ? `+${entry.qty}` : `-${entry.qty}`}
                          </span>
                        </td>

                        {/* Running Balance */}
                        <td className="p-3 text-center bg-indigo-50/40 font-mono font-black text-xs text-[#23277A] border-x border-slate-100">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100/70 border border-indigo-200">
                            {entry.runningBalance} pcs
                          </span>
                        </td>

                        {/* Partner / Destination */}
                        <td className="p-3 text-slate-800 font-semibold text-xs">
                          {isTerjual ? (
                            <div>
                              <span className="text-slate-900 font-bold">{entry.namaCustomer || 'Pasien'}</span>
                              {entry.noInvoice && (
                                <span className="text-slate-400 font-normal ml-1">({entry.noInvoice})</span>
                              )}
                            </div>
                          ) : (
                            <span>{entry.sumberTujuan || entry.cabangTujuan || '-'}</span>
                          )}
                        </td>

                        {/* Notes / Invoice */}
                        <td className="p-3 text-slate-600 text-xs max-w-xs truncate" title={entry.keterangan}>
                          {entry.keterangan || (isTerjual && entry.noInvoice ? `Faktur: ${entry.noInvoice}` : '-')}
                        </td>

                        {/* Branch Code */}
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                            {entry.branchCode || '-'}
                          </span>
                        </td>

                        {/* Action buttons (Edit / Delete with PIN) */}
                        <td className="p-2.5 text-center sticky right-0 bg-white/95 border-l border-slate-100">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditEntry(entry)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Edit Log Mutasi Ini (Perlu PIN)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteEntry(entry)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Hapus Log Mutasi Ini (Perlu PIN)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {displayedEntries.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <div className="font-semibold text-slate-600">Belum ada riwayat mutasi untuk produk ini</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Klik tombol "+ Stok Masuk" untuk mencatat penerimaan perdana produk ini
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Total {displayedEntries.length} catatan mutasi ditampilkan
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
