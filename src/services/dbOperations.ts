import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Patient, AksesorisTransaction, ABDInventoryEntry, AksesorisInventoryEntry, JasaPeriksaTransaction, 
  ABDTransaction, EarmouldReport, ReparasiService, KasKecilEntry, AppUser, CRMNote 
} from '../types';

export const isJanuaryDate = (dateStr: string | undefined | null): boolean => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const s = dateStr.trim().toLowerCase();
  if (s.includes('jan') || s.includes('januari') || s.includes('january')) return true;
  if (/\b202[0-9][-/.](0?1)[-/.][0-3]?[0-9]\b/.test(s)) return true;
  if (/\b[0-3]?[0-9][-/.](0?1)[-/.](202[0-9]|[0-9]{2})\b/.test(s)) return true;
  if (/\b0?1[-/.][0-3]?[0-9][-/.](202[0-9]|[0-9]{2})\b/.test(s)) return true;
  if (s.includes('-01-') || s.endsWith('-01')) return true;
  if (s.includes('/01/') || s.startsWith('01/') || s.endsWith('/01')) return true;

  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.getMonth() === 0;
    }
  } catch (e) {}
  return false;
};

export const purgeJanuaryData = async (purgeAll: boolean = false): Promise<{
  deletedPatientsCount: number;
  deletedAksesorisCount: number;
  deletedJasaCount: number;
  deletedABDCount: number;
  deletedEarmouldCount: number;
  deletedReparasiCount: number;
  deletedKasKecilCount: number;
}> => {
  let deletedPatientsCount = 0;
  let deletedAksesorisCount = 0;
  let deletedJasaCount = 0;
  let deletedABDCount = 0;
  let deletedEarmouldCount = 0;
  let deletedReparasiCount = 0;
  let deletedKasKecilCount = 0;

  const patientIdsInJan = new Set<string>();

  const checkJan = (dStr: any) => purgeAll || isJanuaryDate(dStr);

  // 1. Purge Aksesoris
  try {
    const snap = await getDocs(collection(db, 'aksesoris'));
    for (const d of snap.docs) {
      const data = d.data();
      if (checkJan(data.tanggal)) {
        if (data.idPelanggan) patientIdsInJan.add(data.idPelanggan);
        await deleteDoc(d.ref);
        deletedAksesorisCount++;
      }
    }
  } catch (err) {
    console.error("Error purging aksesoris:", err);
  }

  // 2. Purge Jasa Periksa (both 'jasa_periksa' and 'jasaPeriksa')
  for (const colName of ['jasa_periksa', 'jasaPeriksa']) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        const data = d.data();
        if (checkJan(data.tanggal)) {
          if (data.idPelanggan) patientIdsInJan.add(data.idPelanggan);
          await deleteDoc(d.ref);
          deletedJasaCount++;
        }
      }
    } catch (err) {
      console.error(`Error purging ${colName}:`, err);
    }
  }

  // 3. Purge ABD
  try {
    const snap = await getDocs(collection(db, 'abd'));
    for (const d of snap.docs) {
      const data = d.data();
      if (checkJan(data.tanggal)) {
        if (data.idPelanggan) patientIdsInJan.add(data.idPelanggan);
        await deleteDoc(d.ref);
        deletedABDCount++;
      }
    }
  } catch (err) {
    console.error("Error purging abd:", err);
  }

  // 4. Purge Earmould
  try {
    const snap = await getDocs(collection(db, 'earmould'));
    for (const d of snap.docs) {
      const data = d.data();
      if (checkJan(data.tanggal)) {
        if (data.idPelanggan) patientIdsInJan.add(data.idPelanggan);
        await deleteDoc(d.ref);
        deletedEarmouldCount++;
      }
    }
  } catch (err) {
    console.error("Error purging earmould:", err);
  }

  // 5. Purge Reparasi
  try {
    const snap = await getDocs(collection(db, 'reparasi'));
    for (const d of snap.docs) {
      const data = d.data();
      if (checkJan(data.tanggal)) {
        if (data.idPelanggan) patientIdsInJan.add(data.idPelanggan);
        await deleteDoc(d.ref);
        deletedReparasiCount++;
      }
    }
  } catch (err) {
    console.error("Error purging reparasi:", err);
  }

  // 6. Purge Kas Kecil
  for (const colName of ['kas_kecil', 'kasKecil']) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        const data = d.data();
        if (checkJan(data.tanggal)) {
          await deleteDoc(d.ref);
          deletedKasKecilCount++;
        }
      }
    } catch (err) {
      console.error(`Error purging ${colName}:`, err);
    }
  }

  // 7. Purge Patients created in January OR referenced in January transactions OR if purgeAll
  try {
    const snap = await getDocs(collection(db, 'patients'));
    for (const d of snap.docs) {
      const data = d.data() as Patient;
      const isCreatedJan = checkJan(data.createdAt);
      const isReferencedInJan = patientIdsInJan.has(data.id);

      if (purgeAll || isCreatedJan || isReferencedInJan) {
        await deleteDoc(d.ref);
        deletedPatientsCount++;
      }
    }
  } catch (err) {
    console.error("Error purging patients:", err);
  }

  // Also purge from localStorage
  try {
    const purgeLocal = (key: string, isJanCheck: (item: any) => boolean) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        const remaining = items.filter(i => !isJanCheck(i));
        localStorage.setItem(key, JSON.stringify(remaining));
      }
    };

    purgeLocal('earsound_aksesoris_v1', item => checkJan(item.tanggal));
    purgeLocal('earsound_jasa_periksa_v1', item => checkJan(item.tanggal));
    purgeLocal('earsound_abd_v1', item => checkJan(item.tanggal));
    purgeLocal('earsound_earmould_v1', item => checkJan(item.tanggal));
    purgeLocal('earsound_reparasi_v1', item => checkJan(item.tanggal));
    purgeLocal('earsound_kas_kecil_v1', item => checkJan(item.tanggal));
    purgeLocal('earsound_patients_v1', item => purgeAll || checkJan(item.createdAt) || patientIdsInJan.has(item.id));
  } catch (e) {
    console.error("Error purging localStorage:", e);
  }

  return {
    deletedPatientsCount,
    deletedAksesorisCount,
    deletedJasaCount,
    deletedABDCount,
    deletedEarmouldCount,
    deletedReparasiCount,
    deletedKasKecilCount,
  };
};


// Helper to recursively remove undefined values which Firestore does not support
const sanitize = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
};


const withAlert = (promise: Promise<void>) => {
  return promise.catch((err) => {
    console.error("Firestore Write Error:", err);
    alert("Gagal menyimpan data ke Database Cloud: " + err.message + "\n\nPastikan koneksi internet stabil dan Firestore Rules sudah diset ke allow read, write.");
    throw err;
  });
};

export const dbOps = {
  // Users
  saveUser: (user: AppUser) => withAlert(setDoc(doc(db, 'users', user.id), sanitize(user))),
  deleteUser: (id: string) => withAlert(deleteDoc(doc(db, 'users', id))),

  // Patients
  savePatient: (patient: Patient) => withAlert(setDoc(doc(db, 'patients', patient.id), sanitize(patient))),
  deletePatient: (id: string) => withAlert(deleteDoc(doc(db, 'patients', id))),

  // Aksesoris
  saveAksesoris: (tx: AksesorisTransaction) => withAlert(setDoc(doc(db, 'aksesoris', tx.id), sanitize(tx))),
  deleteAksesoris: (id: string) => withAlert(deleteDoc(doc(db, 'aksesoris', id))),

  // Jasa Periksa
  saveJasaPeriksa: (tx: JasaPeriksaTransaction) => withAlert(setDoc(doc(db, 'jasa_periksa', tx.id), sanitize(tx))),
  deleteJasaPeriksa: (id: string) => withAlert(deleteDoc(doc(db, 'jasa_periksa', id))),

  // ABD
  saveABD: (tx: ABDTransaction) => withAlert(setDoc(doc(db, 'abd', tx.id), sanitize(tx))),
  deleteABD: (id: string) => withAlert(deleteDoc(doc(db, 'abd', id))),

  // Earmould
  saveEarmould: (em: EarmouldReport) => withAlert(setDoc(doc(db, 'earmould', em.id), sanitize(em))),
  deleteEarmould: (id: string) => withAlert(deleteDoc(doc(db, 'earmould', id))),

  // Reparasi
  saveReparasi: (rep: ReparasiService) => withAlert(setDoc(doc(db, 'reparasi', rep.id), sanitize(rep))),
  deleteReparasi: (id: string) => withAlert(deleteDoc(doc(db, 'reparasi', id))),

  // Kas Kecil
  saveKasKecil: (kas: KasKecilEntry) => withAlert(setDoc(doc(db, 'kas_kecil', kas.id), sanitize(kas))),
  deleteKasKecil: (id: string) => withAlert(deleteDoc(doc(db, 'kas_kecil', id))),

  // CRM Notes
  saveCRMNote: (note: CRMNote) => withAlert(setDoc(doc(db, 'crm_notes', note.id), sanitize(note))),
  deleteCRMNote: (id: string) => withAlert(deleteDoc(doc(db, 'crm_notes', id))),
};


export const inventoryDbOps = {
  // Inventory ABD
  saveInventoryABD: (entry: ABDInventoryEntry) => withAlert(setDoc(doc(db, 'inventoryABD', entry.id), sanitize(entry))),
  deleteInventoryABD: (id: string) => withAlert(deleteDoc(doc(db, 'inventoryABD', id))),

  // Inventory Aksesoris
  saveInventoryAksesoris: (entry: AksesorisInventoryEntry) => withAlert(setDoc(doc(db, 'inventoryAksesoris', entry.id), sanitize(entry))),
  deleteInventoryAksesoris: (id: string) => withAlert(deleteDoc(doc(db, 'inventoryAksesoris', id))),
};
