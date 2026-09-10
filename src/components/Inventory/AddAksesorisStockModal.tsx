import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Warehouse, Tag, Check, AlertCircle, PackagePlus } from 'lucide-react';
import { AksesorisInventoryEntry } from '../../types';
import { BRANCHES } from '../../utils/branches';
import { AKSESORIS_CATEGORY_LIST } from '../../data/priceCatalog';
import { findAksesorisSku } from '../../data/skuCatalog';

interface AddAksesorisStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBranchCode: string;
  defaultProduct?: {
    tipe: string;
    kategori: string;
    sku?: string;
  } | null;
  onSave: (entry: AksesorisInventoryEntry) => Promise<void>;
}

export const AddAksesorisStockModal: React.FC<AddAksesorisStockModalProps> = ({
  isOpen,
  onClose,
  defaultBranchCode,
  defaultProduct,
  onSave,
}) => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [branchCode, setBranchCode] = useState(defaultBranchCode === 'ALL' ? 'MD' : defaultBranchCode);
  const [kategori, setKategori] = useState(defaultProduct?.kategori || 'Aksesoris ABD');
  const [tipe, setTipe] = useState(defaultProduct?.tipe || '');
  const [sku, setSku] = useState(defaultProduct?.sku || '');
  const [qty, setQty] = useState<number>(1);
  const [sumber, setSumber] = useState('Gudang Maindealer');
  const [customSumber, setCustomSumber] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (defaultProduct) {
      setKategori(defaultProduct.kategori || 'Aksesoris ABD');
      setTipe(defaultProduct.tipe || '');
      setSku(defaultProduct.sku || findAksesorisSku(defaultProduct.tipe, defaultProduct.kategori) || '');
    }
    setBranchCode(defaultBranchCode === 'ALL' ? 'MD' : defaultBranchCode);
    setTanggal(new Date().toISOString().split('T')[0]);
    setQty(1);
    setSumber('Gudang Maindealer');
    setCustomSumber('');
    setKeterangan('');
    setErrorMsg('');
  }, [defaultProduct, defaultBranchCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tipe.trim()) {
      setErrorMsg('Nama / tipe produk aksesoris wajib diisi');
      return;
    }

    if (!qty || qty <= 0) {
      setErrorMsg('Jumlah (QTY) masuk harus minimal 1');
      return;
    }

    const resolvedSumber = sumber === 'LAINNYA' ? customSumber.trim() || 'Lainnya' : sumber;

    const newEntry: AksesorisInventoryEntry = {
      id: `inv-aks-in-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'MASUK',
      tanggal,
      sumberTujuan: resolvedSumber,
      kategori,
      tipe: tipe.trim(),
      sku: sku.trim() || findAksesorisSku(tipe.trim(), kategori) || undefined,
      qty: Number(qty),
      keterangan: keterangan.trim() || undefined,
      branchCode,
    };

    try {
      setIsSubmitting(true);
      await onSave(newEntry);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Gagal menyimpan data stok masuk');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-[#23277A]">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Stok Masuk Aksesoris</h3>
              <p className="text-[11px] text-slate-500">Penerimaan stok baru / restock barang aksesoris</p>
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

          {/* Product Preselected Header or Inputs */}
          {defaultProduct ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produk Aksesoris</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-slate-800">{defaultProduct.tipe}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#23277A] border border-indigo-200 font-mono text-[11px] font-bold">
                  {defaultProduct.sku || sku || '-'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-semibold">{defaultProduct.kategori}</div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Aksesoris</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
                >
                  {AKSESORIS_CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk / Tipe</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Baterai Rayovac 675, Drying Capsule, dll"
                  value={tipe}
                  onChange={(e) => {
                    setTipe(e.target.value);
                    const autoSku = findAksesorisSku(e.target.value, kategori);
                    if (autoSku) setSku(autoSku);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>
            </div>
          )}

          {/* Tanggal & Cabang */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Tanggal Masuk
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#23277A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-[#23277A]" /> Cabang Penerima
              </label>
              <select
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} [{b.code}] {b.code === 'MD' ? '(Pusat)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Qty Masuk */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah Penerimaan (QTY Masuk)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-[#23277A] focus:ring-2 focus:ring-[#23277A] outline-none"
              />
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">pcs</span>
            </div>
          </div>

          {/* Sumber Penerimaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Penerimaan</label>
            <select
              value={sumber}
              onChange={(e) => setSumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none mb-2"
            >
              <option value="Gudang Maindealer">Gudang Maindealer (Pusat Suplai)</option>
              <option value="Pabrik / Principal (Suplier)">Pabrik / Principal (Suplier)</option>
              <option value="Pembelian Lokal / Vendor">Pembelian Lokal / Vendor</option>
              <option value="Stok Awal Inventori">Stok Awal Inventori</option>
              <option value="LAINNYA">Lainnya (Ketik Manual)...</option>
            </select>

            {sumber === 'LAINNYA' && (
              <input
                type="text"
                placeholder="Tulis sumber penerimaan..."
                value={customSumber}
                onChange={(e) => setCustomSumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#23277A] outline-none"
              />
            )}
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / No. Surat Jalan / Catatan</label>
            <textarea
              rows={2}
              placeholder="Contoh: No. Surat Jalan SJ-001/2026, restock mingguan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#23277A] outline-none"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2.5 bg-[#23277A] hover:bg-[#181B57] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#F5B438]" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Stok Masuk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
