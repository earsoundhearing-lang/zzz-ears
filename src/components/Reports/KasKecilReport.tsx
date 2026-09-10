import React, { useState } from 'react';
import { KasKecilEntry, JenisPengeluaranKasKecil } from '../../types';
import { formatRupiah, formatIndoDate } from '../../utils/formatters';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Wallet, PlusCircle, MinusCircle, PieChart as PieIcon, Trash2, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { ReportFilterToolbar } from '../Common/ReportFilterToolbar';
import { exportKasKecilCSV } from '../../utils/exportHelpers';

interface KasKecilReportProps {
  kasKecilEntries: KasKecilEntry[];
  onAddEntry: (entry: Omit<KasKecilEntry, 'id' | 'saldo'>) => void;
  onDeleteEntry: (id: string) => void;
}

const JENIS_PENGELUARAN_LIST: JenisPengeluaranKasKecil[] = [
  'Biaya Transport',
  'Parkir',
  'Biaya Kirim',
  'Wifi',
  'ATK',
  'Pantry',
  'LPM',
  'Perawatan Bangunan',
  'Perlengkapan Kantor',
  'Lain-lain',
];

const COLORS = [
  '#23277A', '#F5B438', '#181B57', '#3B41B2', '#D99B26', 
  '#4A51D1', '#939BF4', '#B38321', '#121442', '#64748B'
];

export const KasKecilReportComponent: React.FC<KasKecilReportProps> = ({
  kasKecilEntries = [],
  onAddEntry,
  onDeleteEntry,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [entryType, setEntryType] = useState<'PENAMBAHAN' | 'PENGELUARAN'>('PENGELUARAN');

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState(50000);
  const [jenisPengeluaran, setJenisPengeluaran] = useState<JenisPengeluaranKasKecil>('ATK');

  // Additional Fields
  const [penerimaKas, setPenerimaKas] = useState('');
  const [pemberiKas, setPemberiKas] = useState('');
  const [pengeluarKas, setPengeluarKas] = useState('');
  const [buktiPengeluaran, setBuktiPengeluaran] = useState('');

  // Date Range & Filter State
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState<string>('Semua Periode');

  const safeEntries = kasKecilEntries || [];

  // Compute running balance chronologically
  const sortedEntries = [...safeEntries].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );

  let currentBalance = 0;
  const entriesWithBalance: KasKecilEntry[] = sortedEntries.map((e) => {
    currentBalance = currentBalance + (e.penambahanKas || 0) - (e.pengeluaran || 0);
    return {
      ...e,
      saldo: currentBalance,
    };
  });

  // Filtered view by date range
  const filteredEntriesWithBalance = entriesWithBalance.filter((e) => {
    if (filterStartDate && e.tanggal < filterStartDate) return false;
    if (filterEndDate && e.tanggal > filterEndDate) return false;
    return true;
  });

  // Calculate totals
  const totalPenambahan = entriesWithBalance.reduce((acc, curr) => acc + (curr.penambahanKas || 0), 0);
  const totalPengeluaran = entriesWithBalance.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0);
  const saldoAkhir = currentBalance;

  // Filtered totals
  const filteredPenambahan = filteredEntriesWithBalance.reduce((acc, curr) => acc + (curr.penambahanKas || 0), 0);
  const filteredPengeluaran = filteredEntriesWithBalance.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0);

  // Group expenses by category for Pie Chart based on filtered entries
  const expenseByCategory: { [key in JenisPengeluaranKasKecil]?: number } = {};
  filteredEntriesWithBalance.forEach((e) => {
    if (e.pengeluaran > 0 && e.jenisPengeluaran) {
      expenseByCategory[e.jenisPengeluaran] = (expenseByCategory[e.jenisPengeluaran] || 0) + e.pengeluaran;
    }
  });

  const pieChartData = Object.entries(expenseByCategory).map(([cat, amount], idx) => ({
    name: cat,
    value: amount,
    color: COLORS[idx % COLORS.length],
  }));

  const handleExportCSV = (periodLabel: string) => {
    exportKasKecilCSV(filteredEntriesWithBalance, periodLabel);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan.trim()) {
      alert('Mohon isi keterangan kas kecil');
      return;
    }
    if (nominal <= 0) {
      alert('Nominal harus lebih besar dari 0.');
      return;
    }

    onAddEntry({
      tanggal,
      keterangan: keterangan.trim(),
      penambahanKas: entryType === 'PENAMBAHAN' ? nominal : 0,
      pengeluaran: entryType === 'PENGELUARAN' ? nominal : 0,
      jenisPengeluaran: entryType === 'PENGELUARAN' ? jenisPengeluaran : undefined,
      penerimaKas: entryType === 'PENAMBAHAN' ? (penerimaKas.trim() || undefined) : undefined,
      pemberiKas: entryType === 'PENAMBAHAN' ? (pemberiKas.trim() || undefined) : undefined,
      pengeluarKas: entryType === 'PENGELUARAN' ? (pengeluarKas.trim() || undefined) : undefined,
      buktiPengeluaran: entryType === 'PENGELUARAN' ? (buktiPengeluaran.trim() || undefined) : undefined,
    });

    setKeterangan('');
    setPenerimaKas('');
    setPemberiKas('');
    setPengeluarKas('');
    setBuktiPengeluaran('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            <span>Laporan Kas Kecil (Petty Cash Earsound)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan saldo kas kecil operasional klinik, penambahan kas, dan pengeluaran harian.
          </p>
        </div>

        <button
          id="btn-tambah-kas-kecil"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{showForm ? 'Tutup Form' : '+ Catat Kas Kecil'}</span>
        </button>
      </div>

      {/* Summary Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between border border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Saldo Kas Kecil Terkini
            </span>
            <span className="text-2xl font-black text-teal-400 mt-1 block">
              {formatRupiah(saldoAkhir)}
            </span>
            <span className="text-[11px] text-slate-400">Kas Sisa Siap Pakai</span>
          </div>
          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-700 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-100 block">Total Penambahan Kas</span>
            <span className="text-xl font-extrabold mt-1 block">{formatRupiah(totalPenambahan)}</span>
            <span className="text-[11px] text-emerald-200">Dana Kas Masuk</span>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <ArrowUpRight className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-rose-700 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-rose-100 block">Total Pengeluaran Kas</span>
            <span className="text-xl font-extrabold mt-1 block">{formatRupiah(totalPengeluaran)}</span>
            <span className="text-[11px] text-rose-200">Biaya Operasional Klinik</span>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <ArrowDownRight className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Filter & Export Toolbar */}
      <ReportFilterToolbar
        title="Laporan & Filter Tanggal Kas Kecil"
        totalRecords={entriesWithBalance.length}
        filteredRecordsCount={filteredEntriesWithBalance.length}
        totalAmount={filteredPengeluaran}
        amountLabel="Total Pengeluaran Terfilter"
        onFilterChange={(start, end, label) => {
          setFilterStartDate(start);
          setFilterEndDate(end);
          setCurrentPeriodLabel(label);
        }}
        onExportCSV={handleExportCSV}
      />

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-200 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-md font-bold text-slate-900">Form Jurnal Kas Kecil</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEntryType('PENGELUARAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryType === 'PENGELUARAN'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Pengeluaran Kas
              </button>
              <button
                type="button"
                onClick={() => setEntryType('PENAMBAHAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  entryType === 'PENAMBAHAN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Penambahan Kas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan Keperluan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={
                  entryType === 'PENGELUARAN'
                    ? 'Contoh: Pembelian Kertas A4 dan Materai'
                    : 'Contoh: Top Up Kas Kecil Awal Bulan'
                }
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Rupiah ({entryType === 'PENGELUARAN' ? 'Pengeluaran' : 'Penambahan'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={nominal}
                onChange={(e) => setNominal(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {entryType === 'PENGELUARAN' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Pengeluaran Operasional <span className="text-red-500">*</span>
                </label>
                <select
                  value={jenisPengeluaran}
                  onChange={(e) => setJenisPengeluaran(e.target.value as JenisPengeluaranKasKecil)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {JENIS_PENGELUARAN_LIST.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center">
                Penambahan dana akan menambah Saldo Kas Kecil.
              </div>
            )}
          </div>

          {/* Conditional Person & Proof Inputs */}
          {entryType === 'PENAMBAHAN' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">Pemberi Kas Kecil (Top Up / Restok)</label>
                <input
                  type="text"
                  placeholder="Contoh: Om Agung / Finance HQ"
                  value={pemberiKas}
                  onChange={(e) => setPemberiKas(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">Penerima Kas Kecil (Staff Klinik)</label>
                <input
                  type="text"
                  placeholder="Contoh: Diana / Kasir Cabang"
                  value={penerimaKas}
                  onChange={(e) => setPenerimaKas(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-rose-50/50 p-3.5 rounded-xl border border-rose-200">
              <div>
                <label className="block text-xs font-bold text-rose-900 mb-1">Petugas yang Mengeluarkan Kas</label>
                <input
                  type="text"
                  placeholder="Contoh: Mutia / Staff"
                  value={pengeluarKas}
                  onChange={(e) => setPengeluarKas(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-900 mb-1">Lampiran / No. Bukti Pengeluaran (Bon / Kwitansi / Faktur)</label>
                <input
                  type="text"
                  placeholder="Contoh: Bon Toko ATK #8831 / Kwitansi Bensin"
                  value={buktiPengeluaran}
                  onChange={(e) => setBuktiPengeluaran(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-sm shadow-md"
            >
              Simpan Transaksi Kas Kecil
            </button>
          </div>
        </form>
      )}

      {/* Pie Chart Analysis for Monthly Expense Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#23277A]" />
              <span>Diagram Pie Alokasi Pengeluaran Kas Kecil Bulanan</span>
            </h3>
          </div>

          {pieChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">
              Belum ada data pengeluaran kas kecil.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatRupiah(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Categories Breakdown List */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
            Rincian Alokasi Per Jenis Pengeluaran
          </h3>
          <div className="space-y-2 overflow-y-auto max-h-64 text-xs pr-1">
            {JENIS_PENGELUARAN_LIST.map((catName) => {
              const catAmount = expenseByCategory[catName] || 0;
              const percentage = totalPengeluaran > 0 ? (catAmount / totalPengeluaran) * 100 : 0;

              return (
                <div key={catName} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800 block">{catName}</span>
                    <span className="text-[10px] text-slate-400">{percentage.toFixed(1)}% dari total pengeluaran</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatRupiah(catAmount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Journal */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Jurnal Buku Kas Kecil (Petty Cash Journal)
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Diurutkan berdasarkan Kronologis Tanggal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Keterangan Keperluan</th>
                <th className="p-3.5">Jenis Pengeluaran</th>
                <th className="p-3.5 text-right text-emerald-400">Penambahan Kas (+)</th>
                <th className="p-3.5 text-right text-rose-400">Pengeluaran (-)</th>
                <th className="p-3.5 text-right text-teal-300">Saldo Kas Kecil</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntriesWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Belum ada data transaksi kas kecil pada periode ini.
                  </td>
                </tr>
              ) : (
                [...filteredEntriesWithBalance].reverse().map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {formatIndoDate(entry.tanggal)}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      <div>{entry.keterangan}</div>
                      {(entry.pemberiKas || entry.penerimaKas) && (
                        <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                          {entry.pemberiKas && <span>Pemberi: <b>{entry.pemberiKas}</b> </span>}
                          {entry.penerimaKas && <span>• Penerima: <b>{entry.penerimaKas}</b></span>}
                        </div>
                      )}
                      {(entry.pengeluarKas || entry.buktiPengeluaran) && (
                        <div className="text-[11px] text-rose-700 mt-0.5 font-medium">
                          {entry.pengeluarKas && <span>Oleh: <b>{entry.pengeluarKas}</b> </span>}
                          {entry.buktiPengeluaran && <span>• Bukti: <b>{entry.buktiPengeluaran}</b></span>}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      {entry.jenisPengeluaran ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {entry.jenisPengeluaran}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          + Restok Kas
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {entry.penambahanKas > 0 ? `+ ${formatRupiah(entry.penambahanKas)}` : '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-rose-600 whitespace-nowrap">
                      {entry.pengeluaran > 0 ? `- ${formatRupiah(entry.pengeluaran)}` : '-'}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 bg-slate-50/80 whitespace-nowrap">
                      {formatRupiah(entry.saldo)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        title="Hapus Entri"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
