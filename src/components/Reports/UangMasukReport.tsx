import React, { useState } from 'react';
import { AksesorisTransaction, JasaPeriksaTransaction, ABDTransaction } from '../../types';
import { formatRupiah, formatIndoDate } from '../../utils/formatters';
import { getBsiAccountDetails } from '../../utils/branches';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { DollarSign, Wallet, CreditCard, Hospital, Building2, PieChart as PieIcon, BarChart2, Filter, Trash2 } from 'lucide-react';

interface UangMasukReportProps {
  aksesoris: AksesorisTransaction[];
  jasaPeriksa: JasaPeriksaTransaction[];
  abd: ABDTransaction[];
  onDeleteAksesoris?: (id: string) => void;
  onDeleteJasa?: (id: string) => void;
  onDeleteABD?: (id: string) => void;
}

export const UangMasukReport: React.FC<UangMasukReportProps> = ({
  aksesoris = [],
  jasaPeriksa = [],
  abd = [],
  onDeleteAksesoris,
  onDeleteJasa,
  onDeleteABD,
}) => {
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  const safeAksesoris = aksesoris || [];
  const safeJasaPeriksa = jasaPeriksa || [];
  const safeABD = abd || [];

  // Build combined list
  const combinedEntries = [
    ...safeAksesoris.map((a) => ({
      id: a.id,
      tanggal: a.tanggal,
      tipe: 'Aksesoris',
      customer: a.namaCustomer,
      idPelanggan: a.idPelanggan,
      detail: `${a.category} (${a.subtype || ''})`,
      jumlah: a.jumlah,
      payment: a.payment,
      refNumber: a.nomorFaktur,
    })),
    ...safeJasaPeriksa.map((j) => ({
      id: j.id,
      tanggal: j.tanggal,
      tipe: 'Jasa Periksa',
      customer: j.namaCustomer,
      idPelanggan: j.idPelanggan,
      detail: Array.isArray(j.jenisPemeriksaan) ? j.jenisPemeriksaan.join(', ') : (j.jenisPemeriksaan || 'Periksa'),
      jumlah: j.biayaJasaPeriksa,
      payment: j.payment,
      refNumber: j.nomorKwitansi,
    })),
    ...safeABD.map((b) => ({
      id: b.id,
      tanggal: b.tanggal,
      tipe: 'Alat Bantu Dengar',
      customer: b.namaPasien,
      idPelanggan: b.idPelanggan,
      detail: `${b.tipeABD} (${b.fittingType})`,
      jumlah: b.jumlah,
      payment: b.payment,
      refNumber: b.nomorFakturPenjualan,
    })),
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  // Calculations
  const totalOmset = combinedEntries.reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalCash = combinedEntries.reduce((acc, curr) => {
    if (curr.payment.method === 'Cash') return acc + curr.jumlah;
    if (curr.payment.method === 'Split (Cash & Transfer)') return acc + (curr.payment.cashAmount || 0);
    return acc;
  }, 0);

  const totalTransfer = combinedEntries.reduce((acc, curr) => {
    if (curr.payment.method === 'Transfer') return acc + curr.jumlah;
    if (curr.payment.method === 'Split (Cash & Transfer)') return acc + (curr.payment.transferAmount || 0);
    return acc;
  }, 0);

  const totalShopee = combinedEntries
    .filter((e) => e.payment.method === 'Shopee')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalPiutangBPJS = combinedEntries
    .filter((e) => e.payment.method === 'Piutang BPJS')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalPiutangFaskes = combinedEntries
    .filter((e) => e.payment.method === 'Piutang RS/Klinik/Laboratorium')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  // Category totals
  const totalAksesoris = aksesoris.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalJasa = jasaPeriksa.reduce((acc, curr) => acc + curr.biayaJasaPeriksa, 0);
  const totalABD = abd.reduce((acc, curr) => acc + curr.jumlah, 0);

  // Data for Charts
  const paymentChartDataRaw = [
    { name: 'Cash', value: totalCash, color: '#23277A' },
    { name: 'Transfer (BSI)', value: totalTransfer, color: '#F5B438' },
    { name: 'Shopee (YM)', value: totalShopee, color: '#EE4D2D' },
    { name: 'Piutang BPJS', value: totalPiutangBPJS, color: '#3B41B2' },
    { name: 'Piutang RS/Klinik/Lab', value: totalPiutangFaskes, color: '#4A51D1' },
  ];
  const paymentChartData = paymentChartDataRaw.filter((item) => item.value > 0);

  const categoryChartData = [
    { name: 'Aksesoris', value: totalAksesoris, color: '#F5B438' },
    { name: 'Jasa Periksa', value: totalJasa, color: '#3B41B2' },
    { name: 'Alat Bantu Dengar', value: totalABD, color: '#23277A' },
  ];

  // BSI account breakdown
  const bsiAccountsMap: { [key: string]: number } = {};
  combinedEntries.forEach((e) => {
    if (e.payment.method === 'Transfer' && e.payment.bsiAccount) {
      bsiAccountsMap[e.payment.bsiAccount] = (bsiAccountsMap[e.payment.bsiAccount] || 0) + e.jumlah;
    } else if (e.payment.method === 'Split (Cash & Transfer)') {
      const acct = e.payment.splitBsiAccount || e.payment.bsiAccount;
      if (acct) {
        bsiAccountsMap[acct] = (bsiAccountsMap[acct] || 0) + (e.payment.transferAmount || 0);
      }
    }
  });

  const filteredEntries = combinedEntries.filter((e) => {
    if (paymentFilter === 'ALL') return true;
    return e.payment.method === paymentFilter;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#23277A]" />
            <span>Laporan Uang Masuk Omset Earsound</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi seluruh pendapatan dari transaksi Aksesoris, Jasa Periksa, dan Alat Bantu Dengar.
          </p>
        </div>

        <div className="bg-[#23277A]/5 px-5 py-3 rounded-2xl border border-[#23277A]/20 text-right">
          <span className="text-xs font-semibold text-[#23277A] uppercase tracking-wider block">
            Total Omset Uang Masuk
          </span>
          <span className="text-2xl font-black text-[#23277A]">
            {formatRupiah(totalOmset)}
          </span>
        </div>
      </div>

      {/* Summary Cards (4 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#23277A] text-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-200 block">Total Pembayaran Cash</span>
            <span className="text-xl font-extrabold mt-1 block">{formatRupiah(totalCash)}</span>
            <span className="text-[11px] text-amber-300 font-medium">Tunai di Kasir</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-[#181B57] text-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-200 block">Total Transfer Bank BSI</span>
            <span className="text-xl font-extrabold mt-1 block">{formatRupiah(totalTransfer)}</span>
            <span className="text-[11px] text-amber-300 font-medium">8 Rekening Resmi Cabang BSI</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-[#3B41B2] text-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-200 block">Total Piutang BPJS</span>
            <span className="text-xl font-extrabold mt-1 block">{formatRupiah(totalPiutangBPJS)}</span>
            <span className="text-[11px] text-amber-300 font-medium">Klaim / Kwitansi BPJS</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl shrink-0">
            <Hospital className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-[#4A51D1] text-white p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-200 block">Piutang RS / Klinik / Lab</span>
            <span className="text-xl font-extrabold mt-1 block">{formatRupiah(totalPiutangFaskes)}</span>
            <span className="text-[11px] text-amber-300 font-medium">Kemitraan Instansi</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Visual Diagrams Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagram 1: Payment Method Breakdown Pie */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#23277A]" />
              <span>Proporsi Uang Masuk Berdasarkan Cara Pembayaran</span>
            </h3>
          </div>
          <div className="h-64">
            {paymentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatRupiah(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Belum ada data transaksi uang masuk.
              </div>
            )}
          </div>
        </div>

        {/* Diagram 2: Category Breakdown Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#23277A]" />
              <span>Omset Berdasarkan Kategori Transaksi</span>
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(val: number) => formatRupiah(val)} />
                <Bar dataKey="value" name="Omset (Rp)" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BSI Account Breakdown Detail */}
      {Object.keys(bsiAccountsMap).length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
            Rincian Penerimaan Transfer Per Rekening BSI:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(bsiAccountsMap).map(([accName, accTotal]) => {
              const bsiInfo = getBsiAccountDetails(accName);
              return (
                <div key={accName} className="bg-teal-50/70 p-3 rounded-xl border border-teal-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-mono font-bold text-slate-800">{accName}</span>
                    {bsiInfo && (
                      <span className="text-[10px] font-extrabold bg-teal-200 text-teal-900 px-1.5 py-0.5 rounded-full">
                        {bsiInfo.branchName}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-teal-800">{formatRupiah(accTotal)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ledger Filter & Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Riwayat Seluruh Transaksi Uang Masuk ({filteredEntries.length})
          </h3>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-semibold rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Semua Cara Pembayaran</option>
              <option value="Cash">Hanya Cash</option>
              <option value="Transfer">Hanya Transfer BSI</option>
              <option value="Shopee">Hanya Shopee (Khusus Yamin)</option>
              <option value="Split (Cash & Transfer)">Hanya Split (Cash & Transfer)</option>
              <option value="Piutang BPJS">Hanya Piutang BPJS</option>
              <option value="Piutang RS/Klinik/Laboratorium">Hanya Piutang RS/Klinik/Lab</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jenis Transaksi</th>
                <th className="p-3.5">No. Ref / Faktur</th>
                <th className="p-3.5">Customer / Pasien</th>
                <th className="p-3.5">Deskripsi Item</th>
                <th className="p-3.5">Cara Pembayaran</th>
                <th className="p-3.5 text-right">Nominal Omset</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                    {formatIndoDate(item.tanggal)}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                        item.tipe === 'Aksesoris'
                          ? 'bg-blue-100 text-blue-800'
                          : item.tipe === 'Jasa Periksa'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {item.tipe}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-xs font-bold text-slate-700">
                    {item.refNumber}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{item.customer}</div>
                    <div className="text-xs text-slate-400">{item.idPelanggan}</div>
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">
                    {item.detail}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    {item.payment.method === 'Shopee' ? (
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#EE4D2D] bg-orange-100 border border-orange-300 px-2 py-0.5 rounded text-xs inline-block">
                          Shopee (YM)
                        </span>
                        {item.payment.shopeeOrderNo && (
                          <div className="text-[10px] text-orange-800 font-mono font-medium">
                            No: {item.payment.shopeeOrderNo}
                          </div>
                        )}
                      </div>
                    ) : item.payment.method === 'Split (Cash & Transfer)' ? (
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs inline-block">
                          Split (Cash & TF)
                        </span>
                        <div className="text-[11px] text-emerald-700 font-mono font-semibold">
                          C: {formatRupiah(item.payment.cashAmount || 0)}
                        </div>
                        <div className="text-[11px] text-teal-700 font-mono font-semibold">
                          TF: {formatRupiah(item.payment.transferAmount || 0)}
                        </div>
                        {item.payment.splitBsiAccount && (
                          <div className="text-[10px] text-slate-500 font-mono">{item.payment.splitBsiAccount}</div>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-800">{item.payment.method}</span>
                        {item.payment.bsiAccount && (
                          <div className="text-[11px] text-teal-700 font-semibold">{item.payment.bsiAccount}</div>
                        )}
                        {item.payment.namaRSBPJS && (
                          <div className="text-[11px] text-blue-700 font-semibold">RS: {item.payment.namaRSBPJS}</div>
                        )}
                        {item.payment.namaFaskes && (
                          <div className="text-[11px] text-purple-700 font-semibold">Faskes: {item.payment.namaFaskes}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-black text-emerald-700 whitespace-nowrap">
                    {formatRupiah(item.jumlah)}
                  </td>
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => {
                        if (item.tipe === 'Aksesoris' && onDeleteAksesoris) {
                          onDeleteAksesoris(item.id);
                        } else if (item.tipe === 'Jasa Periksa' && onDeleteJasa) {
                          onDeleteJasa(item.id);
                        } else if (item.tipe === 'Alat Bantu Dengar' && onDeleteABD) {
                          onDeleteABD(item.id);
                        }
                      }}
                      className="inline-flex items-center justify-center p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

