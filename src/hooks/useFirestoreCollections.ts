import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  AppUser, Patient, AksesorisTransaction, JasaPeriksaTransaction, 
  ABDTransaction, EarmouldReport, ReparasiService, KasKecilEntry,
  ABDInventoryEntry, AksesorisInventoryEntry, CRMNote
} from '../types';

export function useFirestoreCollections() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [aksesoris, setAksesoris] = useState<AksesorisTransaction[]>([]);
  const [jasaPeriksa, setJasaPeriksa] = useState<JasaPeriksaTransaction[]>([]);
  const [abd, setABD] = useState<ABDTransaction[]>([]);
  const [earmould, setEarmould] = useState<EarmouldReport[]>([]);
  const [reparasi, setReparasi] = useState<ReparasiService[]>([]);
  const [kasKecil, setKasKecil] = useState<KasKecilEntry[]>([]);
  const [inventoryABD, setInventoryABD] = useState<ABDInventoryEntry[]>([]);
  const [inventoryAksesoris, setInventoryAksesoris] = useState<AksesorisInventoryEntry[]>([]);
  const [crmNotes, setCrmNotes] = useState<CRMNote[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsubs: (() => void)[] = [];

    const unsubInvABD = onSnapshot(collection(db, 'inventoryABD'), (snap) => {
      if (isMounted) setInventoryABD(snap.docs.map(d => d.data() as ABDInventoryEntry));
    }, err => console.error("inventoryABD sync error:", err));
    unsubs.push(unsubInvABD);

    const unsubInvAks = onSnapshot(collection(db, 'inventoryAksesoris'), (snap) => {
      if (isMounted) setInventoryAksesoris(snap.docs.map(d => d.data() as AksesorisInventoryEntry));
    }, err => console.error("inventoryAksesoris sync error:", err));
    unsubs.push(unsubInvAks);

    try {
      unsubs.push(onSnapshot(collection(db, 'users'), (snap) => {
        if (isMounted) setUsers(snap.docs.map(d => d.data() as AppUser));
      }, err => console.error("users sync error:", err)));

      unsubs.push(onSnapshot(collection(db, 'patients'), (snap) => {
        if (isMounted) setPatients(snap.docs.map(d => d.data() as Patient));
      }, err => console.error("patients sync error:", err)));

      unsubs.push(onSnapshot(collection(db, 'aksesoris'), (snap) => {
        if (isMounted) setAksesoris(snap.docs.map(d => d.data() as AksesorisTransaction));
      }, err => console.error("aksesoris sync error:", err)));

      // Listen to both 'jasa_periksa' (standard) and 'jasaPeriksa' (legacy fallback)
      let primaryJasa: JasaPeriksaTransaction[] = [];
      let legacyJasa: JasaPeriksaTransaction[] = [];
      const updateJasa = () => {
        if (!isMounted) return;
        const mergedMap = new Map<string, JasaPeriksaTransaction>();
        legacyJasa.forEach(item => mergedMap.set(item.id, item));
        primaryJasa.forEach(item => mergedMap.set(item.id, item));
        setJasaPeriksa(Array.from(mergedMap.values()));
      };

      unsubs.push(onSnapshot(collection(db, 'jasa_periksa'), (snap) => {
        primaryJasa = snap.docs.map(d => d.data() as JasaPeriksaTransaction);
        updateJasa();
      }, err => console.error("jasa_periksa sync error:", err)));

      unsubs.push(onSnapshot(collection(db, 'jasaPeriksa'), (snap) => {
        legacyJasa = snap.docs.map(d => d.data() as JasaPeriksaTransaction);
        updateJasa();
      }, err => console.error("jasaPeriksa legacy sync error:", err)));

      unsubs.push(onSnapshot(collection(db, 'abd'), (snap) => {
        if (isMounted) setABD(snap.docs.map(d => d.data() as ABDTransaction));
      }, err => console.error("abd sync error:", err)));

      unsubs.push(onSnapshot(collection(db, 'earmould'), (snap) => {
        if (isMounted) setEarmould(snap.docs.map(d => d.data() as EarmouldReport));
      }, err => console.error("earmould sync error:", err)));

      unsubs.push(onSnapshot(collection(db, 'reparasi'), (snap) => {
        if (isMounted) setReparasi(snap.docs.map(d => d.data() as ReparasiService));
      }, err => console.error("reparasi sync error:", err)));

      // Listen to both 'kas_kecil' (standard) and 'kasKecil' (legacy fallback)
      let primaryKas: KasKecilEntry[] = [];
      let legacyKas: KasKecilEntry[] = [];
      const updateKas = () => {
        if (!isMounted) return;
        const mergedMap = new Map<string, KasKecilEntry>();
        legacyKas.forEach(item => mergedMap.set(item.id, item));
        primaryKas.forEach(item => mergedMap.set(item.id, item));
        setKasKecil(Array.from(mergedMap.values()));
      };

      unsubs.push(onSnapshot(collection(db, 'kas_kecil'), (snap) => {
        primaryKas = snap.docs.map(d => d.data() as KasKecilEntry);
        updateKas();
      }, err => console.error("kas_kecil sync error:", err)));

      unsubs.push(onSnapshot(collection(db, 'kasKecil'), (snap) => {
        legacyKas = snap.docs.map(d => d.data() as KasKecilEntry);
        updateKas();
      }, err => console.error("kasKecil legacy sync error:", err)));

      // Listen to 'crm_notes'
      unsubs.push(onSnapshot(collection(db, 'crm_notes'), (snap) => {
        if (isMounted) setCrmNotes(snap.docs.map(d => d.data() as CRMNote));
      }, err => console.error("crm_notes sync error:", err)));
      
      setLoading(false);
    } catch (err: any) {
      if (isMounted) {
        console.error("Firestore sync error:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  return { users, patients, aksesoris, jasaPeriksa, abd, earmould, reparasi, kasKecil, inventoryABD, inventoryAksesoris, crmNotes, loading, error };
}

