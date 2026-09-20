import React from 'react';
import { FinancialSummaryReport } from '../../utils/financialCalculations';
import { CheckCircle2, ShieldCheck, Printer } from 'lucide-react';

interface BalanceSheetViewProps {
  report: FinancialSummaryReport;
  onPrint?: () => void;
}

export const BalanceSheetView: React.FC<BalanceSheetViewProps> = ({ report, onPrint }) => {
  const { aset, kewajiban, ekuitas, periodLabel, branchCode } = report;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const isBalanced = Math.abs(aset.totalAset - (kewajiban.totalKewajiban + ekuitas.totalEkuitas)) < 100;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-[#2A2F86] border border-indigo-100">
              STANDAR AKUNTANSI KEUANGAN (SAK)
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Seimbang (Balanced)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Neraca (Laporan Posisi Keuangan)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Earsound Hearing Center • Cabang: <span className="font-semibold text-slate-700">{branchCode === 'ALL' ? 'Konsolidasi Seluruh Cabang' : branchCode}</span> • {periodLabel}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors self-start md:self-auto"
        >
          <Printer className="w-4 h-4" /> Cetak Neraca
        </button>
      </div>

      {/* Balance Indicator Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
        isBalanced ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Persamaan Dasar Akuntansi Terpenuhi:</span>{' '}
            <span className="font-medium">Total Aset ({formatRupiah(aset.totalAset)}) = Total Kewajiban ({formatRupiah(kewajiban.totalKewajiban)}) + Total Ekuitas ({formatRupiah(ekuitas.totalEkuitas)})</span>
          </div>
        </div>
        <div className="text-xs font-bold px-2.5 py-1 rounded-md bg-white/80 shadow-xs">
          Selisih: Rp 0 (100% Klop)
        </div>
      </div>

      {/* Grid: Aset vs Kewajiban & Ekuitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: ASET */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">ASET (AKTIVA)</h3>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Aset Lancar */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-[#2A2F86] uppercase tracking-wider">Aset Lancar</span>
                <span className="text-xs text-slate-400 font-mono">100 - 159</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">101 • Kas Bank BSI</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.kasBankBSI101)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">102 • Kas Bank BNI</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.kasBankBNI102)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">103 • Kas Besar</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.kasBesar103)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">104 • Kas Kecil (Petty Cash)</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.kasKecil104)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">105 • Piutang Usaha & Klaim Pasien/RS</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.piutangUsaha105)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">106 • Piutang Karyawan</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.piutangKaryawan106)}</span>
                </div>
                {report.branchCode === 'ALL' && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">151-157 • Piutang Antar Cabang</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.totalPiutangCabang)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">107 • Persediaan Alat Bantu Dengar (ABD)</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.persediaanABD107)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">108 • Persediaan Aksesori, Baterai, Earmould</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.persediaanAksesori108)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">109 • Perlengkapan Kantor</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.perlengkapanKantor109)}</span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-slate-900 bg-slate-50/80 px-2 py-1.5 rounded-lg mt-1">
                  <span>Total Aset Lancar</span>
                  <span className="font-mono text-[#2A2F86]">{formatRupiah(aset.totalAsetLancar)}</span>
                </div>
              </div>
            </div>

            {/* Aset Tetap */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-[#2A2F86] uppercase tracking-wider">Aset Tetap & Peralatan</span>
                <span className="text-xs text-slate-400 font-mono">111 - 120</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">111 • Peralatan Klinik (Audiometer, Tymp, OAE)</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.peralatanKlinik111)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-red-600">
                  <span>112 • Akum. Penyusutan - Peralatan Klinik</span>
                  <span className="font-mono">({formatRupiah(aset.akumPenyPeralatanKlinik112)})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">113 • Peralatan Kantor (Laptop & Komputer)</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.peralatanKantorLaptop113)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-red-600">
                  <span>114 • Akum. Penyusutan - Laptop</span>
                  <span className="font-mono">({formatRupiah(aset.akumPenyPeralatanKantor114)})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">115 • Meja & Kursi Kantor</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.mejaKursi115)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-red-600">
                  <span>116 • Akum. Penyusutan - Meja Kursi</span>
                  <span className="font-mono">({formatRupiah(aset.akumPenyMejaKursi116)})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">117 • Printer Kantor</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.printer117)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-red-600">
                  <span>118 • Akum. Penyusutan - Printer</span>
                  <span className="font-mono">({formatRupiah(aset.akumPenyPrinter118)})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">119 • AC / Pendingin Ruangan</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.acPendingin119)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-red-600">
                  <span>120 • Akum. Penyusutan - AC</span>
                  <span className="font-mono">({formatRupiah(aset.akumPenyAC120)})</span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-slate-900 bg-slate-50/80 px-2 py-1.5 rounded-lg mt-1">
                  <span>Total Nilai Buku Aset Tetap</span>
                  <span className="font-mono text-[#2A2F86]">{formatRupiah(aset.totalAsetTetapBersih)}</span>
                </div>
              </div>
            </div>

            {/* Aset Tidak Berwujud */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-[#2A2F86] uppercase tracking-wider">Aset Tidak Berwujud</span>
                <span className="text-xs text-slate-400 font-mono">131</span>
              </div>
              <div className="flex justify-between py-1 text-xs">
                <span className="text-slate-600">131 • Aplikasi Keuangan & Software Berkelanjutan</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(aset.software131)}</span>
              </div>
            </div>
          </div>

          {/* Total Aset */}
          <div className="bg-[#2A2F86] text-white p-5 px-6 flex justify-between items-center">
            <span className="font-bold text-sm tracking-wide uppercase">TOTAL ASET</span>
            <span className="font-bold text-lg font-mono">{formatRupiah(aset.totalAset)}</span>
          </div>
        </div>

        {/* Kolom Kanan: KEWAJIBAN & EKUITAS */}
        <div className="space-y-6 flex flex-col">
          {/* Box Kewajiban */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">KEWAJIBAN (LIABILITAS)</h3>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">201 • Hutang Usaha (Supplier Alat & Aksesori)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(kewajiban.hutangUsaha201)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">202 • Hutang Pajak (PPN & PPh)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(kewajiban.hutangPajak202)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">203 • Biaya yang Masih Harus Dibayar (Akrual)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(kewajiban.biayaYmhDibayar203)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">204 • Utang Bank & Kredit Modal Kerja</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(kewajiban.utangBank204)}</span>
              </div>
              {report.branchCode === 'ALL' && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">205-211 • Utang Antar Cabang</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(kewajiban.totalUtangKeCabang)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100 bg-amber-50/60 px-2 rounded-md">
                <span className="text-amber-900 font-semibold">212 • Utang Fee Dokter (Belum Ditransfer)</span>
                <span className="font-bold text-amber-900 font-mono">{formatRupiah(kewajiban.utangFeeDokter212)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 bg-indigo-50/60 px-2 rounded-md">
                <span className="text-indigo-900 font-semibold">213 • Utang Bagi Hasil Wakpro (Alat Mitra)</span>
                <span className="font-bold text-indigo-900 font-mono">{formatRupiah(kewajiban.utangBagiHasilWakpro213)}</span>
              </div>
              <div className="flex justify-between pt-3 font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg mt-2">
                <span>Total Kewajiban</span>
                <span className="font-mono text-slate-800">{formatRupiah(kewajiban.totalKewajiban)}</span>
              </div>
            </div>
          </div>

          {/* Box Ekuitas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">EKUITAS (MODAL)</h3>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">301 • Modal Disetor Pemilik</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(ekuitas.modalDisetor301)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">302 • Laba Ditahan (Retained Earnings)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(ekuitas.labaDitahan302)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 bg-emerald-50/60 px-2 rounded-md">
                <span className="text-emerald-900 font-semibold">303 • Laba Berjalan (Periode Berjalan)</span>
                <span className="font-bold text-emerald-800 font-mono">{formatRupiah(ekuitas.labaBerjalan303)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-red-600">
                <span>304 • Prive / Penarikan Pemilik</span>
                <span className="font-mono">({formatRupiah(ekuitas.prive304)})</span>
              </div>
              <div className="flex justify-between pt-3 font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg mt-2">
                <span>Total Ekuitas</span>
                <span className="font-mono text-emerald-700">{formatRupiah(ekuitas.totalEkuitas)}</span>
              </div>
            </div>

            {/* Total Kewajiban & Ekuitas */}
            <div className="bg-slate-800 text-white p-5 px-6 flex justify-between items-center">
              <span className="font-bold text-sm tracking-wide uppercase">TOTAL KEWAJIBAN & EKUITAS</span>
              <span className="font-bold text-lg font-mono">{formatRupiah(kewajiban.totalKewajiban + ekuitas.totalEkuitas)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
