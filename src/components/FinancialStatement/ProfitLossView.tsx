import React from 'react';
import { FinancialSummaryReport } from '../../utils/financialCalculations';
import { TrendingUp, ArrowDownRight, DollarSign, Printer } from 'lucide-react';

interface ProfitLossViewProps {
  report: FinancialSummaryReport;
}

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({ report }) => {
  const { pendapatan, hpp, labaKotor, bebanOperasional, labaBersihOperasional, periodLabel, branchCode } = report;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const grossMargin = pendapatan.totalPendapatan > 0 
    ? ((labaKotor / pendapatan.totalPendapatan) * 100).toFixed(1)
    : '0.0';

  const netMargin = pendapatan.totalPendapatan > 0 
    ? ((labaBersihOperasional / pendapatan.totalPendapatan) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-[#2A2F86] border border-indigo-100">
              STANDAR AKUNTANSI KEUANGAN (SAK)
            </span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
              labaBersihOperasional >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {labaBersihOperasional >= 0 ? 'Surplus / Laba Bersih' : 'Defisit / Rugi'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Laporan Laba Rugi (Profit & Loss Statement)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Earsound Hearing Center • Cabang: <span className="font-semibold text-slate-700">{branchCode === 'ALL' ? 'Konsolidasi Seluruh Cabang' : branchCode}</span> • {periodLabel}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors self-start md:self-auto"
        >
          <Printer className="w-4 h-4" /> Cetak Laporan P/L
        </button>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Pendapatan (Gross)</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">{formatRupiah(pendapatan.totalPendapatan)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Jasa, ABD, Aksesori, B2B & Instrumen</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Laba Kotor (Gross Profit)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">{formatRupiah(labaKotor)}</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Margin Kotor: {grossMargin}%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Beban Operasional</span>
            <ArrowDownRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-800 font-mono">{formatRupiah(bebanOperasional.totalBebanOperasional)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Gaji, utilitas, marketing, kas kecil</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${
          labaBersihOperasional >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'
        }`}>
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Laba Bersih (Net Profit)</span>
            <TrendingUp className={`w-4 h-4 ${labaBersihOperasional >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
          </div>
          <div className={`text-xl font-bold font-mono ${labaBersihOperasional >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatRupiah(labaBersihOperasional)}
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Net Profit Margin: {netMargin}%</p>
        </div>
      </div>

      {/* Main Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 text-xs">
          
          {/* BAGIAN 1: PENDAPATAN */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-[#2A2F86] uppercase tracking-wide">I. PENDAPATAN OPERASIONAL</span>
              <span className="text-xs font-mono text-slate-400">Akun 401 - 407</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">401 • Pendapatan Jasa Pemeriksaan (Audiometri, Tymp, OAE, BERA, FFT)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(pendapatan.jasaPemeriksaan401)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">402 • Penjualan Alat Bantu Dengar (ABD Retail)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(pendapatan.penjualanABD402)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">403 • Penjualan Aksesori & Baterai (Baterai, Earmould, Dehumidifier, Dome)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(pendapatan.penjualanAksesori403)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">404 • Pendapatan Servis, Reparasi & Perawatan Alat</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(pendapatan.servisPerawatan404)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-600">405 • Pendapatan Lain-lain</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(pendapatan.pendapatanLain405)}</span>
              </div>
              {(report.branchCode === 'ALL' || report.branchCode === 'MD') && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-600">406 • Penjualan B2B Maindealer (Grosir ABD, Dokter & RS Rekanan)</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatRupiah(pendapatan.penjualanB2B406)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-600">407 • Penjualan Instrumen Audiologi Maindealer (Audiometer, HiPRO, Noahlink)</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatRupiah(pendapatan.penjualanInstrumen407)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2.5 font-bold text-slate-900 bg-indigo-50/60 px-3 py-2 rounded-xl mt-1">
                <span>TOTAL PENDAPATAN OPERASIONAL</span>
                <span className="font-mono text-[#2A2F86] text-sm">{formatRupiah(pendapatan.totalPendapatan)}</span>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: BEBAN POKOK PENDAPATAN (HPP) */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#2A2F86] uppercase tracking-wide">II. HARGA POKOK PENJUALAN & JASA (HPP)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Master HPP Resmi Aktif
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">Akun 501 - 505</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">501 • HPP Alat Bantu Dengar (ABD Terjual)</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">60 SKU</span>
                </div>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(hpp.hppABD501)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">502 • HPP Aksesori, Baterai, Earmould</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">41 SKU</span>
                </div>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(hpp.hppAksesori502)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 bg-amber-50/50 px-2 rounded-md">
                <span className="text-amber-900 font-medium">503 • Fee Dokter / Audiologis (Jasa Periksa & Penjualan ABD Rujukan)</span>
                <span className="font-bold text-amber-900 font-mono">{formatRupiah(hpp.feeDokter503)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 bg-indigo-50/50 px-2 rounded-md">
                <span className="text-indigo-900 font-medium">504 • Beban Bagi Hasil Wakpro (Tymp, OAE & BERA)</span>
                <span className="font-bold text-indigo-900 font-mono">{formatRupiah(hpp.bagiHasilWakpro504)}</span>
              </div>
              {(report.branchCode === 'ALL' || report.branchCode === 'MD') && (
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">505 • HPP B2B & Instrumen Audiologi Maindealer</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatRupiah(hpp.hppB2B505)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2.5 font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl mt-1">
                <span>TOTAL HARGA POKOK PENJUALAN & JASA</span>
                <span className="font-mono text-slate-800 text-sm">({formatRupiah(hpp.totalHPP)})</span>
              </div>

              {/* Subtotal Laba Kotor */}
              <div className="flex justify-between pt-3 font-bold text-emerald-900 bg-emerald-50 px-4 py-3 rounded-xl mt-3 border border-emerald-200">
                <span className="text-sm">LABA KOTOR (GROSS PROFIT)</span>
                <span className="font-mono text-base">{formatRupiah(labaKotor)}</span>
              </div>
            </div>
          </div>

          {/* BAGIAN 3: BEBAN OPERASIONAL */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-[#2A2F86] uppercase tracking-wide">III. BEBAN OPERASIONAL KLINIK & KANTOR</span>
              <span className="text-xs font-mono text-slate-400">Akun 601 - 625</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">601 • Beban Gaji & Tunjangan Staf</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.gajiTunjangan601)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">603 • Biaya ADM Bank</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.admBank603)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">604 • Biaya Aplikasi Keuangan</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.aplikasiKeuangan604)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">605 • Biaya ATK dan Service</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.atkService605)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">606 • Biaya Cetak Marketing</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.cetakMarketing606)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">607 • Biaya Gathering</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.gathering607)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">608 • Biaya Iklan Online</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.iklanOnline608)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">609 • Biaya Insentif</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.insentif609)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">610 • Biaya Internet (Wifi)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.internet610)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">611 • Biaya Kebutuhan Lab</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.kebutuhanLab611)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">612 • Biaya Listrik (PLN)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.pln612)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">613 • Biaya LPM / Keamanan & Kebersihan</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.lpm613)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">614 • Biaya Pantry (Konsumsi & Galon)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.pantry614)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">615 • Biaya Air (PDAM)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.pdam615)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">616 • Biaya Penginapan Karyawan</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.penginapan616)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">617 • Biaya Pengiriman (Ekspedisi/Kurir)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.pengiriman617)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">618 • Biaya Perawatan Bangunan</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.perawatanBangunan618)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">619 • Biaya Perlengkapan Kantor</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.perlengkapanKantor619)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">620 • Biaya Training</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.training620)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">621 • Biaya Transport Operasional</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.transport621)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">622 • Biaya Transport Luar Kota</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.transportLuarKota622)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">623 • ZISWAF</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.ziswaf623)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">624 • Biaya THR</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.thr624)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">625 • Biaya Lain-lain</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(bebanOperasional.lainLain625)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-3 font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl mt-4">
              <span>TOTAL BEBAN OPERASIONAL</span>
              <span className="font-mono text-slate-800 text-sm">({formatRupiah(bebanOperasional.totalBebanOperasional)})</span>
            </div>
          </div>

          {/* BAGIAN 4: LABA BERSIH OPERASIONAL */}
          <div className="p-6 bg-slate-50/50">
            <div className="flex justify-between items-center bg-[#2A2F86] text-white p-5 px-6 rounded-2xl shadow-sm">
              <div>
                <span className="text-xs uppercase font-semibold text-indigo-200 tracking-wider block">HASIL AKHIR BERJALAN</span>
                <span className="text-base font-bold">LABA (RUGI) BERSIH OPERASIONAL</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono tracking-tight">{formatRupiah(labaBersihOperasional)}</span>
                <span className="block text-[11px] text-indigo-200 mt-0.5">Dialokasikan ke Ekuitas (303 Laba Berjalan)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
