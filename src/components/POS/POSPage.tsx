import React, { useState, useMemo, useEffect } from 'react';
import { 
  Patient, 
  AppUser, 
  BranchCode, 
  POSCartItem, 
  POSItemCategory, 
  POSTransactionReceipt, 
  PaymentDetails, 
  PaymentMethod, 
  BsiAccount,
  AksesorisTransaction,
  JasaPeriksaTransaction,
  ABDTransaction,
  AksesorisInventoryEntry,
  ABDInventoryEntry,
  JenisPemeriksaan,
  JenisEarmould,
  FittingType,
  EarmouldSide
} from '../../types';
import { ABD_PRICE_CATALOG, CATALOG_AKSESORIS_SERVICE, PAKET_BUNDLING, ABDPriceItem } from '../../data/priceCatalog';
import { formatIndoDate, formatRupiah } from '../../utils/formatters';
import { 
  BRANCHES, 
  getBranchByCode, 
  generateKwitansiNumber, 
  getDefaultBsiAccount, 
  ALL_BSI_ACCOUNTS_ORDERED, 
  BRANCH_BSI_ACCOUNTS 
} from '../../utils/branches';
import { POSReceiptModal } from './POSReceiptModal';
import { PatientModal } from '../Patients/PatientModal';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserCheck, 
  UserPlus, 
  CheckCircle2, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Percent, 
  X, 
  ChevronRight, 
  Tag, 
  Volume2, 
  Stethoscope, 
  Battery, 
  ShoppingBag, 
  Disc, 
  Wrench, 
  Package, 
  Layers,
  ArrowRight,
  AlertCircle,
  Calculator,
  RefreshCw,
  Printer
} from 'lucide-react';

interface POSPageProps {
  patients: Patient[];
  currentUser: AppUser;
  selectedBranch: BranchCode;
  inventoryABD?: ABDInventoryEntry[];
  inventoryAksesoris?: AksesorisInventoryEntry[];
  onAddPatient: (patient: Patient) => void;
  onAddAksesoris: (transaction: AksesorisTransaction) => void;
  onAddJasaPeriksa: (transaction: JasaPeriksaTransaction) => void;
  onAddABD: (transaction: ABDTransaction) => void;
}

const AUDIOMETRIS_LIST = [
  'Diana',
  'Agung',
  'Mutia',
  'Dila',
  'Adit',
  'Ira',
  'Fifah',
  'Rara',
  'Rendi',
  'Zidan'
];

const JASA_MEDIS_CATALOG = [
  { name: 'Audiometri Nada Murni', price: 100000, desc: 'Pemeriksaan ambang pendengaran konduktif & sensorineural' },
  { name: 'Play Audiometri Anak', price: 100000, desc: 'Pemeriksaan pendengaran khusus anak usia dini' },
  { name: 'Tympanometri', price: 100000, desc: 'Pemeriksaan fungsi & kelenturan membran timpani telinga tengah' },
  { name: 'Tympanometry Lengkap', price: 200000, desc: 'Pemeriksaan fungsi telinga tengah & refleks akustik' },
  { name: 'OAE (Otoacoustic Emission)', price: 200000, desc: 'Pemeriksaan sel rambut luar koklea (Screening bayi & anak)' },
  { name: 'BERA (Brainstem Evoked Audiometry)', price: 1300000, desc: 'Pemeriksaan respon saraf pendengaran ke batang otak' },
  { name: 'FFT (Free Field Test)', price: 100000, desc: 'Pemeriksaan gain & performa saat memakai Alat Bantu Dengar' },
  { name: 'Konsultasi & Otoskopi Free Check', price: 0, desc: 'Pemeriksaan liang telinga & konsultasi pendengaran dasar' },
];

export const POSPage: React.FC<POSPageProps> = ({
  patients,
  currentUser,
  selectedBranch,
  inventoryABD = [],
  inventoryAksesoris = [],
  onAddPatient,
  onAddAksesoris,
  onAddJasaPeriksa,
  onAddABD,
}) => {
  const activeBranchCode = (selectedBranch === 'ALL' || selectedBranch === 'HQ')
    ? (currentUser.branchCode === 'ALL' || currentUser.branchCode === 'HQ' ? 'YM' : currentUser.branchCode)
    : selectedBranch;
  
  const branchInfo = getBranchByCode(activeBranchCode);

  // Active Patient State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isQuickPatientModalOpen, setIsQuickPatientModalOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [transactionDiscountType, setTransactionDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [transactionDiscountValue, setTransactionDiscountValue] = useState<number>(0);

  // Active Catalog Filter
  const [activeCategory, setActiveCategory] = useState<POSItemCategory | 'ALL'>('ALL');
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

  // ABD Config Modal State (when adding ABD to cart)
  const [isABDModalOpen, setIsABDModalOpen] = useState(false);
  const [selectedABDItem, setSelectedABDItem] = useState<ABDPriceItem | null>(null);
  const [abdEarSide, setAbdEarSide] = useState<'Monoaural (Kanan)' | 'Monoaural (Kiri)' | 'Binaural'>('Monoaural (Kanan)');
  const [abdSerial1, setAbdSerial1] = useState('');
  const [abdSerial2, setAbdSerial2] = useState('');
  const [abdCustomPrice, setAbdCustomPrice] = useState<number>(0);
  const [abdPackage, setAbdPackage] = useState<'Tanpa Bundling' | 'Basic' | 'Essential' | 'Exclusive'>('Tanpa Bundling');
  const [abdEarmouldMaterial, setAbdEarmouldMaterial] = useState<JenisEarmould>('S/C');

  // Custom Item Modal State
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState<POSItemCategory>('Kustom');
  const [customItemPrice, setCustomItemPrice] = useState<number | ''>('');
  const [customItemNotes, setCustomItemNotes] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [selectedBsiAccount, setSelectedBsiAccount] = useState<BsiAccount>(getDefaultBsiAccount(activeBranchCode));
  const [shopeeOrderNo, setShopeeOrderNo] = useState('');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [isDP, setIsDP] = useState(false);
  const [uangMuka, setUangMuka] = useState<number | ''>('');
  const [selectedAudiometris, setSelectedAudiometris] = useState(currentUser.fullName || AUDIOMETRIS_LIST[0]);
  const [transactionNotes, setTransactionNotes] = useState('');

  // Sync default BSI account when branch changes
  useEffect(() => {
    setSelectedBsiAccount(getDefaultBsiAccount(activeBranchCode));
  }, [activeBranchCode]);

  // Checkout Receipt Modal
  const [completedReceipt, setCompletedReceipt] = useState<POSTransactionReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Filtered Patients for autocomplete
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return patients.slice(0, 10);
    const q = patientSearchTerm.toLowerCase();
    return patients.filter(p => 
      p.nama.toLowerCase().includes(q) ||
      (p.telepon && p.telepon.includes(q)) ||
      p.id.toLowerCase().includes(q) ||
      (p.alamat?.kabupatenKota && p.alamat.kabupatenKota.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [patients, patientSearchTerm]);

  // Unified Product Catalog
  const fullProductCatalog = useMemo(() => {
    const items: {
      id: string;
      category: POSItemCategory;
      name: string;
      subtype?: string;
      price: number;
      desc?: string;
      rawABD?: ABDPriceItem;
    }[] = [];

    // 1. Jasa Medis
    JASA_MEDIS_CATALOG.forEach((j, idx) => {
      items.push({
        id: `jasa-${idx}`,
        category: 'Jasa Medis',
        name: j.name,
        price: j.price,
        desc: j.desc,
      });
    });

    // 2. ABD
    ABD_PRICE_CATALOG.forEach((abd) => {
      items.push({
        id: `abd-${abd.id}`,
        category: 'Alat Bantu Dengar',
        name: `${abd.tipe} (${abd.model})`,
        subtype: abd.model,
        price: abd.harga,
        desc: `Alat Bantu Dengar Model ${abd.model}`,
        rawABD: abd,
      });
    });

    // 3. Aksesoris, Baterai, Earmould, Servis
    CATALOG_AKSESORIS_SERVICE.forEach((aks, idx) => {
      let mappedCat: POSItemCategory = 'Aksesoris & Charger';
      if (aks.kategori === 'Baterai ABD') mappedCat = 'Baterai';
      else if (aks.kategori === 'Aidtip & Earmould') mappedCat = 'Lab Earmould';
      else if (aks.kategori === 'Spare Part dan Service') mappedCat = 'Servis & Reparasi';
      else mappedCat = 'Aksesoris & Charger';

      items.push({
        id: `aks-${idx}`,
        category: mappedCat,
        name: aks.nama,
        subtype: aks.kategori,
        price: aks.harga,
        desc: aks.kategori,
      });
    });

    return items;
  }, []);

  // Filtered Catalog by category & search
  const visibleCatalog = useMemo(() => {
    return fullProductCatalog.filter(item => {
      const matchCategory = activeCategory === 'ALL' || item.category === activeCategory;
      const matchSearch = !catalogSearchTerm.trim() || 
        item.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
        (item.subtype && item.subtype.toLowerCase().includes(catalogSearchTerm.toLowerCase())) ||
        (item.desc && item.desc.toLowerCase().includes(catalogSearchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [fullProductCatalog, activeCategory, catalogSearchTerm]);

  // Stock calculation helper for current branch
  const getBranchStock = (itemName: string, category: POSItemCategory) => {
    if (category === 'Alat Bantu Dengar') {
      const inStock = inventoryABD
        .filter(inv => inv.branchCode === activeBranchCode && inv.tipeABD.toLowerCase().includes(itemName.split(' ')[0].toLowerCase()))
        .reduce((sum, inv) => sum + (inv.type === 'MASUK' ? 1 : -1), 0);
      return Math.max(0, inStock);
    } else if (category === 'Baterai' || category === 'Aksesoris & Charger' || category === 'Lab Earmould') {
      const inStock = inventoryAksesoris
        .filter(inv => inv.branchCode === activeBranchCode && (inv.tipe.toLowerCase().includes(itemName.toLowerCase()) || inv.kategori.toLowerCase().includes(itemName.toLowerCase())))
        .reduce((sum, inv) => sum + (inv.type === 'MASUK' ? inv.qty : -inv.qty), 0);
      return Math.max(0, inStock);
    }
    return null;
  };

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (transactionDiscountType === 'percent') {
      return Math.round((cartSubtotal * Math.min(100, Math.max(0, transactionDiscountValue))) / 100);
    }
    return Math.min(cartSubtotal, Math.max(0, transactionDiscountValue));
  }, [cartSubtotal, transactionDiscountType, transactionDiscountValue]);

  const cartGrandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount);
  }, [cartSubtotal, discountAmount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Cash' || typeof cashGiven !== 'number') return 0;
    const toPay = isDP && typeof uangMuka === 'number' ? uangMuka : cartGrandTotal;
    return Math.max(0, cashGiven - toPay);
  }, [paymentMethod, cashGiven, cartGrandTotal, isDP, uangMuka]);

  const sisaPembayaran = useMemo(() => {
    if (!isDP || typeof uangMuka !== 'number') return 0;
    return Math.max(0, cartGrandTotal - uangMuka);
  }, [isDP, uangMuka, cartGrandTotal]);

  // Add Item to Cart Handlers
  const handleAddToCart = (product: {
    id: string;
    category: POSItemCategory;
    name: string;
    subtype?: string;
    price: number;
    rawABD?: ABDPriceItem;
  }) => {
    if (product.category === 'Alat Bantu Dengar' && product.rawABD) {
      // Open configuration modal for ABD
      setSelectedABDItem(product.rawABD);
      setAbdCustomPrice(product.price);
      setAbdEarSide('Monoaural (Kanan)');
      setAbdSerial1('');
      setAbdSerial2('');
      setAbdPackage('Tanpa Bundling');
      setAbdEarmouldMaterial('S/C');
      setIsABDModalOpen(true);
      return;
    }

    // Standard item add (Lab Earmould & Servis are custom-made on demand, no inventory stock required)
    const isCustomOnDemand = product.category === 'Lab Earmould' || product.category === 'Servis & Reparasi' || product.category === 'Kustom';
    const currentStock = isCustomOnDemand ? null : getBranchStock(product.name, product.category);
    if (!isCustomOnDemand && currentStock !== null && currentStock <= 0) {
      alert(`STOK TIDAK TERSEDIA!\n\nProduk "${product.name}" di Gudang Cabang [${activeBranchCode}] saat ini KOSONG (0 Pcs).\n\nHanya stok yang ada di gudang cabang yang dapat ditransaksikan.`);
      return;
    }

    const existingIndex = cart.findIndex(c => c.name === product.name && c.category === product.category);
    if (existingIndex > -1) {
      const updated = [...cart];
      const item = updated[existingIndex];
      const newQty = item.qty + 1;
      if (!isCustomOnDemand && currentStock !== null && newQty > currentStock) {
        alert(`STOK TIDAK MENCUKUPI!\n\nStok produk "${product.name}" di Gudang Cabang [${activeBranchCode}] tersisa ${currentStock} Pcs.\n\nTidak dapat menambah lebih dari stok yang ada.`);
        return;
      }
      updated[existingIndex] = {
        ...item,
        qty: newQty,
        subtotal: (item.price * newQty) - item.discount,
      };
      setCart(updated);
    } else {
      const newItem: POSCartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        category: product.category,
        name: product.name,
        subtype: product.subtype,
        price: product.price,
        qty: 1,
        discount: 0,
        subtotal: product.price,
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const handleConfirmAddABD = () => {
    if (!selectedABDItem) return;

    let finalPrice = abdCustomPrice;
    let bundlingPrice = 0;
    if (abdPackage !== 'Tanpa Bundling') {
      const pkg = PAKET_BUNDLING.find(p => p.nama === abdPackage);
      if (pkg) bundlingPrice = pkg.totalHarga;
    }

    if (abdEarSide === 'Binaural') {
      finalPrice = (finalPrice * 2) + bundlingPrice;
    } else {
      finalPrice = finalPrice + bundlingPrice;
    }

    const newItem: POSCartItem = {
      id: `cart-abd-${Date.now()}`,
      category: 'Alat Bantu Dengar',
      name: `${selectedABDItem.tipe} (${selectedABDItem.model})`,
      subtype: selectedABDItem.model,
      price: finalPrice,
      qty: 1,
      discount: 0,
      subtotal: finalPrice,
      earSide: abdEarSide,
      serialNumber: abdSerial1 || 'Auto-Generate',
      serialNumber2: abdEarSide === 'Binaural' ? (abdSerial2 || 'Auto-Generate') : undefined,
      modelABD: selectedABDItem.model,
      modelABD2: abdEarSide === 'Binaural' ? selectedABDItem.model : undefined,
      tipeABD2: abdEarSide === 'Binaural' ? selectedABDItem.tipe : undefined,
      bundlingPackage: abdPackage !== 'Tanpa Bundling' ? abdPackage : undefined,
      jenisEarmould: abdEarmouldMaterial,
      notes: `Sisi: ${abdEarSide}${abdPackage !== 'Tanpa Bundling' ? ` | Bundling: ${abdPackage}` : ''}`,
    };

    setCart(prev => [...prev, newItem]);
    setIsABDModalOpen(false);
  };

  const handleConfirmAddCustomItem = () => {
    if (!customItemName.trim() || typeof customItemPrice !== 'number' || customItemPrice < 0) {
      alert('Mohon lengkapi nama barang/jasa dan harga.');
      return;
    }

    const newItem: POSCartItem = {
      id: `cart-custom-${Date.now()}`,
      category: customItemCategory,
      name: customItemName.trim(),
      price: customItemPrice,
      qty: 1,
      discount: 0,
      subtotal: customItemPrice,
      notes: customItemNotes.trim() || undefined,
    };

    setCart(prev => [...prev, newItem]);
    setIsCustomItemModalOpen(false);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemNotes('');
  };

  // Cart Qty & Discount adjustments
  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(1, item.qty + delta);
      return {
        ...item,
        qty: newQty,
        subtotal: (item.price * newQty) - item.discount,
      };
    }));
  };

  const handleUpdateItemDiscount = (id: string, discountVal: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const safeDiscount = Math.max(0, Math.min(item.price * item.qty, discountVal));
      return {
        ...item,
        discount: safeDiscount,
        subtotal: (item.price * item.qty) - safeDiscount,
      };
    }));
  };

  const handleRemoveCartItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Kosongkan semua item di keranjang kasir?')) {
      setCart([]);
      setTransactionDiscountValue(0);
      setCashGiven('');
      setIsDP(false);
      setUangMuka('');
    }
  };

  // Quick Select Walk-in / Guest Patient
  const handleSelectWalkInGuest = () => {
    const guestPatient: Patient = {
      id: `WALKIN-${Date.now().toString().slice(-6)}`,
      nama: 'Pasien Umum / Walk-In',
      tanggalLahir: '2000-01-01',
      usia: 0,
      gender: 'L',
      telepon: '-',
      alamat: {
        kecamatan: '-',
        kabupatenKota: branchInfo.city,
        provinsi: 'Sumatera Barat',
      },
      referal: 'Plang Toko, Neonbox, Google Maps / Walk-in',
      createdAt: new Date().toISOString(),
      branchCode: activeBranchCode,
      staffUser: currentUser.username,
    };
    setSelectedPatient(guestPatient);
    setIsPatientDropdownOpen(false);
    setPatientSearchTerm('');
  };

  // Checkout and Save to Firestore
  const handleCheckout = () => {
    if (!selectedPatient) {
      alert('Silakan pilih atau daftarkan Pasien terlebih dahulu.');
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang kasir masih kosong. Silakan pilih produk atau jasa.');
      return;
    }

    if (isDP && (typeof uangMuka !== 'number' || uangMuka <= 0)) {
      alert('Masukkan nominal Uang Muka (DP) yang valid.');
      return;
    }

    if (paymentMethod === 'Cash' && typeof cashGiven === 'number' && cashGiven < (isDP && typeof uangMuka === 'number' ? uangMuka : cartGrandTotal)) {
      alert('Jumlah uang tunai yang diterima kurang dari total pembayaran.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const invoiceNumber = `INV-${activeBranchCode}-${Date.now().toString().slice(-6)}`;

    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
      bsiAccount: paymentMethod === 'Transfer' ? selectedBsiAccount : undefined,
      shopeeOrderNo: paymentMethod === 'Shopee' ? (shopeeOrderNo || 'Pesanan Shopee Yamin') : undefined,
    };

    // 1. Distribute Aksesoris, Baterai, Charger & Service items
    const aksesorisItems = cart.filter(c => c.category === 'Baterai' || c.category === 'Aksesoris & Charger' || c.category === 'Lab Earmould' || c.category === 'Servis & Reparasi' || c.category === 'Kustom');
    if (aksesorisItems.length > 0) {
      const aksSubtotal = aksesorisItems.reduce((s, i) => s + i.subtotal, 0);
      const aksTx: AksesorisTransaction = {
        id: `AKS-POS-${Date.now()}`,
        tanggal: today,
        idPelanggan: selectedPatient.id,
        namaCustomer: selectedPatient.nama,
        category: aksesorisItems[0].category === 'Baterai' ? 'Baterai Alat Bantu Dengar' : 'Multi-Item' as any,
        qty: aksesorisItems.reduce((s, i) => s + i.qty, 0),
        nomorFaktur: invoiceNumber,
        hargaJual: aksSubtotal,
        diskon: 0,
        jumlah: aksSubtotal,
        payment: paymentDetails,
        branchCode: activeBranchCode,
        staffUser: currentUser.fullName || currentUser.username,
        items: aksesorisItems.map(item => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          category: item.category === 'Baterai' ? 'Baterai Alat Bantu Dengar' : 'Aksesoris ABD',
          subtype: item.name,
          qty: item.qty,
          hargaJual: item.price,
          subtotal: item.subtotal,
        }))
      };
      onAddAksesoris(aksTx);
    }

    // 2. Distribute Jasa Medis items
    const jasaItems = cart.filter(c => c.category === 'Jasa Medis');
    if (jasaItems.length > 0) {
      const jasaSubtotal = jasaItems.reduce((s, i) => s + i.subtotal, 0);
      const jasaTx: JasaPeriksaTransaction = {
        id: `JSA-POS-${Date.now()}`,
        tanggal: today,
        idPelanggan: selectedPatient.id,
        namaCustomer: selectedPatient.nama,
        nomorKwitansi: invoiceNumber,
        jenisPemeriksaan: jasaItems.map(j => j.name as JenisPemeriksaan),
        examinationItems: jasaItems.map(j => ({
          jenis: j.name as JenisPemeriksaan,
          biaya: j.subtotal,
        })),
        subtotalBiaya: jasaSubtotal,
        diskon: 0,
        biayaJasaPeriksa: jasaSubtotal,
        audiometris: selectedAudiometris,
        catatanHasil: transactionNotes || 'Pemeriksaan via Kasir POS',
        payment: paymentDetails,
        branchCode: activeBranchCode,
        staffUser: currentUser.fullName || currentUser.username,
      };
      onAddJasaPeriksa(jasaTx);
    }

    // 3. Distribute ABD items
    const abdItems = cart.filter(c => c.category === 'Alat Bantu Dengar');
    abdItems.forEach((item, idx) => {
      const isBinaural = item.earSide === 'Binaural';
      const singleAbdPrice = item.price / (isBinaural ? 2 : 1);

      const abdTx: ABDTransaction = {
        id: `ABD-POS-${Date.now()}-${idx}`,
        tanggal: today,
        idPelanggan: selectedPatient.id,
        namaPasien: selectedPatient.nama,
        hac: selectedAudiometris,
        tipeABD: item.name.split(' (')[0],
        modelABD: item.modelABD || 'BTE',
        nomorSeriABD: item.serialNumber || 'SN-BARU',
        hargaABD1: singleAbdPrice,
        tipeABD2: isBinaural ? (item.tipeABD2 || item.name.split(' (')[0]) : undefined,
        modelABD2: isBinaural ? (item.modelABD2 || item.modelABD || 'BTE') : undefined,
        nomorSeriABD2: isBinaural ? (item.serialNumber2 || 'SN-BARU-2') : undefined,
        hargaABD2: isBinaural ? singleAbdPrice : undefined,
        fittingType: (item.earSide as FittingType) || 'Monoaural (Kanan)',
        paketBundling: (item.bundlingPackage as any) || 'Tanpa Bundling',
        jenisEarmould: item.jenisEarmould || 'S/C',
        pilihEarmould: true,
        nomorFakturPenjualan: invoiceNumber,
        hargaJual: item.price,
        diskon: item.discount,
        jumlah: item.subtotal,
        uangMuka: isDP && typeof uangMuka === 'number' ? uangMuka : undefined,
        sisaPembayaran: isDP ? sisaPembayaran : 0,
        isDP: isDP,
        payment: paymentDetails,
        branchCode: activeBranchCode,
        staffUser: currentUser.fullName || currentUser.username,
      };
      onAddABD(abdTx);
    });

    // Create Receipt and open Print Modal
    const receiptData: POSTransactionReceipt = {
      invoiceNumber,
      date: today,
      patient: selectedPatient,
      items: [...cart],
      subtotal: cartSubtotal,
      discountTotal: discountAmount,
      grandTotal: cartGrandTotal,
      payment: paymentDetails,
      cashGiven: typeof cashGiven === 'number' ? cashGiven : undefined,
      changeDue: paymentMethod === 'Cash' ? changeDue : undefined,
      isDP: isDP,
      uangMuka: isDP && typeof uangMuka === 'number' ? uangMuka : undefined,
      sisaPembayaran: isDP ? sisaPembayaran : undefined,
      branchCode: activeBranchCode,
      staffUser: currentUser.fullName || currentUser.username,
      catatan: transactionNotes || undefined,
    };

    setCompletedReceipt(receiptData);
    setIsReceiptModalOpen(true);

    // Reset Cart
    setCart([]);
    setTransactionDiscountValue(0);
    setCashGiven('');
    setShopeeOrderNo('');
    setIsDP(false);
    setUangMuka('');
    setTransactionNotes('');
  };

  const tenderQuickAmounts = [
    50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col -m-3 sm:-m-5 md:-m-6 lg:-m-8 xl:-m-10 w-auto max-w-full overflow-x-hidden">
      {/* Top POS Header Bar */}
      <div className="bg-[#2A2F86] text-white px-3.5 sm:px-6 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 shrink-0 w-full max-w-full">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-400 text-[#2A2F86] rounded-xl shadow-xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">POINT OF SALES (POS)</h1>
              <span className="px-2.5 py-0.5 bg-amber-400 text-[#2A2F86] rounded-full text-[10px] font-black uppercase tracking-wider">
                KASIR CEPAT
              </span>
            </div>
            <p className="text-xs text-indigo-200">
              Klinik: <strong className="text-amber-300">{branchInfo.name} ({activeBranchCode})</strong> • Kasir: <span className="text-white font-semibold">{currentUser.fullName}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCustomItemModalOpen(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Item Bebas</span>
          </button>

          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl text-xs font-bold transition-all border border-red-400/30 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Keranjang</span>
          </button>
        </div>
      </div>

      {/* Main POS Split Screen: Left Product Grid & Right Live Cart */}
      <div className="flex-1 flex flex-col lg:flex-row p-2.5 sm:p-4 gap-4 w-full max-w-full overflow-x-hidden">
        {/* LEFT COLUMN: Patient Selection & Product Catalog */}
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
          {/* Active Patient Card / Fast Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#2A2F86]" />
                <span>Pilih Pasien / Pelanggan Transaksi:</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectWalkInGuest}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>👤 Pasien Walk-in (Umum)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuickPatientModalOpen(true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Pasien Baru</span>
                </button>
              </div>
            </div>

            {selectedPatient ? (
              <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/60 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#2A2F86] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {selectedPatient.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{selectedPatient.nama}</h4>
                      <span className="px-2 py-0.5 bg-indigo-100 text-[#2A2F86] rounded text-[10px] font-mono font-bold">
                        {selectedPatient.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      No. HP: <strong className="text-slate-800">{selectedPatient.telepon || '-'}</strong> • Usia: {selectedPatient.usia} Thn • {selectedPatient.alamat?.kabupatenKota || branchInfo.city}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                  title="Ganti Pasien"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ketik Nama Pasien / No. Rekam Medis / No. HP untuk mencari..."
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A2F86] focus:border-transparent transition-all"
                  />
                </div>

                {isPatientDropdownOpen && filteredPatients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setIsPatientDropdownOpen(false);
                          setPatientSearchTerm('');
                        }}
                        className="w-full p-3 text-left hover:bg-indigo-50/70 transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{p.nama}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{p.id} • {p.telepon || 'Tanpa HP'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {p.alamat?.kabupatenKota || branchInfo.city}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Tabs & Product Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'ALL', label: '⚡ Semua Item', icon: Layers },
                  { id: 'Jasa Medis', label: '🩺 Jasa Medis', icon: Stethoscope },
                  { id: 'Alat Bantu Dengar', label: '🦻 Alat Bantu Dengar', icon: Volume2 },
                  { id: 'Baterai', label: '🔋 Baterai ABD', icon: Battery },
                  { id: 'Aksesoris & Charger', label: '🧴 Aksesoris & Charger', icon: ShoppingBag },
                  { id: 'Lab Earmould', label: '👂 Lab Earmould', icon: Disc },
                  { id: 'Servis & Reparasi', label: '🔧 Servis & Reparasi', icon: Wrench },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      activeCategory === cat.id
                        ? 'bg-[#2A2F86] text-amber-300 shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Product Search Box */}
              <div className="relative min-w-[200px] shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama barang / jasa..."
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A2F86]"
                />
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {visibleCatalog.map((item) => {
                const stock = getBranchStock(item.name, item.category);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddToCart(item)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 hover:border-[#2A2F86] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          item.category === 'Jasa Medis' ? 'bg-indigo-100 text-[#23277A]' :
                          item.category === 'Alat Bantu Dengar' ? 'bg-amber-100 text-amber-900' :
                          item.category === 'Baterai' ? 'bg-blue-100 text-blue-800' :
                          item.category === 'Lab Earmould' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.category}
                        </span>

                        {stock !== null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            Stok: {stock}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#2A2F86] transition-colors line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
                      {item.desc && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-black text-xs text-[#2A2F86]">
                        {formatRupiah(item.price)}
                      </span>

                      <span className="p-1.5 bg-slate-100 group-hover:bg-[#2A2F86] group-hover:text-white text-slate-600 rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}

              {visibleCatalog.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">Tidak ada produk atau jasa yang cocok dengan pencarian.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Cashier Basket & Settlement Panel */}
        <div className="w-full lg:w-[420px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col overflow-hidden max-h-none lg:max-h-[calc(100vh-140px)] min-w-0">
          {/* Cart Header */}
          <div className="bg-[#2A2F86] text-white p-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-amber-300" />
              <h3 className="font-extrabold text-sm text-white">Keranjang Transaksi</h3>
            </div>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold text-amber-300">
              {cart.reduce((s, i) => s + i.qty, 0)} Item
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
            {cart.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-[9px] font-bold text-[#2A2F86] uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h5 className="font-extrabold text-xs text-slate-900 leading-tight">{item.name}</h5>
                    {item.notes && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5">{item.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveCartItem(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                    title="Hapus Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => handleUpdateCartQty(item.id, -1)}
                      className="p-1 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2.5 text-xs font-bold text-slate-900 min-w-[24px] text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => handleUpdateCartQty(item.id, 1)}
                      className="p-1 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal Display */}
                  <div className="text-right">
                    <span className="font-black text-xs text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                    {item.qty > 1 && (
                      <span className="text-[9px] text-slate-400 block">
                        @{formatRupiah(item.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Keranjang masih kosong</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Klik produk atau jasa medis di sebelah kiri untuk menambahkan ke keranjang.
                </p>
              </div>
            )}
          </div>

          {/* Cart Calculation & Payment Settlement Controls */}
          {cart.length > 0 && (
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 space-y-3 shrink-0">
              {/* Subtotal & Transaction Discount */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatRupiah(cartSubtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium">Diskon Transaksi:</span>
                  <div className="flex items-center gap-1">
                    <select
                      value={transactionDiscountType}
                      onChange={(e) => setTransactionDiscountType(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-700"
                    >
                      <option value="nominal">Rp</option>
                      <option value="percent">%</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={transactionDiscountValue || ''}
                      onChange={(e) => setTransactionDiscountValue(Number(e.target.value))}
                      placeholder="0"
                      className="w-20 bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] text-right font-bold focus:ring-1 focus:ring-[#2A2F86]"
                    />
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Potongan Diskon:</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Display */}
              <div className="bg-[#2A2F86] text-white p-3 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Total Tagihan</span>
                  <span className="text-lg font-black text-amber-300">{formatRupiah(cartGrandTotal)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-200 block">Metode:</span>
                  <span className="text-xs font-bold text-white">{paymentMethod}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                  Metode Pembayaran:
                </label>
                {(() => {
                  const isYaminPos = activeBranchCode === 'YM' || activeBranchCode === 'HQ' || activeBranchCode === 'ALL';
                  const availableMethods: PaymentMethod[] = isYaminPos 
                    ? ['Cash', 'Transfer', 'Shopee', 'Split (Cash & Transfer)'] 
                    : ['Cash', 'Transfer', 'Split (Cash & Transfer)'];

                  return (
                    <div className={`grid ${availableMethods.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 text-xs`}>
                      {availableMethods.map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`p-2 rounded-xl font-bold text-[11px] transition-all flex flex-col items-center justify-center gap-1 ${
                            paymentMethod === method
                              ? method === 'Shopee'
                                ? 'bg-[#EE4D2D] text-white shadow-xs ring-2 ring-orange-300'
                                : 'bg-[#2A2F86] text-amber-300 shadow-xs'
                              : method === 'Shopee'
                              ? 'bg-orange-50 border border-orange-200 text-[#EE4D2D] hover:bg-orange-100 font-extrabold'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {method === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                          {method === 'Transfer' && <CreditCard className="w-3.5 h-3.5" />}
                          {method === 'Shopee' && <ShoppingBag className="w-3.5 h-3.5" />}
                          {method === 'Split (Cash & Transfer)' && <Calculator className="w-3.5 h-3.5" />}
                          <span>{method === 'Split (Cash & Transfer)' ? 'Split' : method === 'Shopee' ? 'Shopee (YM)' : method}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Shopee Order Details (Khusus Cabang Yamin) */}
                {paymentMethod === 'Shopee' && (
                  <div className="bg-orange-50/90 p-2.5 rounded-xl border border-orange-300 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-orange-950 uppercase flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#EE4D2D]" />
                        <span>Shopee Official (Cabang Yamin)</span>
                      </label>
                      <span className="text-[9px] font-bold bg-orange-200 text-orange-900 px-1.5 py-0.5 rounded">
                        YM Only
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Nomor Pesanan / ID Shopee (Opsional)"
                      value={shopeeOrderNo}
                      onChange={(e) => setShopeeOrderNo(e.target.value)}
                      className="w-full bg-white border border-orange-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#EE4D2D]"
                    />
                    <p className="text-[9px] text-orange-800">
                      * Pembayaran dicatat dari transaksi Shopee Online Cabang Yamin.
                    </p>
                  </div>
                )}

                {/* Transfer Bank Selection */}
                {paymentMethod === 'Transfer' && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Rekening Tujuan BSI:</label>
                      <span className="text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        Default Cabang [{activeBranchCode}]
                      </span>
                    </div>
                    <select
                      value={selectedBsiAccount}
                      onChange={(e) => setSelectedBsiAccount(e.target.value as BsiAccount)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                    >
                      {ALL_BSI_ACCOUNTS_ORDERED.map((b) => (
                        <option key={b.account} value={b.account}>
                          {b.account} — Cabang {b.branchName} ({b.branchCode}) {b.branchCode === activeBranchCode ? '★ [Default]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Cash Tender Calculation */}
                {paymentMethod === 'Cash' && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Uang Diterima:</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value ? Number(e.target.value) : '')}
                        className="w-32 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-black text-right text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#2A2F86]"
                      />
                    </div>

                    {/* Tender quick buttons */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setCashGiven(isDP && typeof uangMuka === 'number' ? uangMuka : cartGrandTotal)}
                        className="px-2 py-1 bg-indigo-50 text-[#2A2F86] text-[10px] font-bold rounded hover:bg-indigo-100 whitespace-nowrap"
                      >
                        Uang Pas
                      </button>
                      {tenderQuickAmounts.filter(a => a >= cartGrandTotal).slice(0, 4).map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashGiven(amt)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-200 whitespace-nowrap"
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>

                    {typeof cashGiven === 'number' && cashGiven > 0 && (
                      <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600">Kembalian:</span>
                        <span className={`font-black text-sm ${changeDue >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatRupiah(changeDue)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* DP / Uang Muka Toggle */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isDP}
                      onChange={(e) => setIsDP(e.target.checked)}
                      className="rounded border-slate-300 text-[#2A2F86] focus:ring-[#2A2F86]"
                    />
                    <span>Transaksi Uang Muka (DP) / Belum Lunas</span>
                  </label>

                  {isDP && (
                    <div className="mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-900">Nominal DP:</span>
                        <input
                          type="number"
                          placeholder="Nominal DP"
                          value={uangMuka}
                          onChange={(e) => setUangMuka(e.target.value ? Number(e.target.value) : '')}
                          className="w-32 bg-white border border-amber-300 rounded px-2 py-1 text-xs font-bold text-right text-slate-900"
                        />
                      </div>
                      <div className="flex justify-between items-center font-bold text-red-700">
                        <span>Sisa Pembayaran:</span>
                        <span>{formatRupiah(sisaPembayaran)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audiometris / Consultant Selector */}
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Petugas Pemeriksa / HAC:
                  </label>
                  <select
                    value={selectedAudiometris}
                    onChange={(e) => setSelectedAudiometris(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                  >
                    {AUDIOMETRIS_LIST.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-black text-sm tracking-wide transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>PROSES TRANSAKSI & CETAK NOTA</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FULL PATIENT REGISTRATION MODAL (Same as Menu Data & History Pasien) */}
      <PatientModal
        isOpen={isQuickPatientModalOpen}
        onClose={() => setIsQuickPatientModalOpen(false)}
        onSave={(newPatient) => {
          onAddPatient(newPatient);
          setSelectedPatient(newPatient);
          setIsQuickPatientModalOpen(false);
        }}
        existingCount={patients.length}
        patientToEdit={null}
        activeBranchCode={activeBranchCode}
        existingPatients={patients}
      />

      {/* ABD CONFIGURATION MODAL */}
      {isABDModalOpen && selectedABDItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Konfigurasi Penjualan ABD</h3>
                  <p className="text-xs text-slate-500">{selectedABDItem.tipe} ({selectedABDItem.model})</p>
                </div>
              </div>
              <button onClick={() => setIsABDModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fitting Type / Sisi Telinga</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Monoaural (Kanan)', 'Monoaural (Kiri)', 'Binaural'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setAbdEarSide(side)}
                      className={`p-2 rounded-xl font-bold text-xs transition-all ${
                        abdEarSide === side 
                          ? 'bg-[#2A2F86] text-amber-300 shadow-xs' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {side.replace('Monoaural ', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Seri ABD 1 (Kanan/Utama)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 240819001"
                    value={abdSerial1}
                    onChange={(e) => setAbdSerial1(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                {abdEarSide === 'Binaural' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">No. Seri ABD 2 (Kiri)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 240819002"
                      value={abdSerial2}
                      onChange={(e) => setAbdSerial2(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilihan Paket Bundling Perawatan</label>
                <select
                  value={abdPackage}
                  onChange={(e) => setAbdPackage(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="Tanpa Bundling">Tanpa Bundling (Standar)</option>
                  <option value="Basic">Paket Basic (+ Rp 320.000) - Earmould, Baterai 1 Rol, Aidtip</option>
                  <option value="Essential">Paket Essential (+ Rp 900.000) - Earmould, Dryer Jar, Tester, Blower, Pouch</option>
                  <option value="Exclusive">Paket Exclusive (+ Rp 1.500.000) - Earmould, Dryer Electric, Baterai 4 Rol, Retainer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis / Bahan Earmould</label>
                <select
                  value={abdEarmouldMaterial}
                  onChange={(e) => setAbdEarmouldMaterial(e.target.value as JenisEarmould)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="S/C">Soft Canal (S/C)</option>
                  <option value="H/C">Hard Canal (H/C)</option>
                  <option value="S/FS">Soft Full Shell (S/FS)</option>
                  <option value="H/FS">Hard Full Shell (H/FS)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsABDModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddABD}
                  className="px-4 py-2 bg-[#2A2F86] hover:bg-[#1A1D5C] text-white rounded-xl font-extrabold shadow-sm"
                >
                  Tambahkan ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ITEM MODAL */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900">Tambah Item Kustom / Bebas</h3>
              </div>
              <button onClick={() => setIsCustomItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Barang / Jasa *</label>
                <input
                  type="text"
                  placeholder="Contoh: Paket Pembersihan Alat & Ganti Selang"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={customItemCategory}
                    onChange={(e) => setCustomItemCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Aksesoris & Charger">Aksesoris</option>
                    <option value="Jasa Medis">Jasa Medis</option>
                    <option value="Servis & Reparasi">Servis & Reparasi</option>
                    <option value="Lab Earmould">Lab Earmould</option>
                    <option value="Kustom">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="150000"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Keterangan spesifikasi..."
                  value={customItemNotes}
                  onChange={(e) => setCustomItemNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddCustomItem}
                  className="px-4 py-2 bg-[#2A2F86] hover:bg-[#1A1D5C] text-white rounded-xl font-extrabold shadow-sm"
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED POS RECEIPT MODAL */}
      <POSReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setCompletedReceipt(null);
        }}
        receipt={completedReceipt}
      />
    </div>
  );
};
