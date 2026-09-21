import React from 'react';
import { LogOut, Smartphone, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AppExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const AppExitModal: React.FC<AppExitModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* Header Icon Banner */}
        <div className="bg-gradient-to-br from-[#23277A] to-indigo-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="w-16 h-16 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-3 text-amber-300 shadow-inner">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">
            Konfirmasi Keluar Aplikasi
          </h3>
          <p className="text-xs text-indigo-200 mt-1">
            Pusat Alat Bantu Dengar Earsound
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-left flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed font-medium">
              <strong className="font-bold block text-amber-950 mb-0.5">Tombol Kembali (Back) Tertekan</strong>
              Anda baru saja menekan tombol kembali pada HP/perangkat Anda. Apakah Anda yakin ingin keluar dari aplikasi Earsound?
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 text-left space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tips Navigasi HP / Android:
            </div>
            <p>
              Gunakan baris menu di bagian atas layar untuk berpindah halaman (Dashboard, Pasien, Kasir, CRM, Laporan) tanpa berpindah browser.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 bg-[#23277A] hover:bg-indigo-900 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tetap di Aplikasi (Batal Keluar)</span>
            </button>

            <button
              type="button"
              onClick={onConfirmExit}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-2xl text-xs font-bold border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ya, Keluar dari Aplikasi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
