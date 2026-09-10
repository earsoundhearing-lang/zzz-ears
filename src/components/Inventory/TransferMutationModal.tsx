import React, { useState } from 'react';
import { X, ArrowRightLeft, Undo2, ShoppingCart, Check, Warehouse, Calendar, AlertCircle } from 'lucide-react';
import { BRANCHES } from '../../utils/branches';
import { BranchCode } from '../../types';

export type MutationActionType = 'MUTASI_CABANG' | 'RETUR_MAINDEALER' | 'CATAT_TERJUAL';

export interface TransferItemPayload {
  itemType?: 'ABD' | 'AKSESORIS';
  noSeri?: string;
  tipeABD?: string;
  model?: string;
  // Aksesoris fields
  kategori?: string;
  tipe?: string;
  sku?: string;
  currentBranch: string;
  availableStock?: number;
  sourceEntryId?: string;
}

interface TransferMutationModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: MutationActionType;
  item: TransferItemPayload | null;
  onConfirmMutation: (data: {
    actionType: MutationActionType;
    tanggal: string;
    targetBranch: string;
    alasan: string;
    noInvoice?: string;
    namaCustomer?: string;
    qty?: number;
  }) => Promise<void>;
}

export const TransferMutationModal: React.FC<TransferMutationModalProps> = ({
  isOpen,
  onClose,
  actionType,
  item,
  onConfirmMutation,
}) => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [targetBranch, setTargetBranch] = useState<string>('MD');
  const [alasan, setAlasan] = useState('');
  const [noInvoice, setNoInvoice] = useState('');
  const [namaCustomer, setNamaCustomer] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !item) return null;

  const isAksesoris = item.itemType === 'AKSESORIS';
  const availableStock = item.availableStock ?? 0;
  const currentBranchObj = BRANCHES.find(b => b.code === item.currentBranch);
  const currentBranchName = currentBranchObj ? `${currentBranchObj.name} [${currentBranchObj.code}]` : item.currentBranch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isAksesoris) {
      if (!qty || qty <= 0) {
        setErrorMsg('Jumlah (QTY) mutasi harus minimal 1 pcs');
        return;
      }
      if (availableStock > 0 && qty > availableStock) {
        setErrorMsg(`Jumlah mutasi (${qty} pcs) melebihi stok yang tersedia (${availableStock} pcs) di cabang ini`);
        return;
      }
    }

    if (actionType === 'MUTASI_CABANG') {
      if (!targetBranch) {
        setErrorMsg('Pilih cabang tujuan mutasi');
        return;
      }
      if (targetBranch === item.currentBranch) {
        setErrorMsg('Cabang tujuan tidak boleh sama dengan cabang saat ini');
        return;
      }
    }

    if (actionType === 'CATAT_TERJUAL') {
      if (!namaCustomer.trim()) {
        setErrorMsg('Nama pembeli/pasien wajib diisi');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onConfirmMutation({
        actionType,
        tanggal,
        targetBranch: actionType === 'RETUR_MAINDEALER' ? 'MD' : targetBranch,
        alasan: alasan.trim() || (actionType === 'RETUR_MAINDEALER' ? 'Mutasi fisik ke Gudang Maindealer (Pusat)' : 'Mutasi antar cabang'),
        noInvoice: noInvoice.trim(),
        namaCustomer: namaCustomer.trim(),
        qty: isAksesoris ? Number(qty) : 1,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memproses perpindahan');
    }
  };

  const getTitle = () => {
    switch (actionType) {
      case 'RETUR_MAINDEALER':
        return 'Mutasi ke Gudang Maindealer (Pusat)';
      case 'MUTASI_CABANG':
        return 'Mutasi Stok Antar Cabang';
      case 'CATAT_TERJUAL':
        return 'Catat Penjualan (Terjual)';
    }
  };

  const getIcon = () => {
    switch (actionType) {
      case 'RETUR_MAINDEALER':
        return <Undo2 className="w-5 h-5 text-rose-600" />;
      case 'MUTASI_CABANG':
        return <ArrowRightLeft className="w-5 h-5 text-blue-600" />;
      case 'CATAT_TERJUAL':
        return <ShoppingCart className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              actionType === 'RETUR_MAINDEALER' ? 'bg-rose-100' : (actionType === 'CATAT_TERJUAL' ? 'bg-emerald-100' : 'bg-blue-100')
            }`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">{getTitle()}</h3>
              <p className="text-[11px] text-slate-500">Perpindahan inventori tercatat otomatis ke sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Unit / Product Info Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isAksesoris ? 'Produk Aksesoris Terpilih' : 'Unit ABD Terpilih'}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm font-bold text-blue-700">
                {isAksesoris ? (item.sku ? `[${item.sku}]` : item.kategori) : item.noSeri}
              </span>
              <span className="text-xs font-extrabold text-slate-800 text-right">
                {isAksesoris ? item.tipe : `${item.tipeABD} ${item.model}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <div className="flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                <span>Lokasi Saat Ini: <strong>{currentBranchName}</strong></span>
              </div>
              {isAksesoris && (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Stok Tersedia: {availableStock} pcs
                </span>
              )}
            </div>
          </div>

          {/* Qty Input for Aksesoris */}
          {isAksesoris && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Jumlah (QTY) yang Dimutasi / Dikeluarkan
                </label>
                <span className="text-[11px] text-slate-500">Maks. {availableStock} pcs</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={availableStock > 0 ? availableStock : undefined}
                  required
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">pcs</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Tanggal Perpindahan
            </label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {actionType === 'MUTASI_CABANG' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-blue-600" /> Cabang Tujuan Mutasi
              </label>
              <select
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b.code} value={b.code} disabled={b.code === item.currentBranch}>
                    {b.name} [{b.code}] {b.code === 'MD' ? '(Gudang Utama)' : ''} {b.code === item.currentBranch ? '(Saat Ini)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                *Stok akan otomatis berkurang dari cabang asal dan bertambah di cabang tujuan.
              </p>
            </div>
          )}

          {actionType === 'RETUR_MAINDEALER' && (
            <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-rose-800 flex items-center gap-1.5">
                <Warehouse className="w-4 h-4" /> Tujuan Mutasi: Gudang Maindealer (Pusat) [MD]
              </div>
              <p className="text-slate-600 text-[11px]">
                Unit akan dimutasi ke Gudang Maindealer. Stok di cabang saat ini akan berkurang (status KELUAR_RETUR / Mutasi Keluar) dan masuk ke Gudang Maindealer (status MASUK).
              </p>
            </div>
          )}

          {actionType === 'CATAT_TERJUAL' && (
            <div className="space-y-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
              <div className="text-xs font-bold text-emerald-800">Detail Penjualan</div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Faktur / Invoice</label>
                <input
                  type="text"
                  placeholder="INV-YM-000001 (opsional)"
                  value={noInvoice}
                  onChange={(e) => setNoInvoice(e.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Pasien / Pembeli</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Pasien"
                  value={namaCustomer}
                  onChange={(e) => setNamaCustomer(e.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alasan / Catatan Keterangan</label>
            <textarea
              rows={2}
              placeholder="Tulis alasan atau rincian surat jalan / pengiriman..."
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                actionType === 'RETUR_MAINDEALER' 
                  ? 'bg-rose-600 hover:bg-rose-700' 
                  : (actionType === 'CATAT_TERJUAL' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700')
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi Perpindahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
