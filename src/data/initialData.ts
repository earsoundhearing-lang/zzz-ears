import { 
  Patient, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  EarmouldReport, 
  ReparasiService, 
  KasKecilEntry 
} from '../types';
import { calculateAge } from '../utils/formatters';

export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_AKSESORIS: AksesorisTransaction[] = [];
export const INITIAL_JASA_PERIKSA: JasaPeriksaTransaction[] = [];
export const INITIAL_ABD: ABDTransaction[] = [];
export const INITIAL_EARMOULD: EarmouldReport[] = [];
export const INITIAL_REPARASI: ReparasiService[] = [];
export const INITIAL_KAS_KECIL: KasKecilEntry[] = [];
