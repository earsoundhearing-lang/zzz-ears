import React, { useState } from 'react';
import { 
  AksesorisTransaction, 
  Patient, 
  AksesorisTypeCategory, 
  BateraiSubtype, 
  AidtipSubtype, 
  DryingJarSubtype, 
  JenisEarmould,
  EarmouldSide,
  PaymentDetails,
  AksesorisCartItem,
  BranchCode,
  AppUser,
  AksesorisInventoryEntry,
  ABDInventoryEntry
} from '../../types';
import { formatIndoDate, formatRupiah, formatPatientWithGelar } from '../../utils/formatters';
import { generateBranchInvoiceNumber } from '../../utils/branches';
import { generateWhatsAppReceiptMessage, openWhatsAppWithReceipt } from '../../utils/whatsappHelper';
import { PaymentSelector } from './PaymentSelector';
import { CATALOG_AKSESORIS_SERVICE, PAKET_BUNDLING, CatalogItem } from '../../data/priceCatalog';
import { findAksesorisSku, getAksesorisBySku } from '../../data/skuCatalog';
import { isSonicAmplifierSubtype, getSonicAmplifierTargetSkus, getAvailableSonicABDStock } from '../../utils/sonicAmplifierHelper';
import { ShoppingBag, Plus, Trash2, Search, Printer, ShoppingCart, UserCheck, ShieldCheck, Tag, X, PackageCheck, Edit3, MessageSquare, AlertCircle } from 'lucide-react';
import { PinVerificationModal } from '../Common/PinVerificationModal';
import { EditTransactionModal } from './EditTransactionModal';
import { ReportFilterToolbar } from '../Common/ReportFilterToolbar';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';
import { exportAksesorisCSV } from '../../utils/exportHelpers';
import { CloseTransactionConfirmModal } from './CloseTransactionConfirmModal';

interface AksesorisSectionProps {
  transactions: AksesorisTransaction[];
  patients: Patient[];
  currentUser: AppUser;
  selectedBranch: BranchCode;
  inventoryAksesoris?: AksesorisInventoryEntry[];
  inventoryABD?: ABDInventoryEntry[];
  onAddTransaction: (transaction: AksesorisTransaction) => void;
  onSaveTransaction?: (transaction: AksesorisTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintInvoice?: (transaction: AksesorisTransaction) => void;
}

const CATEGORIES: AksesorisTypeCategory[] = [
  'Baterai Alat Bantu Dengar',
  'Aidtip',
  'Earmould',
  'Selang Soft',
  'Drying Jar',
  'Charger ABD',
  'Spare Part dan Service',
  'HA Retainer (Gantungan Alat Bantu Dengar)',
  'Wax Guard',
  'Earhook Sonic',
  'Blower',
  'Pouch',
  'Baterai Checker',
  'Elbow',
  'Housing',
  'Paket Bundling ABD',
];

const BATERAI_SUBTYPES = CATALOG_AKSESORIS_SERVICE.filter(i => i.kategori === 'Baterai ABD');
const AIDTIP_SUBTYPES = CATALOG_AKSESORIS_SERVICE.filter(i => i.kategori === 'Aidtip & Earmould' && i.nama.toLowerCase().includes('aidtip'));
const DRYING_JAR_SUBTYPES = CATALOG_AKSESORIS_SERVICE.filter(i => i.kategori === 'Aksesoris ABD' && i.nama.toLowerCase().includes('drying jar'));
const CHARGER_SUBTYPES = CATALOG_AKSESORIS_SERVICE.filter(i => i.kategori === 'Charger ABD');
const SPAREPART_SERVICE_SUBTYPES = CATALOG_AKSESORIS_SERVICE.filter(i => i.kategori === 'Spare Part dan Service');

const JENIS_EARMOULD_OPTIONS: { label: string; value: JenisEarmould; price: number }[] = [
  { label: 'H/C (Hard Canal) - Rp 250.000', value: 'H/C', price: 250000 },
  { label: 'H/FS (Hard Full Shell) - Rp 250.000', value: 'H/FS', price: 250000 },
  { label: 'S/C (Soft Canal) - Rp 250.000', value: 'S/C', price: 250000 },
  { label: 'S/FS (Soft Full Shell) - Rp 250.000', value: 'S/FS', price: 250000 },
];

const SISI_EARMOULD_OPTIONS: EarmouldSide[] = [
  'Keduanya (Binaural)',
  'Kanan',
  'Kiri',
];

export const AksesorisSection: React.FC<AksesorisSectionProps> = ({
  transactions = [],
  patients = [],
  currentUser,
  selectedBranch,
  inventoryAksesoris = [],
  inventoryABD = [],
  onAddTransaction,
  onSaveTransaction,
  onDeleteTransaction,
  onPrintInvoice,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form Header State
  const [idPelanggan, setIdPelanggan] = useState('');
  const [namaCustomer, setNamaCustomer] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [payment, setPayment] = useState<PaymentDetails>({ method: 'Cash' });

  // Current Item Input State
  const [category, setCategory] = useState<AksesorisTypeCategory>('Baterai Alat Bantu Dengar');
  const [subtype, setSubtype] = useState<string>('13 Sonic');
  const [jenisEarmould, setJenisEarmould] = useState<JenisEarmould>('S/C');
  const [jenisEarmould2, setJenisEarmould2] = useState<JenisEarmould>('S/C');
  const [sisiEarmould, setSisiEarmould] = useState<EarmouldSide>('Keduanya (Binaural)');
  const [noSeri, setNoSeri] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [hargaJual, setHargaJual] = useState(50000);
  const [diskon, setDiskon] = useState<number>(0);

  // Edit & PIN Modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTxToEdit, setSelectedTxToEdit] = useState<AksesorisTransaction | null>(null);

  // Cart State for Multi-Item Transaction
  const [cartItems, setCartItems] = useState<AksesorisCartItem[]>([]);
  const [ongkosKirim, setOngkosKirim] = useState<number>(0);
  const [uangMuka, setUangMuka] = useState<number>(0);
  const [isDP, setIsDP] = useState<boolean>(false);
  const [staffPetugas, setStaffPetugas] = useState<string>('Diana');

  // Date Range & Export State
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState<string>('Semua Periode');
  const [patientGelar, setPatientGelar] = useState<string>('');

  const activeBranchCode: BranchCode = currentUser.branchCode === 'HQ' ? (selectedBranch === 'ALL' ? 'YM' : selectedBranch) : currentUser.branchCode;

  // Calculate available stock for an item in the active branch
  const getBranchStock = (subtypeName: string, categoryName: string): number => {
    if (categoryName === 'Spare Part dan Service' && isSonicAmplifierSubtype(subtypeName)) {
      return getAvailableSonicABDStock(subtypeName, inventoryABD, activeBranchCode).length;
    }

    if (!inventoryAksesoris || inventoryAksesoris.length === 0) return 0;
    const sku = findAksesorisSku(subtypeName, categoryName);
    const master = (sku && sku !== '-') ? getAksesorisBySku(sku) : undefined;
    const canonicalSku = master?.sku || (sku && sku !== '-' ? sku : undefined);

    let totalMasuk = 0;
    let totalKeluar = 0;

    inventoryAksesoris.forEach((item) => {
      const bCode = item.branchCode || 'YM';
      if (bCode === activeBranchCode) {
        const itemSku = item.sku || findAksesorisSku(item.tipe, item.kategori);
        const itemMaster = (itemSku && itemSku !== '-') ? getAksesorisBySku(itemSku) : undefined;
        const itemCanonicalSku = itemMaster?.sku || (itemSku && itemSku !== '-' ? itemSku : undefined);

        let isMatch = false;
        if (canonicalSku && itemCanonicalSku) {
          isMatch = canonicalSku === itemCanonicalSku;
        } else {
          isMatch = (item.tipe || '').trim().toLowerCase() === subtypeName.trim().toLowerCase();
        }

        if (isMatch) {
          const qtyVal = Number(item.qty) || 0;
          if (item.type === 'MASUK') {
            totalMasuk += qtyVal;
          } else {
            totalKeluar += qtyVal;
          }
        }
      }
    });

    return Math.max(0, totalMasuk - totalKeluar);
  };

  // List of available ABD items for Sonic Amplifier replacements in active branch
  const availableSonicABDList = React.useMemo(() => {
    if (category === 'Spare Part dan Service' && isSonicAmplifierSubtype(subtype)) {
      return getAvailableSonicABDStock(subtype, inventoryABD, activeBranchCode);
    }
    return [];
  }, [category, subtype, inventoryABD, activeBranchCode]);

  const handlePatientSelect = (patientId: string) => {
    setIdPelanggan(patientId);
    const p = patients.find((pat) => pat.id === patientId);
    if (p) {
      setNamaCustomer(p.nama);
      setPatientGelar(p.gelar || '');
    }
  };

  const handleCategoryChange = (newCat: AksesorisTypeCategory) => {
    setCategory(newCat);
    setNoSeri('');
    if (newCat === 'Baterai Alat Bantu Dengar') {
      const defaultItem = BATERAI_SUBTYPES[0];
      setSubtype(defaultItem ? defaultItem.nama : '13 Sonic');
      setHargaJual(defaultItem ? defaultItem.harga : 50000);
    } else if (newCat === 'Aidtip') {
      const defaultItem = AIDTIP_SUBTYPES[0];
      setSubtype(defaultItem ? defaultItem.nama : 'Aidtip Size M');
      setHargaJual(defaultItem ? defaultItem.harga : 10000);
    } else if (newCat === 'Earmould') {
      setSubtype(`Soft Canal (S/C) - ${sisiEarmould}`);
      setHargaJual(250000);
    } else if (newCat === 'Drying Jar') {
      const defaultItem = DRYING_JAR_SUBTYPES[0];
      setSubtype(defaultItem ? defaultItem.nama : 'Drying Jar - Standard');
      setHargaJual(defaultItem ? defaultItem.harga : 100000);
    } else if (newCat === 'Charger ABD') {
      const defaultItem = CHARGER_SUBTYPES[0];
      setSubtype(defaultItem ? defaultItem.nama : 'Charger A1 Travel');
      setHargaJual(defaultItem ? defaultItem.harga : 4500000);
    } else if (newCat === 'Spare Part dan Service') {
      const defaultItem = SPAREPART_SERVICE_SUBTYPES[0];
      setSubtype(defaultItem ? defaultItem.nama : 'Jasa Service Biasa');
      setHargaJual(defaultItem ? defaultItem.harga : 100000);
    } else if (newCat === 'Selang Soft') {
      setSubtype('Selang Soft');
      setHargaJual(15000);
    } else if (newCat === 'HA Retainer (Gantungan Alat Bantu Dengar)') {
      setSubtype('HA Retainer (Gantungan ABD)');
      setHargaJual(100000);
    } else if (newCat === 'Wax Guard') {
      setSubtype('Wax Guard');
      setHargaJual(150000);
    } else if (newCat === 'Earhook Sonic') {
      setSubtype('Earhook Sonic');
      setHargaJual(120000);
    } else if (newCat === 'Blower') {
      setSubtype('Blower');
      setHargaJual(80000);
    } else if (newCat === 'Pouch') {
      setSubtype('Earsound Pouch');
      setHargaJual(100000);
    } else if (newCat === 'Baterai Checker') {
      setSubtype('Baterai Checker');
      setHargaJual(80000);
    } else if (newCat === 'Elbow') {
      setSubtype('Elbow');
      setHargaJual(20000);
    } else if (newCat === 'Housing') {
      setSubtype('Housing');
      setHargaJual(300000);
    } else if (newCat === 'Paket Bundling ABD') {
      const defaultPkg = PAKET_BUNDLING[0];
      setSubtype(`Paket ${defaultPkg.nama}`);
      setHargaJual(defaultPkg.totalHarga);
    }
  };

  const handleSubtypeSelectChange = (val: string) => {
    setSubtype(val);
    // Find matching price in catalog or bundling
    const catMatch = CATALOG_AKSESORIS_SERVICE.find(i => i.nama === val);
    if (catMatch) {
      setHargaJual(catMatch.harga);
      return;
    }
    const bundMatch = PAKET_BUNDLING.find(p => `Paket ${p.nama}` === val || p.nama === val);
    if (bundMatch) {
      setHargaJual(bundMatch.totalHarga);
    }
  };

  const handleAddToCart = () => {
    const isBinauralEm = category === 'Earmould' && sisiEarmould === 'Keduanya (Binaural)';
    const effectiveQty = isBinauralEm ? 2 : qty;
    const finalSubtype = category === 'Earmould' 
      ? (isBinauralEm 
          ? `Binaural: ${jenisEarmould} (R) & ${jenisEarmould2} (L)` 
          : `${jenisEarmould} (${sisiEarmould})`)
      : subtype;

    const isEarmould = category === 'Earmould';
    const isService = category === 'Spare Part dan Service' && subtype.toLowerCase().includes('jasa');

    // Physical stock check (Earmould & Service Jasa are custom on-demand, no inventory stock required)
    if (!isEarmould && !isService) {
      const availableStock = getBranchStock(subtype, category);

      const targetSku = findAksesorisSku(subtype, category);
      const inCartQty = cartItems.reduce((acc, item) => {
        const itemSku = findAksesorisSku(item.subtype, item.category);
        if (targetSku && targetSku !== '-' && itemSku === targetSku) {
          return acc + item.qty;
        }
        if (item.subtype === finalSubtype || item.subtype === subtype) {
          return acc + item.qty;
        }
        return acc;
      }, 0);

      if (availableStock <= 0) {
        alert(`STOK TIDAK TERSEDIA!\n\nProduk [${subtype}] di Gudang Cabang [${activeBranchCode}] saat ini HABIS (0 Pcs).\n\nAnda tidak dapat menjual produk ini dari Cabang ${activeBranchCode}.`);
        return;
      }

      if (inCartQty + effectiveQty > availableStock) {
        alert(`STOK TIDAK CUKUP!\n\nStok produk [${subtype}] di Gudang Cabang [${activeBranchCode}] tersisa ${availableStock} Pcs.\n\nKeranjang saat ini: ${inCartQty} Pcs + Tambah ${effectiveQty} Pcs (${inCartQty + effectiveQty} Pcs) melebihi stok yang ada.`);
        return;
      }
    }

    const newItem: AksesorisCartItem = {
      id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category,
      subtype: finalSubtype,
      jenisEarmouldDetails: category === 'Earmould' ? jenisEarmould : undefined,
      sisiEarmouldDetails: category === 'Earmould' ? sisiEarmould : undefined,
      noSeri: noSeri.trim() || undefined,
      qty: effectiveQty,
      hargaJual,
      subtotal: effectiveQty * hargaJual,
    };

    setCartItems((prev) => [...prev, newItem]);
    setNoSeri('');
    setQty(1);
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const cartTotalAmount = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const netCartTotal = Math.max(0, cartTotalAmount - diskon + (ongkosKirim || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPelanggan) {
      alert('Mohon pilih Pasien / Customer terlebih dahulu.');
      return;
    }

    if (cartItems.length === 0) {
      alert('Mohon tambahkan minimal 1 item aksesoris ke dalam keranjang belanja.');
      return;
    }
    if (cartItems.some(i => i.harga < 0 || i.qty <= 0 || i.subtotal < 0)) {
      alert('Harga item tidak boleh negatif dan Kuantitas (Qty) minimal 1.');
      return;
    }
    if (diskon < 0) {
      alert('Diskon tidak boleh bernilai negatif.');
      return;
    }
    if (diskon > cartTotalAmount) {
      alert('Diskon tidak boleh lebih besar dari total harga keranjang.');
      return;
    }

    // Strict validation: Re-verify that all physical cart items are in stock in activeBranchCode
    for (const item of cartItems) {
      if (item.category !== 'Earmould' && !(item.category === 'Spare Part dan Service' && item.subtype.toLowerCase().includes('jasa'))) {
        const avail = getBranchStock(item.subtype, item.category);
        if (item.qty > avail) {
          alert(`STOK TIDAK MENCUKUPI!\n\nProduk [${item.subtype}] di Gudang Cabang [${activeBranchCode}] tersisa ${avail} Pcs, namun di keranjang terdapat ${item.qty} Pcs.\n\nHanya stok yang ada di gudang cabang ini yang dapat ditransaksikan.`);
          return;
        }
      }
    }

    const branchCount = transactions.filter(t => t.branchCode === activeBranchCode).length;
    const nomorFaktur = generateBranchInvoiceNumber(activeBranchCode, branchCount + 1);

    // Primary item for table summary
    const firstItem = cartItems[0];

    const newTx: AksesorisTransaction = {
      id: `AKS-${Date.now().toString().slice(-6)}`,
      tanggal,
      idPelanggan,
      gelar: patientGelar || patients.find(p => p.id === idPelanggan)?.gelar,
      namaCustomer,
      category: cartItems.length > 1 ? `${firstItem.category} (+${cartItems.length - 1} item)` : firstItem.category,
      subtype: cartItems.length > 1 ? `Multi-Item (${cartItems.length} jenis)` : firstItem.subtype,
      jenisEarmouldDetails: firstItem.jenisEarmouldDetails,
      jenisEarmouldDetails2: jenisEarmould2,
      sisiEarmouldDetails: firstItem.sisiEarmouldDetails,
      noSeri: firstItem?.noSeri,
      items: cartItems,
      qty: cartItems.reduce((acc, i) => acc + i.qty, 0),
      nomorFaktur,
      hargaJual: cartTotalAmount,
      diskon,
      jumlah: netCartTotal,
      payment,
      branchCode: activeBranchCode,
      staffUser: staffPetugas,
      ongkosKirim,
      uangMuka,
      isDP,
      sisaPembayaran: isDP ? netCartTotal - uangMuka : 0,
    };

    onAddTransaction(newTx);
    setCartItems([]);
    setDiskon(0);
    setOngkosKirim(0);
    setUangMuka(0);
    setIsDP(false);
    setStaffPetugas('Diana');

    setShowForm(false);
  };

  const handleSendWhatsApp = (t: AksesorisTransaction) => {
    const p = patients.find((pat) => pat.id === t.idPelanggan);
    let targetPhone = p?.telepon && p.telepon !== '-' ? p.telepon : '';
    const displayName = formatPatientWithGelar(t.namaCustomer, t.gelar || p?.gelar);

    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 8) {
      const inputPhone = window.prompt(
        `Kirim Faktur Penjualan Aksesoris via WhatsApp\n\nMasukkan Nomor WhatsApp untuk pasien ${displayName}:\n(Contoh: 08123456789 atau 628123456789)`,
        targetPhone || ''
      );
      if (inputPhone === null) return;
      targetPhone = inputPhone.trim();
    }

    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 8) {
      alert('Nomor WhatsApp tidak valid (minimal 8 digit angka).');
      return;
    }

    const message = generateWhatsAppReceiptMessage({
      transaction: t,
      type: 'AKS',
      patient: p,
    });
    openWhatsAppWithReceipt(targetPhone, message);
  };

  const handleEditClick = (tx: AksesorisTransaction) => {
    setSelectedTxToEdit(tx);
    setIsPinModalOpen(true);
  };

  const handlePinVerified = () => {
    setIsPinModalOpen(false);
    setIsEditModalOpen(true);
  };

  const filteredTransactions = transactions.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      t.namaCustomer.toLowerCase().includes(term) ||
      t.idPelanggan.toLowerCase().includes(term) ||
      t.nomorFaktur.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term)
    );
    if (!matchesSearch) return false;

    if (filterStartDate && t.tanggal < filterStartDate) return false;
    if (filterEndDate && t.tanggal > filterEndDate) return false;

    return true;
  });

  const totalFilteredAmount = filteredTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0);

  const handleExportCSV = (periodLabel: string) => {
    exportAksesorisCSV(filteredTransactions, periodLabel, selectedBranch !== 'ALL' ? selectedBranch : undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#23277A]" />
            <span>Transaksi Pembelian Aksesoris ABD (Multi-Item Cart)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Mendukung keranjang multi-item (Baterai, Aidtip, Earmould, Soft Tube, Drying Jar, Gantungan Retainer, Blower) dalam 1 Faktur Penjualan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition-all"
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Katalog Harga Aksesoris & Service</span>
          </button>
          <button
            id="btn-tambah-transaksi-aksesoris"
            onClick={() => {
              if (showForm) {
                setShowCloseConfirmModal(true);
              } else {
                setShowForm(true);
              }
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#23277A] hover:bg-[#1A1D60] text-white font-bold text-sm shadow-md transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{showForm ? 'Tutup Form' : '+ Transaksi Aksesoris Baru'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal Before Closing */}
      <CloseTransactionConfirmModal
        isOpen={showCloseConfirmModal}
        transactionTitle="Transaksi Pembelian Aksesoris ABD"
        onContinue={() => setShowCloseConfirmModal(false)}
        onCancelAndClose={() => {
          setShowCloseConfirmModal(false);
          setShowForm(false);
        }}
      />

      {/* Form Multi-Item Cart Panel */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-indigo-200 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#23277A]" />
              <span>Form Transaksi Aksesoris (Cabang [{activeBranchCode}])</span>
            </h3>
            <span className="text-xs font-bold text-[#23277A] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              User Input: @{currentUser.username}
            </span>
          </div>

          {/* Row 1: Header Info Pasien */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <SearchablePatientSelect
                patients={patients}
                value={idPelanggan}
                onChange={(pid) => handlePatientSelect(pid)}
                required
                id="aksesoris-patient-select"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Customer
              </label>
              <input
                type="text"
                readOnly
                value={namaCustomer}
                placeholder="Terisi otomatis..."
                className="w-full bg-slate-200/70 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pembelian <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#23277A] outline-none"
              />
            </div>
          </div>

          {/* Add Item Block */}
          <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 space-y-4">
            <h4 className="text-xs font-bold text-[#23277A] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#23277A]" />
              <span>Tambah Item ke Keranjang Belanja</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as AksesorisTypeCategory)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipe / Item Katalog</label>
                {category === 'Earmould' ? (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        value={sisiEarmould}
                        onChange={(e) => {
                          const s = e.target.value as EarmouldSide;
                          setSisiEarmould(s);
                          if (s === 'Keduanya (Binaural)') {
                            setQty(2);
                            setSubtype(`Binaural: ${jenisEarmould} (R) & ${jenisEarmould2} (L)`);
                          } else {
                            setQty(1);
                            setSubtype(`${jenisEarmould} (${s})`);
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-[11px] font-bold"
                      >
                        {SISI_EARMOULD_OPTIONS.map((side) => (
                          <option key={side} value={side}>
                            {side}
                          </option>
                        ))}
                      </select>
                      <select
                        value={jenisEarmould}
                        onChange={(e) => {
                          const v = e.target.value as JenisEarmould;
                          setJenisEarmould(v);
                          setSubtype(sisiEarmould === 'Keduanya (Binaural)' ? `Binaural: ${v} (R) & ${jenisEarmould2} (L)` : `${v} (${sisiEarmould})`);
                          setHargaJual(250000);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-[11px] font-bold"
                      >
                        {JENIS_EARMOULD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {sisiEarmould === 'Keduanya (Binaural)' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Earmould Unit 2 (L)</label>
                        <select
                          value={jenisEarmould2}
                          onChange={(e) => {
                            const v = e.target.value as JenisEarmould;
                            setJenisEarmould2(v);
                            setSubtype(`Binaural: ${jenisEarmould} (R) & ${v} (L)`);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl p-1.5 text-[11px] font-bold text-slate-800"
                        >
                          {JENIS_EARMOULD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : category === 'Baterai Alat Bantu Dengar' ? (
                  <select
                    value={subtype}
                    onChange={(e) => handleSubtypeSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  >
                    {BATERAI_SUBTYPES.map((sub) => (
                      <option key={sub.nama} value={sub.nama}>
                        {sub.nama} ({formatRupiah(sub.harga)})
                      </option>
                    ))}
                  </select>
                ) : category === 'Aidtip' ? (
                  <select
                    value={subtype}
                    onChange={(e) => handleSubtypeSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  >
                    {AIDTIP_SUBTYPES.map((sub) => (
                      <option key={sub.nama} value={sub.nama}>
                        {sub.nama} ({formatRupiah(sub.harga)})
                      </option>
                    ))}
                  </select>
                ) : category === 'Drying Jar' ? (
                  <select
                    value={subtype}
                    onChange={(e) => handleSubtypeSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  >
                    {DRYING_JAR_SUBTYPES.map((sub) => (
                      <option key={sub.nama} value={sub.nama}>
                        {sub.nama} ({formatRupiah(sub.harga)})
                      </option>
                    ))}
                  </select>
                ) : category === 'Charger ABD' ? (
                  <select
                    value={subtype}
                    onChange={(e) => handleSubtypeSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  >
                    {CHARGER_SUBTYPES.map((sub) => (
                      <option key={sub.nama} value={sub.nama}>
                        {sub.nama} ({formatRupiah(sub.harga)})
                      </option>
                    ))}
                  </select>
                ) : category === 'Spare Part dan Service' ? (
                  <div className="space-y-2">
                    <select
                      value={subtype}
                      onChange={(e) => handleSubtypeSelectChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800"
                    >
                      {SPAREPART_SERVICE_SUBTYPES.map((sub) => (
                        <option key={sub.nama} value={sub.nama}>
                          {sub.nama} ({formatRupiah(sub.harga)})
                        </option>
                      ))}
                    </select>

                    {isSonicAmplifierSubtype(subtype) ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1 flex justify-between items-center">
                          <span>No. Seri ABD yang Digunakan (SKU: {getSonicAmplifierTargetSkus(subtype).join(', ')})</span>
                          <span className="text-[#23277A] font-bold">Terhubung Stok ABD</span>
                        </label>
                        {availableSonicABDList.length > 0 ? (
                          <select
                            value={noSeri}
                            onChange={(e) => setNoSeri(e.target.value)}
                            className="w-full bg-white border-2 border-[#23277A] rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23277A]"
                          >
                            <option value="">-- Pilih No. Seri dari Stok ABD --</option>
                            {availableSonicABDList.map((stk) => (
                              <option key={stk.inventoryId} value={stk.noSeri}>
                                No. Seri: {stk.noSeri} | SKU: {stk.sku} ({stk.tipeABD})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                            <p className="text-[10px] text-amber-800 font-semibold">
                              ⚠️ Belum ada stok fisik ABD ({getSonicAmplifierTargetSkus(subtype).join(', ')}) di cabang [{activeBranchCode}]. Anda tetap dapat memasukkan No. Seri manual:
                            </p>
                            <input
                              type="text"
                              placeholder="Masukkan No. Seri manual..."
                              value={noSeri}
                              onChange={(e) => setNoSeri(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          No. Seri (Serial Number) <span className="text-[#23277A] font-medium">(Opsional / Jika ada)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Masukkan No. Seri spare part..."
                          value={noSeri}
                          onChange={(e) => setNoSeri(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-1.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-[#23277A] outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : category === 'Paket Bundling ABD' ? (
                  <select
                    value={subtype}
                    onChange={(e) => handleSubtypeSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  >
                    {PAKET_BUNDLING.map((pkg) => (
                      <option key={pkg.nama} value={`Paket ${pkg.nama}`}>
                        Paket {pkg.nama} ({formatRupiah(pkg.totalHarga)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subtype}
                    onChange={(e) => setSubtype(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  />
                )}
                
                {/* Stock badge indicator */}
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Stok Cabang [{activeBranchCode}]:</span>
                  {category === 'Earmould' ? (
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300 font-bold flex items-center gap-1">
                      👂 Custom Cetak Lab (Tanpa Batas Stok)
                    </span>
                  ) : (category === 'Spare Part dan Service' && subtype.toLowerCase().includes('jasa')) ? (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-bold flex items-center gap-1">
                      🛠️ Jasa Service
                    </span>
                  ) : (category === 'Spare Part dan Service' && isSonicAmplifierSubtype(subtype)) ? (
                    getBranchStock(subtype, category) > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold font-mono">
                        {getBranchStock(subtype, category)} Pcs (Stok ABD: {getSonicAmplifierTargetSkus(subtype).join(', ')})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-300 font-bold font-mono flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 inline" /> 0 Pcs (Habis) (SKU ABD: {getSonicAmplifierTargetSkus(subtype).join(', ')})
                      </span>
                    )
                  ) : getBranchStock(subtype, category) > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold font-mono">
                      {getBranchStock(subtype, category)} Pcs
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-300 font-bold font-mono flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 inline" /> 0 Pcs (Habis)
                    </span>
                  )}
                </div>
                {category === 'Earmould' && (
                  <p className="text-[10px] text-purple-700 mt-1 font-medium bg-purple-50/70 px-2 py-1 rounded-md border border-purple-200/70">
                    ℹ️ Earmould adalah produk custom yang diproduksi di Lab Earmould, tidak memerlukan stok fisik inventori di cabang.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={hargaJual}
                    onChange={(e) => setHargaJual(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-2.5 bg-[#23277A] hover:bg-[#1A1D60] text-[#F5B438] font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  + Tambah ke Keranjang
                </button>
              </div>
            </div>
          </div>

          {/* Cart Table View */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>Rincian Keranjang Belanja ({cartItems.length} Item)</span>
              <span className="text-[#23277A] font-black">Total: {formatRupiah(cartTotalAmount)}</span>
            </div>
            {cartItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                Keranjang belanja masih kosong. Silakan tambah item di atas.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Kategori & Spesifikasi</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Harga Satuan</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5 font-bold text-slate-800">
                        <div>
                          {item.category} <span className="text-slate-500 font-normal">({item.subtype})</span>
                        </div>
                        {item.noSeri && (
                          <div className="text-[10px] text-[#23277A] font-mono font-bold mt-0.5 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 inline-block">
                            No. Seri: {item.noSeri}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold">{item.qty}</td>
                      <td className="p-2.5 text-right">{formatRupiah(item.hargaJual)}</td>
                      <td className="p-2.5 text-right font-bold text-[#23277A]">{formatRupiah(item.jumlah)}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Diskon & Net Amount Block */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtotal Keranjang</label>
                <div className="text-sm font-black text-slate-800">{formatRupiah(cartTotalAmount)}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diskon / Potongan Harga (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={diskon}
                  onChange={(e) => setDiskon(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                  placeholder="0"
                />
              </div>

              <div className="text-right bg-indigo-50/70 p-3 rounded-xl border border-indigo-200">
                <span className="block text-[11px] font-bold text-[#23277A] uppercase tracking-wider">Total Net Faktur</span>
                <span className="text-base font-black text-[#181B57]">{formatRupiah(netCartTotal)}</span>
              </div>
            </div>
          </div>

          
          {/* Petugas, Ongkir, DP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Petugas / Pemeriksa</label>
              <select
                className="w-full rounded-lg border-slate-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-[#23277A]"
                value={staffPetugas}
                onChange={(e) => setStaffPetugas(e.target.value)}
              >
                {['Diana', 'Agung', 'Mutia', 'Dila', 'Adit', 'Ira', 'Fifah', 'Randi', 'Rara', 'Zidan', 'Vivi'].map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ongkos Kirim (Rp)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full rounded-lg border-slate-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-[#23277A]"
                value={ongkosKirim || ''}
                onChange={(e) => setOngkosKirim(Number(e.target.value))}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status DP</label>
              <div className="flex items-center h-9 space-x-2">
                <input
                  type="checkbox"
                  id="isDPCheckbox"
                  checked={isDP}
                  onChange={(e) => {
                    setIsDP(e.target.checked);
                    if (!e.target.checked) setUangMuka(0);
                  }}
                  className="rounded border-slate-300 text-[#23277A] focus:ring-[#23277A] h-5 w-5"
                />
                <label htmlFor="isDPCheckbox" className="text-sm font-medium text-slate-700">DP (Uang Muka)?</label>
              </div>
            </div>

            {isDP && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Uang Muka (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full rounded-lg border-slate-200 border px-3 py-2 text-sm focus:ring-2 focus:ring-[#23277A]"
                  value={uangMuka || ''}
                  onChange={(e) => setUangMuka(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <PaymentSelector 
            value={payment} 
            branchCode={activeBranchCode}
            totalAmount={isDP && uangMuka > 0 ? uangMuka : netCartTotal}
            onChange={setPayment} 
          />

          {/* Submit Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              id="btn-batal-transaksi-aksesoris"
              onClick={() => setShowCloseConfirmModal(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#23277A] hover:bg-[#1A1D60] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Simpan & Terbitkan Faktur Aksesoris
            </button>
          </div>
        </form>
      )}

      {/* Filter & Export Toolbar */}
      <ReportFilterToolbar
        title="Laporan & Filter Tanggal Transaksi Aksesoris"
        totalRecords={transactions.length}
        filteredRecordsCount={filteredTransactions.length}
        totalAmount={totalFilteredAmount}
        amountLabel="Total Penjualan Aksesoris"
        onFilterChange={(start, end, label) => {
          setFilterStartDate(start);
          setFilterEndDate(end);
          setCurrentPeriodLabel(label);
        }}
        onExportCSV={handleExportCSV}
      />

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari faktur, nama, cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: {filteredTransactions.length} Transaksi Aksesoris
        </div>
      </div>

      {/* Mobile Card List (screens < md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Belum ada data transaksi aksesoris.
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-[#23277A] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {t.nomorFaktur}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">
                    {formatPatientWithGelar(t.namaCustomer || t.namaPasien || '', t.gelar || patients.find(p => p.id === t.idPelanggan)?.gelar)}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {t.idPelanggan} • [{t.branchCode || 'YM'}] Staff: @{t.staffUser || 'admin'}</p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleSendWhatsApp(t)}
                    className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"
                    title="Kirim Faktur via WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(t)}
                    className="p-2 bg-amber-50 text-amber-700 rounded-xl"
                    title="Edit (CEO)"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {onPrintInvoice && (
                    <button
                      onClick={() => onPrintInvoice(t)}
                      className="p-2 bg-indigo-50 text-[#23277A] rounded-xl"
                      title="Cetak Faktur"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="p-2 bg-rose-50 text-rose-700 rounded-xl"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="font-bold text-slate-800">{t.category} ({t.subtype})</div>
                {(t.noSeri || t.items?.some(i => i.noSeri)) && (
                  <div className="text-[10px] text-[#23277A] font-mono font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-block">
                    No. Seri: {t.noSeri || t.items?.find(i => i.noSeri)?.noSeri}
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Jumlah Items:</span>
                  <span className="font-bold text-slate-800">{t.qty} item</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#23277A]">
                  <span>Total Harga:</span>
                  <span className="text-sm font-black">{formatRupiah(t.jumlah)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Tanggal: {formatIndoDate(t.tanggal)}</span>
                <span className={`px-2 py-0.5 font-bold rounded-full ${
                  t.payment.method === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                  t.payment.method === 'Transfer' ? 'bg-indigo-100 text-[#23277A]' :
                  t.payment.method === 'Shopee' ? 'bg-orange-100 text-[#EE4D2D] border border-orange-300 font-extrabold' :
                  t.payment.method === 'Split (Cash & Transfer)' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {t.payment.method === 'Shopee' ? `Shopee (YM)${t.payment.shopeeOrderNo ? ` - ${t.payment.shopeeOrderNo}` : ''}` : t.payment.method}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Reports Table (screens >= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#181B57] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">Tgl Pembelian</th>
                <th className="p-3.5">No. Faktur & Cabang</th>
                <th className="p-3.5">ID & Customer</th>
                <th className="p-3.5">Type Aksesoris / Items</th>
                <th className="p-3.5 text-center">Qty</th>
                <th className="p-3.5 text-right">Jumlah Total</th>
                <th className="p-3.5">Pembayaran</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Belum ada data transaksi aksesoris.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {formatIndoDate(t.tanggal)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-bold text-[#23277A] block">{t.nomorFaktur}</span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                        [{t.branchCode || 'YM'}] Staff: @{t.staffUser || 'admin'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {formatPatientWithGelar(t.namaCustomer || t.namaPasien || '', t.gelar || patients.find(p => p.id === t.idPelanggan)?.gelar)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.idPelanggan}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800">{t.category}</span>
                      {t.subtype && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          ({t.subtype})
                        </div>
                      )}
                      {(t.noSeri || t.items?.some(i => i.noSeri)) && (
                        <div className="text-[10px] text-[#23277A] font-mono font-bold mt-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-block">
                          No. Seri: {t.noSeri || t.items?.find(i => i.noSeri)?.noSeri}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-800">
                      {t.qty}
                    </td>
                    <td className="p-3.5 text-right font-black text-[#181B57] whitespace-nowrap">
                      {formatRupiah(t.jumlah)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.payment.method === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.payment.method === 'Transfer'
                            ? 'bg-indigo-100 text-[#23277A]'
                            : t.payment.method === 'Shopee'
                            ? 'bg-orange-100 text-[#EE4D2D] border border-orange-300 font-extrabold'
                            : t.payment.method === 'Split (Cash & Transfer)'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {t.payment.method === 'Shopee' ? `Shopee (YM)${t.payment.shopeeOrderNo ? ` - ${t.payment.shopeeOrderNo}` : ''}` : t.payment.method}
                      </span>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Kirim Faktur via WhatsApp"
                          onClick={() => handleSendWhatsApp(t)}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit Transaksi (Akses CEO)"
                          onClick={() => handleEditClick(t)}
                          className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {onPrintInvoice && (
                          <button
                            title="Cetak Faktur"
                            onClick={() => onPrintInvoice(t)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="Hapus Transaksi"
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Catalog Reference Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200 p-6 space-y-6 animate-scaleIn">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                <Tag className="w-6 h-6 text-amber-600" />
                <span>Katalog Harga Resmi Aksesoris, Sparepart, Service & Bundling</span>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Catalog Items Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 bg-slate-100 p-2.5 rounded-xl">
                <ShoppingBag className="w-4 h-4 text-[#23277A]" />
                <span>Daftar Harga Aksesoris, Sparepart, Aidtip & Service</span>
              </h3>
              <div className="border rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900 text-white font-bold text-[11px]">
                    <tr>
                      <th className="p-3">KATEGORI</th>
                      <th className="p-3">NAMA ITEM / LAYANAN</th>
                      <th className="p-3 text-right">HARGA RESMI</th>
                      <th className="p-3 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {CATALOG_AKSESORIS_SERVICE.map((item, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/50">
                        <td className="p-2.5">
                          <span className="font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">{item.nama}</td>
                        <td className="p-2.5 text-right font-black text-[#23277A]">{formatRupiah(item.harga)}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.kategori === 'Baterai ABD') setCategory('Baterai Alat Bantu Dengar');
                              else if (item.kategori === 'Charger ABD') setCategory('Charger ABD');
                              else if (item.kategori === 'Spare Part dan Service') setCategory('Spare Part dan Service');
                              else if (item.nama.toLowerCase().includes('aidtip')) setCategory('Aidtip');
                              else if (item.nama.toLowerCase().includes('drying jar')) setCategory('Drying Jar');
                              
                              setSubtype(item.nama);
                              setHargaJual(item.harga);
                              setShowCatalogModal(false);
                              setShowForm(true);
                            }}
                            className="px-2 py-1 bg-[#23277A] hover:bg-[#181B57] text-white rounded-lg text-[11px] font-bold"
                          >
                            Pilih
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800"
              >
                Tutup Katalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CEO PIN Verification Modal */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Verifikasi PIN CEO"
        description="Masukkan PIN khusus CEO untuk mengedit transaksi aksesoris."
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transaction={selectedTxToEdit}
        type="AKS"
        patients={patients}
        onSaveAksesoris={(updated) => {
          if (onSaveTransaction) onSaveTransaction(updated);
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
};

