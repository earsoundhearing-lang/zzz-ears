import React, { useState, useMemo } from 'react';
import { 
  ABDTransaction, 
  Patient, 
  FittingType, 
  PaymentDetails,
  BranchCode,
  AppUser,
  JenisEarmould,
  ABDInventoryEntry,
  AksesorisInventoryEntry,
  ABDBonusItem
} from '../../types';
import { formatIndoDate, formatRupiah, formatPatientWithGelar } from '../../utils/formatters';
import { generateBranchInvoiceNumber, getBranchByCode } from '../../utils/branches';
import { generateWhatsAppReceiptMessage, openWhatsAppWithReceipt } from '../../utils/whatsappHelper';
import { PaymentSelector } from './PaymentSelector';
import { ABD_PRICE_CATALOG, CATALOG_AKSESORIS_SERVICE, AKSESORIS_CATEGORY_LIST } from '../../data/priceCatalog';
import { findABDSku, findAksesorisSku } from '../../data/skuCatalog';
import { PinVerificationModal } from '../Common/PinVerificationModal';
import { EditTransactionModal } from './EditTransactionModal';
import { ReportFilterToolbar } from '../Common/ReportFilterToolbar';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';
import { exportABDCSV } from '../../utils/exportHelpers';
import { Volume2, Plus, Trash2, Search, Printer, ShieldCheck, Tag, PackageCheck, X, Edit3, DollarSign, Ear, AlertTriangle, CheckCircle2, AlertCircle, Boxes, Package, MessageSquare } from 'lucide-react';

interface ABDSectionProps {
  inventoryABD?: ABDInventoryEntry[];
  inventoryAksesoris?: AksesorisInventoryEntry[];
  transactions: ABDTransaction[];
  patients: Patient[];
  currentUser: AppUser;
  selectedBranch: BranchCode;
  onAddTransaction: (transaction: ABDTransaction) => void;
  onSaveTransaction?: (transaction: ABDTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onPrintInvoice?: (transaction: ABDTransaction) => void;
}

const HAC_OPTIONS = [
  'Diana',
  'Agung',
  'Mutia',
  'Dila',
  'Adit',
  'Ira',
  'Fifah',
  'Randi',
  'Rara',
  'Zidan',
  'Vivi',
];

export const ABDSection: React.FC<ABDSectionProps> = ({
  inventoryABD = [],
  inventoryAksesoris = [],
  transactions = [],
  patients = [],
  currentUser,
  selectedBranch,
  onAddTransaction,
  onSaveTransaction,
  onDeleteTransaction,
  onPrintInvoice,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showBranchStockModal, setShowBranchStockModal] = useState(false);
  const [branchStockActiveTab, setBranchStockActiveTab] = useState<'ABD' | 'AKSESORIS'>('ABD');
  const [branchStockSearchTerm, setBranchStockSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // PIN & Edit Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTxToEdit, setSelectedTxToEdit] = useState<ABDTransaction | null>(null);

  const activeBranchCode: BranchCode = currentUser.branchCode === 'HQ' ? (selectedBranch === 'ALL' ? 'YM' : selectedBranch) : currentUser.branchCode;

  // Form Fields
  const [idPelanggan, setIdPelanggan] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [hac, setHac] = useState('Diana');
  const [fittingType, setFittingType] = useState<FittingType>('Binaural');

  // ABD Unit 1 - Initialized with empty serial number
  const [selectedAbdModel1, setSelectedAbdModel1] = useState<string>(ABD_PRICE_CATALOG[0]?.id || '1');
  const [customAbdModel1, setCustomAbdModel1] = useState<string>('');
  const [isCustomModel1, setIsCustomModel1] = useState<boolean>(false);
  const [tipeABD1, setTipeABD1] = useState(ABD_PRICE_CATALOG[0]?.tipe || 'Enchant SE 10');
  const [modelABD1, setModelABD1] = useState(ABD_PRICE_CATALOG[0]?.model || 'BTE');
  const [nomorSeriABD1, setNomorSeriABD1] = useState('');
  const [hargaABD1, setHargaABD1] = useState(ABD_PRICE_CATALOG[0]?.harga || 7500000);
  const [manualInputSN1, setManualInputSN1] = useState(false);

  // ABD Unit 2 (if Binaural) - Initialized with empty serial number
  const [selectedAbdModel2, setSelectedAbdModel2] = useState<string>(ABD_PRICE_CATALOG[0]?.id || '1');
  const [customAbdModel2, setCustomAbdModel2] = useState<string>('');
  const [isCustomModel2, setIsCustomModel2] = useState<boolean>(false);
  const [tipeABD2, setTipeABD2] = useState(ABD_PRICE_CATALOG[0]?.tipe || 'Enchant SE 10');
  const [modelABD2, setModelABD2] = useState(ABD_PRICE_CATALOG[0]?.model || 'BTE');
  const [nomorSeriABD2, setNomorSeriABD2] = useState('');
  const [hargaABD2, setHargaABD2] = useState(ABD_PRICE_CATALOG[0]?.harga || 7500000);
  const [manualInputSN2, setManualInputSN2] = useState(false);

  // Calculate Available Physical Stock for Active Branch (ABD)
  const availableStock = useMemo(() => {
    const stockMap = new Map<string, ABDInventoryEntry>();
    const branchInventory = inventoryABD.filter(item => item.branchCode === activeBranchCode);
    const sorted = [...branchInventory].sort((a,b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    sorted.forEach(item => {
      if (item.type === 'MASUK') {
        stockMap.set(item.noSeri, item);
      } else {
        stockMap.delete(item.noSeri);
      }
    });
    return Array.from(stockMap.values());
  }, [inventoryABD, activeBranchCode]);

  // Grouped Available Stock for ABD (Alat Bantu Dengar) in active branch (Qty > 0)
  const branchAvailableABDList = useMemo(() => {
    const map = new Map<string, { sku: string; tipeABD: string; model: string; qty: number; serialNumbers: string[] }>();
    availableStock.forEach(item => {
      const sku = item.sku || findABDSku(item.tipeABD, item.model) || '-';
      const key = `${sku}___${item.tipeABD}___${item.model || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          sku,
          tipeABD: item.tipeABD,
          model: item.model || '',
          qty: 0,
          serialNumbers: []
        });
      }
      const rec = map.get(key)!;
      rec.qty += 1;
      if (item.noSeri && !rec.serialNumbers.includes(item.noSeri)) {
        rec.serialNumbers.push(item.noSeri);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.tipeABD.localeCompare(b.tipeABD));
  }, [availableStock]);

  // Available Physical Stock for Aksesoris in active branch (Qty > 0)
  const branchAvailableAksesorisList = useMemo(() => {
    const map = new Map<string, { sku: string; kategori: string; tipe: string; qty: number }>();
    const branchInventory = inventoryAksesoris.filter(item => item.branchCode === activeBranchCode);
    branchInventory.forEach(item => {
      const sku = item.sku || findAksesorisSku(item.tipe, item.kategori) || '-';
      const key = `${item.kategori}___${item.tipe}`;
      if (!map.has(key)) {
        map.set(key, {
          sku,
          kategori: item.kategori || 'Aksesoris',
          tipe: item.tipe,
          qty: 0
        });
      }
      const rec = map.get(key)!;
      const q = Number(item.qty) || 0;
      if (item.type === 'MASUK') {
        rec.qty += q;
      } else {
        rec.qty -= q;
      }
    });
    return Array.from(map.values())
      .filter(item => item.qty > 0)
      .sort((a, b) => a.tipe.localeCompare(b.tipe));
  }, [inventoryAksesoris, activeBranchCode]);

  // Filtered lists for the Branch Stock modal
  const filteredBranchABDList = useMemo(() => {
    if (!branchStockSearchTerm.trim()) return branchAvailableABDList;
    const term = branchStockSearchTerm.toLowerCase();
    return branchAvailableABDList.filter(item => 
      item.sku.toLowerCase().includes(term) ||
      item.tipeABD.toLowerCase().includes(term) ||
      item.model.toLowerCase().includes(term) ||
      item.serialNumbers.some(sn => sn.toLowerCase().includes(term))
    );
  }, [branchAvailableABDList, branchStockSearchTerm]);

  const filteredBranchAksesorisList = useMemo(() => {
    if (!branchStockSearchTerm.trim()) return branchAvailableAksesorisList;
    const term = branchStockSearchTerm.toLowerCase();
    return branchAvailableAksesorisList.filter(item => 
      item.sku.toLowerCase().includes(term) ||
      item.tipe.toLowerCase().includes(term) ||
      item.kategori.toLowerCase().includes(term)
    );
  }, [branchAvailableAksesorisList, branchStockSearchTerm]);

  // Filter stock matching Unit 1
  const matchingStock1 = useMemo(() => {
    const targetTipe = (isCustomModel1 ? customAbdModel1 : tipeABD1).trim().toLowerCase();
    const targetModel = modelABD1.trim().toLowerCase();
    if (!targetTipe) return [];
    return availableStock.filter(s => {
      const sTipe = (s.tipeABD || '').trim().toLowerCase();
      const sModel = (s.model || '').trim().toLowerCase();
      if (sTipe === targetTipe) {
        if (!targetModel || !sModel || sModel === targetModel) return true;
      }
      if (sTipe.includes(targetTipe) || targetTipe.includes(sTipe)) {
        return true;
      }
      return false;
    });
  }, [availableStock, isCustomModel1, customAbdModel1, tipeABD1, modelABD1]);

  // Filter stock matching Unit 2 (excluding SN from Unit 1)
  const matchingStock2 = useMemo(() => {
    const targetTipe = (isCustomModel2 ? customAbdModel2 : tipeABD2).trim().toLowerCase();
    const targetModel = modelABD2.trim().toLowerCase();
    if (!targetTipe) return [];
    return availableStock.filter(s => {
      if (nomorSeriABD1 && s.noSeri === nomorSeriABD1) return false;
      const sTipe = (s.tipeABD || '').trim().toLowerCase();
      const sModel = (s.model || '').trim().toLowerCase();
      if (sTipe === targetTipe) {
        if (!targetModel || !sModel || sModel === targetModel) return true;
      }
      if (sTipe.includes(targetTipe) || targetTipe.includes(sTipe)) {
        return true;
      }
      return false;
    });
  }, [availableStock, isCustomModel2, customAbdModel2, tipeABD2, modelABD2, nomorSeriABD1]);

  // Handle stock selection
  const handleSelectStock1 = (noSeri: string) => {
    setNomorSeriABD1(noSeri);
    const stock = availableStock.find(s => s.noSeri === noSeri);
    if (stock) {
      setTipeABD1(stock.tipeABD);
      setModelABD1(stock.model);
    }
  };

  const handleSelectStock2 = (noSeri: string) => {
    setNomorSeriABD2(noSeri);
    const stock = availableStock.find(s => s.noSeri === noSeri);
    if (stock) {
      setTipeABD2(stock.tipeABD);
      setModelABD2(stock.model);
    }
  };

  // Item Bonus Aksesoris Manual State
  const [bonusItems, setBonusItems] = useState<ABDBonusItem[]>([]);
  const [bonusKategori, setBonusKategori] = useState<string>('Baterai ABD');
  const [bonusTipe, setBonusTipe] = useState<string>('Baterai 13 Sonic');
  const [bonusQty, setBonusQty] = useState<number>(1);

  const filteredBonusCatalog = useMemo(() => {
    return CATALOG_AKSESORIS_SERVICE.filter(item => item.kategori === bonusKategori);
  }, [bonusKategori]);

  const handleBonusCategoryChange = (cat: string) => {
    setBonusKategori(cat);
    const items = CATALOG_AKSESORIS_SERVICE.filter(i => i.kategori === cat);
    if (items.length > 0) {
      setBonusTipe(items[0].nama);
    } else {
      setBonusTipe('');
    }
  };

  const handleAddBonusItem = (kategori?: string, tipe?: string, qty: number = 1) => {
    const finalKat = kategori || bonusKategori;
    const finalTipe = tipe || bonusTipe;
    if (!finalTipe.trim()) return;

    const sku = findAksesorisSku(finalTipe, finalKat);
    const newItem: ABDBonusItem = {
      id: `bonus-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kategori: finalKat,
      tipe: finalTipe,
      sku: sku !== '-' ? sku : undefined,
      qty: qty > 0 ? qty : 1,
      harga: 0
    };
    setBonusItems(prev => [...prev, newItem]);
  };

  const handleRemoveBonusItem = (id: string) => {
    setBonusItems(prev => prev.filter(item => item.id !== id));
  };

  // Earmould Integration
  const [pilihEarmould, setPilihEarmould] = useState<boolean>(true);
  const [jenisEarmould, setJenisEarmould] = useState<JenisEarmould>('S/C');
  const [jenisEarmould2, setJenisEarmould2] = useState<JenisEarmould>('S/C');

  // Pricing Totals
  const [diskon, setDiskon] = useState(0);

  // DP (Uang Muka)
  const [isDP, setIsDP] = useState<boolean>(false);
  const [uangMuka, setUangMuka] = useState<number>(0);

  // Payment
  const [payment, setPayment] = useState<PaymentDetails>({ method: 'Transfer' });

  // Date Range & Export State
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState<string>('Semua Periode');
  const [patientGelar, setPatientGelar] = useState<string>('');

  const handlePatientSelect = (patientId: string) => {
    setIdPelanggan(patientId);
    const p = patients.find((pat) => pat.id === patientId);
    if (p) {
      setNamaPasien(p.nama);
      setPatientGelar(p.gelar || '');
    }
  };

  const handleAbdModel1Select = (idOrCustom: string) => {
    setNomorSeriABD1('');
    if (idOrCustom === '__CUSTOM__') {
      setIsCustomModel1(true);
      setSelectedAbdModel1('__CUSTOM__');
    } else {
      setIsCustomModel1(false);
      setSelectedAbdModel1(idOrCustom);
      const catalogItem = ABD_PRICE_CATALOG.find((i) => i.id === idOrCustom);
      if (catalogItem) {
        setTipeABD1(catalogItem.tipe);
        setModelABD1(catalogItem.model);
        setHargaABD1(catalogItem.harga);
      }
    }
  };

  const handleAbdModel2Select = (idOrCustom: string) => {
    setNomorSeriABD2('');
    if (idOrCustom === '__CUSTOM__') {
      setIsCustomModel2(true);
      setSelectedAbdModel2('__CUSTOM__');
    } else {
      setIsCustomModel2(false);
      setSelectedAbdModel2(idOrCustom);
      const catalogItem = ABD_PRICE_CATALOG.find((i) => i.id === idOrCustom);
      if (catalogItem) {
        setTipeABD2(catalogItem.tipe);
        setModelABD2(catalogItem.model);
        setHargaABD2(catalogItem.harga);
      }
    }
  };

  // Calculated Totals
  const grossTotal = hargaABD1 + (fittingType === 'Binaural' ? hargaABD2 : 0);
  const netTotal = Math.max(0, grossTotal - diskon);
  const effectiveDP = isDP ? Math.min(netTotal, uangMuka) : netTotal;
  const sisaPembayaran = Math.max(0, netTotal - effectiveDP);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPelanggan) {
      alert('Mohon pilih Pasien terlebih dahulu.');
      return;
    }

    const finalTipeAbd1 = isCustomModel1 ? customAbdModel1 : tipeABD1;
    if (!finalTipeAbd1.trim()) {
      alert('Mohon isi tipe Alat Bantu Dengar Unit 1.');
      return;
    }

    if (!nomorSeriABD1.trim()) {
      alert('Mohon pilih atau masukkan Nomor Seri untuk ABD Unit 1.');
      return;
    }

    // Branch stock validation for Unit 1
    const sn1ExistsInBranch = availableStock.some(s => s.noSeri.toLowerCase() === nomorSeriABD1.trim().toLowerCase());
    if (availableStock.length > 0 && !sn1ExistsInBranch) {
      const proceed = confirm(
        `⚠️ PERHATIAN STOK CABANG:\n\nNomor Seri "${nomorSeriABD1}" (${finalTipeAbd1}) TIDAK DITEMUKAN di stok aktif Gudang Cabang [${activeBranchCode}].\n\nSistem mengutamakan hanya stok fisik yang ada di gudang cabang yang dapat ditransaksikan.\n\nApakah Anda yakin ingin tetap melanjutkan transaksi ini?`
      );
      if (!proceed) return;
    }

    if (fittingType === 'Binaural') {
      if (!nomorSeriABD2.trim()) {
        alert('Mohon pilih atau masukkan Nomor Seri untuk ABD Unit 2 (Binaural).');
        return;
      }
      if (nomorSeriABD1.trim().toLowerCase() === nomorSeriABD2.trim().toLowerCase()) {
        alert('Nomor Seri Unit 1 dan Unit 2 tidak boleh sama.');
        return;
      }
      const sn2ExistsInBranch = availableStock.some(s => s.noSeri.toLowerCase() === nomorSeriABD2.trim().toLowerCase());
      if (availableStock.length > 0 && !sn2ExistsInBranch) {
        const proceed = confirm(
          `⚠️ PERHATIAN STOK CABANG:\n\nNomor Seri Unit 2 "${nomorSeriABD2}" TIDAK DITEMUKAN di stok aktif Gudang Cabang [${activeBranchCode}].\n\nApakah Anda yakin ingin tetap melanjutkan transaksi ini?`
        );
        if (!proceed) return;
      }
    }

    if (hargaABD1 < 0 || hargaABD2 < 0) {
      alert('Harga Unit tidak boleh bernilai negatif.');
      return;
    }
    if (diskon < 0) {
      alert('Diskon tidak boleh bernilai negatif.');
      return;
    }
    if (diskon > grossTotal) {
      alert('Diskon tidak boleh lebih besar dari total Harga Gross.');
      return;
    }
    if (isDP && uangMuka <= 0) {
      alert('Uang muka (DP) harus lebih besar dari 0.');
      return;
    }
    if (isDP && uangMuka > netTotal) {
      alert('Uang muka (DP) tidak boleh lebih besar dari total yang harus dibayar.');
      return;
    }

    if (payment.method === 'Split (Cash & Transfer)') {
      const cAmount = payment.cashAmount || 0;
      const tAmount = payment.transferAmount || 0;
      if (cAmount <= 0 && tAmount <= 0) {
        alert('Mohon masukkan rincian nominal Cash dan Transfer untuk pembayaran Split.');
        return;
      }
    }

    const finalTipeAbd2 = fittingType === 'Binaural' ? (isCustomModel2 ? customAbdModel2 : tipeABD2) : undefined;

    const branchCount = transactions.filter(t => t.branchCode === activeBranchCode).length;
    const nomorFakturPenjualan = generateBranchInvoiceNumber(activeBranchCode, branchCount + 1);

    const newTx: ABDTransaction = {
      id: `ABD-${Date.now().toString().slice(-6)}`,
      tanggal,
      idPelanggan,
      gelar: patientGelar || patients.find(p => p.id === idPelanggan)?.gelar,
      namaPasien,
      hac,
      tipeABD: finalTipeAbd1,
      nomorSeriABD: nomorSeriABD1,
      hargaABD1,
      tipeABD2: finalTipeAbd2,
      nomorSeriABD2: fittingType === 'Binaural' ? nomorSeriABD2 : undefined,
      hargaABD2: fittingType === 'Binaural' ? hargaABD2 : undefined,
      bonusItems: bonusItems.length > 0 ? bonusItems : undefined,
      pilihEarmould,
      jenisEarmould: pilihEarmould ? jenisEarmould : undefined,
      jenisEarmould2: (pilihEarmould && fittingType === 'Binaural') ? jenisEarmould2 : undefined,
      sisiEarmould: fittingType === 'Binaural' ? 'Keduanya (Binaural)' : (fittingType === 'Monoaural (Kanan)' ? 'Kanan' : 'Kiri'),
      fittingType,
      nomorFakturPenjualan,
      hargaJual: grossTotal,
      diskon,
      jumlah: netTotal,
      uangMuka: isDP ? effectiveDP : netTotal,
      sisaPembayaran,
      isDP: sisaPembayaran > 0,
      payment,
      branchCode: activeBranchCode,
      staffUser: currentUser.username,
    };

    onAddTransaction(newTx);
    setBonusItems([]);
    setShowForm(false);
  };

  const handleSendWhatsApp = (t: ABDTransaction) => {
    const p = patients.find((pat) => pat.id === t.idPelanggan);
    let targetPhone = p?.telepon && p.telepon !== '-' ? p.telepon : '';
    const displayName = formatPatientWithGelar(t.namaPasien, t.gelar || p?.gelar);

    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 8) {
      const inputPhone = window.prompt(
        `Kirim Faktur/Kwitansi via WhatsApp\n\nMasukkan Nomor WhatsApp untuk pasien ${displayName}:\n(Contoh: 08123456789 atau 628123456789)`,
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
      type: 'ABD',
      patient: p,
    });
    openWhatsAppWithReceipt(targetPhone, message);
  };

  const handleEditClick = (tx: ABDTransaction) => {
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
      t.namaPasien.toLowerCase().includes(term) ||
      t.idPelanggan.toLowerCase().includes(term) ||
      t.tipeABD.toLowerCase().includes(term) ||
      t.nomorSeriABD.toLowerCase().includes(term) ||
      t.nomorFakturPenjualan.toLowerCase().includes(term)
    );
    if (!matchesSearch) return false;

    if (filterStartDate && t.tanggal < filterStartDate) return false;
    if (filterEndDate && t.tanggal > filterEndDate) return false;

    return true;
  });

  const totalFilteredAmount = filteredTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0);

  const handleExportCSV = (periodLabel: string) => {
    exportABDCSV(filteredTransactions, patients, periodLabel, selectedBranch !== 'ALL' ? selectedBranch : undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-[#23277A]" />
            <span>Transaksi Penjualan Alat Bantu Dengar (ABD)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Penjualan Hearing Aid, Consultant HAC, Fitting Binaural/Monoaural, Bundling, DP & Otorisasi CEO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setBranchStockActiveTab('ABD');
              setShowBranchStockModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#23277A] border border-indigo-200 font-bold text-xs shadow-xs transition-all"
          >
            <PackageCheck className="w-4 h-4 text-[#23277A]" />
            <span>Lihat Stok Tersedia Cabang ({activeBranchCode})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition-all"
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>Katalog Harga ABD & Bundling</span>
          </button>
          <button
            id="btn-tambah-transaksi-abd"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>{showForm ? 'Tutup Form' : '+ Transaksi Penjualan ABD'}</span>
          </button>
        </div>
      </div>

      {/* Form Transaksi Penjualan ABD */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-indigo-200 space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-black text-slate-900">Form Transaksi Alat Bantu Dengar (Cabang [{activeBranchCode}])</h3>
              <button
                type="button"
                onClick={() => {
                  setBranchStockActiveTab('ABD');
                  setShowBranchStockModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-xs shadow-xs transition-all"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Lihat Stok Tersedia Cabang</span>
              </button>
            </div>
            <span className="text-xs font-bold text-[#23277A] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Format Faktur/Resi: INV-{activeBranchCode}-00xxxx
            </span>
          </div>

          {/* Row 1: Patient Selection & Tanggal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchablePatientSelect
                patients={patients}
                value={idPelanggan}
                onChange={(pid) => handlePatientSelect(pid)}
                required
                id="abd-patient-select"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pasien
              </label>
              <input
                type="text"
                readOnly
                value={namaPasien}
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

          {/* Row 2: HAC & Fitting Qty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Hearing Aid Consultant (HAC) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={hac}
                onChange={(e) => setHac(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23277A]"
              >
                {HAC_OPTIONS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Fitting Qty <span className="text-red-500">*</span>
              </label>
              <select
                value={fittingType}
                onChange={(e) => setFittingType(e.target.value as FittingType)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-[#23277A] focus:ring-2 focus:ring-[#23277A]"
              >
                <option value="Binaural">Binaural (Sepasang / Both Ears - 2 Unit ABD)</option>
                <option value="Monoaural (Kanan)">Monoaural (Kanan / Right - 1 Unit ABD)</option>
                <option value="Monoaural (Kiri)">Monoaural (Kiri / Left - 1 Unit ABD)</option>
              </select>
            </div>
          </div>

          {/* Row 3: ABD Unit 1 */}
          <div className="space-y-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-[#23277A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#23277A]" />
                <span>Alat Bantu Dengar Unit 1</span>
              </h4>
              <span className="text-[10px] text-[#23277A] bg-indigo-100/90 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                {fittingType}
              </span>
            </div>

            {/* Warning & Stock Alert Banner for Unit 1 */}
            {matchingStock1.length === 0 ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-amber-950">⚠️ Peringatan Stok Kosong: </span>
                  Tipe <span className="font-bold underline">{isCustomModel1 ? customAbdModel1 || "Kustom" : (tipeABD1 + " (" + modelABD1 + ")")}</span> saat ini <span className="font-bold text-red-600">KOSONG (0 unit)</span> di Gudang {getBranchByCode(activeBranchCode).name}.
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-emerald-900 text-xs">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Stok Sesuai Tersedia di Gudang {getBranchByCode(activeBranchCode).name}
                </span>
                <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  {matchingStock1.length} Unit Siap
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe ABD Katalog 1</label>
                <select
                  value={selectedAbdModel1}
                  onChange={(e) => handleAbdModel1Select(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#23277A]"
                >
                  {ABD_PRICE_CATALOG.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tipe} - {item.model} ({formatRupiah(item.harga)})
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Tipe Lain (Ketik Manual)</option>
                </select>
                {isCustomModel1 && (
                  <input
                    type="text"
                    required
                    placeholder="Ketik Tipe ABD..."
                    value={customAbdModel1}
                    onChange={(e) => setCustomAbdModel1(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 mt-1.5 text-xs font-bold text-slate-900"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Nomor Seri ABD 1</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setManualInputSN1(!manualInputSN1)}
                      className="text-[10px] text-[#23277A] hover:text-[#181B57] font-semibold underline"
                    >
                      {manualInputSN1 ? "Pilih dari Stok" : "Ketik Manual"}
                    </button>
                    {nomorSeriABD1 && (
                      <button
                        type="button"
                        onClick={() => setNomorSeriABD1("")}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>

                {manualInputSN1 ? (
                  <input
                    type="text"
                    placeholder="Ketik Nomor Seri Manual..."
                    value={nomorSeriABD1}
                    onChange={(e) => setNomorSeriABD1(e.target.value)}
                    className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={nomorSeriABD1}
                      onChange={(e) => handleSelectStock1(e.target.value)}
                      className={"w-full bg-white border rounded-xl p-2.5 text-xs font-mono font-bold appearance-none " + (
                        nomorSeriABD1
                          ? "border-[#23277A] text-[#23277A] bg-indigo-50/40 ring-1 ring-[#23277A]/30"
                          : matchingStock1.length === 0
                          ? "border-amber-300 bg-amber-50/30 text-slate-600"
                          : "border-slate-300 text-slate-700"
                      )}
                    >
                      <option value="">
                        {matchingStock1.length > 0
                          ? "-- Pilih No. Seri (" + matchingStock1.length + " unit tersedia) --"
                          : "-- (Nomor Seri Dikosongkan / Stok 0) --"}
                      </option>
                      {matchingStock1.length > 0 && (
                        <optgroup label={"Stok Sesuai Model (" + matchingStock1.length + " Unit)"}>
                          {matchingStock1.map((s) => (
                            <option key={s.noSeri} value={s.noSeri}>
                              {s.noSeri} - {s.tipeABD} {s.model}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {availableStock.filter((s) => !matchingStock1.some((m) => m.noSeri === s.noSeri)).length > 0 && (
                        <optgroup label="Stok Tipe Lain di Gudang">
                          {availableStock
                            .filter((s) => !matchingStock1.some((m) => m.noSeri === s.noSeri))
                            .map((s) => (
                              <option key={s.noSeri} value={s.noSeri}>
                                {s.noSeri} - {s.tipeABD} {s.model}
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {nomorSeriABD1 && !availableStock.find((s) => s.noSeri === nomorSeriABD1) && (
                        <option value={nomorSeriABD1}>{nomorSeriABD1} (Manual)</option>
                      )}
                    </select>
                  </div>
                )}
                <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>No. Seri: <strong className="text-slate-800 font-mono">{nomorSeriABD1 || "(Kosong)"}</strong></span>
                  {matchingStock1.length === 0 && !nomorSeriABD1 && (
                    <span className="text-amber-700 font-bold">Stok Gudang Kosong</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga Unit 1 (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={hargaABD1}
                  onChange={(e) => setHargaABD1(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-[#23277A]"
                />
              </div>
            </div>
          </div>

          {/* Row 4: ABD Unit 2 (Only if Binaural) */}
          {fittingType === "Binaural" && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-200 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-purple-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>Alat Bantu Dengar Unit 2 (Pasangan Binaural)</span>
                </h4>
                <span className="text-[10px] text-purple-800 bg-purple-100/90 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                  Telinga Kedua
                </span>
              </div>

              {/* Warning & Stock Alert Banner for Unit 2 */}
              {matchingStock2.length === 0 ? (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-amber-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-amber-950">⚠️ Peringatan Stok Kosong: </span>
                    Tipe <span className="font-bold underline">{isCustomModel2 ? customAbdModel2 || "Kustom" : (tipeABD2 + " (" + modelABD2 + ")")}</span> saat ini <span className="font-bold text-red-600">KOSONG (0 unit)</span> di Gudang {getBranchByCode(activeBranchCode).name}.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-emerald-900 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Stok Sesuai Tersedia di Gudang {getBranchByCode(activeBranchCode).name}
                  </span>
                  <span className="bg-purple-700 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                    {matchingStock2.length} Unit Siap
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe ABD Katalog 2</label>
                  <select
                    value={selectedAbdModel2}
                    onChange={(e) => handleAbdModel2Select(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    {ABD_PRICE_CATALOG.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.tipe} - {item.model} ({formatRupiah(item.harga)})
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Tipe Lain (Ketik Manual)</option>
                  </select>
                  {isCustomModel2 && (
                    <input
                      type="text"
                      required
                      placeholder="Ketik Tipe ABD 2..."
                      value={customAbdModel2}
                      onChange={(e) => setCustomAbdModel2(e.target.value)}
                      className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 mt-1.5 text-xs font-bold text-slate-900"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Nomor Seri ABD 2</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setManualInputSN2(!manualInputSN2)}
                        className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold underline"
                      >
                        {manualInputSN2 ? "Pilih dari Stok" : "Ketik Manual"}
                      </button>
                      {nomorSeriABD2 && (
                        <button
                          type="button"
                          onClick={() => setNomorSeriABD2("")}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                        >
                          Kosongkan
                        </button>
                      )}
                    </div>
                  </div>

                  {manualInputSN2 ? (
                    <input
                      type="text"
                      placeholder="Ketik Nomor Seri Manual Unit 2..."
                      value={nomorSeriABD2}
                      onChange={(e) => setNomorSeriABD2(e.target.value)}
                      className="w-full bg-white border border-purple-400 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={nomorSeriABD2}
                        onChange={(e) => handleSelectStock2(e.target.value)}
                        className={"w-full bg-white border rounded-xl p-2.5 text-xs font-mono font-bold appearance-none " + (
                          nomorSeriABD2
                            ? "border-purple-500 text-purple-950 bg-purple-50/40 ring-1 ring-purple-400"
                            : matchingStock2.length === 0
                            ? "border-amber-300 bg-amber-50/30 text-slate-600"
                            : "border-slate-300 text-slate-700"
                        )}
                      >
                        <option value="">
                          {matchingStock2.length > 0
                            ? "-- Pilih No. Seri (" + matchingStock2.length + " unit tersedia) --"
                            : "-- (Nomor Seri Dikosongkan / Stok 0) --"}
                        </option>
                        {matchingStock2.length > 0 && (
                          <optgroup label={"Stok Sesuai Model (" + matchingStock2.length + " Unit)"}>
                            {matchingStock2.map((s) => (
                              <option key={s.noSeri} value={s.noSeri}>
                                {s.noSeri} - {s.tipeABD} {s.model}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {availableStock
                          .filter((s) => s.noSeri !== nomorSeriABD1 && !matchingStock2.some((m) => m.noSeri === s.noSeri))
                          .length > 0 && (
                          <optgroup label="Stok Tipe Lain di Gudang">
                            {availableStock
                              .filter((s) => s.noSeri !== nomorSeriABD1 && !matchingStock2.some((m) => m.noSeri === s.noSeri))
                              .map((s) => (
                                <option key={s.noSeri} value={s.noSeri}>
                                  {s.noSeri} - {s.tipeABD} {s.model}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {nomorSeriABD2 && !availableStock.find((s) => s.noSeri === nomorSeriABD2) && (
                          <option value={nomorSeriABD2}>{nomorSeriABD2} (Manual)</option>
                        )}
                      </select>
                    </div>
                  )}
                  <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>No. Seri: <strong className="text-slate-800 font-mono">{nomorSeriABD2 || "(Kosong)"}</strong></span>
                    {matchingStock2.length === 0 && !nomorSeriABD2 && (
                      <span className="text-amber-700 font-bold">Stok Gudang Kosong</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Unit 2 (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={hargaABD2}
                    onChange={(e) => setHargaABD2(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-purple-800"
                  />
                </div>
              </div>
            </div>
          )}
          {/* Row 5: Bonus Aksesoris Pembelian ABD (Tambahkan Manual) */}
          <div className="space-y-4 bg-[#FFFDF5] p-4.5 rounded-2xl border-2 border-amber-300 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
              <div>
                <h4 className="font-black text-amber-950 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <span>🎁 Bonus Aksesoris Pembelian ABD</span>
                </h4>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  Tambahkan item aksesoris / bonus secara manual (Otomatis mengurangi stok inventori aksesoris)
                </p>
              </div>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Stok Otomatis Terhubung
              </span>
            </div>

            {/* Quick Bonus Preset Shortcuts */}
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-700" />
                <span>Pilihan Cepat Bonus Favorit (Sekali Klik):</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddBonusItem('Baterai ABD', 'Baterai 13 Sonic', 1)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-700" /> + Baterai 13 Sonic (1 Roll)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBonusItem('Baterai ABD', 'Baterai 675 Sonic', 1)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-700" /> + Baterai 675 Sonic (1 Roll)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBonusItem('Aidtip & Earmould', 'Aidtip Set', 1)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-700" /> + Aidtip Set (1 Pcs)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBonusItem('Aksesoris ABD', 'Drying Jar – Standard', 1)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-700" /> + Drying Jar Standard (1 Pcs)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBonusItem('Aksesoris ABD', 'Earsound Pouch', 1)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-700" /> + Earsound Pouch (1 Pcs)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBonusItem('Aksesoris ABD', 'Baterai Checker', 1)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-700" /> + Baterai Checker (1 Pcs)
                </button>
              </div>
            </div>

            {/* Manual Form to Select Category & Item */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-white p-3 rounded-xl border border-amber-200 items-end">
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori Aksesoris</label>
                <select
                  value={bonusKategori}
                  onChange={(e) => handleBonusCategoryChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  {AKSESORIS_CATEGORY_LIST.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-5">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Pilih Item Aksesoris Bonus</label>
                {filteredBonusCatalog.length > 0 ? (
                  <select
                    value={bonusTipe}
                    onChange={(e) => setBonusTipe(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                  >
                    {filteredBonusCatalog.map((item) => (
                      <option key={item.sku} value={item.nama}>
                        {item.nama} ({item.sku})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={bonusTipe}
                    onChange={(e) => setBonusTipe(e.target.value)}
                    placeholder="Nama item aksesoris..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                  />
                )}
              </div>

              <div className="md:col-span-1.5">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={bonusQty}
                  onChange={(e) => setBonusQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-center text-slate-800"
                />
              </div>

              <div className="md:col-span-1.5">
                <button
                  type="button"
                  onClick={() => handleAddBonusItem(bonusKategori, bonusTipe, bonusQty)}
                  className="w-full py-2 px-3 bg-[#23277A] hover:bg-[#1b1f63] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>
            </div>

            {/* Added Bonus Items List */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-amber-900">Daftar Bonus Aksesoris Ditambahkan:</label>
              {bonusItems.length > 0 ? (
                <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-amber-200 divide-y divide-amber-100">
                  {bonusItems.map((bItem) => (
                    <div key={bItem.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{bItem.tipe}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {bItem.kategori} {bItem.sku ? `(${bItem.sku})` : ''}
                        </span>
                        <span className="font-mono font-bold text-amber-900 text-[11px]">
                          Qty: {bItem.qty} Pcs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-md">
                          GRATIS / BONUS
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBonusItem(bItem.id)}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Bonus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl text-center text-[11px] text-amber-800 font-medium">
                  Belum ada item bonus aksesoris yang ditambahkan. Gunakan pilihan cepat di atas atau form untuk menambah bonus.
                </div>
              )}
            </div>

            {/* Integrasi Cetak Earmould ke Lab */}
            <div className="pt-3 border-t border-amber-200/80">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="pilihEarmouldCheck"
                  checked={pilihEarmould}
                  onChange={(e) => setPilihEarmould(e.target.checked)}
                  className="w-4 h-4 text-[#23277A] rounded focus:ring-[#23277A] cursor-pointer"
                />
                <label htmlFor="pilihEarmouldCheck" className="text-xs font-black text-amber-950 flex items-center gap-1.5 cursor-pointer">
                  <Ear className="w-4 h-4 text-[#23277A]" />
                  <span>Integrasikan Cetak Earmould ke Lab Earmould</span>
                </label>
              </div>

              {pilihEarmould && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-amber-300">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Pilihan Jenis Earmould Unit 1</label>
                    <select
                      value={jenisEarmould}
                      onChange={(e) => setJenisEarmould(e.target.value as JenisEarmould)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                    >
                      <option value="S/C">S/C (Soft Clear)</option>
                      <option value="H/C">H/C (Hard Clear)</option>
                      <option value="S/FS">S/FS (Soft Full Shell)</option>
                      <option value="H/FS">H/FS (Hard Full Shell)</option>
                    </select>
                  </div>

                  {fittingType === 'Binaural' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Pilihan Jenis Earmould Unit 2</label>
                      <select
                        value={jenisEarmould2}
                        onChange={(e) => setJenisEarmould2(e.target.value as JenisEarmould)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                      >
                        <option value="S/C">S/C (Soft Clear)</option>
                        <option value="H/C">H/C (Hard Clear)</option>
                        <option value="S/FS">S/FS (Soft Full Shell)</option>
                        <option value="H/FS">H/FS (Hard Full Shell)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 6: Prices Calculation & DP Option */}
          <div className="space-y-3 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Total Gross ABD (ABD 1 + ABD 2)</label>
                <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm font-black text-amber-400">
                  {formatRupiah(grossTotal)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Potongan Diskon (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={diskon}
                  onChange={(e) => setDiskon(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-rose-400 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Total Tagihan Net</label>
                <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm font-black text-[#F5B438]">
                  {formatRupiah(netTotal)}
                </div>
              </div>
            </div>

            {/* Down Payment (Uang Muka DP) Section */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-dp"
                  checked={isDP}
                  onChange={(e) => setIsDP(e.target.checked)}
                  className="w-4 h-4 text-[#F5B438] rounded focus:ring-[#F5B438]"
                />
                <label htmlFor="chk-dp" className="text-xs font-extrabold text-amber-300 cursor-pointer">
                  Pembayaran Uang Muka (DP) / Belum Lunas
                </label>
              </div>

              {isDP ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">Nominal Uang Muka / DP (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={uangMuka}
                      onChange={(e) => setUangMuka(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-amber-500 rounded-xl p-2.5 text-xs font-bold text-amber-300 focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-300 mb-1">Sisa Pelunasan (Otomatis)</label>
                    <div className="w-full bg-rose-950/70 border border-rose-500 rounded-xl p-2.5 text-xs font-black text-rose-300">
                      {formatRupiah(sisaPembayaran)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-xs text-slate-400 font-medium">
                  Status Pembayaran: <span className="text-emerald-400 font-bold">LUNAS LANGSUNG</span> (Akan diterbitkan Invoice Lunas).
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <PaymentSelector 
            value={payment} 
            totalAmount={isDP ? (effectiveDP || 0) : netTotal}
            branchCode={activeBranchCode}
            onChange={setPayment} 
          />

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-xs shadow-md"
            >
              Simpan & Terbitkan {isDP ? 'Kwitansi DP ABD' : 'Faktur ABD'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Export Toolbar */}
      <ReportFilterToolbar
        title="Laporan & Filter Tanggal Transaksi ABD"
        totalRecords={transactions.length}
        filteredRecordsCount={filteredTransactions.length}
        totalAmount={totalFilteredAmount}
        amountLabel="Total Penjualan ABD"
        onFilterChange={(start, end, label) => {
          setFilterStartDate(start);
          setFilterEndDate(end);
          setCurrentPeriodLabel(label);
        }}
        onExportCSV={handleExportCSV}
      />

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari transaksi ABD, serial, cabang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: {filteredTransactions.length} Transaksi Penjualan ABD
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Belum ada data transaksi ABD.
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const hasDP = t.isDP || (t.sisaPembayaran && t.sisaPembayaran > 0) || ((t.uangMuka || 0) > 0 && (t.uangMuka || 0) < (t.jumlah || 0));
            return (
              <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#23277A] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {t.nomorFakturPenjualan}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">
                      {formatPatientWithGelar(t.namaPasien, t.gelar || patients.find(p => p.id === t.idPelanggan)?.gelar)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {t.idPelanggan} • [{t.branchCode || 'YM'}] Staff: @{t.staffUser || 'admin'}</p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSendWhatsApp(t)}
                      className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"
                      title="Kirim Faktur/Kwitansi via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    {onPrintInvoice && (
                      <button
                        onClick={() => onPrintInvoice(t)}
                        className="p-2 bg-indigo-50 text-[#23277A] rounded-xl"
                        title="Cetak Faktur/Kwitansi"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(t)}
                      className="p-2 bg-amber-50 text-amber-700 rounded-xl"
                      title="Edit Transaksi (Otorisasi CEO)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
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
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipe ABD Unit 1:</span>
                    <span className="font-bold text-slate-800">{t.tipeABD} {t.modelABD && t.modelABD !== '-' ? `[${t.modelABD}]` : ''} ({t.nomorSeriABD})</span>
                  </div>
                  {t.tipeABD2 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tipe ABD Unit 2:</span>
                      <span className="font-bold text-purple-800">{t.tipeABD2} {t.modelABD2 && t.modelABD2 !== '-' ? `[${t.modelABD2}]` : ''} ({t.nomorSeriABD2 || '-'})</span>
                    </div>
                  )}
                  {t.bonusItems && t.bonusItems.length > 0 ? (
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-slate-500">Bonus Aksesoris:</span>
                      <span className="font-bold text-emerald-800 text-right">
                        {t.bonusItems.map(b => `${b.tipe} (${b.qty} Pcs)`).join(', ')}
                      </span>
                    </div>
                  ) : t.paketBundling ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Paket Bundling:</span>
                      <span className="font-bold text-amber-800">{t.paketBundling}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-slate-500">HAC Consultant:</span>
                    <span className="font-medium text-slate-700">{t.hac}</span>
                  </div>

                  {hasDP ? (
                    <div className="pt-1 border-t border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-amber-800">
                        <span>DP Diterima:</span>
                        <span>{formatRupiah(t.uangMuka || 0)}</span>
                      </div>
                      <div className="flex justify-between font-black text-rose-700">
                        <span>Sisa Pelunasan:</span>
                        <span>{formatRupiah(t.sisaPembayaran || Math.max(0, t.jumlah - (t.uangMuka || 0)))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#23277A]">
                      <span>Total Net Lunas:</span>
                      <span className="text-sm font-black">{formatRupiah(t.jumlah)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Pembelian: {formatIndoDate(t.tanggal)}</span>
                  <span className={`px-2 py-0.5 font-bold rounded-full ${hasDP ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                    {hasDP ? 'UANG MUKA (DP)' : 'LUNAS'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#181B57] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">Tgl Pembelian</th>
                <th className="p-3.5">No. Faktur</th>
                <th className="p-3.5">ID & Nama Pasien</th>
                <th className="p-3.5">HAC & Unit ABD</th>
                <th className="p-3.5">Fitting & Serial Number</th>
                <th className="p-3.5 text-right">Harga Gross & Diskon</th>
                <th className="p-3.5 text-right">Status DP & Tagihan</th>
                <th className="p-3.5">Pembayaran</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Belum ada data transaksi ABD.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const hasDP = t.isDP || (t.sisaPembayaran && t.sisaPembayaran > 0) || ((t.uangMuka || 0) > 0 && (t.uangMuka || 0) < (t.jumlah || 0));
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                        {formatIndoDate(t.tanggal)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#23277A] block">{t.nomorFakturPenjualan}</span>
                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                          [{t.branchCode || 'YM'}] Staff: @{t.staffUser || 'admin'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {formatPatientWithGelar(t.namaPasien, t.gelar || patients.find(p => p.id === t.idPelanggan)?.gelar)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.idPelanggan}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{t.tipeABD}</div>
                        {t.tipeABD2 && (
                          <div className="text-xs font-semibold text-purple-800">Unit 2: {t.tipeABD2}</div>
                        )}
                        <div className="text-xs text-slate-500">HAC: {t.hac}</div>
                        {t.bonusItems && t.bonusItems.length > 0 ? (
                          <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-block mt-0.5 max-w-[200px] truncate" title={t.bonusItems.map(b => `${b.tipe} (${b.qty} Pcs)`).join(', ')}>
                            🎁 {t.bonusItems.map(b => `${b.tipe} (${b.qty})`).join(', ')}
                          </div>
                        ) : t.paketBundling ? (
                          <div className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            {t.paketBundling}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-[#23277A] rounded-md font-bold text-[10px] mb-1">
                          {t.fittingType}
                        </span>
                        <div className="text-[11px] font-mono text-slate-700">{t.nomorSeriABD}</div>
                        {t.nomorSeriABD2 && (
                          <div className="text-[11px] font-mono text-purple-700">{t.nomorSeriABD2}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{formatRupiah(t.hargaJual)}</div>
                        {t.diskon > 0 && (
                          <div className="text-rose-600 font-semibold text-[11px]">
                            - {formatRupiah(t.diskon)}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {hasDP ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full inline-block">
                              DP: {formatRupiah(t.uangMuka || 0)}
                            </span>
                            <div className="text-xs font-black text-rose-600">
                              Sisa: {formatRupiah(t.sisaPembayaran || Math.max(0, t.jumlah - (t.uangMuka || 0)))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-block mb-0.5">
                              LUNAS
                            </span>
                            <div className="font-black text-[#23277A] text-xs">
                              {formatRupiah(t.jumlah)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {t.payment.method === 'Split (Cash & Transfer)' ? (
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              Split (Cash + TF)
                            </span>
                            <div className="text-[10px] text-emerald-800 font-mono font-semibold">
                              Cash: {formatRupiah(t.payment.cashAmount || 0)}
                            </div>
                            <div className="text-[10px] text-[#23277A] font-mono font-semibold">
                              TF: {formatRupiah(t.payment.transferAmount || 0)}
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              t.payment.method === 'Cash'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.payment.method === 'Transfer'
                                ? 'bg-indigo-100 text-[#23277A]'
                                : t.payment.method === 'Shopee'
                                ? 'bg-orange-100 text-[#EE4D2D] border border-orange-300 font-extrabold'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {t.payment.method === 'Shopee' ? 'Shopee (YM)' : t.payment.method}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Kirim Faktur/Kwitansi via WhatsApp"
                            onClick={() => handleSendWhatsApp(t)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {onPrintInvoice && (
                            <button
                              title={hasDP ? "Cetak Kwitansi DP ABD" : "Cetak Invoice Lunas ABD"}
                              onClick={() => onPrintInvoice(t)}
                              className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            title="Edit Transaksi (Otorisasi PIN CEO)"
                            onClick={() => handleEditClick(t)}
                            className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIN CEO Verification Modal */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinVerified}
        title="Otorisasi PIN CEO Edit Transaksi ABD"
        description="Masukan PIN khusus CEO untuk mengedit data transaksi penjualan ABD."
      />

      {/* Edit Transaction Modal */}
      {selectedTxToEdit && (
        <EditTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTxToEdit(null);
          }}
          transaction={selectedTxToEdit}
          type="ABD"
          patients={patients}
          onSaveABD={(updated) => {
            if (onSaveTransaction) onSaveTransaction(updated);
            setIsEditModalOpen(false);
            setSelectedTxToEdit(null);
          }}
        />
      )}

      {/* Catalog & Bundling Reference Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-200 p-6 space-y-6 animate-scaleIn">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                <Tag className="w-6 h-6 text-amber-600" />
                <span>Katalog Harga Resmi ABD & Paket Bundling</span>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bundling Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <div className="flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-amber-600" />
                  <span>PAKET PEMBELIAN ABD (BUNDLING) RESMI</span>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  3 Opsi Paket: Basic, Essential & Exclusive
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PAKET_BUNDLING.map((pkg) => (
                  <div key={pkg.nama} className="border-2 border-slate-200 hover:border-amber-500 rounded-2xl p-4 bg-slate-50/80 hover:bg-white flex flex-col justify-between transition-all shadow-xs">
                    <div>
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                        <span className="font-black text-slate-900 text-sm tracking-wide uppercase">PAKET {pkg.nama}</span>
                        <span className="font-black text-amber-900 text-xs bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                          {formatRupiah(pkg.totalHarga)}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                        {pkg.items.map((it, idx) => (
                          <li key={idx} className="flex justify-between items-center border-b border-slate-200/50 pb-1 text-[11px]">
                            <span className="font-medium text-slate-800">{it.namaItem}</span>
                            <span className="font-bold text-slate-900 ml-2 whitespace-nowrap">
                              {it.hargaVal ? formatRupiah(it.hargaVal) : '-'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center text-xs font-black text-slate-900 mb-2">
                        <span>Total Harga:</span>
                        <span className="text-amber-800 text-sm">{formatRupiah(pkg.totalHarga)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleBundlingSelect(pkg.nama);
                          setShowCatalogModal(false);
                          setShowForm(true);
                        }}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Pilih Paket {pkg.nama}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ABD Models Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 bg-slate-100 p-2.5 rounded-xl">
                <Volume2 className="w-4 h-4 text-[#23277A]" />
                <span>Tipe ABD & Daftar Harga Resmi (48 Unit)</span>
              </h3>
              <div className="border rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900 text-white font-bold text-[11px]">
                    <tr>
                      <th className="p-3">TIPE ABD</th>
                      <th className="p-3 text-right">HARGA RESMI</th>
                      <th className="p-3 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {ABD_PRICE_CATALOG.map((item) => (
                      <tr key={item.tipe} className="hover:bg-indigo-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{item.tipe}</td>
                        <td className="p-2.5 text-right font-black text-[#23277A]">{formatRupiah(item.harga)}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              handleAbdModel1Select(item.tipe);
                              setShowCatalogModal(false);
                              setShowForm(true);
                            }}
                            className="px-2.5 py-1 bg-[#23277A] hover:bg-[#181B57] text-white rounded-lg text-[11px] font-bold shadow-2xs"
                          >
                            Pilih Model Ini
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

      {/* Modal Cek Stok Tersedia di Cabang */}
      {showBranchStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#23277A] flex items-center justify-center text-white shadow-md">
                  <PackageCheck className="w-5 h-5 text-[#F5B438]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Stok Tersedia Cabang {getBranchByCode(activeBranchCode).name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-[#23277A] border border-indigo-200">
                      [{activeBranchCode}]
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hanya menampilkan stok fisik ready / tersedia (Qty &gt; 0) untuk transaksi staff cabang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBranchStockModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Tabs */}
            <div className="p-4 bg-white border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari SKU, Tipe, Model, atau Nama Produk..."
                  value={branchStockSearchTerm}
                  onChange={(e) => setBranchStockSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#23277A] focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBranchStockActiveTab('ABD')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    branchStockActiveTab === 'ABD'
                      ? 'bg-[#23277A] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Alat Bantu Dengar ({branchAvailableABDList.reduce((acc, i) => acc + i.qty, 0)} Unit Ready)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBranchStockActiveTab('AKSESORIS')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    branchStockActiveTab === 'AKSESORIS'
                      ? 'bg-[#23277A] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Aksesoris ({branchAvailableAksesorisList.reduce((acc, i) => acc + i.qty, 0)} Pcs Ready)</span>
                </button>
              </div>
            </div>

            {/* Modal Body / Table */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[55vh]">
              {branchStockActiveTab === 'ABD' ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181B57] text-white font-bold text-[11px] sticky top-0">
                      <tr>
                        <th className="p-3 w-32">SKU</th>
                        <th className="p-3">TIPE & MODEL</th>
                        <th className="p-3 text-center w-28">QTY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredBranchABDList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="p-3 font-mono font-bold">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 font-mono text-xs font-bold">
                              {item.sku}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 text-xs">
                              {item.tipeABD} {item.model ? `- ${item.model}` : ''}
                            </div>
                            {item.serialNumbers.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                <span className="text-[10px] text-slate-400 font-medium mr-1">SN Ready:</span>
                                {item.serialNumbers.map((sn, sIdx) => (
                                  <span key={sIdx} className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px]">
                                    {sn}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {item.qty} Unit
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredBranchABDList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <Volume2 className="w-8 h-8 text-slate-300" />
                              <p className="font-bold text-slate-600 text-xs">Tidak ada stok Alat Bantu Dengar yang tersedia di cabang ini</p>
                              {branchStockSearchTerm && (
                                <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian "{branchStockSearchTerm}"</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181B57] text-white font-bold text-[11px] sticky top-0">
                      <tr>
                        <th className="p-3 w-32">SKU</th>
                        <th className="p-3">TIPE / PRODUK</th>
                        <th className="p-3 text-center w-28">QTY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredBranchAksesorisList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="p-3 font-mono font-bold">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[#23277A] font-mono text-xs font-bold">
                              {item.sku}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 text-xs">{item.tipe}</div>
                            <span className="inline-block mt-0.5 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.2 rounded">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {item.qty} Pcs
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredBranchAksesorisList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <Tag className="w-8 h-8 text-slate-300" />
                              <p className="font-bold text-slate-600 text-xs">Tidak ada stok Aksesoris yang tersedia di cabang ini</p>
                              {branchStockSearchTerm && (
                                <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian "{branchStockSearchTerm}"</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Cabang: <span className="font-bold text-slate-800">{getBranchByCode(activeBranchCode).name}</span> ({activeBranchCode})
              </div>
              <button
                type="button"
                onClick={() => setShowBranchStockModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
