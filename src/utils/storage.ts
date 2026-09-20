import { 
  Patient, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  EarmouldReport, 
  ReparasiService, 
  KasKecilEntry,
  AppUser,
  BranchCode,
  CRMNote,
  ManualJournalEntry,
  MaindealerB2BTransaction,
  MaindealerSupplyTransaction
} from '../types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_AKSESORIS, 
  INITIAL_JASA_PERIKSA, 
  INITIAL_ABD, 
  INITIAL_EARMOULD, 
  INITIAL_REPARASI, 
  INITIAL_KAS_KECIL 
} from '../data/initialData';

const KEYS = {
  USERS: 'earsound_users_v1',
  SESSION: 'earsound_session_v1',
  SELECTED_BRANCH: 'earsound_selected_branch_v1',
  PATIENTS: 'earsound_patients_v1',
  AKSESORIS: 'earsound_aksesoris_v1',
  JASA_PERIKSA: 'earsound_jasa_periksa_v1',
  ABD: 'earsound_abd_v1',
  EARMOULD: 'earsound_earmould_v1',
  REPARASI: 'earsound_reparasi_v1',
  KAS_KECIL: 'earsound_kas_kecil_v1',
  EDIT_PIN: 'earsound_edit_pin_v1',
  CRM_NOTES: 'earsound_crm_notes_v1',
  FINANCIAL_JOURNALS: 'earsound_fin_journals_v1',
  DOCTOR_FEE_OVERRIDES: 'earsound_doc_fee_overrides_v1',
  WAKPRO_OVERRIDES: 'earsound_wakpro_overrides_v1',
  MAINDEALER_B2B: 'earsound_md_b2b_v1',
  MAINDEALER_SUPPLY: 'earsound_md_supply_v1',
};

export const DEFAULT_EDIT_PIN = '1234';

// Default Accounts for CEO, Finance, Akuntan, 3 Supervisors, Logistik, and 8 Branches
export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'USR-CEO-001',
    username: 'ceo_earsound',
    password: 'ceo123',
    fullName: 'Bpk. CEO Earsound (Kantor Pusat)',
    role: 'CEO',
    branchCode: 'HQ',
    allowedBranches: ['ALL', 'YM', 'PB', 'JB', 'BJ', 'PK', 'LS', 'ST', 'BT', 'MD'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-FIN-001',
    username: 'finance_earsound',
    password: 'finance123',
    fullName: 'Staf Finance Earsound (Kantor Pusat)',
    role: 'FINANCE',
    branchCode: 'HQ',
    allowedBranches: ['ALL', 'YM', 'PB', 'JB', 'BJ', 'PK', 'LS', 'ST', 'BT', 'MD'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-AKT-001',
    username: 'akuntan_earsound',
    password: 'akuntan123',
    fullName: 'Senior Akuntan Earsound',
    role: 'AKUNTAN',
    branchCode: 'HQ',
    allowedBranches: ['ALL', 'YM', 'PB', 'JB', 'BJ', 'PK', 'LS', 'ST', 'BT', 'MD'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-SPV-001',
    username: 'spv_diana',
    password: 'diana123',
    fullName: 'Diana (Supervisor Area 1)',
    role: 'SUPERVISOR',
    branchCode: 'YM',
    allowedBranches: ['YM', 'BT', 'ST', 'PK'], // Yamin, Betahive, Siantar, Pakam
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-SPV-002',
    username: 'spv_mutia',
    password: 'mutia123',
    fullName: 'Mutia (Supervisor Area 2)',
    role: 'SUPERVISOR',
    branchCode: 'PB',
    allowedBranches: ['PB', 'LS', 'BJ'], // Bulan, Langsa, Binjai
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-SPV-003',
    username: 'spv_agung',
    password: 'agung123',
    fullName: 'Agung (Supervisor Area 3)',
    role: 'SUPERVISOR',
    branchCode: 'JB',
    allowedBranches: ['JB'], // Jambi
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-LOG-001',
    username: 'logistik_rianti',
    password: 'rianti123',
    fullName: 'Rianti (Logistik & Gudang Pusat)',
    role: 'LOGISTIK',
    branchCode: 'MD',
    allowedBranches: ['ALL', 'YM', 'PB', 'JB', 'BJ', 'PK', 'LS', 'ST', 'BT', 'MD'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-YM-001',
    username: 'staff_yamin',
    password: 'yamin123',
    fullName: 'Staf Admin Yamin',
    role: 'STAFF',
    branchCode: 'YM',
    allowedBranches: ['YM'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-PB-001',
    username: 'staff_bulan',
    password: 'bulan123',
    fullName: 'Staf Admin Bulan',
    role: 'STAFF',
    branchCode: 'PB',
    allowedBranches: ['PB'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-JB-001',
    username: 'staff_jambi',
    password: 'jambi123',
    fullName: 'Staf Admin Jambi',
    role: 'STAFF',
    branchCode: 'JB',
    allowedBranches: ['JB'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-BJ-001',
    username: 'staff_binjai',
    password: 'binjai123',
    fullName: 'Staf Admin Binjai',
    role: 'STAFF',
    branchCode: 'BJ',
    allowedBranches: ['BJ'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-PK-001',
    username: 'staff_pakam',
    password: 'pakam123',
    fullName: 'Staf Admin Pakam',
    role: 'STAFF',
    branchCode: 'PK',
    allowedBranches: ['PK'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-LS-001',
    username: 'staff_langsa',
    password: 'langsa123',
    fullName: 'Staf Admin Langsa',
    role: 'STAFF',
    branchCode: 'LS',
    allowedBranches: ['LS'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-ST-001',
    username: 'staff_siantar',
    password: 'siantar123',
    fullName: 'Staf Admin Siantar',
    role: 'STAFF',
    branchCode: 'ST',
    allowedBranches: ['ST'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-BT-001',
    username: 'staff_betahive',
    password: 'betahive123',
    fullName: 'Staf Admin Betahive',
    role: 'STAFF',
    branchCode: 'BT',
    allowedBranches: ['BT'],
    isActive: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'USR-MD-001',
    username: 'gudang_maindealer',
    password: 'maindealer123',
    fullName: 'Staf Gudang Maindealer',
    role: 'STAFF',
    branchCode: 'MD',
    allowedBranches: ['MD'],
    isActive: true,
    createdAt: '2026-01-01',
  },
];

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') return defaultValue;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return defaultValue;
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
}

function getFromSessionStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = sessionStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') return defaultValue;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return defaultValue;
    return parsed;
  } catch (e) {
    console.error(`Error reading ${key} from sessionStorage`, e);
    return defaultValue;
  }
}

function setToSessionStorage<T>(key: string, value: T | null): void {
  try {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error(`Error saving ${key} to sessionStorage`, e);
  }
}

// App Users
export const getUsers = (): AppUser[] => {
  const stored = getFromStorage<AppUser[]>(KEYS.USERS, DEFAULT_USERS);
  if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_USERS;
  
  // Ensure any newly configured default user (e.g. gudang_maindealer) is merged
  const existingUsernames = new Set(stored.map(u => u.username));
  let modified = false;
  const merged = [...stored];
  DEFAULT_USERS.forEach(defUser => {
    if (!existingUsernames.has(defUser.username)) {
      merged.push(defUser);
      modified = true;
    }
  });
  if (modified) {
    setToStorage(KEYS.USERS, merged);
  }
  return merged;
};
export const saveUsers = (data: AppUser[]) => setToStorage(KEYS.USERS, data);

// Active Session (Per-session storage: cleared automatically when browser window/tab/app is closed)
export const getActiveUserSession = (): AppUser | null => {
  // Clear any legacy persistent session stored in localStorage
  try {
    localStorage.removeItem(KEYS.SESSION);
  } catch (e) {}

  return getFromSessionStorage<AppUser | null>(KEYS.SESSION, null);
};

export const saveActiveUserSession = (user: AppUser | null) => {
  try {
    localStorage.removeItem(KEYS.SESSION);
  } catch (e) {}

  if (user) {
    setToSessionStorage(KEYS.SESSION, user);
  } else {
    sessionStorage.removeItem(KEYS.SESSION);
  }
};

// Selected Branch Scope (for CEO filter)
export const getSelectedBranchCode = (): BranchCode => getFromStorage(KEYS.SELECTED_BRANCH, 'ALL');
export const saveSelectedBranchCode = (code: BranchCode) => setToStorage(KEYS.SELECTED_BRANCH, code);

// Patients
export const getPatients = (): Patient[] => getFromStorage(KEYS.PATIENTS, INITIAL_PATIENTS);
export const savePatients = (data: Patient[]) => setToStorage(KEYS.PATIENTS, data);

// Aksesoris
export const getAksesoris = (): AksesorisTransaction[] => getFromStorage(KEYS.AKSESORIS, INITIAL_AKSESORIS);
export const saveAksesoris = (data: AksesorisTransaction[]) => setToStorage(KEYS.AKSESORIS, data);

// Jasa Periksa
export const getJasaPeriksa = (): JasaPeriksaTransaction[] => getFromStorage(KEYS.JASA_PERIKSA, INITIAL_JASA_PERIKSA);
export const saveJasaPeriksa = (data: JasaPeriksaTransaction[]) => setToStorage(KEYS.JASA_PERIKSA, data);

// ABD
export const getABD = (): ABDTransaction[] => getFromStorage(KEYS.ABD, INITIAL_ABD);
export const saveABD = (data: ABDTransaction[]) => setToStorage(KEYS.ABD, data);

// Earmould
export const getEarmould = (): EarmouldReport[] => getFromStorage(KEYS.EARMOULD, INITIAL_EARMOULD);
export const saveEarmould = (data: EarmouldReport[]) => setToStorage(KEYS.EARMOULD, data);

// Reparasi
export const getReparasi = (): ReparasiService[] => getFromStorage(KEYS.REPARASI, INITIAL_REPARASI);
export const saveReparasi = (data: ReparasiService[]) => setToStorage(KEYS.REPARASI, data);

// Kas Kecil
export const getKasKecil = (): KasKecilEntry[] => getFromStorage(KEYS.KAS_KECIL, INITIAL_KAS_KECIL);
export const saveKasKecil = (data: KasKecilEntry[]) => setToStorage(KEYS.KAS_KECIL, data);

// Edit Transaction PIN
export const getEditTransactionPin = (): string => getFromStorage(KEYS.EDIT_PIN, DEFAULT_EDIT_PIN);
export const saveEditTransactionPin = (pin: string) => setToStorage(KEYS.EDIT_PIN, pin);

// CRM Follow-up Notes
export const getCRMNotes = (): CRMNote[] => getFromStorage(KEYS.CRM_NOTES, []);
export const saveCRMNotes = (data: CRMNote[]) => setToStorage(KEYS.CRM_NOTES, data);

// Permission & Branch Helpers
export const canManageInventory = (user?: AppUser | null): boolean => {
  if (!user) return false;
  return user.role === 'CEO' || user.role === 'LOGISTIK';
};

export const canAccessFinancialStatement = (user?: AppUser | null): boolean => {
  if (!user) return false;
  return user.role === 'CEO' || user.role === 'FINANCE' || user.role === 'AKUNTAN';
};

export const canManageFinancialBooks = (user?: AppUser | null): boolean => {
  if (!user) return false;
  return user.role === 'FINANCE' || user.role === 'AKUNTAN';
};

export const getAllowedBranchesForUser = (user?: AppUser | null): BranchCode[] => {
  if (!user) return ['YM'];
  if (user.role === 'CEO' || user.role === 'LOGISTIK' || user.role === 'FINANCE' || user.role === 'AKUNTAN') {
    return ['ALL', 'YM', 'PB', 'JB', 'BJ', 'PK', 'LS', 'ST', 'BT', 'MD'];
  }
  if (user.role === 'SUPERVISOR') {
    return user.allowedBranches && user.allowedBranches.length > 0 
      ? user.allowedBranches 
      : [user.branchCode || 'YM'];
  }
  return [user.branchCode || 'YM'];
};

// Financial Statements Storage Helpers
export const getFinancialJournals = (): ManualJournalEntry[] => getFromStorage(KEYS.FINANCIAL_JOURNALS, []);
export const saveFinancialJournals = (data: ManualJournalEntry[]) => setToStorage(KEYS.FINANCIAL_JOURNALS, data);

export const getDoctorFeeOverrides = (): Record<string, { percentageOption?: 10 | 15; status?: 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR'; tanggalDibayar?: string; noBukti?: string; metodePembayaran?: any }> => 
  getFromStorage(KEYS.DOCTOR_FEE_OVERRIDES, {});
export const saveDoctorFeeOverrides = (data: Record<string, any>) => setToStorage(KEYS.DOCTOR_FEE_OVERRIDES, data);

export const getMaindealerB2B = (): MaindealerB2BTransaction[] => getFromStorage(KEYS.MAINDEALER_B2B, []);
export const saveMaindealerB2B = (data: MaindealerB2BTransaction[]) => setToStorage(KEYS.MAINDEALER_B2B, data);

export const getMaindealerSupply = (): MaindealerSupplyTransaction[] => getFromStorage(KEYS.MAINDEALER_SUPPLY, []);
export const saveMaindealerSupply = (data: MaindealerSupplyTransaction[]) => setToStorage(KEYS.MAINDEALER_SUPPLY, data);

// Reset storage to default
export const resetAllStorage = () => {
  localStorage.removeItem(KEYS.USERS);
  localStorage.removeItem(KEYS.SESSION);
  sessionStorage.removeItem(KEYS.SESSION);
  localStorage.removeItem(KEYS.SELECTED_BRANCH);
  localStorage.removeItem(KEYS.PATIENTS);
  localStorage.removeItem(KEYS.AKSESORIS);
  localStorage.removeItem(KEYS.JASA_PERIKSA);
  localStorage.removeItem(KEYS.ABD);
  localStorage.removeItem(KEYS.EARMOULD);
  localStorage.removeItem(KEYS.REPARASI);
  localStorage.removeItem(KEYS.KAS_KECIL);
  localStorage.removeItem(KEYS.CRM_NOTES);
};

