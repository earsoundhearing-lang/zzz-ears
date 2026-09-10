import { BranchCode } from '../types';

export interface BranchInfo {
  code: BranchCode; // YM, PB, JB, BJ, PK, LS, ST, BT, HQ, MD
  name: string; // e.g. "Earsound Yamin"
  city: string;
  address: string;
  phone: string;
}

export const BRANCHES: BranchInfo[] = [
  {
    code: 'YM',
    name: 'Earsound Yamin',
    city: 'Medan',
    address: 'Jl. Prof. HM. Yamin No. 75 (Dekat Masjid Perjuangan 45), Medan',
    phone: '0812-6004-3332',
  },
  {
    code: 'PB',
    name: 'Earsound Bulan',
    city: 'Medan',
    address: 'Jl. Djamin Ginting No. 244 (Depan Pajak Sore), Padang Bulan, Medan',
    phone: '0851-9452-6305',
  },
  {
    code: 'JB',
    name: 'Earsound Jambi',
    city: 'Jambi',
    address: 'Jl. Sultan Agung Beringin, Simpang Murni, Kec. Pasar Jambi, Kota Jambi',
    phone: '0811-7405-413',
  },
  {
    code: 'BJ',
    name: 'Earsound Binjai',
    city: 'Binjai',
    address: 'Jl. Tamtama No. 10, Satria, Kec. Binjai Kota, Kota Binjai',
    phone: '0851-9452-6304',
  },
  {
    code: 'PK',
    name: 'Earsound Pakam',
    city: 'Lubuk Pakam',
    address: 'Jl. Sudirman No. 90 A, Lubuk Pakam, Deli Serdang',
    phone: '0851-9452-6307',
  },
  {
    code: 'LS',
    name: 'Earsound Langsa',
    city: 'Langsa',
    address: 'Jl. Teuku Cik Ditiro No. 13, Paya Bujok Tunong, Kec. Langsa Baro, Kota Langsa, Aceh',
    phone: '0812-7483-1066',
  },
  {
    code: 'ST',
    name: 'Earsound Siantar',
    city: 'Pematang Siantar',
    address: 'Jl. Sisingamangaraja, Bukit Sofa, Kec. Siantar Sitalasari, Kota Pematang Siantar, Sumatera Utara',
    phone: '0813-7672-3854',
  },
  {
    code: 'BT',
    name: 'Earsound Betahive',
    city: 'Medan',
    address: 'Jl. Abdullah Lubis No. 75 / 48 (Gedung Betahive), Kec. Medan Baru, Medan',
    phone: '0851-9452-6305',
  },
  {
    code: 'MD',
    name: 'Gudang Maindealer',
    city: 'Medan (Pusat Suplai)',
    address: 'Gudang Logistik & Maindealer Pusat Earsound Indonesia',
    phone: '0812-6004-3332',
  },
];

export const HQ_BRANCH: BranchInfo = {
  code: 'HQ',
  name: 'Earsound Kantor Pusat (CEO)',
  city: 'Medan (Pusat)',
  address: 'Headquarters Earsound Indonesia, Medan',
  phone: '0812-6004-3332',
};

export function getBranchByCode(code: string): BranchInfo {
  if (code === 'HQ' || code === 'ALL') return HQ_BRANCH;
  return BRANCHES.find((b) => b.code === code) || {
    code: (code as BranchCode) || 'YM',
    name: `Earsound ${code}`,
    city: 'Indonesia',
    address: 'Cabang Earsound',
    phone: '0812-6004-3332',
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
