import { BranchCode } from '../types';

export const MONTH_NAMES_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// Target Bulanan 2026 per Cabang (dalam Rupiah)
// Key: Month Index (0 = Januari, ..., 11 = Desember)
export const TARGETS_2026_BY_MONTH: Record<number, Record<string, number>> = {
  0: { // JANUARI
    YM: 194979825,
    BT: 23340000,
    PB: 28468000,
    BJ: 10000000,
    PK: 17550000,
    LS: 17559394,
    JB: 66900000,
    ST: 17559394,
  },
  1: { // FEBRUARI
    YM: 181380860,
    BT: 28287500,
    PB: 49840000,
    BJ: 17430000,
    PK: 15720000,
    LS: 19182703,
    JB: 89544000,
    ST: 19182703,
  },
  2: { // MARET
    YM: 184116540,
    BT: 29895950,
    PB: 27037700,
    BJ: 22974000,
    PK: 23175600,
    LS: 21100000,
    JB: 71737500,
    ST: 21100000,
  },
  3: { // APRIL
    YM: 235122250,
    BT: 66197420,
    PB: 28088100,
    BJ: 18450000,
    PK: 25603500,
    LS: 17043946,
    JB: 88352000,
    ST: 17043946,
  },
  4: { // MEI
    YM: 245400750,
    BT: 43823900,
    PB: 40046500,
    BJ: 18233245,
    PK: 16099400,
    LS: 16329371,
    JB: 52585000,
    ST: 16329371,
  },
  5: { // JUNI
    YM: 213053100,
    BT: 28356000,
    PB: 44500600,
    BJ: 28325400,
    PK: 14918858,
    LS: 22001081,
    JB: 57421000,
    ST: 22001081,
  },
  6: { // JULI
    YM: 194724000,
    BT: 38733500,
    PB: 22209000,
    BJ: 29284950,
    PK: 27502300,
    LS: 21935167,
    JB: 96140000,
    ST: 21935167,
  },
  7: { // AGUSTUS
    YM: 202693700,
    BT: 26257132,
    PB: 19640500,
    BJ: 18570000,
    PK: 19845000,
    LS: 24838339,
    JB: 91520000,
    ST: 24838339,
  },
  8: { // SEPTEMBER
    YM: 216720375,
    BT: 31456200,
    PB: 38491100,
    BJ: 15876000,
    PK: 22275000,
    LS: 37800000,
    JB: 95590000,
    ST: 25000000,
  },
  9: { // OKTOBER
    YM: 220487300,
    BT: 35277000,
    PB: 19624300,
    BJ: 24286500,
    PK: 24000000,
    LS: 17823772,
    JB: 88352000,
    ST: 21043162,
  },
  10: { // NOVEMBER
    YM: 182460000,
    BT: 42601800,
    PB: 40885117,
    BJ: 28119000,
    PK: 13920000,
    LS: 10000000,
    JB: 85590060,
    ST: 19577312,
  },
  11: { // DESEMBER
    YM: 228862150,
    BT: 55773600,
    PB: 26169100,
    BJ: 18451800,
    PK: 29391000,
    LS: 24386256,
    JB: 81268000,
    ST: 24386256,
  },
};

/**
 * Mendapatkan target omset bulanan untuk cabang tertentu pada bulan tertentu
 */
export function getBranchMonthlyTarget2026(branchCode: string, monthIndex: number): number {
  if (branchCode === 'ALL' || branchCode === 'HQ') {
    const monthData = TARGETS_2026_BY_MONTH[monthIndex] || {};
    return Object.values(monthData).reduce((sum, val) => sum + val, 0);
  }
  return TARGETS_2026_BY_MONTH[monthIndex]?.[branchCode] || 0;
}

/**
 * Mendapatkan total target setahun (2026) untuk cabang tertentu
 */
export function getBranchYearlyTarget2026(branchCode: string): number {
  let total = 0;
  for (let m = 0; m < 12; m++) {
    total += getBranchMonthlyTarget2026(branchCode, m);
  }
  return total;
}

/**
 * Mendapatkan total target seluruh cabang pada bulan tertentu
 */
export function getTotalMonthlyTarget2026(monthIndex: number): number {
  const monthData = TARGETS_2026_BY_MONTH[monthIndex] || {};
  return Object.values(monthData).reduce((sum, val) => sum + val, 0);
}
