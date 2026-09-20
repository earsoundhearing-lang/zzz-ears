import React, { useState } from 'react';
import { DoctorFeeRecord, WakproSharingRecord, BranchCode } from '../../types';
import { 
  Stethoscope, 
  CheckCircle2, 
  Clock, 
  Search, 
  DollarSign, 
  Percent, 
  ExternalLink,
  Printer,
  ChevronDown
} from 'lucide-react';

interface DoctorFeeAndWakproViewProps {
  doctorFees: DoctorFeeRecord[];
  wakproSharings: WakproSharingRecord[];
  onUpdateDoctorFee: (id: string, updates: { percentageOption?: 10 | 15; status?: 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR'; tanggalDibayar?: string; noBukti?: string; metodePembayaran?: any }) => void;
  onUpdateWakpro: (id: string, updates: { isPaid?: boolean; tanggalDibayar?: string; isBeraJambiHospitalPaid?: boolean }) => void;
  selectedBranch: BranchCode | 'ALL';
  canManage: boolean; // true for Finance & Akuntan, false for CEO (monitoring only)
}

export const DoctorFeeAndWakproView: React.FC<DoctorFeeAndWakproViewProps> = ({
  doctorFees = [],
  wakproSharings = [],
  onUpdateDoctorFee,
  onUpdateWakpro,
  selectedBranch,
  canManage,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'DOCTOR_FEE' | 'WAKPRO'>('DOCTOR_FEE');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment modal state
  const [paymentModalData, setPaymentModalData] = useState<{
    isOpen: boolean;
    feeRecord?: DoctorFeeRecord;
    metode: 'Kas Bank BSI' | 'Kas Bank BNI' | 'Kas Kecil' | 'Kas Besar';
    tanggal: string;
    noBukti: string;
    catatan: string;
  }>({
    isOpen: false,
    metode: 'Kas Bank BSI',
    tanggal: new Date().toISOString().split('T')[0],
    noBukti: '',
    catatan: '',
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Filter Doctor Fees
  const filteredDoctorFees = doctorFees.filter(f => {
    const matchesBranch = selectedBranch === 'ALL' || f.branchCode === selectedBranch;
    const matchesStatus = filterStatus === 'ALL' || f.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      f.namaDokter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.namaPasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.nomorInvoiceOrKwitansi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesStatus && matchesSearch;
  });

  // Filter Wakpro
  const filteredWakpro = wakproSharings.filter(w => {
    const matchesBranch = selectedBranch === 'ALL' || w.branchCode === selectedBranch;
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'SUDAH_DIBAYAR' && w.isPaidToWakpro) ||
      (filterStatus === 'BELUM_DIBAYAR' && !w.isPaidToWakpro);
    const matchesSearch = searchQuery === '' || 
      w.namaPasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.jenisPemeriksaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.nomorKwitansi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesStatus && matchesSearch;
  });

  // Totals
  const totalUtangDoctor = doctorFees
    .filter(f => (selectedBranch === 'ALL' || f.branchCode === selectedBranch) && f.status === 'BELUM_DIBAYAR')
    .reduce((acc, f) => acc + f.nominalFee, 0);

  const totalPaidDoctor = doctorFees
    .filter(f => (selectedBranch === 'ALL' || f.branchCode === selectedBranch) && f.status === 'SUDAH_DIBAYAR')
    .reduce((acc, f) => acc + f.nominalFee, 0);

  const totalUtangWakpro = wakproSharings
    .filter(w => (selectedBranch === 'ALL' || w.branchCode === selectedBranch) && !w.isPaidToWakpro)
    .reduce((acc, w) => acc + w.nominalBagiHasil, 0);

  const totalPaidWakpro = wakproSharings
    .filter(w => (selectedBranch === 'ALL' || w.branchCode === selectedBranch) && w.isPaidToWakpro)
    .reduce((acc, w) => acc + w.nominalBagiHasil, 0);

  const handleOpenPayment = (fee: DoctorFeeRecord) => {
    setPaymentModalData({
      isOpen: true,
      feeRecord: fee,
      metode: 'Kas Bank BSI',
      tanggal: new Date().toISOString().split('T')[0],
      noBukti: `TRF-FEE-${Date.now().toString().slice(-6)}`,
      catatan: `Pembayaran fee ${fee.namaDokter} untuk pasien ${fee.namaPasien}`,
    });
  };

  const handleConfirmPayment = () => {
    if (!paymentModalData.feeRecord) return;
    onUpdateDoctorFee(paymentModalData.feeRecord.id, {
      status: 'SUDAH_DIBAYAR',
      tanggalDibayar: paymentModalData.tanggal,
      noBukti: paymentModalData.noBukti,
      metodePembayaran: paymentModalData.metode,
    });
    setPaymentModalData(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-[#2A2F86] border border-indigo-100">
              AKUN 212 & 503 • AKUN 213 & 504
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
              Otomasi Aturan Klinik Earsound
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Utang Fee Dokter & Bagi Hasil Wakpro</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola kewajiban komisi rujukan dokter umum/spesialis dan bagi hasil peralatan audiologi mitra
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak Rekap Fee
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Utang Fee Dokter (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 font-mono">{formatRupiah(totalUtangDoctor)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Akun 212 • Belum ditransfer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Fee Dokter Sudah Dibayar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono">{formatRupiah(totalPaidDoctor)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Akun 503 • Diakui sebagai Beban</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Utang Bagi Hasil Wakpro</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-600 font-mono">{formatRupiah(totalUtangWakpro)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Akun 213 • Alat Tymp, OAE, BERA</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Wakpro Sudah Disetor</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 font-mono">{formatRupiah(totalPaidWakpro)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Akun 504 • Beban Bagi Hasil</p>
        </div>
      </div>

      {/* Rules Information Box */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-1.5">
        <div className="font-bold flex items-center gap-1.5 text-indigo-900">
          <Stethoscope className="w-4 h-4 text-[#2A2F86]" />
          <span>Aturan Sistem Akuntansi Fee Dokter & Wakpro:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-slate-700 text-[11.5px] pl-5 list-disc">
          <div>• <strong>Audiometri, Nada Murni, FFT (Selain Jambi):</strong> Rp 20.000 / pemeriksaan jika referral dokter.</div>
          <div>• <strong>Audiometri (Khusus Jambi):</strong> Rp 10.000 / pasien jika referral dokter.</div>
          <div>• <strong>Tympanometry & OAE (Selain Jambi):</strong> Milik Wakpro → Utang Bagi Hasil Rp 100.000 / pemeriksaan.</div>
          <div>• <strong>Tympanometry & OAE (Khusus Jambi):</strong> Bagi hasil Rp 170.000 / pemeriksaan.</div>
          <div>• <strong>BERA Cabang Jambi:</strong> Milik Wakpro → Utang Bagi Hasil Rp 1.000.000 (jika sudah dilunasi RS).</div>
          <div>• <strong>Penjualan Alat Bantu Dengar (ABD):</strong> Fee dokter 10% atau 15% dari harga jual alat (dapat dipilih langsung).</div>
        </div>
      </div>

      {/* Sub Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Sub Tab buttons */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('DOCTOR_FEE')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'DOCTOR_FEE' 
                  ? 'bg-white text-[#2A2F86] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fee Dokter Rujukan ({doctorFees.length})
            </button>
            <button
              onClick={() => setActiveSubTab('WAKPRO')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'WAKPRO' 
                  ? 'bg-white text-[#2A2F86] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bagi Hasil Wakpro & Alat Mitra ({wakproSharings.length})
            </button>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2A2F86]"
            >
              <option value="ALL">Semua Status</option>
              <option value="BELUM_DIBAYAR">Belum Dibayar (Utang)</option>
              <option value="SUDAH_DIBAYAR">Sudah Dibayar (Lunas)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder={activeSubTab === 'DOCTOR_FEE' ? 'Cari nama dokter, nama pasien, atau invoice...' : 'Cari jenis pemeriksaan atau nama pasien...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2A2F86] focus:bg-white transition-all"
          />
        </div>

        {/* Table Content */}
        {activeSubTab === 'DOCTOR_FEE' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Tanggal & Cabang</th>
                  <th className="py-3 px-4">Dokter & Pasien</th>
                  <th className="py-3 px-4">Jenis Transaksi & Item</th>
                  <th className="py-3 px-4 text-right">Nilai Transaksi</th>
                  <th className="py-3 px-4 text-center">Skema / Rate</th>
                  <th className="py-3 px-4 text-right">Nominal Fee</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi / Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctorFees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data fee dokter yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredDoctorFees.map(fee => (
                    <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{fee.tanggal}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Cabang: {fee.branchCode}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{fee.nomorInvoiceOrKwitansi}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{fee.namaDokter}</div>
                        <div className="text-[11px] text-slate-500">Pasien: {fee.namaPasien}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          fee.sourceType === 'PENJUALAN_ABD' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {fee.sourceType === 'PENJUALAN_ABD' ? 'Penjualan ABD' : 'Jasa Periksa'}
                        </span>
                        <div className="text-[11px] text-slate-600 mt-1 max-w-[200px] truncate" title={fee.detailPemeriksaanOrItem}>
                          {fee.detailPemeriksaanOrItem}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(fee.nilaiTransaksi)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {fee.sourceType === 'PENJUALAN_ABD' ? (
                          canManage && fee.status === 'BELUM_DIBAYAR' ? (
                            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                              <button
                                onClick={() => onUpdateDoctorFee(fee.id, { percentageOption: 10 })}
                                className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                                  (fee.percentageOption || 10) === 10 ? 'bg-[#2A2F86] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                10%
                              </button>
                              <button
                                onClick={() => onUpdateDoctorFee(fee.id, { percentageOption: 15 })}
                                className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                                  fee.percentageOption === 15 ? 'bg-[#2A2F86] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                15%
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 text-[#2A2F86]">
                              {fee.percentageOption || 10}%
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">Flat Medis</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(fee.nominalFee)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {fee.status === 'SUDAH_DIBAYAR' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" /> LUNAS
                            </span>
                            {fee.tanggalDibayar && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{fee.tanggalDibayar}</div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock className="w-3 h-3" /> UTANG
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canManage ? (
                          fee.status === 'BELUM_DIBAYAR' ? (
                            <button
                              onClick={() => handleOpenPayment(fee)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                            >
                              Bayar Fee
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateDoctorFee(fee.id, { status: 'BELUM_DIBAYAR' })}
                              className="text-[10px] text-slate-400 hover:text-red-600 underline"
                              title="Batalkan status lunas kembali ke utang"
                            >
                              Batal Bayar
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400">Hanya Pantau (CEO)</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* WAKPRO TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Tanggal & Cabang</th>
                  <th className="py-3 px-4">Pasien & Kwitansi</th>
                  <th className="py-3 px-4">Alat & Jenis Pemeriksaan</th>
                  <th className="py-3 px-4 text-right">Bagi Hasil Wakpro</th>
                  <th className="py-3 px-4 text-center">Pelunasan RS (Khusus BERA)</th>
                  <th className="py-3 px-4 text-center">Status Setor</th>
                  <th className="py-3 px-4 text-center">Aksi / Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWakpro.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data bagi hasil Wakpro yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredWakpro.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{w.tanggal}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Cabang: {w.branchCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{w.namaPasien}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{w.nomorKwitansi}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{w.jenisPemeriksaan}</span>
                        {w.branchCode === 'JB' && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold">
                            Khusus Jambi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(w.nominalBagiHasil)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {w.jenisPemeriksaan.includes('BERA') ? (
                          canManage ? (
                            <button
                              onClick={() => onUpdateWakpro(w.id, { isBeraJambiHospitalPaid: !w.isBeraJambiHospitalPaid })}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                w.isBeraJambiHospitalPaid 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {w.isBeraJambiHospitalPaid ? '✓ RS Sudah Lunas' : 'Menunggu Pelunasan RS'}
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-600">
                              {w.isBeraJambiHospitalPaid ? 'Lunas RS' : 'Menunggu RS'}
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {w.isPaidToWakpro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" /> SUDAH DISETOR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock className="w-3 h-3" /> UTANG WAKPRO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {canManage ? (
                          !w.isPaidToWakpro ? (
                            <button
                              onClick={() => onUpdateWakpro(w.id, { isPaid: true, tanggalDibayar: new Date().toISOString().split('T')[0] })}
                              className="px-3 py-1.5 bg-[#2A2F86] hover:bg-[#23277A] text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                            >
                              Setor ke Wakpro
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateWakpro(w.id, { isPaid: false })}
                              className="text-[10px] text-slate-400 hover:text-red-600 underline"
                            >
                              Batal Setor
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400">Hanya Pantau (CEO)</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      {paymentModalData.isOpen && paymentModalData.feeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Pembayaran Fee Dokter Rujukan</h3>
              </div>
              <button 
                onClick={() => setPaymentModalData(prev => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Dokter:</span>
                <span className="font-bold text-slate-800">{paymentModalData.feeRecord.namaDokter}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pasien:</span>
                <span className="font-semibold text-slate-700">{paymentModalData.feeRecord.namaPasien}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan:</span>
                <span className="text-slate-700">{paymentModalData.feeRecord.detailPemeriksaanOrItem}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800">Nominal Fee:</span>
                <span className="font-bold font-mono text-base text-emerald-600">
                  {formatRupiah(paymentModalData.feeRecord.nominalFee)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sumber Kas / Rekening Pembayaran:</label>
                <select
                  value={paymentModalData.metode}
                  onChange={(e) => setPaymentModalData(prev => ({ ...prev, metode: e.target.value as any }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2A2F86]"
                >
                  <option value="Kas Bank BSI">101 • Kas Bank BSI</option>
                  <option value="Kas Bank BNI">102 • Kas Bank BNI</option>
                  <option value="Kas Kecil">104 • Kas Kecil Klinik</option>
                  <option value="Kas Besar">103 • Kas Besar Kantor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tanggal Transfer / Bayar:</label>
                <input
                  type="date"
                  value={paymentModalData.tanggal}
                  onChange={(e) => setPaymentModalData(prev => ({ ...prev, tanggal: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2A2F86]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nomor Bukti Transfer / Kwitansi:</label>
                <input
                  type="text"
                  value={paymentModalData.noBukti}
                  onChange={(e) => setPaymentModalData(prev => ({ ...prev, noBukti: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#2A2F86]"
                  placeholder="Contoh: TRF-BSI-9009-012"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setPaymentModalData(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-2.5 bg-[#2A2F86] hover:bg-[#23277A] text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
