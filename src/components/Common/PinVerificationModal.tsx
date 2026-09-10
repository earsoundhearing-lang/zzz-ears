import React, { useState, useEffect } from 'react';
import { KeyRound, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getEditTransactionPin } from '../../utils/storage';

interface PinVerificationModalProps {
  requirePin?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  actionText?: string;
  isDanger?: boolean;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Verifikasi PIN Edit Transaksi',
  subtitle = 'Otorisasi khusus edit data & kwitansi',
  actionText = 'Verifikasi PIN',
  isDanger = false,
  requirePin = true,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset input and error message whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirePin) {
      onSuccess();
      return;
    }
    const currentPin = getEditTransactionPin();
    if (pinInput === currentPin) {
      setErrorMsg('');
      setPinInput('');
      onSuccess();
    } else {
      setErrorMsg('PIN yang Anda masukkan salah. Hubungi CEO untuk PIN otorisasi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{title}</h3>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setErrorMsg('');
              setPinInput('');
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          
          {requirePin ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Masukkan PIN Otorisasi (4 Digit)
              </label>
              <input
                type="password"
                maxLength={8}
                required
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full text-center tracking-widest text-lg font-mono font-black bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
              />
            </div>
          ) : (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-center text-sm font-bold">
              Konfirmasi: Apakah Anda yakin ingin menghapus data ini secara permanen?
            </div>
          )}


          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setPinInput('');
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 font-black rounded-xl shadow-md text-xs flex items-center gap-1.5 ${isDanger ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-[#23277A] text-[#FFB800] hover:bg-[#1C1F66]'}`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{actionText}</span>
            </button>
          </div>
        </form>

        {requirePin && (
          <p className="text-[10px] text-center text-slate-400 pt-1 border-t border-slate-100">
            Pengaturan PIN dapat dikelola di Akun CEO.
          </p>
        )}
      </div>
    </div>
  );
};
