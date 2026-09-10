import React, { useMemo } from 'react';
import { BRANCHES } from '../../utils/branches';
import { formatRupiah } from '../../utils/formatters';
import { Building2, TrendingUp, Users, ShoppingBag, Stethoscope, Volume2, ArrowRight } from 'lucide-react';
import { Patient, AksesorisTransaction, JasaPeriksaTransaction, ABDTransaction, EarmouldReport, ReparasiService, BranchCode } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface BranchPerformanceSectionProps {
  allPatients: Patient[];
  allAksesoris: AksesorisTransaction[];
  allJasaPeriksa: JasaPeriksaTransaction[];
  allABD: ABDTransaction[];
  allEarmould: EarmouldReport[];
  allReparasi: ReparasiService[];
  onSelectBranch?: (branchCode: BranchCode) => void;
  activeBranchFilter?: BranchCode;
}

export const BranchPerformanceSection: React.FC<BranchPerformanceSectionProps> = ({
  allPatients,
  allAksesoris,
  allJasaPeriksa,
  allABD,
  allEarmould,
  allReparasi,
  onSelectBranch,
  activeBranchFilter = 'ALL',
}) => {
  // Aggregate stats per branch
  const branchStats = useMemo(() => {
    return BRANCHES.map((b) => {
      const code = b.code;

      // Patients registered in this branch
      const patientsCount = allPatients.filter(p => p.branchCode === code).length;

      // Aksesoris transactions & omset
      const aksList = allAksesoris.filter(a => a.branchCode === code);
      const aksOmset = aksList.reduce((sum, item) => sum + (item.jumlah || 0), 0);
      const aksTxCount = aksList.length;

      // Jasa transactions & omset
      const jasaList = allJasaPeriksa.filter(j => j.branchCode === code);
      const jasaOmset = jasaList.reduce((sum, item) => sum + (item.biayaJasaPeriksa || 0), 0);
      const jasaTxCount = jasaList.length;

      // ABD transactions & omset
      const abdList = allABD.filter(ab => ab.branchCode === code);
      const abdOmset = abdList.reduce((sum, item) => sum + (item.jumlah || 0), 0);
      const abdTxCount = abdList.length;

      // Earmould orders
      const earmouldCount = allEarmould.filter(e => e.branchCode === code).length;
      
      // Reparasi
      const reparasiCount = allReparasi.filter(r => r.branchCode === code).length;

      const totalOmset = aksOmset + jasaOmset + abdOmset;
      const totalTransactions = aksTxCount + jasaTxCount + abdTxCount;

      return {
        code,
        name: b.name,
        city: b.city,
        phone: b.phone,
        totalOmset,
        totalTransactions,
        patientsCount,
        aksOmset,
        aksTxCount,
        jasaOmset,
        jasaTxCount,
        abdOmset,
        abdTxCount,
        earmouldCount,
        reparasiCount,
      };
    }).sort((a, b) => b.totalOmset - a.totalOmset);
  }, [allPatients, allAksesoris, allJasaPeriksa, allABD, allEarmould, allReparasi]);

  const grandTotalOmset = useMemo(() => {
    return branchStats.reduce((sum, b) => sum + b.totalOmset, 0);
  }, [branchStats]);

  const chartData = useMemo(() => {
    return branchStats.map(b => ({
      cabang: b.name.replace('Earsound ', ''),
      'ABD (Jt)': Number((b.abdOmset / 1000000).toFixed(1)),
      'Aksesoris (Jt)': Number((b.aksOmset / 1000000).toFixed(1)),
      'Jasa (Jt)': Number((b.jasaOmset / 1000000).toFixed(1)),
      total: b.totalOmset,
    }));
  }, [branchStats]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl">
            <Building2 className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Performa & Perbandingan 8 Cabang</h3>
            <p className="text-xs text-slate-500 font-normal">Monitoring omset, kuantitas transaksi, dan kontribusi seluruh cabang klinik</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl">
          <span className="text-xs text-slate-500 font-medium">Total Seluruh Cabang:</span>
          <span className="text-sm font-bold text-slate-900">{formatRupiah(grandTotalOmset)}</span>
        </div>
      </div>

      {/* Bar Chart Comparison */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Grafik Omset per Cabang (Juta Rupiah)</span>
          <span className="text-xs text-slate-400 font-normal">Diurutkan berdasarkan total omset tertinggi</span>
        </div>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="cabang" tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} angle={-15} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} unit=" Jt" />
              <Tooltip 
                formatter={(val: any, name: any) => [`Rp ${val} Juta`, name]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="ABD (Jt)" stackId="a" fill="#23277A" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Aksesoris (Jt)" stackId="a" fill="#3B41B2" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Jasa (Jt)" stackId="a" fill="#F5B438" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Branch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 pt-1">
        {branchStats.map((branch, idx) => {
          const sharePercent = grandTotalOmset > 0 ? ((branch.totalOmset / grandTotalOmset) * 100).toFixed(1) : '0';
          const isSelected = activeBranchFilter === branch.code;

          return (
            <div 
              key={branch.code}
              className={`p-4 rounded-xl border transition-all ${
                isSelected 
                  ? 'border-slate-800 bg-slate-50 shadow-xs ring-1 ring-slate-800/10' 
                  : 'border-slate-200/70 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{branch.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">{branch.city} • Kode: {branch.code}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                  {sharePercent}%
                </span>
              </div>

              {/* Total Revenue */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-normal">Total Omset:</span>
                <span className="text-sm font-bold text-slate-900">{formatRupiah(branch.totalOmset)}</span>
              </div>

              {/* Breakdown metrics */}
              <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-slate-400 block text-[10px] font-medium">ABD</span>
                  <span className="font-semibold text-slate-800">{branch.abdTxCount} tx</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-slate-400 block text-[10px] font-medium">AKSESORIS</span>
                  <span className="font-semibold text-slate-800">{branch.aksTxCount} tx</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-slate-400 block text-[10px] font-medium">JASA</span>
                  <span className="font-semibold text-slate-800">{branch.jasaTxCount} tx</span>
                </div>
              </div>

              {/* Secondary stats: Pasien, Earmould, Reparasi */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-normal mt-2.5 px-0.5">
                <span>{branch.patientsCount} Pasien</span>
                <span>{branch.earmouldCount} Lab</span>
                <span>{branch.reparasiCount} Servis</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
