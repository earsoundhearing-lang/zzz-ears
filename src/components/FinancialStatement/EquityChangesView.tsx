import React from 'react';
import { FinancialSummaryReport } from '../../utils/financialCalculations';
import { Layers, Printer } from 'lucide-react';

interface EquityChangesViewProps {
  report: FinancialSummaryReport;
}

export const EquityChangesView: React.FC<EquityChangesViewProps> = ({ report }) => {
  const { ekuitas, labaBersihOperasional, periodLabel, branchCode } = report;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const modalAwal = ekuitas.modalDisetor301;
  const labaBersih = labaBersihOperasional;
  const labaDitahan = ekuitas.labaDitahan302;
  const prive = ekuitas.prive304;
  const modalAkhir = ekuitas.totalEkuitas;

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
              Ekuitas & Modal Pemilik
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Laporan Perubahan Modal (Statement of Changes in Equity)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Earsound Hearing Center • Cabang: <span className="font-semibold text-slate-700">{branchCode === 'ALL' ? 'Konsolidasi Seluruh Cabang' : branchCode}</span> • {periodLabel}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors self-start md:self-auto"
        >
          <Printer className="w-4 h-4" /> Cetak Perubahan Modal
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2A2F86]" />
          <h3 className="font-bold text-slate-800 uppercase tracking-wide">Rincian Perubahan Ekuitas Perusahaan</h3>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100 text-slate-700">
            <span className="font-semibold">301 • Modal Disetor Awal Pemilik</span>
            <span className="font-semibold text-slate-800 font-mono text-sm">{formatRupiah(modalAwal)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-100 text-slate-700">
            <span>302 • Akumulasi Laba Ditahan (Retained Earnings Sebelumnya)</span>
            <span className="font-semibold text-slate-800 font-mono">{formatRupiah(labaDitahan)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-100 text-emerald-800 bg-emerald-50/50 px-3 rounded-lg">
            <span className="font-semibold">303 • Ditambah: Laba Bersih Periode Berjalan</span>
            <span className="font-bold font-mono text-emerald-700">{formatRupiah(labaBersih)}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-100 text-red-800 bg-red-50/50 px-3 rounded-lg">
            <span className="font-semibold">304 • Dikurangi: Penarikan Prive / Dividen Pemilik</span>
            <span className="font-bold font-mono text-red-700">({formatRupiah(prive)})</span>
          </div>

          <div className="flex justify-between items-center bg-[#2A2F86] text-white p-5 px-6 rounded-2xl font-bold mt-4 shadow-sm">
            <div>
              <span className="text-xs uppercase text-indigo-200 font-semibold block">SALDO EKUITAS AKHIR</span>
              <span className="text-base">TOTAL MODAL AKHIR PERIODE (NERACA)</span>
            </div>
            <span className="text-2xl font-mono">{formatRupiah(modalAkhir)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
