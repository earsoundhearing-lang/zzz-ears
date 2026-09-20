import React from 'react';
import { FinancialSummaryReport } from '../../utils/financialCalculations';
import { ArrowUpRight, ArrowDownLeft, Wallet, Printer } from 'lucide-react';

interface CashFlowViewProps {
  report: FinancialSummaryReport;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ report }) => {
  const { arusKas, aset, periodLabel, branchCode } = report;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const totalKasBankRiil = aset.kasBankBSI101 + aset.kasBankBNI102 + aset.kasBesar103 + aset.kasKecil104;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-[#2A2F86] border border-indigo-100">
              STANDAR AKUNTANSI KEUANGAN (SAK)
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              Metode Langsung (Direct Method)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Laporan Arus Kas (Cash Flow Statement)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Earsound Hearing Center • Cabang: <span className="font-semibold text-slate-700">{branchCode === 'ALL' ? 'Konsolidasi Seluruh Cabang' : branchCode}</span> • {periodLabel}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors self-start md:self-auto"
        >
          <Printer className="w-4 h-4" /> Cetak Arus Kas
        </button>
      </div>

      {/* High-level Cash Position */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Kas Masuk Operasi</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600 font-mono">{formatRupiah(arusKas.kasMasukOperasi)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Penerimaan kas & transfer pasien/B2B</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Kas Keluar Operasi</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-600 font-mono">{formatRupiah(arusKas.kasKeluarOperasi)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Biaya harian, HPP, fee dokter terbayar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Saldo Kas & Bank Akhir</span>
            <Wallet className="w-4 h-4 text-[#2A2F86]" />
          </div>
          <div className="text-lg font-bold text-[#2A2F86] font-mono">{formatRupiah(totalKasBankRiil)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Rekonsiliasi BSI + BNI + Kas Besar + Kecil</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="divide-y divide-slate-100">
          
          {/* I. ARUS KAS DARI AKTIVITAS OPERASI */}
          <div className="p-6">
            <div className="font-bold text-sm text-[#2A2F86] uppercase tracking-wide mb-3">
              I. ARUS KAS DARI AKTIVITAS OPERASIONAL
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-700">
                <span>Penerimaan Kas dari Pasien (Penjualan ABD, Aksesori, Servis)</span>
                <span className="font-semibold text-slate-800 font-mono">{formatRupiah(arusKas.kasMasukOperasi)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-700">
                <span>Pembayaran Pembelian Barang Dagangan & Suplai HPP</span>
                <span className="font-semibold text-slate-800 font-mono">({formatRupiah(Math.round(report.hpp.totalHPP * 0.6))})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-700">
                <span>Pembayaran Beban Operasional Klinik & Kantor</span>
                <span className="font-semibold text-slate-800 font-mono">({formatRupiah(report.bebanOperasional.totalBebanOperasional)})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-700">
                <span>Pembayaran Fee Dokter & Bagi Hasil Wakpro yang Telah Ditransfer</span>
                <span className="font-semibold text-slate-800 font-mono">({formatRupiah(report.doctorFeePaidTotal + report.wakproPaidTotal)})</span>
              </div>
              <div className="flex justify-between pt-2.5 font-bold text-emerald-900 bg-emerald-50 px-3 py-2 rounded-xl mt-1">
                <span>Arus Kas Bersih dari Aktivitas Operasional</span>
                <span className="font-mono text-emerald-700">{formatRupiah(arusKas.arusKasBersihOperasi)}</span>
              </div>
            </div>
          </div>

          {/* II. ARUS KAS DARI AKTIVITAS INVESTASI */}
          <div className="p-6">
            <div className="font-bold text-sm text-[#2A2F86] uppercase tracking-wide mb-3">
              II. ARUS KAS DARI AKTIVITAS INVESTASI
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-700">
                <span>Perolehan Peralatan Klinik / Kantor / Perlengkapan Baru</span>
                <span className="font-semibold text-slate-800 font-mono">({formatRupiah(Math.abs(arusKas.arusKasInvestasi))})</span>
              </div>
              <div className="flex justify-between pt-2.5 font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl mt-1">
                <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                <span className="font-mono text-slate-700">({formatRupiah(Math.abs(arusKas.arusKasInvestasi))})</span>
              </div>
            </div>
          </div>

          {/* III. ARUS KAS DARI AKTIVITAS PENDANAAN */}
          <div className="p-6">
            <div className="font-bold text-sm text-[#2A2F86] uppercase tracking-wide mb-3">
              III. ARUS KAS DARI AKTIVITAS PENDANAAN
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-50 text-slate-700">
                <span>Penarikan Prive / Dividen Pemilik</span>
                <span className="font-semibold text-slate-800 font-mono">({formatRupiah(Math.abs(arusKas.arusKasPendanaan))})</span>
              </div>
              <div className="flex justify-between pt-2.5 font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl mt-1">
                <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                <span className="font-mono text-slate-700">({formatRupiah(Math.abs(arusKas.arusKasPendanaan))})</span>
              </div>
            </div>
          </div>

          {/* IV. REKONSILIASI SALDO KAS AKHIR */}
          <div className="p-6 bg-slate-50/70">
            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-200 font-semibold text-slate-700">
                <span>Kenaikan (Penurunan) Bersih Kas & Bank</span>
                <span className="font-mono">{formatRupiah(arusKas.kenaikanBersihKas)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 font-semibold text-slate-700">
                <span>Saldo Kas & Bank pada Awal Periode</span>
                <span className="font-mono">{formatRupiah(arusKas.saldoKasAwal)}</span>
              </div>
              <div className="flex justify-between items-center bg-[#2A2F86] text-white p-4 px-5 rounded-xl font-bold mt-2">
                <span className="text-sm">SALDO KAS & BANK PADA AKHIR PERIODE (RECONCILED)</span>
                <span className="text-lg font-mono">{formatRupiah(totalKasBankRiil)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
