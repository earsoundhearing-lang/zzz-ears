import React from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

interface CloseTransactionConfirmModalProps {
  isOpen: boolean;
  transactionTitle: string;
  onContinue: () => void;
  onCancelAndClose: () => void;
}

export const CloseTransactionConfirmModal: React.FC<CloseTransactionConfirmModalProps> = ({
  isOpen,
  transactionTitle,
  onContinue,
  onCancelAndClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
    >
      <div 
        id="modal-konfirmasi-tutup-transaksi"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 sm:p-7 space-y-5 animate-scaleUp"
      >
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Konfirmasi Penutupan Form
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-snug">
              {transactionTitle}
            </h3>
          </div>
        </div>

        {/* Question & Description */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
          <p className="font-bold text-sm text-slate-800">
            Apakah transaksi ini mau dibatalkan atau dilanjutkan?
          </p>
          <p className="leading-relaxed">
            Form transaksi ini sedang dibuka. Silakan tentukan apakah Anda ingin membatalkan pengisian data atau tetap melanjutkan proses transaksi.
          </p>
        </div>

        {/* Action Options Info */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
            <span><strong>Lanjutkan Transaksi:</strong> Tetap di form ini dan lanjutkan pengisian.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
            <span><strong>Batalkan Transaksi:</strong> Batalkan pengisian dan tutup menu form ini.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            id="btn-batalkan-transaksi"
            onClick={onCancelAndClose}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs order-2 sm:order-1"
          >
            <X className="w-4 h-4" />
            <span>Batalkan Transaksi</span>
          </button>

          <button
            type="button"
            id="btn-lanjutkan-transaksi"
            onClick={onContinue}
            className="w-full py-2.5 px-4 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md order-1 sm:order-2"
          >
            <span>Lanjutkan Transaksi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
