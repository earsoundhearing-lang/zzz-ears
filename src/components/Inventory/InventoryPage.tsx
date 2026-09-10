import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeftRight, Check, X, Search, Package, Layers, Plus, Download, 
  FileSpreadsheet, ChevronDown, CheckCircle2, AlertCircle, Lock, ShieldCheck,
  Edit3, Trash2, Undo2, ArrowRightLeft, ShoppingCart, Warehouse, Sparkles, Filter,
  Clock, History, PlusCircle, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { ABDInventoryEntry, AksesorisInventoryEntry, BranchCode, AppUser } from '../../types';
import { inventoryDbOps } from '../../services/dbOperations';
import { getBranchByCode, BRANCHES, HQ_BRANCH } from '../../utils/branches';
import { canManageInventory } from '../../utils/storage';
import { ManualOrderModal } from './ManualOrderModal';
import { EditInventoryModal } from './EditInventoryModal';
import { TransferMutationModal, MutationActionType, TransferItemPayload } from './TransferMutationModal';
import { AksesorisDetailHistoryModal } from './AksesorisDetailHistoryModal';
import { AddAksesorisStockModal } from './AddAksesorisStockModal';
import { PinVerificationModal } from '../Common/PinVerificationModal';
import { AKSESORIS_CATEGORY_LIST } from '../../data/priceCatalog';
import { findABDSku, findAksesorisSku, getAksesorisBySku } from '../../data/skuCatalog';
import { 
  exportABDInventoryCSV, 
  exportAksesorisInventorySummaryCSV, 
  exportAksesorisInventoryMutationsCSV 
} from '../../utils/exportHelpers';

interface InventoryPageProps {
  abdInventory: ABDInventoryEntry[];
  aksesorisInventory: AksesorisInventoryEntry[];
  selectedBranch: BranchCode;
  currentUser: AppUser;
}

export function InventoryPage({ abdInventory, aksesorisInventory, selectedBranch, currentUser }: InventoryPageProps) {
  const hasInventoryEditAccess = canManageInventory(currentUser);
  
  // Branch Filter: allow switching views between individual branches or Central Maindealer
  const [activeBranchFilter, setActiveBranchFilter] = useState<string>(
    selectedBranch === 'ALL' ? (currentUser?.branchCode === 'ALL' || currentUser?.role === 'CEO' || currentUser?.role === 'LOGISTIK' ? 'MD' : (currentUser?.branchCode || 'MD')) : selectedBranch
  );

  // Sync if selectedBranch from top app header changes
  useEffect(() => {
    if (selectedBranch !== 'ALL') {
      setActiveBranchFilter(selectedBranch);
    }
  }, [selectedBranch]);

  const [activeTab, setActiveTab] = useState<'ABD' | 'AKSESORIS'>('ABD');
  const [abdViewMode, setAbdViewMode] = useState<'CONSOLIDATED' | 'RAW_LOGS'>('CONSOLIDATED');
  const [aksCategoryFilter, setAksCategoryFilter] = useState<string>('ALL');
  const [aksSearchTerm, setAksSearchTerm] = useState<string>('');
  const [aksStatusFilter, setAksStatusFilter] = useState<'ALL' | 'TERSEDIA' | 'MENIPIS' | 'HABIS'>('ALL');
  const [aksViewMode, setAksViewMode] = useState<'SUMMARY' | 'RAW_LOGS'>('SUMMARY');
  
  // ABD search & status filter
  const [abdSearchTerm, setAbdSearchTerm] = useState<string>('');
  const [abdStatusFilter, setAbdStatusFilter] = useState<'ALL' | 'TERSEDIA' | 'TERJUAL' | 'RETUR'>('ALL');
  
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [manualOrderModalOpen, setManualOrderModalOpen] = useState(false);
  
  // PIN Verification State
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalConfig, setPinModalConfig] = useState<{
    title: string;
    subtitle: string;
    actionText: string;
    isDanger: boolean;
    onSuccess: () => void;
  }>({
    title: 'Verifikasi PIN Otorisasi',
    subtitle: 'Masukkan PIN untuk melanjutkan',
    actionText: 'Verifikasi PIN',
    isDanger: false,
    onSuccess: () => {},
  });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemType, setEditItemType] = useState<'ABD' | 'AKSESORIS'>('ABD');
  const [editingABDEntry, setEditingABDEntry] = useState<ABDInventoryEntry | null>(null);
  const [editingAksEntry, setEditingAksEntry] = useState<AksesorisInventoryEntry | null>(null);

  // Aksesoris Detail / History & Add Stock Modals
  const [aksDetailModalOpen, setAksDetailModalOpen] = useState(false);
  const [selectedAksDetailKey, setSelectedAksDetailKey] = useState<string | null>(null);
  const [addAksModalOpen, setAddAksModalOpen] = useState(false);
  const [selectedAksForAdd, setSelectedAksForAdd] = useState<{ tipe: string; kategori: string; sku?: string } | null>(null);

  // Mutation / Transfer Modal State
  const [mutationModalOpen, setMutationModalOpen] = useState(false);
  const [mutationActionType, setMutationActionType] = useState<MutationActionType>('MUTASI_CABANG');
  const [mutationTargetItem, setMutationTargetItem] = useState<TransferItemPayload | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter based on activeBranchFilter
  const isBranchScoped = activeBranchFilter !== 'ALL';
  
  const filteredABD = useMemo(() => {
    return abdInventory.filter(item => {
      if (!isBranchScoped) return true;
      if (activeBranchFilter === 'MD') {
        return item.branchCode === 'MD' || item.branchCode === 'HQ';
      }
      return item.branchCode === activeBranchFilter;
    });
  }, [abdInventory, isBranchScoped, activeBranchFilter]);

  const filteredAksesoris = useMemo(() => {
    return aksesorisInventory.filter(item => {
      if (!isBranchScoped) return true;
      if (activeBranchFilter === 'MD') {
        return item.branchCode === 'MD' || item.branchCode === 'HQ';
      }
      return item.branchCode === activeBranchFilter;
    });
  }, [aksesorisInventory, isBranchScoped, activeBranchFilter]);

  // Aksesoris filtered list
  const displayAksesoris = useMemo(() => {
    return filteredAksesoris.filter(item => {
      if (aksCategoryFilter !== 'ALL' && item.kategori !== aksCategoryFilter) return false;
      if (aksSearchTerm.trim()) {
        const term = aksSearchTerm.toLowerCase();
        const matches = (item.tipe || '').toLowerCase().includes(term) ||
                        (item.kategori || '').toLowerCase().includes(term) ||
                        (item.sumberTujuan || '').toLowerCase().includes(term) ||
                        (item.keterangan || '').toLowerCase().includes(term) ||
                        (item.namaCustomer || '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [filteredAksesoris, aksCategoryFilter, aksSearchTerm]);

  // Aksesoris stock summary calculation (Masuk - Keluar = Sisa) with rawEntries history
  const aksesorisSummary = useMemo(() => {
    const map = new Map<string, { 
      key: string;
      kategori: string; 
      tipe: string; 
      sku?: string; 
      totalMasuk: number; 
      totalKeluar: number; 
      sisaStok: number; 
      latestBranch: string;
      rawEntries: AksesorisInventoryEntry[];
    }>();
    
    filteredAksesoris.forEach(item => {
      const rawSku = (item.sku && item.sku !== '-') ? item.sku : undefined;
      const itemSku = rawSku || findAksesorisSku(item.tipe, item.kategori);
      const master = (itemSku && itemSku !== '-') ? getAksesorisBySku(itemSku) : undefined;
      const canonicalSku = master?.sku || (itemSku && itemSku !== '-' ? itemSku : findAksesorisSku(item.tipe, item.kategori));
      const canonicalKategori = master?.kategori || item.kategori || 'Aksesoris ABD';
      const canonicalTipe = master?.nama || item.tipe || '-';
      
      const key = (canonicalSku && canonicalSku !== '-') ? canonicalSku : `${canonicalKategori}___${canonicalTipe}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          kategori: canonicalKategori,
          tipe: canonicalTipe,
          sku: (canonicalSku && canonicalSku !== '-') ? canonicalSku : undefined,
          totalMasuk: 0,
          totalKeluar: 0,
          sisaStok: 0,
          latestBranch: item.branchCode || 'MD',
          rawEntries: []
        });
      }
      const record = map.get(key)!;
      if ((!record.sku || record.sku === '-') && canonicalSku && canonicalSku !== '-') {
        record.sku = canonicalSku;
      }
      const qty = Number(item.qty) || 0;
      if (item.type === 'MASUK') {
        record.totalMasuk += qty;
      } else {
        record.totalKeluar += qty;
      }
      record.sisaStok = record.totalMasuk - record.totalKeluar;
      record.rawEntries.push(item);
    });

    return Array.from(map.values())
      .filter(item => {
        if (aksCategoryFilter !== 'ALL' && item.kategori !== aksCategoryFilter) return false;
        if (aksSearchTerm.trim()) {
          const term = aksSearchTerm.toLowerCase();
          return item.tipe.toLowerCase().includes(term) || 
                 item.kategori.toLowerCase().includes(term) ||
                 (item.sku || '').toLowerCase().includes(term);
        }
        return true;
      })
      .sort((a, b) => a.kategori.localeCompare(b.kategori) || a.tipe.localeCompare(b.tipe));
  }, [filteredAksesoris, aksCategoryFilter, aksSearchTerm]);

  // Aksesoris metrics & stock health statistics
  const aksStats = useMemo(() => {
    let totalPcs = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;
    let tersedia = 0;
    let menipis = 0;
    let habis = 0;

    aksesorisSummary.forEach(item => {
      totalMasuk += item.totalMasuk;
      totalKeluar += item.totalKeluar;
      totalPcs += Math.max(0, item.sisaStok);
      if (item.sisaStok <= 0) habis++;
      else if (item.sisaStok <= 3) menipis++;
      else tersedia++;
    });

    return { 
      totalJenis: aksesorisSummary.length, 
      totalPcs, 
      totalMasuk,
      totalKeluar,
      tersedia, 
      menipis, 
      habis 
    };
  }, [aksesorisSummary]);

  // Filtered Aksesoris Summary based on status pill
  const displayedAksesorisSummary = useMemo(() => {
    return aksesorisSummary.filter(item => {
      if (aksStatusFilter === 'TERSEDIA' && item.sisaStok <= 3) return false;
      if (aksStatusFilter === 'MENIPIS' && (item.sisaStok <= 0 || item.sisaStok > 3)) return false;
      if (aksStatusFilter === 'HABIS' && item.sisaStok > 0) return false;
      return true;
    });
  }, [aksesorisSummary, aksStatusFilter]);

  // Currently active Aksesoris item for detail / history modal (keeps in sync in real-time)
  const currentSelectedAksDetail = useMemo(() => {
    if (!selectedAksDetailKey) return null;
    return aksesorisSummary.find(item => item.key === selectedAksDetailKey) || null;
  }, [aksesorisSummary, selectedAksDetailKey]);

  // Consolidated ABD units
  const consolidatedABD = useMemo(() => {
    const map = new Map<string, {
      noSeri: string;
      tipeABD: string;
      model: string;
      sku: string;
      tanggalMasuk: string;
      sumber: string;
      keteranganMasuk: string;
      tanggalRetur: string;
      tujuanRetur: string;
      alasanRetur: string;
      tanggalTerjual: string;
      noInvoice: string;
      namaCustomer: string;
      cabangTerjual: string;
      branchCode: string;
      masukEntryId?: string;
      returEntryId?: string;
      terjualEntryId?: string;
      rawEntries: ABDInventoryEntry[];
    }>();
    
    const sorted = [...filteredABD].sort((a,b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    
    sorted.forEach(item => {
      const key = item.noSeri ? item.noSeri.trim() : item.id;
      const rawSku = (item.sku && item.sku !== '-') ? item.sku : undefined;
      const resolvedSku = rawSku || findABDSku(item.tipeABD, item.model || '') || '-';
      if (!map.has(key)) {
        map.set(key, {
          noSeri: item.noSeri || '-',
          tipeABD: item.tipeABD,
          model: item.model || '',
          sku: resolvedSku,
          tanggalMasuk: '-',
          sumber: '-',
          keteranganMasuk: '-',
          tanggalRetur: '-',
          tujuanRetur: '-',
          alasanRetur: '-',
          tanggalTerjual: '-',
          noInvoice: '-',
          namaCustomer: '-',
          cabangTerjual: '-',
          branchCode: item.branchCode || activeBranchFilter,
          rawEntries: []
        });
      }
      
      const record = map.get(key)!;
      record.rawEntries.push(item);
      record.branchCode = item.branchCode || record.branchCode;
      if (resolvedSku && resolvedSku !== '-' && record.sku === '-') {
        record.sku = resolvedSku;
      }

      if (item.type === 'MASUK') {
        record.tanggalMasuk = item.tanggal;
        record.sumber = item.sumberTujuan;
        record.keteranganMasuk = item.keterangan || '-';
        record.tipeABD = item.tipeABD;
        record.model = item.model || '';
        record.masukEntryId = item.id;
      } else if (item.type === 'KELUAR_RETUR') {
        record.tanggalRetur = item.tanggal;
        record.tujuanRetur = item.sumberTujuan || item.cabangTujuan || '-';
        record.alasanRetur = item.keterangan || '-';
        record.returEntryId = item.id;
      } else if (item.type === 'KELUAR_TERJUAL') {
        record.tanggalTerjual = item.tanggal;
        record.noInvoice = item.noInvoice || '-';
        record.namaCustomer = item.namaCustomer || '-';
        record.cabangTerjual = item.cabangTujuan || item.branchCode || '-';
        record.terjualEntryId = item.id;
      }
    });
    
    return Array.from(map.values()).sort((a, b) => {
       const dateA = a.tanggalMasuk !== '-' ? a.tanggalMasuk : (a.tanggalTerjual !== '-' ? a.tanggalTerjual : '');
       const dateB = b.tanggalMasuk !== '-' ? b.tanggalMasuk : (b.tanggalTerjual !== '-' ? b.tanggalTerjual : '');
       return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [filteredABD, activeBranchFilter]);

  // Filtered ABD for display
  const displayConsolidatedABD = useMemo(() => {
    return consolidatedABD.filter(item => {
      // Status filter
      if (abdStatusFilter === 'TERSEDIA') {
        if (item.tanggalTerjual !== '-' || item.tanggalRetur !== '-') return false;
      } else if (abdStatusFilter === 'TERJUAL') {
        if (item.tanggalTerjual === '-') return false;
      } else if (abdStatusFilter === 'RETUR') {
        if (item.tanggalRetur === '-') return false;
      }

      // Search term
      if (abdSearchTerm.trim()) {
        const term = abdSearchTerm.toLowerCase();
        const matches = (item.noSeri || '').toLowerCase().includes(term) ||
                        (item.sku || '').toLowerCase().includes(term) ||
                        (item.tipeABD || '').toLowerCase().includes(term) ||
                        (item.model || '').toLowerCase().includes(term) ||
                        (item.sumber || '').toLowerCase().includes(term) ||
                        (item.namaCustomer || '').toLowerCase().includes(term) ||
                        (item.noInvoice || '').toLowerCase().includes(term) ||
                        (item.tujuanRetur || '').toLowerCase().includes(term) ||
                        (item.branchCode || '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [consolidatedABD, abdStatusFilter, abdSearchTerm]);

  // ABD Statistics
  const abdStats = useMemo(() => {
    let tersedia = 0;
    let terjual = 0;
    let retur = 0;

    consolidatedABD.forEach(item => {
      if (item.tanggalRetur !== '-') retur++;
      else if (item.tanggalTerjual !== '-') terjual++;
      else tersedia++;
    });

    return { total: consolidatedABD.length, tersedia, terjual, retur };
  }, [consolidatedABD]);

  // Protected Actions with PIN
  const requirePinForAction = (
    title: string,
    subtitle: string,
    actionText: string,
    isDanger: boolean,
    onSuccess: () => void
  ) => {
    setPinModalConfig({
      title,
      subtitle,
      actionText,
      isDanger,
      onSuccess: () => {
        setPinModalOpen(false);
        onSuccess();
      }
    });
    setPinModalOpen(true);
  };

  // 1. Edit Handlers
  const handleEditABD = (entry: ABDInventoryEntry) => {
    requirePinForAction(
      'Verifikasi PIN Edit Stok ABD',
      `Otorisasi ubah data unit ${entry.noSeri || entry.tipeABD}`,
      'Verifikasi & Edit',
      false,
      () => {
        setEditingABDEntry(entry);
        setEditItemType('ABD');
        setEditModalOpen(true);
      }
    );
  };

  const handleEditConsolidatedABD = (item: typeof consolidatedABD[0]) => {
    const rawEntry = item.rawEntries[0] || {
      id: `inv-abd-${Date.now()}`,
      type: item.tanggalRetur !== '-' ? 'KELUAR_RETUR' : (item.tanggalTerjual !== '-' ? 'KELUAR_TERJUAL' : 'MASUK'),
      tanggal: item.tanggalMasuk !== '-' ? item.tanggalMasuk : new Date().toISOString().split('T')[0],
      sumberTujuan: item.sumber !== '-' ? item.sumber : 'Gudang Maindealer',
      tipeABD: item.tipeABD,
      model: item.model,
      noSeri: item.noSeri,
      keterangan: item.keteranganMasuk !== '-' ? item.keteranganMasuk : '',
      branchCode: item.branchCode,
      noInvoice: item.noInvoice !== '-' ? item.noInvoice : undefined,
      namaCustomer: item.namaCustomer !== '-' ? item.namaCustomer : undefined,
      cabangTujuan: item.tujuanRetur !== '-' ? item.tujuanRetur : undefined,
    };

    requirePinForAction(
      'Verifikasi PIN Edit Stok ABD',
      `Otorisasi ubah data unit No Seri: ${item.noSeri}`,
      'Verifikasi & Edit',
      false,
      () => {
        setEditingABDEntry(rawEntry);
        setEditItemType('ABD');
        setEditModalOpen(true);
      }
    );
  };

  const handleEditAksesoris = (entry: AksesorisInventoryEntry) => {
    requirePinForAction(
      'Verifikasi PIN Edit Stok Aksesoris',
      `Otorisasi ubah data stok produk ${entry.tipe}`,
      'Verifikasi & Edit',
      false,
      () => {
        setEditingAksEntry(entry);
        setEditItemType('AKSESORIS');
        setEditModalOpen(true);
      }
    );
  };

  // 2. Delete Handlers
  const handleDeleteABD = (entry: ABDInventoryEntry) => {
    requirePinForAction(
      'Verifikasi PIN Hapus Data ABD',
      `PERINGATAN: Menghapus data unit ${entry.noSeri || entry.tipeABD} permanen`,
      'Verifikasi & Hapus',
      true,
      async () => {
        if (confirm(`Apakah Anda yakin ingin menghapus data inventori No Seri "${entry.noSeri}" secara permanen?`)) {
          await inventoryDbOps.deleteInventoryABD(entry.id);
          alert('Data inventori berhasil dihapus.');
        }
      }
    );
  };

  const handleDeleteConsolidatedABD = (item: typeof consolidatedABD[0]) => {
    requirePinForAction(
      'Verifikasi PIN Hapus Unit ABD',
      `PERINGATAN: Menghapus seluruh riwayat stok No Seri ${item.noSeri}`,
      'Verifikasi & Hapus',
      true,
      async () => {
        if (confirm(`Apakah Anda yakin ingin menghapus unit No Seri "${item.noSeri}" (${item.rawEntries.length} data riwayat) secara permanen?`)) {
          for (const raw of item.rawEntries) {
            await inventoryDbOps.deleteInventoryABD(raw.id);
          }
          alert('Unit inventori berhasil dihapus.');
        }
      }
    );
  };

  const handleDeleteAksesoris = (entry: AksesorisInventoryEntry) => {
    requirePinForAction(
      'Verifikasi PIN Hapus Stok Aksesoris',
      `PERINGATAN: Menghapus log mutasi ${entry.tipe} (${entry.qty} pcs)`,
      'Verifikasi & Hapus',
      true,
      async () => {
        if (confirm(`Apakah Anda yakin ingin menghapus log mutasi aksesoris "${entry.tipe}" tanggal ${entry.tanggal}?`)) {
          await inventoryDbOps.deleteInventoryAksesoris(entry.id);
          alert('Log mutasi aksesoris berhasil dihapus.');
        }
      }
    );
  };

  // 3. Mutation, Retur, & Sale Actions
  const handleOpenMutation = (
    item: typeof consolidatedABD[0], 
    action: MutationActionType
  ) => {
    setMutationTargetItem({
      itemType: 'ABD',
      noSeri: item.noSeri,
      tipeABD: item.tipeABD,
      model: item.model,
      currentBranch: item.branchCode || activeBranchFilter,
      sourceEntryId: item.masukEntryId
    });
    setMutationActionType(action);
    setMutationModalOpen(true);
  };

  const handleOpenAksMutation = (
    item: typeof aksesorisSummary[0],
    action: MutationActionType,
    customAvailableStock?: number
  ) => {
    setMutationTargetItem({
      itemType: 'AKSESORIS',
      tipe: item.tipe,
      kategori: item.kategori,
      sku: item.sku,
      currentBranch: activeBranchFilter === 'ALL' ? 'MD' : activeBranchFilter,
      availableStock: customAvailableStock !== undefined ? customAvailableStock : item.sisaStok,
    });
    setMutationActionType(action);
    setMutationModalOpen(true);
  };

  const handleOpenAksRestock = (item?: { tipe: string; kategori: string; sku?: string }) => {
    if (item) {
      setSelectedAksForAdd({
        tipe: item.tipe,
        kategori: item.kategori,
        sku: item.sku,
      });
    } else {
      setSelectedAksForAdd(null);
    }
    setAddAksModalOpen(true);
  };

  const handleOpenAksDetail = (item: typeof aksesorisSummary[0]) => {
    setSelectedAksDetailKey(item.key);
    setAksDetailModalOpen(true);
  };

  const handleSaveAksStock = async (newEntry: AksesorisInventoryEntry) => {
    await inventoryDbOps.saveInventoryAksesoris(newEntry);
    alert(`✅ Stok masuk "${newEntry.tipe}" sebanyak ${newEntry.qty} pcs berhasil ditambahkan.`);
  };

  const handleConfirmMutation = async (data: {
    actionType: MutationActionType;
    tanggal: string;
    targetBranch: string;
    alasan: string;
    noInvoice?: string;
    namaCustomer?: string;
    qty?: number;
  }) => {
    if (!mutationTargetItem) return;

    const timestamp = Date.now();
    const fromBranch = mutationTargetItem.currentBranch;

    // A. Aksesoris Mutations
    if (mutationTargetItem.itemType === 'AKSESORIS') {
      const mutQty = data.qty || 1;
      const itemKategori = mutationTargetItem.kategori || 'Aksesoris ABD';
      const itemTipe = mutationTargetItem.tipe || '-';
      const itemSku = mutationTargetItem.sku || findAksesorisSku(itemTipe, itemKategori);

      if (data.actionType === 'RETUR_MAINDEALER') {
        // 1. KELUAR_RETUR from current branch
        await inventoryDbOps.saveInventoryAksesoris({
          id: `inv-aks-ret-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'KELUAR_RETUR',
          tanggal: data.tanggal,
          sumberTujuan: 'Gudang Maindealer',
          cabangTujuan: 'MD',
          kategori: itemKategori,
          tipe: itemTipe,
          sku: itemSku,
          qty: mutQty,
          keterangan: `Mutasi ke Gudang Maindealer (Pusat)${data.alasan ? ' | ' + data.alasan : ''}`,
          branchCode: fromBranch
        });

        // 2. MASUK to Maindealer Warehouse if not already MD
        if (fromBranch !== 'MD' && fromBranch !== 'HQ') {
          await inventoryDbOps.saveInventoryAksesoris({
            id: `inv-aks-in-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'MASUK',
            tanggal: data.tanggal,
            sumberTujuan: fromBranch,
            kategori: itemKategori,
            tipe: itemTipe,
            sku: itemSku,
            qty: mutQty,
            keterangan: `Penerimaan Mutasi dari Cabang ${fromBranch}${data.alasan ? ' | ' + data.alasan : ''}`,
            branchCode: 'MD'
          });
        }

        alert(`✅ Berhasil! ${mutQty} pcs "${itemTipe}" telah dimutasi ke Gudang Maindealer.`);
      } else if (data.actionType === 'MUTASI_CABANG') {
        // 1. KELUAR_RETUR from origin branch
        await inventoryDbOps.saveInventoryAksesoris({
          id: `inv-aks-out-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'KELUAR_RETUR',
          tanggal: data.tanggal,
          sumberTujuan: data.targetBranch,
          cabangTujuan: data.targetBranch,
          kategori: itemKategori,
          tipe: itemTipe,
          sku: itemSku,
          qty: mutQty,
          keterangan: `Mutasi keluar ke cabang ${data.targetBranch}${data.alasan ? ' | ' + data.alasan : ''}`,
          branchCode: fromBranch
        });

        // 2. MASUK to target branch
        await inventoryDbOps.saveInventoryAksesoris({
          id: `inv-aks-in-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'MASUK',
          tanggal: data.tanggal,
          sumberTujuan: fromBranch,
          kategori: itemKategori,
          tipe: itemTipe,
          sku: itemSku,
          qty: mutQty,
          keterangan: `Mutasi masuk dari cabang ${fromBranch}${data.alasan ? ' | ' + data.alasan : ''}`,
          branchCode: data.targetBranch
        });

        alert(`✅ Mutasi Berhasil! ${mutQty} pcs "${itemTipe}" berpindah dari ${fromBranch} ke ${data.targetBranch}.`);
      } else if (data.actionType === 'CATAT_TERJUAL') {
        await inventoryDbOps.saveInventoryAksesoris({
          id: `inv-aks-sale-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'KELUAR_TERJUAL',
          tanggal: data.tanggal,
          sumberTujuan: data.namaCustomer || 'Pasien',
          cabangTujuan: fromBranch,
          kategori: itemKategori,
          tipe: itemTipe,
          sku: itemSku,
          qty: mutQty,
          noInvoice: data.noInvoice || '-',
          namaCustomer: data.namaCustomer || '-',
          keterangan: `Terjual ke ${data.namaCustomer}${data.noInvoice ? ' (Faktur: ' + data.noInvoice + ')' : ''}${data.alasan ? ' | ' + data.alasan : ''}`,
          branchCode: fromBranch
        });

        alert(`✅ Penjualan Berhasil Dicatat! ${mutQty} pcs "${itemTipe}" tercatat sebagai TERJUAL.`);
      }
      return;
    }

    // B. ABD Mutations (Individual Unit by Serial Number)
    if (data.actionType === 'RETUR_MAINDEALER') {
      // 1. KELUAR_RETUR from current branch
      await inventoryDbOps.saveInventoryABD({
        id: `inv-abd-ret-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'KELUAR_RETUR',
        tanggal: data.tanggal,
        sumberTujuan: 'Gudang Maindealer',
        cabangTujuan: 'MD',
        tipeABD: mutationTargetItem.tipeABD || '-',
        model: mutationTargetItem.model || '-',
        noSeri: mutationTargetItem.noSeri || '-',
        keterangan: `Mutasi ke Gudang Maindealer (Pusat)${data.alasan ? ' | ' + data.alasan : ''}`,
        branchCode: fromBranch
      });

      // 2. MASUK to Maindealer Warehouse
      if (fromBranch !== 'MD' && fromBranch !== 'HQ') {
        await inventoryDbOps.saveInventoryABD({
          id: `inv-abd-in-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'MASUK',
          tanggal: data.tanggal,
          sumberTujuan: fromBranch,
          tipeABD: mutationTargetItem.tipeABD || '-',
          model: mutationTargetItem.model || '-',
          noSeri: mutationTargetItem.noSeri || '-',
          keterangan: `Penerimaan Mutasi dari Cabang ${fromBranch}${data.alasan ? ' | ' + data.alasan : ''}`,
          branchCode: 'MD'
        });
      }

      alert(`✅ Berhasil! Unit ${mutationTargetItem.noSeri} telah dimutasi ke Gudang Maindealer.`);
    } else if (data.actionType === 'MUTASI_CABANG') {
      // 1. KELUAR_RETUR from origin branch
      await inventoryDbOps.saveInventoryABD({
        id: `inv-abd-out-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'KELUAR_RETUR',
        tanggal: data.tanggal,
        sumberTujuan: data.targetBranch,
        cabangTujuan: data.targetBranch,
        tipeABD: mutationTargetItem.tipeABD || '-',
        model: mutationTargetItem.model || '-',
        noSeri: mutationTargetItem.noSeri || '-',
        keterangan: `Mutasi keluar ke cabang ${data.targetBranch}${data.alasan ? ' | ' + data.alasan : ''}`,
        branchCode: fromBranch
      });

      // 2. MASUK to target branch
      await inventoryDbOps.saveInventoryABD({
        id: `inv-abd-in-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'MASUK',
        tanggal: data.tanggal,
        sumberTujuan: fromBranch,
        tipeABD: mutationTargetItem.tipeABD || '-',
        model: mutationTargetItem.model || '-',
        noSeri: mutationTargetItem.noSeri || '-',
        keterangan: `Mutasi masuk dari cabang ${fromBranch}${data.alasan ? ' | ' + data.alasan : ''}`,
        branchCode: data.targetBranch
      });

      alert(`✅ Mutasi Berhasil! Stok unit ${mutationTargetItem.noSeri} berpindah dari ${fromBranch} ke ${data.targetBranch}.`);
    } else if (data.actionType === 'CATAT_TERJUAL') {
      await inventoryDbOps.saveInventoryABD({
        id: `inv-abd-sale-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'KELUAR_TERJUAL',
        tanggal: data.tanggal,
        sumberTujuan: data.namaCustomer || 'Pasien',
        cabangTujuan: fromBranch,
        tipeABD: mutationTargetItem.tipeABD || '-',
        model: mutationTargetItem.model || '-',
        noSeri: mutationTargetItem.noSeri || '-',
        noInvoice: data.noInvoice || '-',
        namaCustomer: data.namaCustomer || '-',
        keterangan: `Terjual ke ${data.namaCustomer}${data.noInvoice ? ' (Faktur: ' + data.noInvoice + ')' : ''}${data.alasan ? ' | ' + data.alasan : ''}`,
        branchCode: fromBranch
      });

      alert(`✅ Penjualan Berhasil Dicatat! Unit ${mutationTargetItem.noSeri} tercatat sebagai TERJUAL.`);
    }
  };

  // Download handlers
  const currentBranchLabel = activeBranchFilter === 'ALL' ? 'Semua_Cabang' : activeBranchFilter;

  const handleDownloadABD = () => {
    exportABDInventoryCSV(displayConsolidatedABD, currentBranchLabel as any);
    setExportDropdownOpen(false);
  };

  const handleDownloadAksSummary = () => {
    exportAksesorisInventorySummaryCSV(aksesorisSummary, currentBranchLabel as any);
    setExportDropdownOpen(false);
  };

  const handleDownloadAksMutations = () => {
    exportAksesorisInventoryMutationsCSV(displayAksesoris, currentBranchLabel as any);
    setExportDropdownOpen(false);
  };

  const handleDownloadAllInventory = () => {
    exportABDInventoryCSV(consolidatedABD, currentBranchLabel as any);
    setTimeout(() => {
      exportAksesorisInventorySummaryCSV(aksesorisSummary, currentBranchLabel as any);
    }, 400);
    setTimeout(() => {
      exportAksesorisInventoryMutationsCSV(filteredAksesoris, currentBranchLabel as any);
    }, 800);
    setExportDropdownOpen(false);
  };

  const currentBranchObj = BRANCHES.find(b => b.code === activeBranchFilter);

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* 1. Header & Branch Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>Manajemen Stok & Inventori</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Pusat kontrol stok, mutasi antar cabang, mutasi ke Maindealer, dan saldo per cabang
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* Download Laporan Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Laporan</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Laporan ({activeBranchFilter === 'ALL' ? 'Semua Cabang' : activeBranchFilter})
                  </p>
                </div>

                <button
                  onClick={handleDownloadABD}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-start gap-3 text-slate-700 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Laporan Stok ABD</div>
                    <div className="text-[11px] text-slate-500">{displayConsolidatedABD.length} unit terfilter</div>
                  </div>
                </button>

                <button
                  onClick={handleDownloadAksSummary}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-start gap-3 text-slate-700 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#23277A] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Ringkasan Saldo Stok Aksesoris</div>
                    <div className="text-[11px] text-slate-500">Saldo stok ({aksesorisSummary.length} item)</div>
                  </div>
                </button>

                <button
                  onClick={handleDownloadAksMutations}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-start gap-3 text-slate-700 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Riwayat Mutasi Stok Aksesoris</div>
                    <div className="text-[11px] text-slate-500">Semua log mutasi ({displayAksesoris.length} baris)</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={handleDownloadAllInventory}
                    className="w-full text-left px-4 py-2 hover:bg-emerald-50 flex items-center gap-2 text-emerald-800 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Semua Laporan Sekaligus</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input Manual / Mutasi (Protected by Role / PIN) */}
          {hasInventoryEditAccess ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setManualOrderModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input / Mutasi Stok</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                requirePinForAction(
                  'Verifikasi PIN Akses Input Stok',
                  'Masukkan PIN otorisasi untuk membuka formulir input stok',
                  'Buka Input Stok',
                  false,
                  () => setManualOrderModalOpen(true)
                );
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Input Stok (Perlu PIN)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Branch Navigation Selector (Separate reports/views per branch) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
            <Warehouse className="w-4 h-4 text-blue-600" />
            <span>PILIH TAMPILAN CABANG / GUDANG:</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Gudang Utama: <strong>Gudang Maindealer (Pusat)</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {/* Gudang Maindealer button (Highlighted) */}
          <button
            onClick={() => setActiveBranchFilter('MD')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeBranchFilter === 'MD'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🏢 Gudang Maindealer (Pusat) [MD]</span>
          </button>

          {/* Individual Branch buttons */}
          {BRANCHES.filter(b => b.code !== 'MD').map((b) => {
            const isSelected = activeBranchFilter === b.code;
            return (
              <button
                key={b.code}
                onClick={() => setActiveBranchFilter(b.code)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {b.name.replace('Earsound ', '')} [{b.code}]
              </button>
            );
          })}

          {/* All branches consolidated (CEO/Supervisor) */}
          <button
            onClick={() => setActiveBranchFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeBranchFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            🌐 Semua Cabang (Konsolidasi)
          </button>
        </div>
      </div>

      {/* 3. Warehouse Info Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        activeBranchFilter === 'MD'
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : activeBranchFilter === 'ALL'
            ? 'bg-slate-100 border-slate-300 text-slate-800'
            : 'bg-blue-50/90 border-blue-200 text-blue-900'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl mt-0.5 ${
            activeBranchFilter === 'MD' ? 'bg-amber-200/80 text-amber-800' : 'bg-blue-200/80 text-blue-800'
          }`}>
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black flex items-center gap-2">
              <span>
                {activeBranchFilter === 'MD'
                  ? 'Gudang Utama: Gudang Maindealer (Pusat Suplai)'
                  : activeBranchFilter === 'ALL'
                    ? 'Tampilan Konsolidasi: Semua Cabang & Gudang'
                    : `Inventori Cabang: ${currentBranchObj?.name || activeBranchFilter} [${activeBranchFilter}]`}
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-white/80 border border-current shadow-2xs">
                {activeBranchFilter === 'MD' ? 'Pusat Suplai' : 'Aktif'}
              </span>
            </div>
            <p className="text-xs opacity-85 mt-0.5">
              {activeBranchFilter === 'MD'
                ? 'Gudang utama adalah sumber seluruh stok yang masuk ke cabang. Mutasi dari cabang akan diterima di sini.'
                : activeBranchFilter === 'ALL'
                  ? 'Menampilkan rekapitulasi data gabungan dari seluruh cabang dan gudang pusat.'
                  : 'Seluruh stok masuk ke cabang ini normalnya disuplai dari Gudang Maindealer. Barang bisa dimutasi ke cabang lain atau gudang pusat.'}
            </p>
          </div>
        </div>

        {activeBranchFilter !== 'MD' && activeBranchFilter !== 'ALL' && (
          <button
            onClick={() => setManualOrderModalOpen(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-300 shadow-2xs transition-all whitespace-nowrap cursor-pointer"
          >
            + Terima Stok dari Maindealer
          </button>
        )}
      </div>

      {/* 4. Product Type Tabs (ABD vs Aksesoris) */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ABD')}
          className={`py-3 px-5 text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ABD'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/60 rounded-t-2xl'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stok Alat Bantu Dengar ({consolidatedABD.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('AKSESORIS')}
          className={`py-3 px-5 text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'AKSESORIS'
              ? 'text-[#23277A] border-b-2 border-[#23277A] bg-indigo-50/60 rounded-t-2xl'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Stok Aksesoris ({aksesorisSummary.length} Jenis Produk)</span>
        </button>
      </div>

      {/* 5. TAB 1: ALAT BANTU DENGAR (ABD) */}
      {activeTab === 'ABD' && (
        <div className="space-y-4">
          {/* Quick Stats Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setAbdStatusFilter('ALL')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                abdStatusFilter === 'ALL'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Unit ABD</span>
              <div className="text-xl font-black text-slate-800 mt-1">{abdStats.total}</div>
            </div>

            <div 
              onClick={() => setAbdStatusFilter(abdStatusFilter === 'TERSEDIA' ? 'ALL' : 'TERSEDIA')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                abdStatusFilter === 'TERSEDIA'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Tersedia di Stok</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{abdStats.tersedia}</div>
            </div>

            <div 
              onClick={() => setAbdStatusFilter(abdStatusFilter === 'TERJUAL' ? 'ALL' : 'TERJUAL')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                abdStatusFilter === 'TERJUAL'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Terjual</span>
              <div className="text-xl font-black text-amber-600 mt-1">{abdStats.terjual}</div>
            </div>

            <div 
              onClick={() => setAbdStatusFilter(abdStatusFilter === 'RETUR' ? 'ALL' : 'RETUR')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                abdStatusFilter === 'RETUR'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
                  : 'bg-white border-slate-200 hover:border-rose-300'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Dimutasi</span>
              <div className="text-xl font-black text-rose-600 mt-1">{abdStats.retur}</div>
            </div>
          </div>

          {/* Search Bar & View Mode Toggle */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari No. Seri, Tipe ABD, Sumber, Invoice, Customer..."
                value={abdSearchTerm}
                onChange={(e) => setAbdSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setAbdViewMode('CONSOLIDATED')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    abdViewMode === 'CONSOLIDATED'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Tabel Unit Terpadu
                </button>
                <button
                  onClick={() => setAbdViewMode('RAW_LOGS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    abdViewMode === 'RAW_LOGS'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Semua Log Entri ({filteredABD.length})
                </button>
              </div>

              <button
                onClick={handleDownloadABD}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer"
                title="Download Laporan CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* ABD TABLE WITH FREEZE PANES (Sticky Headers & Sticky Action Columns) */}
          {abdViewMode === 'CONSOLIDATED' ? (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="max-h-[620px] overflow-auto relative scrollbar-thin">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  {/* Freeze Header (Sticky Top) */}
                  <thead className="sticky top-0 z-30 bg-slate-100 shadow-xs">
                    <tr>
                      <th colSpan={6} className="p-2.5 border-b border-r border-slate-300 bg-emerald-100/90 text-emerald-900 text-center text-xs font-black uppercase tracking-wider">
                        1. Data Masuk (Penerimaan / Stok Awal)
                      </th>
                      <th colSpan={3} className="p-2.5 border-b border-r border-slate-300 bg-amber-100/90 text-amber-900 text-center text-xs font-black uppercase tracking-wider">
                        2. Keluar (Terjual ke Pasien)
                      </th>
                      <th colSpan={3} className="p-2.5 border-b border-r border-slate-300 bg-rose-100/90 text-rose-900 text-center text-xs font-black uppercase tracking-wider">
                        3. Mutasi Keluar / Mutasi Cabang
                      </th>
                      <th colSpan={1} className="p-2.5 border-b border-slate-300 bg-slate-200 text-slate-900 text-center text-xs font-black uppercase tracking-wider sticky right-0 z-35">
                        Aksi & Otorisasi
                      </th>
                    </tr>
                    <tr className="bg-slate-200/90 text-slate-700 text-[10px] uppercase font-black border-b border-slate-300">
                      {/* Masuk */}
                      <th className="p-2.5 border-r border-slate-300 sticky left-0 z-30 bg-slate-200/95 min-w-[110px]">
                        No. Seri (SN)
                      </th>
                      <th className="p-2.5 border-r border-slate-300 min-w-[90px]">SKU</th>
                      <th className="p-2.5 border-r border-slate-300 min-w-[150px]">Tipe & Model</th>
                      <th className="p-2.5 border-r border-slate-300">Tanggal</th>
                      <th className="p-2.5 border-r border-slate-300">Sumber</th>
                      <th className="p-2.5 border-r border-slate-300">Ket. Masuk</th>
                      {/* Terjual */}
                      <th className="p-2.5 border-r border-slate-300">Tanggal</th>
                      <th className="p-2.5 border-r border-slate-300 min-w-[160px]">Invoice & Pasien</th>
                      <th className="p-2.5 border-r border-slate-300">Cabang</th>
                      {/* Mutasi */}
                      <th className="p-2.5 border-r border-slate-300">Tanggal</th>
                      <th className="p-2.5 border-r border-slate-300">Tujuan</th>
                      <th className="p-2.5 border-r border-slate-300">Alasan Mutasi</th>
                      {/* Aksi Sticky Right */}
                      <th className="p-2.5 text-center sticky right-0 z-30 bg-slate-200/95 min-w-[190px]">
                        Kelola Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-200">
                    {displayConsolidatedABD.map((item, idx) => {
                      const isRetur = item.tanggalRetur && item.tanggalRetur !== '-';
                      const isTerjual = item.tanggalTerjual && item.tanggalTerjual !== '-';
                      const isAvailable = !isRetur && !isTerjual;

                      return (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                          {/* No. Seri (Sticky Left Column) */}
                          <td className="p-2.5 border-r border-slate-200 font-mono text-blue-700 font-bold sticky left-0 z-20 bg-white group-hover:bg-blue-50/90 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                            {item.noSeri}
                          </td>

                          {/* SKU */}
                          <td className="p-2.5 border-r border-slate-200 font-mono text-[11px] font-bold">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 font-mono">
                              {(item.sku && item.sku !== '-') ? item.sku : (findABDSku(item.tipeABD, item.model) || '-')}
                            </span>
                          </td>

                          {/* Tipe & Model */}
                          <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-800">
                            {item.tipeABD} <span className="text-slate-400 font-normal">{item.model}</span>
                          </td>

                          {/* Masuk Fields */}
                          <td className="p-2.5 border-r border-slate-200 font-mono text-[11px] text-slate-600">{item.tanggalMasuk}</td>
                          <td className="p-2.5 border-r border-slate-200 font-medium text-slate-700">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.sumber}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-[11px] text-slate-500 max-w-[150px] truncate" title={item.keteranganMasuk}>
                            {item.keteranganMasuk}
                          </td>
                          
                          {/* Terjual Fields */}
                          <td className="p-2.5 border-r border-slate-200 font-mono text-[11px] text-slate-600">{item.tanggalTerjual}</td>
                          <td className="p-2.5 border-r border-slate-200">
                            {item.noInvoice !== '-' ? (
                              <div>
                                <div className="font-bold text-amber-800 text-[11px]">{item.noInvoice}</div>
                                <div className="text-[10px] text-slate-500 font-medium">{item.namaCustomer}</div>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-700">{item.cabangTerjual}</td>
                          
                          {/* Retur Fields */}
                          <td className="p-2.5 border-r border-slate-200 font-mono text-[11px] text-slate-600">{item.tanggalRetur}</td>
                          <td className="p-2.5 border-r border-slate-200">
                            {item.tujuanRetur !== '-' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {item.tujuanRetur}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-[11px] text-slate-500 max-w-[140px] truncate" title={item.alasanRetur}>
                            {item.alasanRetur}
                          </td>
                          
                          {/* Action Buttons (Sticky Right Column) */}
                          <td className="p-2 text-center sticky right-0 z-20 bg-white group-hover:bg-blue-50/90 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)] border-l border-slate-200">
                            <div className="flex items-center justify-center gap-1.5">
                              {isAvailable && (
                                <>
                                  {/* 1-Click Mutasi ke Maindealer */}
                                  <button
                                    onClick={() => handleOpenMutation(item, 'RETUR_MAINDEALER')}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                                    title="Mutasi ke Gudang Maindealer (Pusat)"
                                  >
                                    <Undo2 className="w-3.5 h-3.5" />
                                    <span className="hidden xl:inline">Mutasi MD</span>
                                  </button>

                                  {/* Mutasi Cabang */}
                                  <button
                                    onClick={() => handleOpenMutation(item, 'MUTASI_CABANG')}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                                    title="Mutasi ke Cabang Lain"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    <span className="hidden xl:inline">Mutasi</span>
                                  </button>

                                  {/* Catat Terjual */}
                                  <button
                                    onClick={() => handleOpenMutation(item, 'CATAT_TERJUAL')}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
                                    title="Catat Terjual Manual"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {isRetur && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  Dimutasi
                                </span>
                              )}

                              {isTerjual && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Terjual
                                </span>
                              )}

                              {/* Edit with PIN */}
                              <button
                                onClick={() => handleEditConsolidatedABD(item)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Edit Data Ini (Perlu PIN)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete with PIN */}
                              <button
                                onClick={() => handleDeleteConsolidatedABD(item)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Hapus Data Ini (Perlu PIN)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {displayConsolidatedABD.length === 0 && (
                      <tr>
                        <td colSpan={13} className="p-10 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <div>Tidak ada data stok ABD untuk filter cabang terpilih</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* RAW LOGS VIEW */
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="max-h-[620px] overflow-auto relative scrollbar-thin">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 z-30 bg-slate-100 text-slate-700 text-[11px] uppercase font-bold tracking-wider shadow-xs">
                    <tr>
                      <th className="p-3 border-b border-slate-300">Tanggal</th>
                      <th className="p-3 border-b border-slate-300">Jenis</th>
                      <th className="p-3 border-b border-slate-300">SKU</th>
                      <th className="p-3 border-b border-slate-300">No. Seri (SN)</th>
                      <th className="p-3 border-b border-slate-300">Tipe & Model</th>
                      <th className="p-3 border-b border-slate-300">Cabang</th>
                      <th className="p-3 border-b border-slate-300">Sumber / Tujuan</th>
                      <th className="p-3 border-b border-slate-300">Keterangan</th>
                      <th className="p-3 border-b border-slate-300 text-center sticky right-0 z-30 bg-slate-100">Aksi (PIN)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {filteredABD.sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-slate-700">{entry.tanggal}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.type === 'MASUK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.type === 'KELUAR_RETUR'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                            {(entry.sku && entry.sku !== '-') ? entry.sku : (findABDSku(entry.tipeABD, entry.model) || '-')}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-700">{entry.noSeri}</td>
                        <td className="p-3 font-semibold text-slate-900">{entry.tipeABD} {entry.model}</td>
                        <td className="p-3 font-bold text-slate-700">{entry.branchCode}</td>
                        <td className="p-3 text-slate-700">{entry.sumberTujuan || entry.cabangTujuan || '-'}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{entry.keterangan || '-'}</td>
                        <td className="p-3 text-center sticky right-0 bg-white/95 border-l border-slate-100">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditABD(entry)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                              title="Edit Log Ini (PIN)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteABD(entry)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold"
                              title="Hapus Log Ini (PIN)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredABD.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">Belum ada data log mutasi ABD</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: AKSESORIS */}
      {activeTab === 'AKSESORIS' && (
        <div className="space-y-6">
          {/* Quick Stats Cards for Aksesoris */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setAksStatusFilter('ALL')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                aksStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-slate-700/20'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-75 flex items-center justify-between">
                <span>Total Jenis Produk</span>
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-black mt-1">{aksStats.totalJenis}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Varian aksesoris terdaftar</div>
            </button>

            <div className="p-4 rounded-2xl border bg-white border-slate-200 text-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Total Stok Fisik</span>
                <Layers className="w-3.5 h-3.5 text-[#23277A]" />
              </div>
              <div className="text-2xl font-black text-[#23277A] mt-1">{aksStats.totalPcs} <span className="text-xs font-bold text-slate-500">pcs</span></div>
              <div className="text-[10px] text-slate-500 mt-0.5">Saldo fisik saat ini di cabang</div>
            </div>

            <button
              onClick={() => setAksStatusFilter(aksStatusFilter === 'MENIPIS' ? 'ALL' : 'MENIPIS')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                aksStatusFilter === 'MENIPIS'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900 hover:border-amber-300'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-85 flex items-center justify-between">
                <span>Stok Menipis (1-3 pcs)</span>
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-black mt-1">{aksStats.menipis}</div>
              <div className="text-[10px] opacity-80 mt-0.5">Perlu segera di-restock</div>
            </button>

            <button
              onClick={() => setAksStatusFilter(aksStatusFilter === 'HABIS' ? 'ALL' : 'HABIS')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                aksStatusFilter === 'HABIS'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-600/30'
                  : 'bg-rose-50/60 border-rose-200 text-rose-900 hover:border-rose-300'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-85 flex items-center justify-between">
                <span>Stok Habis (0 pcs)</span>
                <X className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-black mt-1">{aksStats.habis}</div>
              <div className="text-[10px] opacity-80 mt-0.5">Stok kosong di cabang ini</div>
            </button>
          </div>

          {/* Controls: Category Filter, View Mode, Search, & Restock Button */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Kategori:
              </span>
              <button
                onClick={() => setAksCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aksCategoryFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({filteredAksesoris.length})
              </button>
              {AKSESORIS_CATEGORY_LIST.map((cat) => {
                const count = filteredAksesoris.filter(i => i.kategori === cat).length;
                const isSelected = aksCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setAksCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-[#23277A] text-white shadow-xs'
                        : 'bg-indigo-50 text-[#23277A] hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    {cat} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari aksesoris / SKU..."
                  value={aksSearchTerm}
                  onChange={(e) => setAksSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>

              {/* View Mode Toggle: Summary vs Raw Logs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setAksViewMode('SUMMARY')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    aksViewMode === 'SUMMARY'
                      ? 'bg-white text-[#23277A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-[#23277A]" />
                  <span>Ringkasan Produk</span>
                </button>
                <button
                  onClick={() => setAksViewMode('RAW_LOGS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    aksViewMode === 'RAW_LOGS'
                      ? 'bg-white text-indigo-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Semua Log Mutasi</span>
                </button>
              </div>

              {/* Button Tambah Stok Masuk */}
              {hasInventoryEditAccess && (
                <button
                  onClick={() => handleOpenAksRestock()}
                  className="px-3.5 py-2 bg-[#23277A] hover:bg-[#181B57] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Tambah Stok Masuk Aksesoris"
                >
                  <PlusCircle className="w-4 h-4 text-[#F5B438]" />
                  <span>+ Stok Masuk</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: SUMMARY TABLE WITH MUTATION ACTIONS & HISTORY TRIGGER */}
          {aksViewMode === 'SUMMARY' ? (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#23277A]" />
                    <span>Katalog & Saldo Stok Aksesoris ({displayedAksesorisSummary.length} Produk)</span>
                  </h3>
                  {aksStatusFilter !== 'ALL' && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-bold">
                      Filter: {aksStatusFilter}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-medium">
                    Cabang: <strong>{activeBranchFilter === 'MD' ? 'Gudang Maindealer' : activeBranchFilter}</strong>
                  </span>
                </div>
                
                <button
                  onClick={handleDownloadAksSummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#23277A] text-xs font-bold rounded-xl border border-indigo-200 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#23277A]" />
                  <span>Download Ringkasan CSV</span>
                </button>
              </div>
              
              <div className="max-h-[620px] overflow-auto relative scrollbar-thin">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 z-30 bg-slate-100 shadow-xs text-slate-700 text-[11px] uppercase font-black tracking-wider">
                    <tr>
                      <th className="p-3 border-b border-slate-200 text-center w-10">No</th>
                      <th className="p-3 border-b border-slate-200 sticky left-0 z-30 bg-slate-100">Kategori</th>
                      <th className="p-3 border-b border-slate-200 min-w-[90px]">SKU</th>
                      <th className="p-3 border-b border-slate-200">Nama Produk / Tipe</th>
                      <th className="p-3 border-b border-slate-200 text-center">Total Masuk</th>
                      <th className="p-3 border-b border-slate-200 text-center">Total Keluar</th>
                      <th className="p-3 border-b border-slate-200 text-center bg-indigo-50/70 text-[#23277A]">Sisa Stok</th>
                      <th className="p-3 border-b border-slate-200 text-center">Status</th>
                      <th className="p-3 border-b border-slate-200 text-center sticky right-0 z-30 bg-slate-100 min-w-[280px]">
                        Riwayat Mutasi & Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {displayedAksesorisSummary.map((item, idx) => (
                      <tr key={`${item.kategori}-${item.tipe}-${idx}`} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 sticky left-0 z-20 bg-white">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-[#23277A] border border-indigo-200">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[#23277A] font-mono">
                            {(item.sku && item.sku !== '-') ? item.sku : (findAksesorisSku(item.tipe, item.kategori) || '-')}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleOpenAksDetail(item)}
                            className="font-bold text-slate-800 hover:text-[#23277A] transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                            title="Klik untuk melihat kartu stok dan riwayat mutasi lengkap"
                          >
                            <span>{item.tipe}</span>
                            <History className="w-3 h-3 text-[#23277A] opacity-60" />
                          </button>
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-700">+{item.totalMasuk}</td>
                        <td className="p-3 text-center font-bold text-orange-700">-{item.totalKeluar}</td>
                        <td className="p-3 text-center bg-indigo-50/30 font-mono font-black text-xs border-x border-slate-100">
                          <span className={`px-2.5 py-1 rounded-lg ${
                            item.sisaStok <= 0 
                              ? 'bg-rose-100 text-rose-700' 
                              : item.sisaStok <= 3 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.sisaStok} pcs
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {item.sisaStok <= 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">Habis</span>
                          ) : item.sisaStok <= 3 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">Menipis</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Tersedia</span>
                          )}
                        </td>

                        {/* Actions & History Button */}
                        <td className="p-2.5 text-center sticky right-0 bg-white/95 border-l border-slate-100">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Riwayat Mutasi (Full History) */}
                            <button
                              onClick={() => handleOpenAksDetail(item)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#23277A] rounded-lg text-[11px] font-black border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Buka Kartu Stok & Riwayat Mutasi Lengkap"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#23277A]" />
                              <span>Riwayat ({item.rawEntries.length})</span>
                            </button>

                            {/* Mutasi Cabang */}
                            <button
                              disabled={item.sisaStok <= 0}
                              onClick={() => handleOpenAksMutation(item, 'MUTASI_CABANG')}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-30 text-blue-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Mutasi ke Cabang Lain"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Mutasi ke Maindealer */}
                            <button
                              disabled={item.sisaStok <= 0}
                              onClick={() => handleOpenAksMutation(item, 'RETUR_MAINDEALER')}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-30 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Mutasi ke Gudang Maindealer (Pusat)"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Catat Terjual */}
                            <button
                              disabled={item.sisaStok <= 0}
                              onClick={() => handleOpenAksMutation(item, 'CATAT_TERJUAL')}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-30 text-amber-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Catat Terjual ke Pasien"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>

                            {/* + Tambah Stok */}
                            {hasInventoryEditAccess && (
                              <button
                                onClick={() => handleOpenAksRestock(item)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Tambah Stok Masuk Produk Ini"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayedAksesorisSummary.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-10 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <div>Tidak ada stok aksesoris yang sesuai dengan kriteria filter</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW 2: RAW MUTATION LOGS TABLE WITH FREEZE PANES & EDIT/DELETE WITH PIN */
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Semua Log Mutasi & Transaksi Aksesoris ({displayAksesoris.length} Baris Data)</span>
                </h3>
                <button
                  onClick={handleDownloadAksMutations}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Download Mutasi CSV</span>
                </button>
              </div>
              <div className="max-h-[550px] overflow-auto relative scrollbar-thin">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 z-30 bg-slate-100 shadow-xs text-slate-700 text-[11px] uppercase font-bold">
                    <tr>
                      <th className="p-3 border-b border-slate-200">Tanggal</th>
                      <th className="p-3 border-b border-slate-200">Jenis</th>
                      <th className="p-3 border-b border-slate-200 min-w-[90px]">SKU</th>
                      <th className="p-3 border-b border-slate-200">Sumber / Tujuan</th>
                      <th className="p-3 border-b border-slate-200">Kategori</th>
                      <th className="p-3 border-b border-slate-200">Tipe / Produk</th>
                      <th className="p-3 border-b border-slate-200 text-center">QTY</th>
                      <th className="p-3 border-b border-slate-200">Keterangan / Terjual Ke</th>
                      <th className="p-3 border-b border-slate-200 text-center sticky right-0 z-30 bg-slate-100">Aksi (PIN)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100">
                    {displayAksesoris.sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-700 font-mono text-[11px]">{item.tanggal}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            item.type === 'MASUK' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : (item.type === 'KELUAR_RETUR' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800')
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono">
                            {(item.sku && item.sku !== '-') ? item.sku : (findAksesorisSku(item.tipe, item.kategori) || '-')}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 font-medium text-xs">{item.sumberTujuan || item.cabangTujuan || '-'}</td>
                        <td className="p-3 text-slate-800 font-semibold text-xs">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="p-3 text-slate-900 font-bold text-xs">{item.tipe}</td>
                        <td className="p-3 text-center text-slate-900 font-black text-sm">{item.qty}</td>
                        <td className="p-3 text-slate-600 text-xs max-w-xs truncate">
                          {item.keterangan 
                            ? item.keterangan 
                            : (item.type === 'KELUAR_TERJUAL' 
                                ? `Faktur: ${item.noInvoice || '-'} - ${item.namaCustomer || '-'}` 
                                : '-')}
                        </td>
                        {/* Action Column with PIN */}
                        <td className="p-2.5 text-center sticky right-0 bg-white/95 border-l border-slate-100">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditAksesoris(item)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Edit Data Mutasi (Perlu PIN)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAksesoris(item)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Hapus Data Mutasi (Perlu PIN)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayAksesoris.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">Belum ada riwayat mutasi stok aksesoris</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={pinModalConfig.onSuccess}
        title={pinModalConfig.title}
        subtitle={pinModalConfig.subtitle}
        actionText={pinModalConfig.actionText}
        isDanger={pinModalConfig.isDanger}
      />

      {/* Edit Inventory Modal */}
      <EditInventoryModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        itemType={editItemType}
        initialABDEntry={editingABDEntry}
        initialAksEntry={editingAksEntry}
        onSaveABD={async (updated) => {
          await inventoryDbOps.saveInventoryABD(updated);
          alert('Data stok ABD berhasil diperbarui!');
        }}
        onSaveAksesoris={async (updated) => {
          await inventoryDbOps.saveInventoryAksesoris(updated);
          alert('Data stok aksesoris berhasil diperbarui!');
        }}
      />

      {/* Transfer & Mutation Modal */}
      <TransferMutationModal
        isOpen={mutationModalOpen}
        onClose={() => setMutationModalOpen(false)}
        actionType={mutationActionType}
        item={mutationTargetItem}
        onConfirmMutation={handleConfirmMutation}
      />

      {/* Manual Input / Distribution Modal */}
      <ManualOrderModal 
        isOpen={manualOrderModalOpen} 
        onClose={() => setManualOrderModalOpen(false)} 
        branchCode={activeBranchFilter === 'ALL' ? 'MD' : activeBranchFilter} 
        abdInventory={abdInventory}
        aksesorisInventory={aksesorisInventory}
      />

      {/* Aksesoris Detail & Granular Mutation History Modal */}
      <AksesorisDetailHistoryModal
        isOpen={aksDetailModalOpen}
        onClose={() => setAksDetailModalOpen(false)}
        item={currentSelectedAksDetail}
        activeBranchFilter={activeBranchFilter}
        onOpenTransfer={(actionType, availStock) => {
          if (currentSelectedAksDetail) {
            handleOpenAksMutation(currentSelectedAksDetail, actionType, availStock);
          }
        }}
        onOpenRestock={() => {
          if (currentSelectedAksDetail) {
            handleOpenAksRestock(currentSelectedAksDetail);
          }
        }}
        onEditEntry={(entry) => handleEditAksesoris(entry)}
        onDeleteEntry={(entry) => handleDeleteAksesoris(entry)}
      />

      {/* Add / Restock Aksesoris Modal */}
      <AddAksesorisStockModal
        isOpen={addAksModalOpen}
        onClose={() => {
          setAddAksModalOpen(false);
          setSelectedAksForAdd(null);
        }}
        defaultBranchCode={activeBranchFilter === 'ALL' ? 'MD' : activeBranchFilter}
        defaultProduct={selectedAksForAdd}
        onSave={handleSaveAksStock}
      />
    </div>
  );
}
