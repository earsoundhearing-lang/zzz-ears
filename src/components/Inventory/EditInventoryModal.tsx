import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Package, Layers, Calendar, Tag, Warehouse, AlertCircle, Barcode } from 'lucide-react';
import { ABDInventoryEntry, AksesorisInventoryEntry, BranchCode } from '../../types';
import { BRANCHES } from '../../utils/branches';
import { AKSESORIS_CATEGORY_LIST } from '../../data/priceCatalog';
import { findABDSku, findAksesorisSku } from '../../data/skuCatalog';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveABD?: (entry: ABDInventoryEntry) => Promise<void>;
  onSaveAksesoris?: (entry: AksesorisInventoryEntry) => Promise<void>;
  itemType: 'ABD' | 'AKSESORIS';
  initialABDEntry?: ABDInventoryEntry | null;
  initialAksEntry?: AksesorisInventoryEntry | null;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  onClose,
  onSaveABD,
  onSaveAksesoris,
  itemType,
  initialABDEntry,
  initialAksEntry,
}) => {
  // ABD form states
  const [abdTanggal, setAbdTanggal] = useState('');
  const [abdType, setAbdType] = useState<'MASUK' | 'KELUAR_RETUR' | 'KELUAR_TERJUAL'>('MASUK');
  const [abdSumberTujuan, setAbdSumberTujuan] = useState('');
  const [abdTipeABD, setAbdTipeABD] = useState('');
  const [abdModel, setAbdModel] = useState('');
  const [abdSku, setAbdSku] = useState('');
  const [abdNoSeri, setAbdNoSeri] = useState('');
  const [abdKeterangan, setAbdKeterangan] = useState('');
  const [abdNoInvoice, setAbdNoInvoice] = useState('');
  const [abdNamaCustomer, setAbdNamaCustomer] = useState('');
  const [abdCabangTujuan, setAbdCabangTujuan] = useState('');
  const [abdBranchCode, setAbdBranchCode] = useState<string>('MD');

  // Aksesoris form states
  const [aksTanggal, setAksTanggal] = useState('');
  const [aksType, setAksType] = useState<'MASUK' | 'KELUAR_RETUR' | 'KELUAR_TERJUAL'>('MASUK');
  const [aksSumberTujuan, setAksSumberTujuan] = useState('');
  const [aksKategori, setAksKategori] = useState('');
  const [aksTipe, setAksTipe] = useState('');
  const [aksSku, setAksSku] = useState('');
  const [aksQty, setAksQty] = useState(1);
  const [aksKeterangan, setAksKeterangan] = useState('');
  const [aksNoInvoice, setAksNoInvoice] = useState('');
  const [aksNamaCustomer, setAksNamaCustomer] = useState('');
  const [aksCabangTujuan, setAksCabangTujuan] = useState('');
  const [aksBranchCode, setAksBranchCode] = useState<string>('MD');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialABDEntry && itemType === 'ABD') {
      setAbdTanggal(initialABDEntry.tanggal || new Date().toISOString().split('T')[0]);
      setAbdType(initialABDEntry.type || 'MASUK');
      setAbdSumberTujuan(initialABDEntry.sumberTujuan || '');
      setAbdTipeABD(initialABDEntry.tipeABD || '');
      setAbdModel(initialABDEntry.model || '');
      setAbdSku(initialABDEntry.sku || findABDSku(initialABDEntry.tipeABD, initialABDEntry.model));
      setAbdNoSeri(initialABDEntry.noSeri || '');
      setAbdKeterangan(initialABDEntry.keterangan || '');
      setAbdNoInvoice(initialABDEntry.noInvoice || '');
      setAbdNamaCustomer(initialABDEntry.namaCustomer || '');
      setAbdCabangTujuan(initialABDEntry.cabangTujuan || '');
      setAbdBranchCode(initialABDEntry.branchCode || 'MD');
    }
    if (initialAksEntry && itemType === 'AKSESORIS') {
      setAksTanggal(initialAksEntry.tanggal || new Date().toISOString().split('T')[0]);
      setAksType(initialAksEntry.type || 'MASUK');
      setAksSumberTujuan(initialAksEntry.sumberTujuan || '');
      setAksKategori(initialAksEntry.kategori || 'Aksesoris');
      setAksTipe(initialAksEntry.tipe || '');
      setAksSku(initialAksEntry.sku || findAksesorisSku(initialAksEntry.tipe, initialAksEntry.kategori));
      setAksQty(initialAksEntry.qty || 1);
      setAksKeterangan(initialAksEntry.keterangan || '');
      setAksNoInvoice(initialAksEntry.noInvoice || '');
      setAksNamaCustomer(initialAksEntry.namaCustomer || '');
      setAksCabangTujuan(initialAksEntry.cabangTujuan || '');
      setAksBranchCode(initialAksEntry.branchCode || 'MD');
    }
    setErrorMsg('');
  }, [initialABDEntry, initialAksEntry, itemType, isOpen]);

  // Dynamic auto-suggest SKU on typing
  const handleABDTypeChange = (newType: string) => {
    setAbdTipeABD(newType);
    const suggested = findABDSku(newType, abdModel);
    if (suggested) setAbdSku(suggested);
  };

  const handleABDModelChange = (newModel: string) => {
    setAbdModel(newModel);
    const suggested = findABDSku(abdTipeABD, newModel);
    if (suggested) setAbdSku(suggested);
  };

  const handleAksTipeChange = (newTipe: string) => {
    setAksTipe(newTipe);
    const suggested = findAksesorisSku(newTipe, aksKategori);
    if (suggested) setAksSku(suggested);
  };

  const handleAksKategoriChange = (newKat: string) => {
    setAksKategori(newKat);
    const suggested = findAksesorisSku(aksTipe, newKat);
    if (suggested) setAksSku(suggested);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setIsSubmitting(true);
      if (itemType === 'ABD' && initialABDEntry && onSaveABD) {
        if (!abdNoSeri.trim()) {
          setErrorMsg('Nomor Seri ABD tidak boleh kosong');
          setIsSubmitting(false);
          return;
        }
        if (!abdTipeABD.trim()) {
          setErrorMsg('Tipe ABD tidak boleh kosong');
          setIsSubmitting(false);
          return;
        }

        const updatedABD: ABDInventoryEntry = {
          ...initialABDEntry,
          tanggal: abdTanggal,
          type: abdType,
          sumberTujuan: abdSumberTujuan,
          tipeABD: abdTipeABD,
          model: abdModel,
          sku: abdSku.trim() || undefined,
          noSeri: abdNoSeri.trim(),
          keterangan: abdKeterangan,
          noInvoice: abdType === 'KELUAR_TERJUAL' ? abdNoInvoice : undefined,
          namaCustomer: abdType === 'KELUAR_TERJUAL' ? abdNamaCustomer : undefined,
          cabangTujuan: (abdType === 'KELUAR_RETUR' || abdType === 'KELUAR_TERJUAL') ? abdCabangTujuan : undefined,
          branchCode: abdBranchCode,
        };

        await onSaveABD(updatedABD);
      } else if (itemType === 'AKSESORIS' && initialAksEntry && onSaveAksesoris) {
        if (!aksTipe.trim()) {
          setErrorMsg('Nama Produk / Tipe Aksesoris tidak boleh kosong');
          setIsSubmitting(false);
          return;
        }
        if (aksQty <= 0) {
          setErrorMsg('Kuantitas (QTY) harus lebih dari 0');
          setIsSubmitting(false);
          return;
        }

        const updatedAks: AksesorisInventoryEntry = {
          ...initialAksEntry,
          tanggal: aksTanggal,
          type: aksType,
          sumberTujuan: aksSumberTujuan,
          kategori: aksKategori,
          tipe: aksTipe.trim(),
          sku: aksSku.trim() || undefined,
          qty: Number(aksQty),
          keterangan: aksKeterangan,
          noInvoice: aksType === 'KELUAR_TERJUAL' ? aksNoInvoice : undefined,
          namaCustomer: aksType === 'KELUAR_TERJUAL' ? aksNamaCustomer : undefined,
          cabangTujuan: (aksType === 'KELUAR_RETUR' || aksType === 'KELUAR_TERJUAL') ? aksCabangTujuan : undefined,
          branchCode: aksBranchCode,
        };

        await onSaveAksesoris(updatedAks);
      }
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Gagal menyimpan perubahan inventori');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Edit Data {itemType === 'ABD' ? 'Stok Alat Bantu Dengar' : 'Stok Aksesoris'}
              </h2>
              <p className="text-xs text-slate-500">
                Perbarui rincian log stok, SKU, nomor seri, cabang, atau status perpindahan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-180px)] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {itemType === 'ABD' ? (
            <>
              {/* ABD Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={abdTanggal}
                    onChange={(e) => setAbdTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-500" /> Jenis Status Mutasi
                  </label>
                  <select
                    value={abdType}
                    onChange={(e) => setAbdType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="MASUK">MASUK (Stok Masuk / Tersedia)</option>
                    <option value="KELUAR_TERJUAL">KELUAR_TERJUAL (Terjual ke Pasien)</option>
                    <option value="KELUAR_RETUR">KELUAR_MUTASI (Mutasi Keluar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" /> Tipe ABD
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Enchant SE 10, Radiant 20"
                    value={abdTipeABD}
                    onChange={(e) => handleABDTypeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="BTE / MNRT / CIC"
                    value={abdModel}
                    onChange={(e) => handleABDModelChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* SKU & Serial Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-purple-600" /> Kode SKU
                  </label>
                  <input
                    type="text"
                    placeholder="SKU Produk..."
                    value={abdSku}
                    onChange={(e) => setAbdSku(e.target.value)}
                    className="w-full font-mono bg-purple-50/50 border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" /> Nomor Seri (SN)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="No Seri Unit..."
                    value={abdNoSeri}
                    onChange={(e) => setAbdNoSeri(e.target.value)}
                    className="w-full font-mono bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-slate-500" /> Cabang / Lokasi
                  </label>
                  <select
                    value={abdBranchCode}
                    onChange={(e) => setAbdBranchCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} [{b.code}] {b.code === 'MD' ? '(Gudang Utama)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber / Pengirim (Asal Masuk atau Tujuan Keluar)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Gudang Maindealer, Yamin, Supplier..."
                  value={abdSumberTujuan}
                  onChange={(e) => setAbdSumberTujuan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {abdType === 'KELUAR_TERJUAL' && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-amber-800">Detail Penjualan (Terjual)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Faktur / Invoice</label>
                      <input
                        type="text"
                        placeholder="INV-YM-000001"
                        value={abdNoInvoice}
                        onChange={(e) => setAbdNoInvoice(e.target.value)}
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Pasien / Customer</label>
                      <input
                        type="text"
                        placeholder="Nama Pembeli"
                        value={abdNamaCustomer}
                        onChange={(e) => setAbdNamaCustomer(e.target.value)}
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {abdType === 'KELUAR_RETUR' && (
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-rose-800">Detail Mutasi Keluar</div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Gudang / Cabang Tujuan Mutasi</label>
                    <input
                      type="text"
                      placeholder="Gudang Maindealer (MD), Siantar, dll..."
                      value={abdCabangTujuan}
                      onChange={(e) => setAbdCabangTujuan(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan stok..."
                  value={abdKeterangan}
                  onChange={(e) => setAbdKeterangan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Aksesoris Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={aksTanggal}
                    onChange={(e) => setAksTanggal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#23277A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-500" /> Jenis Mutasi
                  </label>
                  <select
                    value={aksType}
                    onChange={(e) => setAksType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
                  >
                    <option value="MASUK">MASUK (Stok Masuk / Tambah)</option>
                    <option value="KELUAR_TERJUAL">KELUAR_TERJUAL (Terjual)</option>
                    <option value="KELUAR_RETUR">KELUAR_MUTASI (Mutasi Keluar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#23277A]" /> Kategori
                  </label>
                  <select
                    value={aksKategori}
                    onChange={(e) => handleAksKategoriChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
                  >
                    {AKSESORIS_CATEGORY_LIST.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Aksesoris">Aksesoris Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-slate-500" /> Cabang / Lokasi Gudang
                  </label>
                  <select
                    value={aksBranchCode}
                    onChange={(e) => setAksBranchCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} [{b.code}] {b.code === 'MD' ? '(Gudang Utama)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Produk / Tipe Aksesoris
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 13 Sonic, Drying Jar Electric 1.0"
                    value={aksTipe}
                    onChange={(e) => handleAksTipeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#23277A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kuantitas (QTY)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={aksQty}
                    onChange={(e) => setAksQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-extrabold text-[#23277A] focus:ring-2 focus:ring-[#23277A] outline-none"
                  />
                </div>
              </div>

              {/* SKU Aksesoris */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-[#23277A]" /> Kode SKU Produk
                </label>
                <input
                  type="text"
                  placeholder="SKU Aksesoris..."
                  value={aksSku}
                  onChange={(e) => setAksSku(e.target.value)}
                  className="w-full font-mono bg-indigo-50/50 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-[#23277A] focus:ring-2 focus:ring-[#23277A] outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber / Pengirim / Tujuan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Gudang Maindealer, Supplier..."
                  value={aksSumberTujuan}
                  onChange={(e) => setAksSumberTujuan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan mutasi stok..."
                  value={aksKeterangan}
                  onChange={(e) => setAksKeterangan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              className="px-5 py-2.5 bg-[#23277A] hover:bg-[#181B57] disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#F5B438]" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
