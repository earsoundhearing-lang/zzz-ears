import { BranchCode, BsiAccount } from '../types';

export interface BranchInfo {
  code: BranchCode; // YM, PB, JB, BJ, PK, LS, ST, BT, HQ, MD
  name: string; // e.g. "Earsound Yamin"
  city: string;
  address: string;
  phone: string;
  bsiAccount: BsiAccount;
  bsiAccountNumber: string;
}

export interface BranchBsiInfo {
  account: BsiAccount;
  accountNumber: string;
  branchName: string;
  branchCode: BranchCode;
  label: string;
}

/**
 * 1 Nomor Rekening Bank BSI Resmi Khusus untuk Masing-Masing Cabang
 */
export const BRANCH_BSI_ACCOUNTS: Record<string, BranchBsiInfo> = {
  PK: {
    account: 'BSI 7368736893',
    accountNumber: '7368736893',
    branchName: 'PAKAM',
    branchCode: 'PK',
    label: 'BSI 7368736893 - PAKAM (PK)',
  },
  BJ: {
    account: 'BSI 7368737822',
    accountNumber: '7368737822',
    branchName: 'BINJAI',
    branchCode: 'BJ',
    label: 'BSI 7368737822 - BINJAI (BJ)',
  },
  YM: {
    account: 'BSI 7320688177',
    accountNumber: '7320688177',
    branchName: 'YAMIN',
    branchCode: 'YM',
    label: 'BSI 7320688177 - YAMIN (YM)',
  },
  LS: {
    account: 'BSI 7348014514',
    accountNumber: '7348014514',
    branchName: 'LANGSA',
    branchCode: 'LS',
    label: 'BSI 7348014514 - LANGSA (LS)',
  },
  BT: {
    account: 'BSI 8171219847',
    accountNumber: '8171219847',
    branchName: 'BETAHIVE',
    branchCode: 'BT',
    label: 'BSI 8171219847 - BETAHIVE (BT)',
  },
  ST: {
    account: 'BSI 8888977822',
    accountNumber: '8888977822',
    branchName: 'SIANTAR',
    branchCode: 'ST',
    label: 'BSI 8888977822 - SIANTAR (ST)',
  },
  PB: {
    account: 'BSI 9009343910',
    accountNumber: '9009343910',
    branchName: 'BULAN',
    branchCode: 'PB',
    label: 'BSI 9009343910 - BULAN (PB)',
  },
  JB: {
    account: 'BSI 1200819865',
    accountNumber: '1200819865',
    branchName: 'JAMBI',
    branchCode: 'JB',
    label: 'BSI 1200819865 - JAMBI (JB)',
  },
};

export const ALL_BSI_ACCOUNTS_ORDERED: BranchBsiInfo[] = [
  BRANCH_BSI_ACCOUNTS.PK,
  BRANCH_BSI_ACCOUNTS.BJ,
  BRANCH_BSI_ACCOUNTS.YM,
  BRANCH_BSI_ACCOUNTS.LS,
  BRANCH_BSI_ACCOUNTS.BT,
  BRANCH_BSI_ACCOUNTS.ST,
  BRANCH_BSI_ACCOUNTS.PB,
  BRANCH_BSI_ACCOUNTS.JB,
];

/**
 * Mengambil default rekening BSI berdasarkan cabang aktif
 */
export function getDefaultBsiAccount(branchCode?: string | null): BsiAccount {
  if (!branchCode || branchCode === 'ALL' || branchCode === 'HQ' || branchCode === 'MD') {
    return 'BSI 7320688177'; // YAMIN / Pusat default
  }
  const cleanCode = branchCode.toUpperCase().trim();
  if (BRANCH_BSI_ACCOUNTS[cleanCode]) {
    return BRANCH_BSI_ACCOUNTS[cleanCode].account;
  }
  return 'BSI 7320688177';
}

/**
 * Mengambil rincian info rekening BSI berdasarkan string rekening atau nomor
 */
export function getBsiAccountDetails(accountStr: string): BranchBsiInfo | undefined {
  if (!accountStr) return undefined;
  return ALL_BSI_ACCOUNTS_ORDERED.find(
    (b) => b.account === accountStr || b.accountNumber === accountStr || accountStr.includes(b.accountNumber)
  );
}

export const BRANCHES: BranchInfo[] = [
  {
    code: 'YM',
    name: 'Earsound Yamin',
    city: 'Medan',
    address: 'Jl. Prof. HM. Yamin No. 75 (Dekat Masjid Perjuangan 45), Medan',
    phone: '0812-6004-3332',
    bsiAccount: 'BSI 7320688177',
    bsiAccountNumber: '7320688177',
  },
  {
    code: 'PB',
    name: 'Earsound Bulan',
    city: 'Medan',
    address: 'Jl. Djamin Ginting No. 244 (Depan Pajak Sore), Padang Bulan, Medan',
    phone: '0851-9452-6305',
    bsiAccount: 'BSI 9009343910',
    bsiAccountNumber: '9009343910',
  },
  {
    code: 'JB',
    name: 'Earsound Jambi',
    city: 'Jambi',
    address: 'Jl. Sultan Agung Beringin, Simpang Murni, Kec. Pasar Jambi, Kota Jambi',
    phone: '0811-7405-413',
    bsiAccount: 'BSI 1200819865',
    bsiAccountNumber: '1200819865',
  },
  {
    code: 'BJ',
    name: 'Earsound Binjai',
    city: 'Binjai',
    address: 'Jl. Tamtama No. 10, Satria, Kec. Binjai Kota, Kota Binjai',
    phone: '0851-9452-6304',
    bsiAccount: 'BSI 7368737822',
    bsiAccountNumber: '7368737822',
  },
  {
    code: 'PK',
    name: 'Earsound Pakam',
    city: 'Lubuk Pakam',
    address: 'Jl. Sudirman No. 90 A, Lubuk Pakam, Deli Serdang',
    phone: '0851-9452-6307',
    bsiAccount: 'BSI 7368736893',
    bsiAccountNumber: '7368736893',
  },
  {
    code: 'LS',
    name: 'Earsound Langsa',
    city: 'Langsa',
    address: 'Jl. Teuku Cik Ditiro No. 13, Paya Bujok Tunong, Kec. Langsa Baro, Kota Langsa, Aceh',
    phone: '0812-7483-1066',
    bsiAccount: 'BSI 7348014514',
    bsiAccountNumber: '7348014514',
  },
  {
    code: 'ST',
    name: 'Earsound Siantar',
    city: 'Pematang Siantar',
    address: 'Jl. Sisingamangaraja, Bukit Sofa, Kec. Siantar Sitalasari, Kota Pematang Siantar, Sumatera Utara',
    phone: '0813-7672-3854',
    bsiAccount: 'BSI 8888977822',
    bsiAccountNumber: '8888977822',
  },
  {
    code: 'BT',
    name: 'Earsound Betahive',
    city: 'Medan',
    address: 'Jl. Abdullah Lubis No. 75 / 48 (Gedung Betahive), Kec. Medan Baru, Medan',
    phone: '0851-9452-6305',
    bsiAccount: 'BSI 8171219847',
    bsiAccountNumber: '8171219847',
  },
  {
    code: 'MD',
    name: 'Gudang Maindealer',
    city: 'Medan (Pusat Suplai)',
    address: 'Gudang Logistik & Maindealer Pusat Earsound Indonesia',
    phone: '0812-6004-3332',
    bsiAccount: 'BSI 7320688177',
    bsiAccountNumber: '7320688177',
  },
];

export const HQ_BRANCH: BranchInfo = {
  code: 'HQ',
  name: 'Earsound Kantor Pusat (CEO)',
  city: 'Medan (Pusat)',
  address: 'Headquarters Earsound Indonesia, Medan',
  phone: '0812-6004-3332',
  bsiAccount: 'BSI 7320688177',
  bsiAccountNumber: '7320688177',
};

export function getBranchByCode(code: string): BranchInfo {
  if (code === 'HQ' || code === 'ALL') return HQ_BRANCH;
  return BRANCHES.find((b) => b.code === code) || {
    code: (code as BranchCode) || 'YM',
    name: `Earsound ${code}`,
    city: 'Indonesia',
    address: 'Cabang Earsound',
    phone: '0812-6004-3332',
    bsiAccount: getDefaultBsiAccount(code),
    bsiAccountNumber: '7320688177',
  };
}

/**
 * Format helper for Kwitansi Jasa Periksa
 * Format: KWT-{KodeCabang}-{00xxxx} e.g. KWT-YM-000001
 */
export function generateKwitansiNumber(branchCode: string, sequenceNumber: number): string {
  const bCode = branchCode === 'ALL' || !branchCode ? 'YM' : branchCode;
  const seqStr = String(sequenceNumber + 1).padStart(6, '0');
  return `KWT-${bCode}-${seqStr}`;
}

/**
 * Format helper for Invoice Aksesoris & ABD
 * Format: INV-{KodeCabang}-{00xxxx} e.g. INV-YM-000001
 */
export function generateBranchInvoiceNumber(branchCode: string, sequenceNumber: number): string {
  const bCode = branchCode === 'ALL' || !branchCode ? 'YM' : branchCode;
  const seqStr = String(sequenceNumber + 1).padStart(6, '0');
  return `INV-${bCode}-${seqStr}`;
}
