import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Wrench, 
  Disc, 
  ArrowRight,
  User,
  Phone,
  Building2,
  Calendar
} from 'lucide-react';
import { EarmouldReport, ReparasiService } from '../../types';
import { formatIndoDate } from '../../utils/formatters';
import { NavTab } from '../Header';

interface OutstandingWorkSectionProps {
  earmould: EarmouldReport[];
  reparasi: ReparasiService[];
  setActiveTab: (tab: NavTab) => void;
}

export const OutstandingWorkSection: React.FC<OutstandingWorkSectionProps> = ({
  earmould = [],
  reparasi = [],
  setActiveTab,
}) => {
  // Outstanding Earmould: status is 'Di Lab' (printing in lab) or 'Di Yamin' (ready to take/dispatch)
  const outstandingEarmould = useMemo(() => {
    return earmould
      .filter((e) => e.status === 'Di Lab' || e.status === 'Di Yamin')
      .sort((a, b) => new Date(b.tanggalCetak || b.tanggalMasukLab || '').getTime() - new Date(a.tanggalCetak || a.tanggalMasukLab || '').getTime());
  }, [earmould]);

  // Outstanding Reparasi: status is NOT 'Selesai Perbaikan' (e.g. Sedang Diperiksa, Receiver, Amplifier, Microphone, Korosi)
  const outstandingReparasi = useMemo(() => {
    return reparasi
      .filter((r) => r.status !== 'Selesai Perbaikan')
      .sort((a, b) => new Date(b.tanggalMasuk || '').getTime() - new Date(a.tanggalMasuk || '').getTime());
  }, [reparasi]);

  const totalOutstanding = outstandingEarmould.length + outstandingReparasi.length;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Pekerjaan Service & Lab Cetak Outstanding</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                totalOutstanding > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {totalOutstanding} Pekerjaan Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">Tracking pesanan earmould lab dan servis alat bantu dengar yang belum selesai</p>
          </div>
        </div>
      </div>

      {/* 2-Column Layout: Left Earmould Lab, Right Reparasi Servis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Earmould Lab (Di Lab & Di Yamin) */}
        <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">Lab Cetak Earmould ({outstandingEarmould.length})</span>
            </div>
            <button
              onClick={() => setActiveTab('earmould')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Menu Lab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {outstandingEarmould.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-dashed border-slate-200 text-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-semibold text-slate-700">Semua Order Earmould Selesai</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada antrian pengerjaan di lab cetak</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {outstandingEarmould.map((item) => (
                <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">{item.namaPelanggan}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Tipe: <span className="font-medium text-slate-700">{item.jenisEarmould}</span> • Qty: {item.qty}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                      item.status === 'Di Lab' 
                        ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {item.status === 'Di Lab' ? 'Proses Lab' : 'Siap di Cabang'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 font-normal">
                    <span>Tgl Cetak: {formatIndoDate(item.tanggalCetak)}</span>
                    <span>Cabang: {item.branchCode || 'YM'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 2: Reparasi Servis (Dalam Proses) */}
        <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">Servis & Reparasi ABD ({outstandingReparasi.length})</span>
            </div>
            <button
              onClick={() => setActiveTab('reparasi')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Menu Servis</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {outstandingReparasi.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-dashed border-slate-200 text-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-semibold text-slate-700">Semua Servis Telah Selesai</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada unit ABD yang sedang dalam antrian perbaikan</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {outstandingReparasi.map((item) => (
                <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">{item.namaPelanggan}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Unit: <span className="font-medium text-slate-700">{item.jenisABD}</span> (SN: {item.nomorSeri || '-'})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                      {item.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                    Keluhan: "{item.keluhan || '-'}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 font-normal">
                    <span>Masuk: {formatIndoDate(item.tanggalMasuk)}</span>
                    <span>Garansi: {item.garansi ? 'Aktif' : 'Non-Garansi'}</span>
                    <span>Cabang: {item.branchCode || 'YM'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
