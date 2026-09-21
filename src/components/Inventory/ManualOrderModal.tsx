import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Save, Warehouse, ArrowRightLeft, CheckCircle2, AlertTriangle, PackageCheck, Sparkles, Barcode } from 'lucide-react';
import { inventoryDbOps } from '../../services/dbOperations';
import { ABDInventoryEntry, AksesorisInventoryEntry } from '../../types';
import { findABDSku, findAksesorisSku, getAksesorisBySku } from '../../data/skuCatalog';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchCode: string;
  abdInventory?: ABDInventoryEntry[];
  aksesorisInventory?: AksesorisInventoryEntry[];
}

interface OrderItem {
  id: string;
  deskripsi: 'Alat Bantu Dengar' | 'Aksesoris';
  produk: string;
  customProduk?: string;
  noSeri: string;
  kuantitas: number;
  satuan: string;
}

interface ProductCatalogue {
  id: string;
  gambar: string;
  nama: string;
  kategori: 'Alat Bantu Dengar' | 'Aksesoris';
  noSeri: string;
  satuan: string;
  qty: number;
}

const BRANCH_CODE_MAP: Record<string, string> = {
  'Maindealer': 'MD',
  'Pusat': 'MD',
  'HQ': 'MD',
  'MD': 'MD',
  'Yamin': 'YM',
  'YM': 'YM',
  'Pakam': 'PK',
  'PK': 'PK',
  'Langsa': 'LS',
  'LS': 'LS',
  'Siantar': 'ST',
  'ST': 'ST',
  'Bulan': 'PB',
  'PB': 'PB',
  'Betahive': 'BT',
  'BT': 'BT',
  'Binjai': 'BJ',
  'BJ': 'BJ',
  'Jambi': 'JB',
  'JB': 'JB'
};

const CODE_TO_BRANCH_NAME: Record<string, string> = {
  'MD': 'Maindealer',
  'HQ': 'Maindealer',
  'YM': 'Yamin',
  'PK': 'Pakam',
  'LS': 'Langsa',
  'ST': 'Siantar',
  'PB': 'Bulan',
  'BT': 'Betahive',
  'BJ': 'Binjai',
  'JB': 'Jambi'
};

export const INTERNAL_WAREHOUSES = [
  'Maindealer',
  'Yamin',
  'Bulan',
  'Jambi',
  'Betahive',
  'Binjai',
  'Pakam',
  'Siantar',
  'Langsa'
];

// Helper function to check if serial number is allowed / required
export function isSerialAllowed(productName: string, categoryOrDesc: string): boolean {
  if (categoryOrDesc === 'Alat Bantu Dengar') {
    return true;
  }
  const nameLower = (productName || '').toLowerCase();
  // Exceptions for Aksesoris that DO require/have No. Seri:
  if (nameLower.includes('charger')) {
    return true;
  }
  if (nameLower.includes('minifit') || nameLower.includes('speaker')) {
    return true;
  }
  if (nameLower.includes('sonic amplifier') || nameLower.includes('amplifier')) {
    return true;
  }
  return false;
}

export function ManualOrderModal({ 
  isOpen, 
  onClose, 
  branchCode,
  abdInventory = [],
  aksesorisInventory = []
}: ManualOrderModalProps) {
  const initialGudang = CODE_TO_BRANCH_NAME[branchCode] || (branchCode === 'ALL' ? 'Maindealer' : branchCode);
  
  const [sumber, setSumber] = useState('Maindealer');
  const [isCustomSumber, setIsCustomSumber] = useState(false);
  const [customSumber, setCustomSumber] = useState('');

  const [gudang, setGudang] = useState(initialGudang === 'Maindealer' ? 'Yamin' : initialGudang);
  const [isCustomGudang, setIsCustomGudang] = useState(false);
  const [customGudang, setCustomGudang] = useState('');

  useEffect(() => {
    if (isOpen) {
      const target = CODE_TO_BRANCH_NAME[branchCode] || (branchCode === 'ALL' ? 'Yamin' : branchCode);
      setGudang(target === 'Maindealer' ? 'Yamin' : target);
      setSumber('Maindealer');
      setIsCustomSumber(false);
      setIsCustomGudang(false);
    }
  }, [isOpen, branchCode]);

  const [tglPengiriman, setTglPengiriman] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<OrderItem[]>([{
    id: Date.now().toString(),
    deskripsi: 'Alat Bantu Dengar',
    produk: '',
    customProduk: '',
    noSeri: '',
    kuantitas: 1,
    satuan: 'Pcs'
  }]);

  // Predefined catalog for ABD and Aksesoris
  const [products, setProducts] = useState<ProductCatalogue[]>([
    // Alat Bantu Dengar (Semua wajib No. Seri)
    { id: '1', gambar: '', nama: 'Enchant SE 10 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '2', gambar: '', nama: 'Enchant SE 20 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '3', gambar: '', nama: 'Z1 20 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '4', gambar: '', nama: 'Z1 20 MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '5', gambar: '', nama: 'Z1 10 -(R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '6', gambar: '', nama: 'Z1 10 MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '7', gambar: '', nama: 'Trek 40 SP BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '8', gambar: '', nama: 'Trek 40 UP BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '9', gambar: '', nama: 'Trek 80 SP BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '10', gambar: '', nama: 'Trek 80 UP BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '11', gambar: '', nama: 'Captivate 20 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '12', gambar: '', nama: 'Captivate 20 MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '13', gambar: '', nama: 'Captivate 20 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '14', gambar: '', nama: 'Captivate 40 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '15', gambar: '', nama: 'Captivate 40 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '16', gambar: '', nama: 'Captivate 60 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '17', gambar: '', nama: 'Captivate 60 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '18', gambar: '', nama: 'Captivate 80 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '19', gambar: '', nama: 'Captivate 80 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '20', gambar: '', nama: 'Captivate 100 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '21', gambar: '', nama: 'Captivate 100 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '22', gambar: '', nama: 'Radiant 20 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '23', gambar: '', nama: 'Radiant 20 MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '24', gambar: '', nama: 'Radiant 20 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '25', gambar: '', nama: 'Radiant 40 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '26', gambar: '', nama: 'Radiant 40 (R) MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '27', gambar: '', nama: 'Radiant 60 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '28', gambar: '', nama: 'Radiant 60 MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '29', gambar: '', nama: 'Radiant 60 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '30', gambar: '', nama: 'Radiant 80 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '31', gambar: '', nama: 'Radiant 80 (R) MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '32', gambar: '', nama: 'Radiant 100 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '33', gambar: '', nama: 'Radiant 100 (R) MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '34', gambar: '', nama: 'Radiant SE 60 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '35', gambar: '', nama: 'Radiant SE 60 (R) MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '36', gambar: '', nama: 'Radiant SE 80 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '37', gambar: '', nama: 'Radiant SE 80 (R) MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '38', gambar: '', nama: 'Radiant SE 100 MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '39', gambar: '', nama: 'Radiant SE 100 (R) MNBT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '40', gambar: '', nama: 'A1 40 MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '41', gambar: '', nama: 'A1 40 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '42', gambar: '', nama: 'A1 60 MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '43', gambar: '', nama: 'A1 60 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '44', gambar: '', nama: 'A1 80 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '45', gambar: '', nama: 'A1 100 (R) MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '46', gambar: '', nama: 'FUN SP BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '47', gambar: '', nama: 'FAST P BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '48', gambar: '', nama: 'VOLTA HPT BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '49', gambar: '', nama: 'VOLTA PB BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '50', gambar: '', nama: 'Dream 600 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '51', gambar: '', nama: 'Dream 500 BTE', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: '52', gambar: '', nama: 'Demoflex MNRT', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 0 },

    // Charger ABD (Ada No. Seri)
    { id: 'chg-1', gambar: '', nama: 'Charger A1 Travel', kategori: 'Aksesoris', noSeri: '', satuan: 'Unit', qty: 0 },
    { id: 'chg-2', gambar: '', nama: 'Charger, RADIANT Travel', kategori: 'Aksesoris', noSeri: '', satuan: 'Unit', qty: 0 },
    { id: 'chg-3', gambar: '', nama: 'Charger, A1 Desk', kategori: 'Aksesoris', noSeri: '', satuan: 'Unit', qty: 0 },
    { id: 'chg-4', gambar: '', nama: 'Charger, RADIANT Desk', kategori: 'Aksesoris', noSeri: '', satuan: 'Unit', qty: 0 },

    // Speaker & Amplifier (Ada No. Seri)
    { id: 'sp-5', gambar: '', nama: 'miniFit Speaker', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'sp-6', gambar: '', nama: 'miniFit Speaker A1.100', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'sp-7', gambar: '', nama: 'Sonic Amplifier 20 Series', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'sp-8', gambar: '', nama: 'Sonic Amplifier 40 Series', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'sp-9', gambar: '', nama: 'Sonic Amplifier 80 Series', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },

    // Aksesoris ABD Umum (Tanpa No. Seri)
    { id: 'aks-1', gambar: '', nama: 'Drying Jar - Standard', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-2', gambar: '', nama: 'Drying Jar - Electric 1.0', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-3', gambar: '', nama: 'Drying Jar - Electrik 2.0', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-4', gambar: '', nama: 'Wax Guard', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-5', gambar: '', nama: 'Earhook', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-6', gambar: '', nama: 'Blower', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-7', gambar: '', nama: 'Earsound Pouch', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-8', gambar: '', nama: 'HA Retainer (Gantungan ABD)', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-9', gambar: '', nama: 'Filter', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-10', gambar: '', nama: 'Baterai Checker', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-11', gambar: '', nama: 'Elbow', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aks-12', gambar: '', nama: 'Housing', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'sp-3', gambar: '', nama: 'Mic Signia, AS, Rexton', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'sp-4', gambar: '', nama: 'Receiver Signia, AS, Rexton', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },

    // Baterai ABD (Tanpa No. Seri)
    { id: 'bat-1', gambar: '', nama: '13 Sonic', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-2', gambar: '', nama: '675 Sonic', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-3', gambar: '', nama: '312 Sonic', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-4', gambar: '', nama: '10 Sonic', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-5', gambar: '', nama: '13 Powerone', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-6', gambar: '', nama: '675 Powerone', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-7', gambar: '', nama: '312 Powerone', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-8', gambar: '', nama: '10 Powerone', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },
    { id: 'bat-9', gambar: '', nama: 'Tipe lain', kategori: 'Aksesoris', noSeri: '', satuan: 'Rol', qty: 0 },

    // Aidtip & Earmould (Tanpa No. Seri)
    { id: 'aid-1', gambar: '', nama: 'Aidtip Size S', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-2', gambar: '', nama: 'Aidtip Size M', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-3', gambar: '', nama: 'Aidtip Size L', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-4', gambar: '', nama: 'Aidtip Set', kategori: 'Aksesoris', noSeri: '', satuan: 'Set', qty: 0 },
    { id: 'aid-5', gambar: '', nama: 'Selang Soft', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-6', gambar: '', nama: 'Power Dome M', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-7', gambar: '', nama: 'Power Dome L', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-8', gambar: '', nama: 'Hard Canal (H/C)', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-9', gambar: '', nama: 'Hard Full Shell (H/FS)', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-10', gambar: '', nama: 'Soft Canal (S/C)', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
    { id: 'aid-11', gambar: '', nama: 'Soft Full Shell (S/FS)', kategori: 'Aksesoris', noSeri: '', satuan: 'Pcs', qty: 0 },
  ]);

  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductCatalogue>({
    id: '', gambar: '', nama: '', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 1
  });

  const activeSumber = isCustomSumber ? customSumber.trim() : sumber;
  const activeGudang = isCustomGudang ? customGudang.trim() : gudang;
  const isInternalSource = !isCustomSumber && INTERNAL_WAREHOUSES.includes(sumber);
  const sourceBranchCode = BRANCH_CODE_MAP[activeSumber] || activeSumber;
  const targetBranchCode = BRANCH_CODE_MAP[activeGudang] || activeGudang;

  // Real-time stock calculation for Source Branch
  // 1. Available ABD in Source Branch
  const availableSourceABD = useMemo(() => {
    if (!isInternalSource || !sourceBranchCode) return [];
    
    // Group all entries for source branch by serial number
    const serialMap = new Map<string, {
      tipeABD: string;
      model: string;
      noSeri: string;
      balance: number;
    }>();

    abdInventory.forEach(entry => {
      const entryBranch = entry.branchCode;
      const isMatchingBranch = sourceBranchCode === 'MD' 
        ? (entryBranch === 'MD' || entryBranch === 'HQ')
        : (entryBranch === sourceBranchCode);

      if (!isMatchingBranch) return;

      const snKey = (entry.noSeri || '').trim();
      if (!snKey) return;

      const existing = serialMap.get(snKey) || {
        tipeABD: entry.tipeABD,
        model: entry.model || '',
        noSeri: entry.noSeri,
        balance: 0
      };

      if (entry.type === 'MASUK') {
        existing.balance += 1;
      } else if (entry.type === 'KELUAR_TERJUAL' || entry.type === 'KELUAR_RETUR') {
        existing.balance -= 1;
      }

      serialMap.set(snKey, existing);
    });

    // Only units with positive balance are available
    const availableUnits: {
      tipeABD: string;
      model: string;
      noSeri: string;
      fullName: string;
      displayName: string;
    }[] = [];

    serialMap.forEach((item) => {
      if (item.balance > 0) {
        const fullProd = `${item.tipeABD} ${item.model}`.trim();
        availableUnits.push({
          tipeABD: item.tipeABD,
          model: item.model,
          noSeri: item.noSeri,
          fullName: fullProd,
          displayName: `[SN: ${item.noSeri}] ${fullProd}`
        });
      }
    });

    return availableUnits.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [abdInventory, isInternalSource, sourceBranchCode]);

  // 2. Available Aksesoris Stock in Source Branch
  const availableSourceAksesoris = useMemo(() => {
    if (!isInternalSource || !sourceBranchCode) return new Map<string, number>();

    const stockMap = new Map<string, number>();

    // Step 1: Calculate net balance by canonical SKU or raw key
    aksesorisInventory.forEach(entry => {
      const entryBranch = entry.branchCode;
      const isMatchingBranch = sourceBranchCode === 'MD' 
        ? (entryBranch === 'MD' || entryBranch === 'HQ')
        : (entryBranch === sourceBranchCode);

      if (!isMatchingBranch) return;

      const rawTipe = (entry.tipe || '').trim();
      if (!rawTipe) return;

      const itemSku = entry.sku || findAksesorisSku(rawTipe, entry.kategori);
      const master = (itemSku && itemSku !== '-') ? getAksesorisBySku(itemSku) : undefined;
      const canonicalKey = master?.sku || rawTipe;

      const current = stockMap.get(canonicalKey) || 0;
      const qty = Number(entry.qty) || 0;

      if (entry.type === 'MASUK') {
        stockMap.set(canonicalKey, current + qty);
      } else if (entry.type === 'KELUAR_TERJUAL' || entry.type === 'KELUAR_RETUR') {
        stockMap.set(canonicalKey, current - qty);
      }
    });

    // Step 2: Create a rich lookup map that can be queried by canonical sku, canonical name, raw names, and aliases
    const lookupMap = new Map<string, number>();
    stockMap.forEach((qty, canonicalKey) => {
      lookupMap.set(canonicalKey, qty);
      lookupMap.set(canonicalKey.toLowerCase(), qty);

      const master = getAksesorisBySku(canonicalKey);
      if (master) {
        lookupMap.set(master.nama, qty);
        lookupMap.set(master.nama.toLowerCase(), qty);
        if (master.aliases) {
          master.aliases.forEach(alias => {
            lookupMap.set(alias, qty);
            lookupMap.set(alias.toLowerCase(), qty);
          });
        }
      }
    });

    // Also copy raw entries mappings
    aksesorisInventory.forEach(entry => {
      const rawTipe = (entry.tipe || '').trim();
      if (!rawTipe) return;
      const itemSku = entry.sku || findAksesorisSku(rawTipe, entry.kategori);
      const master = (itemSku && itemSku !== '-') ? getAksesorisBySku(itemSku) : undefined;
      const canonicalKey = master?.sku || rawTipe;
      const net = stockMap.get(canonicalKey) || 0;
      lookupMap.set(rawTipe, net);
      lookupMap.set(rawTipe.toLowerCase(), net);
    });

    return lookupMap;
  }, [aksesorisInventory, isInternalSource, sourceBranchCode]);

  if (!isOpen) return null;

  const handleItemChange = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };

        // When category changes
        if (field === 'deskripsi') {
          updated.produk = '';
          updated.customProduk = '';
          updated.noSeri = '';
          updated.kuantitas = 1;
        }

        // When choosing from available ABD stock picker
        if (field === 'produk' && updated.deskripsi === 'Alat Bantu Dengar') {
          if (value.startsWith('__AVAIL_ABD__:')) {
            const snVal = value.replace('__AVAIL_ABD__:', '');
            const foundUnit = availableSourceABD.find(u => u.noSeri === snVal);
            if (foundUnit) {
              updated.produk = foundUnit.fullName;
              updated.customProduk = '';
              updated.noSeri = foundUnit.noSeri;
              updated.kuantitas = 1;
              updated.satuan = 'Pcs';
              return updated;
            }
          }
        }

        // When No. Seri is edited
        if (field === 'noSeri') {
          const serialStr = typeof value === 'string' ? value : '';
          const serials = serialStr.split(',').map(s => s.trim()).filter(Boolean);
          if (serials.length > 0) {
            updated.kuantitas = serials.length;
          } else if (!serialStr.trim()) {
            updated.kuantitas = 1;
          }
        }

        if (field === 'produk') {
          if (value === '__CUSTOM__') {
            updated.satuan = 'Pcs';
          } else {
            const prod = products.find(p => p.nama === value);
            if (prod) {
              updated.satuan = prod.satuan;
            }
          }
          
          const targetProdName = value === '__CUSTOM__' ? (updated.customProduk || '') : value;
          if (!isSerialAllowed(targetProdName, updated.deskripsi)) {
            updated.noSeri = '';
          }
        }

        if (field === 'customProduk') {
          if (!isSerialAllowed(value, updated.deskripsi)) {
            updated.noSeri = '';
          }
        }

        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      deskripsi: 'Alat Bantu Dengar',
      produk: '',
      customProduk: '',
      noSeri: '',
      kuantitas: 1,
      satuan: 'Pcs'
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      setItems([{
        id: Date.now().toString(),
        deskripsi: 'Alat Bantu Dengar',
        produk: '',
        customProduk: '',
        noSeri: '',
        kuantitas: 1,
        satuan: 'Pcs'
      }]);
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleSaveNewProduct = () => {
    if (!newProduct.nama.trim()) return alert('Nama produk wajib diisi');
    const p = { ...newProduct, id: Date.now().toString() };
    setProducts([...products, p]);
    setAddProductModalOpen(false);
    setNewProduct({ id: '', gambar: '', nama: '', kategori: 'Alat Bantu Dengar', noSeri: '', satuan: 'Pcs', qty: 1 });
    alert('Produk berhasil ditambahkan ke daftar katalog pilihan!');
  };

  const handleSaveOrder = async () => {
    if (isSubmitting) return;

    try {
      const finalSumber = isCustomSumber ? customSumber.trim() : sumber;
      const finalGudang = isCustomGudang ? customGudang.trim() : gudang;

      if (!finalSumber) {
        alert('Mohon tentukan Sumber pengirim barang.');
        return;
      }
      if (!finalGudang) {
        alert('Mohon tentukan Gudang Tujuan.');
        return;
      }

      if (isInternalSource && sourceBranchCode === targetBranchCode) {
        alert('Gudang Pengirim dan Gudang Tujuan tidak boleh sama untuk proses mutasi/pindah stok.');
        return;
      }

      const branchCodeToSave = BRANCH_CODE_MAP[finalGudang] || finalGudang;
      
      const validItems = items
        .map(it => ({
          ...it,
          resolvedProduct: it.produk === '__CUSTOM__' ? (it.customProduk || '').trim() : it.produk.trim()
        }))
        .filter(it => it.resolvedProduct !== '');

      if (validItems.length === 0) {
        alert('Silakan pilih atau ketik minimal 1 nama produk pada daftar sebelum menyimpan.');
        return;
      }

      // If source is internal warehouse, validate stock availability!
      if (isInternalSource) {
        for (const item of validItems) {
          if (item.deskripsi === 'Alat Bantu Dengar') {
            const serials = item.noSeri ? item.noSeri.split(',').map(s => s.trim()).filter(Boolean) : [];
            for (const sn of serials) {
              const exists = availableSourceABD.some(u => u.noSeri.toLowerCase() === sn.toLowerCase());
              if (!exists) {
                const proceed = confirm(
                  `⚠️ Perhatian: No Seri "${sn}" (${item.resolvedProduct}) tidak terdata di stok aktif ${finalSumber}.\n\nApakah Anda tetap ingin memindahkan / mencatat transaksi ini?`
                );
                if (!proceed) return;
              }
            }
          } else {
            const availableQty = availableSourceAksesoris.get(item.resolvedProduct) || 0;
            if (item.kuantitas > availableQty) {
              const proceed = confirm(
                `⚠️ Perhatian: Jumlah ${item.resolvedProduct} yang ingin dipindahkan (${item.kuantitas} ${item.satuan}) melebihi stok tercatat di ${finalSumber} (${availableQty} ${item.satuan}).\n\nApakah Anda tetap ingin melanjutkan mutasi?`
              );
              if (!proceed) return;
            }
          }
        }
      }

      setIsSubmitting(true);

      const timestamp = Date.now();
      const tanggalSimpan = tglPengiriman || new Date().toISOString().split('T')[0];

      for (let idx = 0; idx < validItems.length; idx++) {
        const item = validItems[idx];
        const qty = Number(item.kuantitas) || 1;
        const isABD = item.deskripsi === 'Alat Bantu Dengar';

        if (isABD) {
          const serials = item.noSeri ? item.noSeri.split(',').map(s => s.trim()).filter(Boolean) : [];
          for (let i = 0; i < qty; i++) {
            const sn = serials[i] || `SN-${Date.now().toString().slice(-6)}-${i + 1}`;
            const parts = item.resolvedProduct.split(' ');
            const model = parts.length > 1 ? parts.pop() || '' : '';
            const tipe = parts.join(' ') || item.resolvedProduct;
            const itemSku = findABDSku(tipe, model);
            
            // 1. Save MASUK to Target Branch
            const ketMasuk = isInternalSource 
              ? `Pindah Stok / Mutasi dari ${finalSumber}${catatan ? ' | ' + catatan : ''}`
              : `Sumber: ${finalSumber}${catatan ? ' | ' + catatan : ''}`;

            await inventoryDbOps.saveInventoryABD({
              id: `inv-abd-in-${timestamp}-${idx}-${i}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'MASUK',
              tanggal: tanggalSimpan,
              sumberTujuan: finalSumber,
              tipeABD: tipe,
              model: model,
              sku: itemSku || undefined,
              noSeri: sn,
              keterangan: ketMasuk,
              branchCode: branchCodeToSave
            });

            // 2. If source is internal warehouse, automatically deduct stock from source (KELUAR_RETUR)
            if (isInternalSource) {
              await inventoryDbOps.saveInventoryABD({
                id: `inv-abd-out-${timestamp}-${idx}-${i}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'KELUAR_RETUR',
                tanggal: tanggalSimpan,
                sumberTujuan: finalGudang,
                cabangTujuan: finalGudang,
                tipeABD: tipe,
                model: model,
                sku: itemSku || undefined,
                noSeri: sn,
                keterangan: `Pindah Stok / Mutasi ke ${finalGudang}${catatan ? ' | ' + catatan : ''}`,
                branchCode: sourceBranchCode
              });
            }
          }
        } else {
          // Aksesoris
          const itemSku = findAksesorisSku(item.resolvedProduct, 'Aksesoris');
          const master = (itemSku && itemSku !== '-') ? getAksesorisBySku(itemSku) : undefined;
          const canonicalTipe = master?.nama || item.resolvedProduct;
          const canonicalKategori = master?.kategori || 'Aksesoris ABD';
          const canonicalSku = master?.sku || (itemSku && itemSku !== '-' ? itemSku : undefined);

          const ketMasuk = isInternalSource 
            ? `Pindah Stok / Mutasi dari ${finalSumber}${item.noSeri ? ' | SN: ' + item.noSeri : ''}${catatan ? ' | ' + catatan : ''}`
            : `Sumber: ${finalSumber}${item.noSeri ? ' | SN: ' + item.noSeri : ''}${catatan ? ' | ' + catatan : ''}`;

          // 1. Save MASUK to Target Branch
          await inventoryDbOps.saveInventoryAksesoris({
            id: `inv-aks-in-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'MASUK',
            tanggal: tanggalSimpan,
            sumberTujuan: finalSumber,
            tipe: canonicalTipe,
            kategori: canonicalKategori,
            sku: canonicalSku,
            qty: qty,
            keterangan: ketMasuk,
            branchCode: branchCodeToSave
          });

          // 2. If source is internal warehouse, automatically deduct stock from source (KELUAR_RETUR)
          if (isInternalSource) {
            await inventoryDbOps.saveInventoryAksesoris({
              id: `inv-aks-out-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'KELUAR_RETUR',
              tanggal: tanggalSimpan,
              sumberTujuan: finalGudang,
              cabangTujuan: finalGudang,
              tipe: canonicalTipe,
              kategori: canonicalKategori,
              sku: canonicalSku,
              qty: qty,
              keterangan: `Pindah Stok / Mutasi ke ${finalGudang}${item.noSeri ? ' | SN: ' + item.noSeri : ''}${catatan ? ' | ' + catatan : ''}`,
              branchCode: sourceBranchCode
            });
          }
        }
      }

      setIsSubmitting(false);

      if (isInternalSource) {
        alert(`✅ Mutasi Stok Berhasil Disinkronkan!\n\n• Stok Gudang Asal (${finalSumber}) berkurang otomatis.\n• Stok Gudang Tujuan (${finalGudang}) bertambah.`);
      } else {
        alert(`✅ Pesanan Produk Baru berhasil dicatat ke stok Gudang ${finalGudang}!`);
      }
      onClose();
    } catch (error: any) {
      setIsSubmitting(false);
      alert('Gagal menyimpan pesanan: ' + error.message);
    }
  };

  const totalUnit = items.reduce((acc, curr) => acc + (Number(curr.kuantitas) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden my-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-blue-600" />
              <span>Input Stok & Sinkronisasi Mutasi Antar Cabang</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola penambahan stok baru atau pindah stok otomatis (stok sumber berkurang, stok tujuan bertambah)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Warehouse Source & Destination Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
            {/* Column 1: Sumber & Gudang */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <span>Sumber (Pengirim Stok)</span>
                  {isInternalSource && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">Gudang Internal</span>
                  )}
                </label>
                {isCustomSumber ? (
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={customSumber} 
                      onChange={e => setCustomSumber(e.target.value)} 
                      className="w-full rounded-xl border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white" 
                      placeholder="Ketik nama supplier luar..." 
                      autoFocus 
                    />
                    <button 
                      onClick={() => { setIsCustomSumber(false); setSumber('Maindealer'); }} 
                      className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 transition-colors cursor-pointer" 
                      title="Kembali ke Pilihan Gudang"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select 
                    value={sumber} 
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') {
                        setIsCustomSumber(true);
                        setCustomSumber('');
                      } else {
                        setSumber(e.target.value);
                      }
                    }} 
                    className="w-full rounded-xl border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    <optgroup label="🏢 Gudang / Cabang Internal (Stok Terintegrasi)">
                      {INTERNAL_WAREHOUSES.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🌐 Sumber Lainnya">
                      <option value="ADD_NEW">+ Tambah Sumber Lain (Supplier Luar / Non-Gudang)...</option>
                    </optgroup>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <span>Gudang Tujuan (Penerima)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">Stok Bertambah</span>
                </label>
                {isCustomGudang ? (
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={customGudang} 
                      onChange={e => setCustomGudang(e.target.value)} 
                      className="w-full rounded-xl border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white" 
                      placeholder="Ketik nama gudang..." 
                      autoFocus 
                    />
                    <button 
                      onClick={() => { setIsCustomGudang(false); setGudang('Yamin'); }} 
                      className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 transition-colors cursor-pointer" 
                      title="Batal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select 
                    value={gudang} 
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') {
                        setIsCustomGudang(true);
                        setCustomGudang('');
                      } else {
                        setGudang(e.target.value);
                      }
                    }} 
                    className="w-full rounded-xl border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    <optgroup label="🏢 Pilihan Cabang / Gudang">
                      {INTERNAL_WAREHOUSES.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </optgroup>
                    <optgroup label="✨ Lainnya">
                      <option value="ADD_NEW">+ Tambah Gudang Baru...</option>
                    </optgroup>
                  </select>
                )}
              </div>
            </div>

            {/* Column 2: Tanggal & Info Status Sinkronisasi */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mutasi / Pengiriman</label>
                <input 
                  type="date" 
                  value={tglPengiriman} 
                  onChange={e => setTglPengiriman(e.target.value)} 
                  className="w-full rounded-xl border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800" 
                />
              </div>

              {/* Real-time Status Card */}
              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                isInternalSource 
                  ? 'bg-blue-50/80 border-blue-200 text-blue-950' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {isInternalSource ? (
                    <>
                      <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                      <span>Sinkronisasi Stok Antar Gudang Aktif</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4 text-emerald-600" />
                      <span>Penerimaan Stok Baru Eksternal</span>
                    </>
                  )}
                </div>
                {isInternalSource ? (
                  <p>
                    Pengiriman dari <strong className="font-bold underline">{activeSumber}</strong> ke <strong className="font-bold underline">{activeGudang}</strong>. Stok di {activeSumber} akan otomatis berkurang dan stok di {activeGudang} akan bertambah.
                    <br />
                    <span className="text-[11px] text-blue-700 font-semibold mt-0.5 block">
                      Stok saat ini di {activeSumber}: {availableSourceABD.length} unit ABD & {availableSourceAksesoris.size} jenis aksesoris.
                    </span>
                  </p>
                ) : (
                  <p>
                    Penerimaan dari pihak luar (<strong className="font-bold">{activeSumber}</strong>). Stok akan bertambah di gudang <strong className="font-bold">{activeGudang}</strong>.
                  </p>
                )}
              </div>
            </div>

            {/* Column 3: Catatan Tambahan */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Tambahan (Opsional)</label>
                <textarea 
                  rows={4}
                  value={catatan} 
                  onChange={e => setCatatan(e.target.value)} 
                  className="w-full rounded-xl border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white resize-none text-slate-800 placeholder:text-slate-400" 
                  placeholder="Misal: Nomor Surat Jalan, Keterangan kurir / ekspedisi, alasan mutasi..." 
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Items Section */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Daftar Produk yang Dipindahkan / Masuk</h3>
                <p className="text-xs text-slate-500">
                  {isInternalSource 
                    ? `Pilih unit ABD / aksesoris yang tersedia di gudang ${activeSumber} untuk dipindahkan.`
                    : 'Pilih kategori dan nama produk yang akan dimasukkan ke stok.'}
                </p>
              </div>
              <button 
                onClick={() => setAddProductModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-blue-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Produk Baru ke Katalog
              </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 text-xs uppercase font-bold tracking-wider">
                    <th className="p-3 border-b border-r border-slate-200 w-44 bg-blue-50/60 text-blue-950">
                      Kategori
                    </th>
                    <th className="p-3 border-b border-r border-slate-200 w-80 bg-emerald-50/60 text-emerald-950">
                      Pilihan Produk
                    </th>
                    <th className="p-3 border-b border-r border-slate-200">
                      No. Seri
                    </th>
                    <th className="p-3 border-b border-r border-slate-200 w-24 text-center">
                      QTY
                    </th>
                    <th className="p-3 border-b border-r border-slate-200 w-24">
                      Satuan
                    </th>
                    <th className="p-3 border-b border-slate-200 w-14 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {items.map((item) => {
                    const effectiveProdName = item.produk === '__CUSTOM__' ? (item.customProduk || '') : item.produk;
                    const hasSerial = isSerialAllowed(effectiveProdName, item.deskripsi);
                    const isABD = item.deskripsi === 'Alat Bantu Dengar';

                    // Available stock helper info for Aksesoris in source branch
                    const aksStockInSource = isInternalSource && !isABD && effectiveProdName 
                      ? (availableSourceAksesoris.get(effectiveProdName) || 0) 
                      : null;
                    const isExceedingAksStock = isInternalSource && !isABD && aksStockInSource !== null && (item.kuantitas > aksStockInSource);

                    // Category Products
                    const categoryProducts = products.filter(p => p.kategori === item.deskripsi);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Kategori */}
                        <td className="p-2.5 border-r border-slate-100 align-top">
                          <select 
                            value={item.deskripsi} 
                            onChange={e => handleItemChange(item.id, 'deskripsi', e.target.value as 'Alat Bantu Dengar' | 'Aksesoris')} 
                            className="w-full rounded-xl border-slate-200 border px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 bg-white font-bold text-slate-800 cursor-pointer shadow-xs" 
                          >
                            <option value="Alat Bantu Dengar">🦻 Alat Bantu Dengar</option>
                            <option value="Aksesoris">🔌 Aksesoris</option>
                          </select>
                        </td>

                        {/* 2. Produk */}
                        <td className="p-2.5 border-r border-slate-100 space-y-1.5 align-top">
                          <select 
                            value={item.produk}
                            onChange={e => handleItemChange(item.id, 'produk', e.target.value)}
                            className="w-full rounded-xl border-slate-200 border px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 bg-white shadow-xs"
                          >
                            <option value="">-- Pilih Produk {item.deskripsi} --</option>

                            {/* If internal source & ABD, show real-time available units */}
                            {isInternalSource && isABD && availableSourceABD.length > 0 && (
                              <optgroup label={`📦 Unit ABD Tersedia di ${activeSumber} (${availableSourceABD.length} unit)`}>
                                {availableSourceABD.map(u => (
                                  <option key={u.noSeri} value={`__AVAIL_ABD__:${u.noSeri}`}>
                                    {u.displayName}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            
                            {isABD ? (
                              <>
                                <optgroup label="🦻 Seluruh Katalog Alat Bantu Dengar">
                                  {categoryProducts.map(p => (
                                    <option key={p.id} value={p.nama}>{p.nama}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="✨ Opsi Lainnya">
                                  <option value="__CUSTOM__">➕ Lain-lain (Ketik Nama Produk ABD Manual)</option>
                                </optgroup>
                              </>
                            ) : (
                              <>
                                {/* Charger ABD */}
                                {categoryProducts.filter(p => p.nama.toLowerCase().includes('charger')).length > 0 && (
                                  <optgroup label="🔌 Charger ABD (Ada No. Seri)">
                                    {categoryProducts.filter(p => p.nama.toLowerCase().includes('charger')).map(p => {
                                      const stk = isInternalSource ? availableSourceAksesoris.get(p.nama) : undefined;
                                      const stockBadge = isInternalSource ? ` (Stok di ${activeSumber}: ${stk ?? 0})` : '';
                                      return (
                                        <option key={p.id} value={p.nama}>{p.nama}{stockBadge}</option>
                                      );
                                    })}
                                  </optgroup>
                                )}

                                {/* Speaker & Amplifier */}
                                {categoryProducts.filter(p => (p.nama.toLowerCase().includes('speaker') || p.nama.toLowerCase().includes('amplifier'))).length > 0 && (
                                  <optgroup label="⚙️ Speaker & Amplifier (Ada No. Seri)">
                                    {categoryProducts.filter(p => (p.nama.toLowerCase().includes('speaker') || p.nama.toLowerCase().includes('amplifier'))).map(p => {
                                      const stk = isInternalSource ? availableSourceAksesoris.get(p.nama) : undefined;
                                      const stockBadge = isInternalSource ? ` (Stok di ${activeSumber}: ${stk ?? 0})` : '';
                                      return (
                                        <option key={p.id} value={p.nama}>{p.nama}{stockBadge}</option>
                                      );
                                    })}
                                  </optgroup>
                                )}

                                {/* Aksesoris Umum */}
                                {categoryProducts.filter(p => 
                                  !p.nama.toLowerCase().includes('charger') && 
                                  !p.nama.toLowerCase().includes('speaker') && 
                                  !p.nama.toLowerCase().includes('amplifier') &&
                                  !p.nama.toLowerCase().includes('sonic') && 
                                  !p.nama.toLowerCase().includes('powerone') && 
                                  !p.nama.toLowerCase().includes('aidtip') && 
                                  !p.nama.toLowerCase().includes('selang') && 
                                  !p.nama.toLowerCase().includes('dome') && 
                                  !p.nama.toLowerCase().includes('canal') && 
                                  !p.nama.toLowerCase().includes('shell')
                                ).length > 0 && (
                                  <optgroup label="📦 Aksesoris Umum">
                                    {categoryProducts.filter(p => 
                                      !p.nama.toLowerCase().includes('charger') && 
                                      !p.nama.toLowerCase().includes('speaker') && 
                                      !p.nama.toLowerCase().includes('amplifier') &&
                                      !p.nama.toLowerCase().includes('sonic') && 
                                      !p.nama.toLowerCase().includes('powerone') && 
                                      !p.nama.toLowerCase().includes('aidtip') && 
                                      !p.nama.toLowerCase().includes('selang') && 
                                      !p.nama.toLowerCase().includes('dome') && 
                                      !p.nama.toLowerCase().includes('canal') && 
                                      !p.nama.toLowerCase().includes('shell')
                                    ).map(p => {
                                      const stk = isInternalSource ? availableSourceAksesoris.get(p.nama) : undefined;
                                      const stockBadge = isInternalSource ? ` (Stok di ${activeSumber}: ${stk ?? 0})` : '';
                                      return (
                                        <option key={p.id} value={p.nama}>{p.nama}{stockBadge}</option>
                                      );
                                    })}
                                  </optgroup>
                                )}

                                {/* Baterai ABD */}
                                {categoryProducts.filter(p => (p.nama.toLowerCase().includes('sonic') || p.nama.toLowerCase().includes('powerone') || p.nama.toLowerCase().includes('tipe lain')) && !p.nama.toLowerCase().includes('amplifier')).length > 0 && (
                                  <optgroup label="🔋 Baterai ABD">
                                    {categoryProducts.filter(p => (p.nama.toLowerCase().includes('sonic') || p.nama.toLowerCase().includes('powerone') || p.nama.toLowerCase().includes('tipe lain')) && !p.nama.toLowerCase().includes('amplifier')).map(p => {
                                      const stk = isInternalSource ? availableSourceAksesoris.get(p.nama) : undefined;
                                      const stockBadge = isInternalSource ? ` (Stok di ${activeSumber}: ${stk ?? 0})` : '';
                                      return (
                                        <option key={p.id} value={p.nama}>{p.nama}{stockBadge}</option>
                                      );
                                    })}
                                  </optgroup>
                                )}

                                {/* Aidtip & Earmould */}
                                {categoryProducts.filter(p => (p.nama.toLowerCase().includes('aidtip') || p.nama.toLowerCase().includes('selang') || p.nama.toLowerCase().includes('dome') || p.nama.toLowerCase().includes('canal') || p.nama.toLowerCase().includes('shell'))).length > 0 && (
                                  <optgroup label="👂 Aidtip & Earmould">
                                    {categoryProducts.filter(p => (p.nama.toLowerCase().includes('aidtip') || p.nama.toLowerCase().includes('selang') || p.nama.toLowerCase().includes('dome') || p.nama.toLowerCase().includes('canal') || p.nama.toLowerCase().includes('shell'))).map(p => {
                                      const stk = isInternalSource ? availableSourceAksesoris.get(p.nama) : undefined;
                                      const stockBadge = isInternalSource ? ` (Stok di ${activeSumber}: ${stk ?? 0})` : '';
                                      return (
                                        <option key={p.id} value={p.nama}>{p.nama}{stockBadge}</option>
                                      );
                                    })}
                                  </optgroup>
                                )}

                                <optgroup label="✨ Opsi Lainnya">
                                  <option value="__CUSTOM__">➕ Lain-lain (Ketik Nama Produk Aksesoris Manual)</option>
                                </optgroup>
                              </>
                            )}
                          </select>

                          {/* Custom Input Field if '__CUSTOM__' is chosen */}
                          {item.produk === '__CUSTOM__' && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                              <input
                                type="text"
                                value={item.customProduk || ''}
                                onChange={e => handleItemChange(item.id, 'customProduk', e.target.value)}
                                placeholder={`Ketik nama ${item.deskripsi} manual...`}
                                className="w-full rounded-xl border border-indigo-300 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-[#23277A] bg-indigo-50/50 font-semibold text-[#23277A]"
                                autoFocus
                              />
                            </div>
                          )}

                          {/* SKU badge & Stock warning */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {effectiveProdName && (
                              (() => {
                                const resolvedSku = isABD ? findABDSku(effectiveProdName, '') : findAksesorisSku(effectiveProdName, 'Aksesoris');
                                return resolvedSku ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-mono font-bold">
                                    <Barcode className="w-3 h-3 text-purple-600" />
                                    <span>SKU: {resolvedSku}</span>
                                  </span>
                                ) : null;
                              })()
                            )}

                            {isExceedingAksStock && (
                              <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Stok di {activeSumber} hanya tersisa {aksStockInSource} {item.satuan}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. No. Seri */}
                        <td className="p-2.5 border-r border-slate-100 align-top">
                          <input 
                            type="text" 
                            value={hasSerial ? item.noSeri : ''} 
                            onChange={e => handleItemChange(item.id, 'noSeri', e.target.value)} 
                            disabled={!hasSerial}
                            className={`w-full rounded-xl border px-2.5 py-2 text-xs transition-all ${
                              hasSerial 
                                ? 'border-slate-200 focus:ring-2 focus:ring-blue-500 font-mono bg-white text-slate-800 placeholder:text-slate-400 placeholder:font-sans' 
                                : 'border-slate-200 bg-slate-100/80 text-slate-400 cursor-not-allowed select-none italic font-sans'
                            }`}
                            placeholder={
                              !hasSerial 
                                ? '— Tidak ada No. Seri —' 
                                : isABD 
                                  ? 'No. Seri (Contoh: SN-89201)' 
                                  : 'No. Seri (Charger / Speaker / Amplifier)'
                            }
                          />
                        </td>

                        {/* 4. Kuantitas */}
                        <td className="p-2.5 border-r border-slate-100 align-top">
                          <input 
                            type="number" 
                            min="1" 
                            value={item.kuantitas || ''} 
                            onChange={e => handleItemChange(item.id, 'kuantitas', parseFloat(e.target.value) || 0)} 
                            className="w-full rounded-xl border-slate-200 border px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 text-center font-bold text-slate-800 bg-white" 
                          />
                        </td>

                        {/* 5. Satuan */}
                        <td className="p-2.5 border-r border-slate-100 align-top">
                          <input 
                            type="text" 
                            value={item.satuan} 
                            onChange={e => handleItemChange(item.id, 'satuan', e.target.value)} 
                            className="w-full rounded-xl border-slate-200 border px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-medium" 
                          />
                        </td>

                        {/* 6. Aksi */}
                        <td className="p-2.5 text-center align-top">
                          <button 
                            onClick={() => removeItem(item.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-xs text-slate-600">
                    <td colSpan={3} className="p-3 text-right">Total Kuantitas Barang:</td>
                    <td className="p-3 text-center font-bold text-blue-700 text-sm bg-blue-50/50">{totalUnit} Unit</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <button 
              onClick={addItem}
              className="mt-3 text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 bg-white shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" /> Tambah Baris Produk
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
           <button 
             onClick={onClose} 
             disabled={isSubmitting}
             className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors text-sm cursor-pointer disabled:opacity-50"
           >
             Batal
           </button>
           <button 
             onClick={handleSaveOrder} 
             disabled={isSubmitting}
             className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
           >
             <Save className="w-4 h-4" />
             <span>{isSubmitting ? 'Menyimpan & Sinkronisasi...' : isInternalSource ? 'Simpan & Sinkronkan Mutasi Stok' : 'Simpan Pesanan & Update Stok'}</span>
           </button>
        </div>
      </div>

      {/* Sub-Modal: Tambah Produk Baru ke Katalog */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Tambah Produk ke Pilihan Katalog</h3>
              <button onClick={() => setAddProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Produk</label>
                <select
                  value={newProduct.kategori}
                  onChange={e => setNewProduct({ ...newProduct, kategori: e.target.value as 'Alat Bantu Dengar' | 'Aksesoris' })}
                  className="w-full border rounded-xl p-2 text-sm border-slate-300"
                >
                  <option value="Alat Bantu Dengar">Alat Bantu Dengar</option>
                  <option value="Aksesoris">Aksesoris</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  placeholder="Contoh: Captivate 50 BTE / Baterai Signia 13..."
                  value={newProduct.nama}
                  onChange={e => setNewProduct({ ...newProduct, nama: e.target.value })}
                  className="w-full border rounded-xl p-2 text-sm border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Default</label>
                <input
                  type="text"
                  placeholder="Pcs, Unit, Rol, Set..."
                  value={newProduct.satuan}
                  onChange={e => setNewProduct({ ...newProduct, satuan: e.target.value })}
                  className="w-full border rounded-xl p-2 text-sm border-slate-300"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setAddProductModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                Batal
              </button>
              <button onClick={handleSaveNewProduct} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
