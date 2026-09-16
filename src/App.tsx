/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { NavTab, Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { PatientList } from './components/Patients/PatientList';
import { GlobalPatientDirectory } from './components/Patients/GlobalPatientDirectory';
import { PatientModal } from './components/Patients/PatientModal';
import { AksesorisSection } from './components/Transactions/AksesorisSection';
import { JasaPeriksaSection } from './components/Transactions/JasaPeriksaSection';
import { ABDSection } from './components/Transactions/ABDSection';
import { UangMasukReport } from './components/Reports/UangMasukReport';
import { InventoryPage } from './components/Inventory/InventoryPage';
import { EarmouldReportComponent } from './components/Reports/EarmouldReport';
import { ReparasiReportComponent } from './components/Reports/ReparasiReport';
import { KasKecilReportComponent } from './components/Reports/KasKecilReport';
import { UserManagementSection } from './components/Users/UserManagementSection';
import { POSPage } from './components/POS/POSPage';

import { PrintInvoiceModal } from './components/Common/PrintInvoiceModal';
import { PinVerificationModal } from './components/Common/PinVerificationModal';

import { 
  Patient, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  EarmouldReport, 
  ReparasiService, 
  KasKecilEntry,
  EarmouldStatus,
  ABDInventoryEntry,
  AksesorisInventoryEntry,
  JenisEarmould,
  ReparasiStatus,
  FittingType,
  AppUser,
  BranchCode
} from './types';

import { 
  getActiveUserSession, saveActiveUserSession,
  getSelectedBranchCode, saveSelectedBranchCode,
  resetAllStorage,
  DEFAULT_USERS
} from './utils/storage';
import { useFirestoreCollections } from './hooks/useFirestoreCollections';
import { dbOps, inventoryDbOps } from './services/dbOperations';
import { generateBundlingInventoryEntries } from './utils/bundlingInventory';
import { findABDSku, findAksesorisSku, getAksesorisBySku } from './data/skuCatalog';
import { isSonicAmplifierSubtype, getSonicAmplifierTargetSkus } from './utils/sonicAmplifierHelper';

import { LoginPage } from './components/LoginPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getActiveUserSession);
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const session = getActiveUserSession();
    return session?.role === 'LOGISTIK' ? 'inventori' : 'dashboard';
  });

  // User Auth & Branch Session
  const [selectedBranch, setSelectedBranch] = useState<BranchCode>(getSelectedBranchCode);

  // Auto-redirect Logistik role to Inventory tab
  useEffect(() => {
    if (currentUser?.role === 'LOGISTIK' && activeTab !== 'inventori') {
      setActiveTab('inventori');
    }
  }, [currentUser, activeTab]);

  // State Management (Real-time from Firestore)
  const { users, patients, aksesoris, jasaPeriksa, abd, earmould, reparasi, kasKecil, inventoryABD, inventoryAksesoris, crmNotes, loading, error } = useFirestoreCollections();

  // Function to explicitly clear all data for testing from scratch


  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [patientEditPinOpen, setPatientEditPinOpen] = useState(false);
  const [pendingPatientToEdit, setPendingPatientToEdit] = useState<Patient | null>(null);

  const handleStartEditPatient = (patient: Patient) => {
    setPendingPatientToEdit(patient);
    setPatientEditPinOpen(true);
  };

  const handlePatientPinSuccess = () => {
    setPatientEditPinOpen(false);
    if (pendingPatientToEdit) {
      setPatientToEdit(pendingPatientToEdit);
      setIsPatientModalOpen(true);
      setPendingPatientToEdit(null);
    }
  };

  // Print Invoice Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printTx, setPrintTx] = useState<AksesorisTransaction | JasaPeriksaTransaction | ABDTransaction | null>(null);
  const [printType, setPrintType] = useState<'AKS' | 'JSA' | 'ABD'>('AKS');

  const [pinDeletionConfig, setPinDeletionConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    actionText: string;
    requirePin?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    actionText: '',
    requirePin: true,
    onConfirm: () => {}
  });




  const handleSelectBranch = (branch: BranchCode) => {
    setSelectedBranch(branch);
    saveSelectedBranchCode(branch);
  };

  const handleLoginUser = (user: AppUser) => {
    setCurrentUser(user);
    saveActiveUserSession(user);
    if (user.role === 'LOGISTIK') {
      setActiveTab('inventori');
    }
    if (user.branchCode !== 'HQ' && user.branchCode !== 'ALL') {
      setSelectedBranch(user.branchCode);
      saveSelectedBranchCode(user.branchCode);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveActiveUserSession(null);
  };

  const handleSaveUser = (userToSave: AppUser) => {
    dbOps.saveUser(userToSave);
  };

  const handleDeleteUser = (id: string) => {
    dbOps.deleteUser(id);
  };

  // Filter Data based on Active User Branch & Selected Branch (Isolation Rule)
  const isHQ = currentUser?.branchCode === 'HQ' || currentUser?.role === 'CEO' || currentUser?.branchCode === 'ALL';

  // Pasien terkoneksi antar cabang - semua cabang bisa melihat semua pasien
  const visiblePatients = useMemo(() => patients, [patients]);

  const visibleAksesoris = useMemo(() => {
    if (isHQ && selectedBranch === 'ALL') return aksesoris;
    const targetCode = isHQ ? selectedBranch : currentUser?.branchCode;
    return aksesoris.filter((a) => a.branchCode === targetCode);
  }, [aksesoris, isHQ, selectedBranch, currentUser?.branchCode]);

  const visibleJasaPeriksa = useMemo(() => {
    if (isHQ && selectedBranch === 'ALL') return jasaPeriksa;
    const targetCode = isHQ ? selectedBranch : currentUser?.branchCode;
    return jasaPeriksa.filter((j) => j.branchCode === targetCode);
  }, [jasaPeriksa, isHQ, selectedBranch, currentUser?.branchCode]);

  const visibleABD = useMemo(() => {
    if (isHQ && selectedBranch === 'ALL') return abd;
    const targetCode = isHQ ? selectedBranch : currentUser?.branchCode;
    return abd.filter((b) => b.branchCode === targetCode);
  }, [abd, isHQ, selectedBranch, currentUser?.branchCode]);

  const visibleEarmould = useMemo(() => {
    if (isHQ && selectedBranch === 'ALL') return earmould;
    const targetCode = isHQ ? selectedBranch : currentUser?.branchCode;
    return earmould.filter((e) => e.branchCode === targetCode);
  }, [earmould, isHQ, selectedBranch, currentUser?.branchCode]);

  const visibleReparasi = useMemo(() => {
    if (isHQ && selectedBranch === 'ALL') return reparasi;
    const targetCode = isHQ ? selectedBranch : currentUser?.branchCode;
    return reparasi.filter((r) => r.branchCode === targetCode);
  }, [reparasi, isHQ, selectedBranch, currentUser?.branchCode]);

  const visibleKasKecil = useMemo(() => {
    if (isHQ && selectedBranch === 'ALL') return kasKecil;
    const targetCode = isHQ ? selectedBranch : currentUser?.branchCode;
    return kasKecil.filter((k) => k.branchCode === targetCode);
  }, [kasKecil, isHQ, selectedBranch, currentUser?.branchCode]);

  // Active working branch for adding new entries
  const activeWorkingBranch: BranchCode = isHQ ? (selectedBranch === 'ALL' ? 'YM' : selectedBranch) : currentUser?.branchCode;

  // Patients Handlers
  const handleSavePatient = (patient: Patient) => {
    const updatedPatient: Patient = {
      ...patient,
      branchCode: patient.branchCode || activeWorkingBranch,
      staffUser: patient.staffUser || currentUser?.username,
    };

    dbOps.savePatient(updatedPatient);
  };

  
  
  const requirePinForDeletion = (config: typeof pinDeletionConfig) => {
    if (currentUser?.branchCode === 'HQ' || currentUser?.branchCode === 'ALL') {
      setPinDeletionConfig({ ...config, requirePin: false });
    } else {
      setPinDeletionConfig({ ...config, requirePin: true });
    }
  };
  const checkDeletePermission = (itemBranchCode?: string) => {
    if (currentUser?.branchCode === 'HQ' || currentUser?.branchCode === 'ALL') return true;
    if (!itemBranchCode) return true; // Allow legacy data without branch code to be deleted by current branch
    if (currentUser?.branchCode === itemBranchCode) return true;
    return false;
  };

  const handleDeletePatient = (id: string) => {
    const p = patients.find(x => x.id === id);
    if (p && !checkDeletePermission(p.branchCode)) {
      alert('Anda tidak memiliki izin untuk menghapus data dari cabang lain.');
      return;
    }
    requirePinForDeletion({
      isOpen: true,
      title: 'Hapus Data Pasien',
      subtitle: 'Data transaksi terkait akan kehilangan referensi. Masukkan PIN untuk konfirmasi.',
      actionText: 'Hapus Pasien',
      onConfirm: () => dbOps.deletePatient(id)
    });
  };

  // Aksesoris Handlers
  const handleAddAksesoris = (tx: AksesorisTransaction) => {
    const txWithBranch = {
      ...tx,
      branchCode: tx.branchCode || activeWorkingBranch,
      staffUser: tx.staffUser || currentUser?.username,
    };
    
    dbOps.saveAksesoris(txWithBranch);

    // Inventory Aksesoris & ABD Spare Part replacement (Earmould is custom lab fabrication, exempt from physical inventory stock)
    if (tx.items && tx.items.length > 0) {
      tx.items.forEach((item, idx) => {
        if (item.category === 'Earmould' || (item.category === 'Spare Part dan Service' && item.subtype.toLowerCase().includes('jasa'))) {
          return;
        }
        if (item.category === 'Spare Part dan Service' && isSonicAmplifierSubtype(item.subtype)) {
          const targetSkus = getSonicAmplifierTargetSkus(item.subtype);
          let resolvedSku = targetSkus[0] || 'E2OBD';
          if (item.noSeri && inventoryABD) {
            const matchedInv = inventoryABD.find(inv => inv.noSeri === item.noSeri && (inv.branchCode || 'YM') === (txWithBranch.branchCode || 'YM'));
            if (matchedInv?.sku) {
              resolvedSku = matchedInv.sku;
            }
          }
          const invABD: ABDInventoryEntry = {
            id: `inv-abd-sp-${Date.now()}-${idx}`,
            type: 'KELUAR_TERJUAL',
            tanggal: tx.tanggal,
            sumberTujuan: tx.namaCustomer || 'Pasien',
            tipeABD: item.subtype,
            model: 'Amplifier Spare Part',
            sku: resolvedSku,
            noSeri: item.noSeri || `SN-SP-${Date.now()}`,
            keterangan: `Penggantian Spare Part/Amplifier (${item.subtype}) - Faktur: ${tx.nomorFaktur}`,
            noInvoice: tx.nomorFaktur,
            namaCustomer: tx.namaCustomer,
            cabangTujuan: txWithBranch.branchCode,
            branchCode: txWithBranch.branchCode || 'YM'
          };
          inventoryDbOps.saveInventoryABD(invABD);
          return;
        }

        const itemSku = item.sku || findAksesorisSku(item.subtype, item.category);
        const master = getAksesorisBySku(itemSku);
        const invAks: AksesorisInventoryEntry = {
          id: `inv-aks-${Date.now()}-${idx}`,
          type: 'KELUAR_TERJUAL',
          tanggal: tx.tanggal,
          sumberTujuan: '',
          kategori: master?.kategori || item.category,
          tipe: master?.nama || item.subtype || '',
          sku: master?.sku || (itemSku !== '-' ? itemSku : undefined),
          qty: item.qty,
          noInvoice: tx.nomorFaktur,
          namaCustomer: tx.namaCustomer,
          cabangTujuan: txWithBranch.branchCode,
          branchCode: txWithBranch.branchCode || 'YM'
        };
        inventoryDbOps.saveInventoryAksesoris(invAks);
      });
    } else if (tx.category !== 'Earmould' && !(tx.category === 'Spare Part dan Service' && tx.subtype.toLowerCase().includes('jasa'))) {
      if (tx.category === 'Spare Part dan Service' && isSonicAmplifierSubtype(tx.subtype)) {
        const targetSkus = getSonicAmplifierTargetSkus(tx.subtype);
        let resolvedSku = targetSkus[0] || 'E2OBD';
        if (tx.noSeri && inventoryABD) {
          const matchedInv = inventoryABD.find(inv => inv.noSeri === tx.noSeri && (inv.branchCode || 'YM') === (txWithBranch.branchCode || 'YM'));
          if (matchedInv?.sku) {
            resolvedSku = matchedInv.sku;
          }
        }
        const invABD: ABDInventoryEntry = {
          id: `inv-abd-sp-${Date.now()}`,
          type: 'KELUAR_TERJUAL',
          tanggal: tx.tanggal,
          sumberTujuan: tx.namaCustomer || 'Pasien',
          tipeABD: tx.subtype,
          model: 'Amplifier Spare Part',
          sku: resolvedSku,
          noSeri: tx.noSeri || `SN-SP-${Date.now()}`,
          keterangan: `Penggantian Spare Part/Amplifier (${tx.subtype}) - Faktur: ${tx.nomorFaktur}`,
          noInvoice: tx.nomorFaktur,
          namaCustomer: tx.namaCustomer,
          cabangTujuan: txWithBranch.branchCode,
          branchCode: txWithBranch.branchCode || 'YM'
        };
        inventoryDbOps.saveInventoryABD(invABD);
      } else {
        const itemSku = findAksesorisSku(tx.subtype, tx.category);
        const master = getAksesorisBySku(itemSku);
        const invAks: AksesorisInventoryEntry = {
          id: `inv-aks-${Date.now()}`,
          type: 'KELUAR_TERJUAL',
          tanggal: tx.tanggal,
          sumberTujuan: '',
          kategori: master?.kategori || tx.category,
          tipe: master?.nama || tx.subtype || '',
          sku: master?.sku || (itemSku !== '-' ? itemSku : undefined),
          qty: tx.qty,
          noInvoice: tx.nomorFaktur,
          namaCustomer: tx.namaCustomer,
          cabangTujuan: txWithBranch.branchCode,
          branchCode: txWithBranch.branchCode || 'YM'
        };
        inventoryDbOps.saveInventoryAksesoris(invAks);
      }
    }


    // Auto sync to Earmould lab tracking if category is Earmould
    if (tx.category === 'Earmould') {
      const today = new Date().toISOString().split('T')[0];
      let fitType: FittingType = 'Binaural';
      if (tx.sisiEarmouldDetails === 'Kanan') fitType = 'Monoaural (Kanan)';
      if (tx.sisiEarmouldDetails === 'Kiri') fitType = 'Monoaural (Kiri)';

      const newEm: EarmouldReport = {
        id: `EMD-${Date.now().toString().slice(-6)}`,
        idPelanggan: tx.idPelanggan,
        namaPelanggan: tx.namaCustomer,
        jenisEarmould: tx.jenisEarmouldDetails || 'S/C',
        qty: fitType,
        tanggalCetak: tx.tanggal || today,
        tanggalKirim: tx.tanggal || today,
        tanggalMasukLab: tx.tanggal || today,
        tanggalSelesai: '-',
        tanggalDiambil: '-',
        status: 'Di Lab',
        catatan: `Order via Aksesoris (Faktur: ${tx.nomorFaktur})`,
        branchCode: activeWorkingBranch,
        staffUser: currentUser?.username,
      };
      dbOps.saveEarmould(newEm);
    }
  };

  const handleDeleteAksesoris = (id: string) => {
    const tx = aksesoris.find(x => x.id === id);
    if (tx && !checkDeletePermission(tx.branchCode)) {
      alert('Anda tidak memiliki izin untuk menghapus data dari cabang lain.');
      return;
    }
    requirePinForDeletion({
      isOpen: true,
      title: 'Hapus Transaksi Aksesoris',
      subtitle: 'Masukkan PIN untuk menghapus transaksi ini permanen dan memulihkan stok inventori.',
      actionText: 'Hapus Transaksi',
      onConfirm: () => {
        dbOps.deleteAksesoris(id);
        if (tx?.nomorFaktur) {
          inventoryAksesoris
            .filter((inv) => inv.noInvoice === tx.nomorFaktur)
            .forEach((inv) => inventoryDbOps.deleteInventoryAksesoris(inv.id));
          inventoryABD
            .filter((inv) => inv.noInvoice === tx.nomorFaktur)
            .forEach((inv) => inventoryDbOps.deleteInventoryABD(inv.id));
        }
      }
    });
  };

  const handleSaveAksesoris = (updatedTx: AksesorisTransaction) => {
    dbOps.saveAksesoris(updatedTx);

    // Sync inventory entries for this transaction invoice
    if (updatedTx.nomorFaktur) {
      inventoryAksesoris
        .filter((inv) => inv.noInvoice === updatedTx.nomorFaktur)
        .forEach((inv) => inventoryDbOps.deleteInventoryAksesoris(inv.id));
      inventoryABD
        .filter((inv) => inv.noInvoice === updatedTx.nomorFaktur)
        .forEach((inv) => inventoryDbOps.deleteInventoryABD(inv.id));

      const txWithBranch = {
        ...updatedTx,
        branchCode: updatedTx.branchCode || activeWorkingBranch,
      };

      if (updatedTx.items && updatedTx.items.length > 0) {
        updatedTx.items.forEach((item, idx) => {
          if (item.category === 'Earmould' || (item.category === 'Spare Part dan Service' && item.subtype.toLowerCase().includes('jasa'))) {
            return;
          }
          if (item.category === 'Spare Part dan Service' && isSonicAmplifierSubtype(item.subtype)) {
            const targetSkus = getSonicAmplifierTargetSkus(item.subtype);
            let resolvedSku = targetSkus[0] || 'E2OBD';
            if (item.noSeri && inventoryABD) {
              const matchedInv = inventoryABD.find(inv => inv.noSeri === item.noSeri && (inv.branchCode || 'YM') === (txWithBranch.branchCode || 'YM'));
              if (matchedInv?.sku) {
                resolvedSku = matchedInv.sku;
              }
            }
            const invABD: ABDInventoryEntry = {
              id: `inv-abd-sp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'KELUAR_TERJUAL',
              tanggal: updatedTx.tanggal,
              sumberTujuan: updatedTx.namaCustomer || 'Pasien',
              tipeABD: item.subtype,
              model: 'Amplifier Spare Part',
              sku: resolvedSku,
              noSeri: item.noSeri || `SN-SP-${Date.now()}`,
              keterangan: `Penggantian Spare Part/Amplifier (${item.subtype}) - Faktur: ${updatedTx.nomorFaktur}`,
              noInvoice: updatedTx.nomorFaktur,
              namaCustomer: updatedTx.namaCustomer,
              cabangTujuan: txWithBranch.branchCode,
              branchCode: txWithBranch.branchCode || 'YM'
            };
            inventoryDbOps.saveInventoryABD(invABD);
            return;
          }

          const itemSku = item.sku || findAksesorisSku(item.subtype, item.category);
          const master = getAksesorisBySku(itemSku);
          const invAks: AksesorisInventoryEntry = {
            id: `inv-aks-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'KELUAR_TERJUAL',
            tanggal: updatedTx.tanggal,
            sumberTujuan: updatedTx.namaCustomer || 'Pasien',
            kategori: master?.kategori || item.category,
            tipe: master?.nama || item.subtype || '',
            sku: master?.sku || (itemSku !== '-' ? itemSku : undefined),
            qty: item.qty,
            noInvoice: updatedTx.nomorFaktur,
            namaCustomer: updatedTx.namaCustomer,
            cabangTujuan: txWithBranch.branchCode,
            branchCode: txWithBranch.branchCode || 'YM'
          };
          inventoryDbOps.saveInventoryAksesoris(invAks);
        });
      } else if (updatedTx.category !== 'Earmould' && !(updatedTx.category === 'Spare Part dan Service' && updatedTx.subtype.toLowerCase().includes('jasa'))) {
        if (updatedTx.category === 'Spare Part dan Service' && isSonicAmplifierSubtype(updatedTx.subtype)) {
          const targetSkus = getSonicAmplifierTargetSkus(updatedTx.subtype);
          let resolvedSku = targetSkus[0] || 'E2OBD';
          if (updatedTx.noSeri && inventoryABD) {
            const matchedInv = inventoryABD.find(inv => inv.noSeri === updatedTx.noSeri && (inv.branchCode || 'YM') === (txWithBranch.branchCode || 'YM'));
            if (matchedInv?.sku) {
              resolvedSku = matchedInv.sku;
            }
          }
          const invABD: ABDInventoryEntry = {
            id: `inv-abd-sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'KELUAR_TERJUAL',
            tanggal: updatedTx.tanggal,
            sumberTujuan: updatedTx.namaCustomer || 'Pasien',
            tipeABD: updatedTx.subtype,
            model: 'Amplifier Spare Part',
            sku: resolvedSku,
            noSeri: updatedTx.noSeri || `SN-SP-${Date.now()}`,
            keterangan: `Penggantian Spare Part/Amplifier (${updatedTx.subtype}) - Faktur: ${updatedTx.nomorFaktur}`,
            noInvoice: updatedTx.nomorFaktur,
            namaCustomer: updatedTx.namaCustomer,
            cabangTujuan: txWithBranch.branchCode,
            branchCode: txWithBranch.branchCode || 'YM'
          };
          inventoryDbOps.saveInventoryABD(invABD);
        } else {
          const itemSku = findAksesorisSku(updatedTx.subtype, updatedTx.category);
          const master = getAksesorisBySku(itemSku);
          const invAks: AksesorisInventoryEntry = {
            id: `inv-aks-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'KELUAR_TERJUAL',
            tanggal: updatedTx.tanggal,
            sumberTujuan: updatedTx.namaCustomer || 'Pasien',
            kategori: master?.kategori || updatedTx.category,
            tipe: master?.nama || updatedTx.subtype || '',
            sku: master?.sku || (itemSku !== '-' ? itemSku : undefined),
            qty: updatedTx.qty,
            noInvoice: updatedTx.nomorFaktur,
            namaCustomer: updatedTx.namaCustomer,
            cabangTujuan: txWithBranch.branchCode,
            branchCode: txWithBranch.branchCode || 'YM'
          };
          inventoryDbOps.saveInventoryAksesoris(invAks);
        }
      }
    }
  };

  // Jasa Periksa Handlers
  const handleAddJasa = (tx: JasaPeriksaTransaction) => {
    const txWithBranch = {
      ...tx,
      branchCode: tx.branchCode || activeWorkingBranch,
      staffUser: tx.staffUser || currentUser?.username,
    };
    dbOps.saveJasaPeriksa(txWithBranch);
  };

  const handleSaveJasa = (updatedTx: JasaPeriksaTransaction) => {
    dbOps.saveJasaPeriksa(updatedTx);
  };

  const handleDeleteJasa = (id: string) => {
    const tx = jasaPeriksa.find(x => x.id === id);
    if (tx && !checkDeletePermission(tx.branchCode)) {
      alert('Anda tidak memiliki izin untuk menghapus data dari cabang lain.');
      return;
    }
    requirePinForDeletion({
      isOpen: true,
      title: 'Hapus Transaksi Jasa Periksa',
      subtitle: 'Masukkan PIN untuk menghapus transaksi ini permanen.',
      actionText: 'Hapus Transaksi',
      onConfirm: () => dbOps.deleteJasaPeriksa(id)
    });
  };

  // ABD Handlers
  const handleAddABD = (tx: ABDTransaction) => {
    const txWithBranch = {
      ...tx,
      branchCode: tx.branchCode || activeWorkingBranch,
      staffUser: tx.staffUser || currentUser?.username,
    };
    
    dbOps.saveABD(txWithBranch);
    
    // Inventory ABD 
    const sku1 = findABDSku(tx.tipeABD, tx.modelABD);
    const invABD: ABDInventoryEntry = {
      id: `inv-abd-${Date.now()}`,
      type: 'KELUAR_TERJUAL',
      tanggal: tx.tanggal,
      sumberTujuan: '',
      tipeABD: tx.tipeABD,
      model: tx.modelABD || '',
      sku: sku1 !== '-' ? sku1 : undefined,
      noSeri: tx.nomorSeriABD,
      noInvoice: tx.nomorFakturPenjualan,
      namaCustomer: tx.namaPasien,
      cabangTujuan: txWithBranch.branchCode,
      branchCode: txWithBranch.branchCode || 'YM'
    };
    inventoryDbOps.saveInventoryABD(invABD);
    if (tx.tipeABD2 && tx.nomorSeriABD2) {
      const sku2 = findABDSku(tx.tipeABD2, tx.modelABD2);
      const invABD2: ABDInventoryEntry = {
        id: `inv-abd-${Date.now()}-2`,
        type: 'KELUAR_TERJUAL',
        tanggal: tx.tanggal,
        sumberTujuan: '',
        tipeABD: tx.tipeABD2,
        model: tx.modelABD2 || '',
        sku: sku2 !== '-' ? sku2 : undefined,
        noSeri: tx.nomorSeriABD2,
        noInvoice: tx.nomorFakturPenjualan,
        namaCustomer: tx.namaPasien,
        cabangTujuan: txWithBranch.branchCode,
        branchCode: txWithBranch.branchCode || 'YM'
      };
      inventoryDbOps.saveInventoryABD(invABD2);
    }

    // Auto deduct accessory stock included in Bundling packages
    if (tx.paketBundling) {
      const bundlingEntries = generateBundlingInventoryEntries(tx, txWithBranch.branchCode || 'YM');
      bundlingEntries.forEach(entry => {
        inventoryDbOps.saveInventoryAksesoris(entry);
      });
    }

    // Auto sync to Earmould lab tracking if earmould is selected or bundling present
    if (tx.pilihEarmould !== false) {
      const today = new Date().toISOString().split('T')[0];
      const jenisEmText = tx.jenisEarmould2 
        ? `${tx.jenisEarmould || 'S/C'} (R) & ${tx.jenisEarmould2} (L)`
        : (tx.jenisEarmould || 'S/C');

      const newEm: EarmouldReport = {
        id: `EMD-${Date.now().toString().slice(-6)}`,
        idPelanggan: tx.idPelanggan,
        namaPelanggan: tx.namaPasien,
        jenisEarmould: (tx.jenisEarmould || 'S/C') as JenisEarmould,
        qty: tx.fittingType,
        tanggalCetak: tx.tanggal || today,
        tanggalKirim: tx.tanggal || today,
        tanggalMasukLab: tx.tanggal || today,
        tanggalSelesai: '-',
        tanggalDiambil: '-',
        status: 'Di Lab',
        catatan: `Order Earmould ABD (${tx.tipeABD}) [${jenisEmText}] - Faktur: ${tx.nomorFakturPenjualan}${tx.paketBundling ? ` (${tx.paketBundling})` : ''}`,
        branchCode: activeWorkingBranch,
        staffUser: currentUser?.username,
      };
      dbOps.saveEarmould(newEm);
    }
  };

  const handleSaveABD = (updatedTx: ABDTransaction) => {
    dbOps.saveABD(updatedTx);

    // Sync inventory entries for this ABD sale
    if (updatedTx.nomorFakturPenjualan) {
      const bCode = updatedTx.branchCode || activeWorkingBranch || 'YM';

      // 1. Re-sync ABD unit inventory (serial number)
      inventoryABD
        .filter((inv) => inv.noInvoice === updatedTx.nomorFakturPenjualan)
        .forEach((inv) => inventoryDbOps.deleteInventoryABD(inv.id));

      if (updatedTx.nomorSeriABD) {
        const itemSku = findABDSku(updatedTx.tipeABD, updatedTx.modelABD);
        const invEntry: ABDInventoryEntry = {
          id: `inv-abd-${Date.now()}-1`,
          type: 'KELUAR_TERJUAL',
          tanggal: updatedTx.tanggal,
          sumberTujuan: updatedTx.namaPasien || 'Pasien',
          tipeABD: updatedTx.tipeABD,
          model: updatedTx.modelABD || '',
          sku: itemSku !== '-' ? itemSku : undefined,
          noSeri: updatedTx.nomorSeriABD,
          keterangan: `Terjual ke Pasien ${updatedTx.namaPasien || ''} (Faktur: ${updatedTx.nomorFakturPenjualan})`,
          noInvoice: updatedTx.nomorFakturPenjualan,
          namaCustomer: updatedTx.namaPasien,
          cabangTujuan: bCode,
          branchCode: bCode
        };
        inventoryDbOps.saveInventoryABD(invEntry);
      }
      if (updatedTx.tipeABD2 && updatedTx.nomorSeriABD2) {
        const itemSku = findABDSku(updatedTx.tipeABD2, updatedTx.modelABD2);
        const invEntry: ABDInventoryEntry = {
          id: `inv-abd-${Date.now()}-2`,
          type: 'KELUAR_TERJUAL',
          tanggal: updatedTx.tanggal,
          sumberTujuan: updatedTx.namaPasien || 'Pasien',
          tipeABD: updatedTx.tipeABD2,
          model: updatedTx.modelABD2 || '',
          sku: itemSku !== '-' ? itemSku : undefined,
          noSeri: updatedTx.nomorSeriABD2,
          keterangan: `Terjual ke Pasien ${updatedTx.namaPasien || ''} (Faktur: ${updatedTx.nomorFakturPenjualan})`,
          noInvoice: updatedTx.nomorFakturPenjualan,
          namaCustomer: updatedTx.namaPasien,
          cabangTujuan: bCode,
          branchCode: bCode
        };
        inventoryDbOps.saveInventoryABD(invEntry);
      }

      // 2. Re-sync bundling accessories inventory
      inventoryAksesoris
        .filter((inv) => inv.noInvoice === updatedTx.nomorFakturPenjualan || inv.keterangan?.includes(updatedTx.nomorFakturPenjualan))
        .forEach((inv) => inventoryDbOps.deleteInventoryAksesoris(inv.id));

      if (updatedTx.paketBundling) {
        const bundlingEntries = generateBundlingInventoryEntries(updatedTx, bCode);
        bundlingEntries.forEach(entry => {
          inventoryDbOps.saveInventoryAksesoris(entry);
        });
      }
    }
  };

  const handleDeleteABD = (id: string) => {
    const tx = abd.find(x => x.id === id);
    if (tx && !checkDeletePermission(tx.branchCode)) {
      alert('Anda tidak memiliki izin untuk menghapus data dari cabang lain.');
      return;
    }
    requirePinForDeletion({
      isOpen: true,
      title: 'Hapus Transaksi Penjualan ABD',
      subtitle: 'Masukkan PIN untuk menghapus transaksi ini permanen dan memulihkan stok inventori unit.',
      actionText: 'Hapus Transaksi',
      onConfirm: () => {
        dbOps.deleteABD(id);
        if (tx?.nomorFakturPenjualan) {
          inventoryABD
            .filter((inv) => inv.noInvoice === tx.nomorFakturPenjualan)
            .forEach((inv) => inventoryDbOps.deleteInventoryABD(inv.id));
          inventoryAksesoris
            .filter((inv) => inv.noInvoice === tx.nomorFakturPenjualan || inv.keterangan?.includes(tx.nomorFakturPenjualan))
            .forEach((inv) => inventoryDbOps.deleteInventoryAksesoris(inv.id));
        }
      }
    });
  };

  // Earmould Handlers
  const handleAddEarmould = (item: EarmouldReport) => {
    const itemWithBranch = {
      ...item,
      branchCode: item.branchCode || activeWorkingBranch,
      staffUser: item.staffUser || currentUser?.username,
    };
    dbOps.saveEarmould(itemWithBranch);
  };

  const handleUpdateEarmouldStatus = (id: string, newStatus: EarmouldStatus) => {
    
    const em = earmould.find(e => e.id === id);
    if (em) dbOps.saveEarmould({ ...em, status: newStatus });
  
  };

  const handleDeleteEarmould = (id: string) => {
    const tx = earmould.find(x => x.id === id);
    if (tx && !checkDeletePermission(tx.branchCode)) {
      alert('Anda tidak memiliki izin untuk menghapus data dari cabang lain.');
      return;
    }
    requirePinForDeletion({
      isOpen: true,
      title: 'Hapus Data Lab Earmould',
      subtitle: 'Masukkan PIN untuk menghapus data ini permanen.',
      actionText: 'Hapus Data',
      onConfirm: () => dbOps.deleteEarmould(id)
    });
  };

  // Reparasi Handlers
  const handleAddReparasi = (item: ReparasiService) => {
    const itemWithBranch = {
      ...item,
      branchCode: item.branchCode || activeWorkingBranch,
      staffUser: item.staffUser || currentUser?.username,
    };
    dbOps.saveReparasi(itemWithBranch);
  };

  const handleUpdateReparasiStatus = (id: string, newStatus: ReparasiStatus) => {
    
    const r = reparasi.find(rep => rep.id === id);
    if (r) dbOps.saveReparasi({ ...r, status: newStatus });
  
  };

  const handleDeleteReparasi = (id: string) => {
    const tx = reparasi.find(x => x.id === id);
    if (tx && !checkDeletePermission(tx.branchCode)) {
      alert('Anda tidak memiliki izin untuk menghapus data dari cabang lain.');
      return;
    }
    requirePinForDeletion({
      isOpen: true,
      title: 'Hapus Data Reparasi',
      subtitle: 'Masukkan PIN untuk menghapus data reparasi ini permanen.',
      actionText: 'Hapus Data',
      onConfirm: () => dbOps.deleteReparasi(id)
    });
  };

  // Kas Kecil Handlers
  const handleAddKasKecil = (entryData: Omit<KasKecilEntry, 'id' | 'saldo'>) => {
    const newEntry: KasKecilEntry = {
      ...entryData,
      id: `KAS-${Date.now().toString().slice(-6)}`,
      saldo: 0, // recalculated by component
      branchCode: entryData.branchCode || activeWorkingBranch,
      staffUser: entryData.staffUser || currentUser?.username,
    };
    dbOps.saveKasKecil(newEntry);
  };

  const handleDeleteKasKecil = (id: string) => {
    const tx = kasKecil.find(x => x.id === id);
    if (tx && !checkDeletePermission(tx.branchCode)) {
      alert('Anda tidak memiliki izin untuk menghapus data dari cabang lain.');
      return;
    }
    requirePinForDeletion({
      isOpen: true,
      title: 'Hapus Kas Kecil',
      subtitle: 'Masukkan PIN untuk menghapus entri ini permanen.',
      actionText: 'Hapus Data',
      onConfirm: () => dbOps.deleteKasKecil(id)
    });
  };

  // Print Invoice trigger
  const handleOpenPrint = (
    tx: AksesorisTransaction | JasaPeriksaTransaction | ABDTransaction,
    type: 'AKS' | 'JSA' | 'ABD'
  ) => {
    setPrintTx(tx);
    setPrintType(type);
    setPrintModalOpen(true);
  };

    // Total Omset for Header
  const totalOmset =
    visibleAksesoris.reduce((acc, curr) => acc + curr.jumlah, 0) +
    visibleJasaPeriksa.reduce((acc, curr) => acc + curr.biayaJasaPeriksa, 0) +
    visibleABD.reduce((acc, curr) => acc + curr.jumlah, 0);

  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl max-w-2xl text-center space-y-4 shadow-sm">
          <h2 className="text-xl font-bold">Koneksi Database Gagal</h2>
          <p className="font-mono text-sm bg-white p-3 rounded text-left overflow-x-auto">{error}</p>
          <div className="text-sm text-left space-y-2 mt-4 bg-white p-4 rounded border border-red-100">
            <p className="font-bold">Cara Memperbaiki:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Buka <b>Firebase Console</b> (console.firebase.google.com)</li>
              <li>Buka project <b>earsound-v1</b></li>
              <li>Di menu kiri, pilih <b>Firestore Database</b></li>
              <li>Klik tab <b>Rules (Aturan)</b></li>
              <li>Ubah aturan menjadi: <br/><code className="bg-slate-100 px-2 py-1 rounded block mt-1">allow read, write: if true;</code></li>
              <li>Klik tombol <b>Publish</b>, lalu refresh halaman ini.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A2F86]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage users={users.length > 0 ? users : DEFAULT_USERS} onLogin={handleLoginUser} />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F9FAFB] text-slate-800 font-sans w-full max-w-full overflow-x-hidden">
      {/* Sidebar Navigation (Desktop) & Top Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalOmset={totalOmset}
        totalPatients={visiblePatients.length}
        currentUser={currentUser}
        selectedBranch={selectedBranch}
        onSelectBranch={handleSelectBranch}
        onOpenLoginModal={handleLogout}
        onAddPatient={() => {
          setPatientToEdit(null);
          setIsPatientModalOpen(true);
        }}
      />

      {/* Right Column: Top Bar + Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Scrollable Main Content */}
        <main className="p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 pb-28 md:pb-10 flex-1 w-full max-w-[1780px] mx-auto space-y-4 sm:space-y-6 overflow-x-hidden min-w-0">
          {activeTab === 'pos' && (
            <POSPage
              patients={visiblePatients}
              currentUser={currentUser}
              selectedBranch={selectedBranch}
              inventoryABD={inventoryABD || []}
              inventoryAksesoris={inventoryAksesoris || []}
              onAddPatient={handleSavePatient}
              onAddAksesoris={handleAddAksesoris}
              onAddJasaPeriksa={handleAddJasa}
              onAddABD={handleAddABD}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardOverview
              setActiveTab={setActiveTab}
              patients={visiblePatients}
              aksesoris={visibleAksesoris}
              jasaPeriksa={visibleJasaPeriksa}
              abd={visibleABD}
              kasKecil={visibleKasKecil}
              earmould={visibleEarmould}
              reparasi={visibleReparasi}
              allPatients={patients || []}
              allAksesoris={aksesoris || []}
              allJasaPeriksa={jasaPeriksa || []}
              allABD={abd || []}
              allEarmould={earmould || []}
              allReparasi={reparasi || []}
              inventoryABD={inventoryABD || []}
              inventoryAksesoris={inventoryAksesoris || []}
              currentUser={currentUser}
              selectedBranch={selectedBranch}
              onAddPatient={() => {
                setPatientToEdit(null);
                setIsPatientModalOpen(true);
              }}
            />
          )}

          {activeTab === 'inventori' && (
            <InventoryPage
              abdInventory={inventoryABD || []}
              aksesorisInventory={inventoryAksesoris || []}
              selectedBranch={selectedBranch}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'pasien' && (
            <PatientList
              patients={visiblePatients}
              onAddPatient={() => {
                setPatientToEdit(null);
                setIsPatientModalOpen(true);
              }}
              onEditPatient={handleStartEditPatient}
              onDeletePatient={handleDeletePatient}
              // Pass global data so the patient history shows transactions from ALL branches
              aksesoris={aksesoris}
              jasaPeriksa={jasaPeriksa}
              abd={abd}
              earmould={earmould}
              reparasi={reparasi}
              onUpdateEarmouldStatus={handleUpdateEarmouldStatus}
              onAddEarmould={handleAddEarmould}
            />
          )}

          {activeTab === 'aksesoris' && (
            <AksesorisSection
              transactions={visibleAksesoris}
              patients={visiblePatients}
              currentUser={currentUser}
              selectedBranch={selectedBranch}
              inventoryAksesoris={inventoryAksesoris}
              onAddTransaction={handleAddAksesoris}
              onSaveTransaction={handleSaveAksesoris}
              onDeleteTransaction={handleDeleteAksesoris}
              onPrintInvoice={(tx) => handleOpenPrint(tx, 'AKS')}
            />
          )}

          {activeTab === 'jasa_periksa' && (
            <JasaPeriksaSection
              transactions={visibleJasaPeriksa}
              patients={visiblePatients}
              currentUser={currentUser}
              selectedBranch={selectedBranch}
              onAddTransaction={handleAddJasa}
              onSaveTransaction={handleSaveJasa}
              onDeleteTransaction={handleDeleteJasa}
              onPrintKwitansi={(tx) => handleOpenPrint(tx, 'JSA')}
            />
          )}

          {activeTab === 'abd' && (
            <ABDSection
              inventoryABD={inventoryABD || []}
              inventoryAksesoris={inventoryAksesoris || []}
              transactions={visibleABD}
              patients={visiblePatients}
              currentUser={currentUser}
              selectedBranch={selectedBranch}
              onAddTransaction={handleAddABD}
              onSaveTransaction={handleSaveABD}
              onDeleteTransaction={handleDeleteABD}
              onPrintInvoice={(tx) => handleOpenPrint(tx, 'ABD')}
            />
          )}

          {activeTab === 'uang_masuk' && (
            <UangMasukReport
              aksesoris={visibleAksesoris}
              jasaPeriksa={visibleJasaPeriksa}
              abd={visibleABD}
            />
          )}

          {activeTab === 'earmould' && (
            <EarmouldReportComponent
              earmouldList={visibleEarmould}
              patients={visiblePatients}
              onAddEarmould={handleAddEarmould}
              onUpdateStatus={handleUpdateEarmouldStatus}
              onDeleteEarmould={handleDeleteEarmould}
            />
          )}

          {activeTab === 'reparasi' && (
            <ReparasiReportComponent
              reparasiList={visibleReparasi}
              patients={visiblePatients}
              onAddReparasi={handleAddReparasi}
              onUpdateStatus={handleUpdateReparasiStatus}
              onDeleteReparasi={handleDeleteReparasi}
            />
          )}

          {activeTab === 'kas_kecil' && (
            <KasKecilReportComponent
              kasKecilEntries={visibleKasKecil}
              onAddEntry={handleAddKasKecil}
              onDeleteEntry={handleDeleteKasKecil}
            />
          )}

          
          {activeTab === 'crm' && (
            <GlobalPatientDirectory
              allPatients={patients}
              allJasa={jasaPeriksa}
              allABD={abd}
              allAksesoris={aksesoris}
              allEarmould={earmould}
              allReparasi={reparasi}
              currentUserBranch={currentUser?.branchCode}
              crmNotes={crmNotes}
              onAddCRMNote={dbOps.saveCRMNote}
              onDeleteCRMNote={dbOps.deleteCRMNote}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementSection
              users={users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onSwitchUserSession={handleLoginUser}
            />
          )}
        </main>

        {/* Patient Registration Modal */}
        <PatientModal
          isOpen={isPatientModalOpen}
          onClose={() => {
            setIsPatientModalOpen(false);
            setPatientToEdit(null);
          }}
          onSave={handleSavePatient}
          existingCount={patients.length}
          patientToEdit={patientToEdit}
          activeBranchCode={activeWorkingBranch}
        />

        {/* User Switch / Login Modal */}
        

        {/* Print Invoice / Kwitansi Modal */}
        <PrintInvoiceModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          transaction={printTx}
          type={printType}
          patients={patients}
        />

        <PinVerificationModal
          isOpen={pinDeletionConfig.isOpen}
          requirePin={pinDeletionConfig.requirePin}
          onClose={() => setPinDeletionConfig(prev => ({ ...prev, isOpen: false }))}
          onSuccess={() => {
            setPinDeletionConfig(prev => ({ ...prev, isOpen: false }));
            pinDeletionConfig.onConfirm();
          }}
          title={pinDeletionConfig.title}
          subtitle={pinDeletionConfig.subtitle}
          actionText={pinDeletionConfig.actionText}
          isDanger={true}
        />

        {/* Patient Edit PIN Verification Modal */}
        <PinVerificationModal
          isOpen={patientEditPinOpen}
          requirePin={true}
          onClose={() => {
            setPatientEditPinOpen(false);
            setPendingPatientToEdit(null);
          }}
          onSuccess={handlePatientPinSuccess}
          title="Verifikasi PIN Edit Pasien"
          subtitle="Masukkan PIN otorisasi untuk mengedit data profil pasien"
          actionText="Verifikasi & Edit Pasien"
        />


        {/* Sleek Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-700">
                © 2026 Pusat Alat Bantu Dengar Earsound • Sleek Management Portal
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                8 Cabang: Yamin, Betahive, Binjai, Bulan, Jambi, Pakam, Siantar, Langsa • Gudang Maindealer & Portal CEO
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

