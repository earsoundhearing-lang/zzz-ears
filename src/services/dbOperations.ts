import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Patient, AksesorisTransaction, ABDInventoryEntry, AksesorisInventoryEntry, JasaPeriksaTransaction, 
  ABDTransaction, EarmouldReport, ReparasiService, KasKecilEntry, AppUser, CRMNote 
} from '../types';


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
