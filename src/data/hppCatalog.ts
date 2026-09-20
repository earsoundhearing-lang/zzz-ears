/**
 * Master HPP (Harga Pokok Penjualan) Catalog for Earsound Hearing Care & Maindealer
 * Directly aligned with Official HPP Tables for Alat Bantu Dengar (60 SKU) & Aksesoris (41 SKU)
 */

export interface HppCatalogItem {
  sku: string;
  nama: string;
  kategori: string;
  hpp: number;
  coaCode: string; // 501 (ABD) or 502 (Aksesoris)
  coaName: string;
  persediaanCode: string; // 103 (ABD) or 104 (Aksesoris)
  persediaanName: string;
  type: 'ABD' | 'AKSESORIS';
}

// 1. MASTER HPP ALAT BANTU DENGAR (60 SKU)
export const MASTER_HPP_ABD: Record<string, { nama: string; hpp: number }> = {
  ENS10: { nama: 'Enchant SE 10', hpp: 2000000 },
  ENS1R: { nama: 'ENCHANT 10', hpp: 2500000 },
  ENS20: { nama: 'Enchant SE 20', hpp: 2500000 },
  Z1A20: { nama: 'Z1 20', hpp: 3350000 },
  Z1A2R: { nama: 'Z1 20 (R)', hpp: 4200000 },
  Z1A10: { nama: 'Z1 10', hpp: 3000000 },
  Z1A1R: { nama: 'Z1 10 (R)', hpp: 3850000 },
  TR4SP: { nama: 'Trek 40 SP', hpp: 3300000 },
  TR4UP: { nama: 'Trek 40 UP', hpp: 3600000 },
  TR8SP: { nama: 'Trek 80 SP', hpp: 5000000 },
  TR8UP: { nama: 'Trek 80 UP', hpp: 6000000 },
  CAP20: { nama: 'Captivate 20', hpp: 3000000 },
  CAP2T: { nama: 'Captivate 20', hpp: 3500000 },
  CAP2R: { nama: 'Captivate 20 (R)', hpp: 3750000 },
  CAP40: { nama: 'Captivate 40', hpp: 3600000 },
  CAP4R: { nama: 'Captivate 40 (R)', hpp: 4400000 },
  CAP60: { nama: 'Captivate 60', hpp: 5000000 },
  CAP6R: { nama: 'Captivate 60 (R)', hpp: 5800000 },
  CAP80: { nama: 'Captivate 80', hpp: 7800000 },
  CAP8R: { nama: 'Captivate 80 (R)', hpp: 9000000 },
  CAP1H: { nama: 'Captivate 100', hpp: 10000000 },
  CAPHR: { nama: 'Captivate 100 (R)', hpp: 10000000 },
  RA2BT: { nama: 'Radiant 20', hpp: 3300000 },
  RA2RT: { nama: 'Radiant 20', hpp: 3800000 },
  RA2BR: { nama: 'Radiant 20 (R)', hpp: 4200000 },
  RA4BT: { nama: 'Radiant 40', hpp: 4200000 },
  RA4RT: { nama: 'Radiant 40', hpp: 4200000 },
  RA4RR: { nama: 'Radiant 40 (R)', hpp: 5500000 },
  RA6BT: { nama: 'Radiant 60', hpp: 7500000 },
  RA6RT: { nama: 'Radiant 60', hpp: 8000000 },
  RA6BR: { nama: 'Radiant 60 (R)', hpp: 8500000 },
  RA8BT: { nama: 'Radiant 80', hpp: 9000000 },
  RA8BR: { nama: 'Radiant 80 (R)', hpp: 10000000 },
  RA1BT: { nama: 'Radiant 100', hpp: 10000000 },
  RA1RR: { nama: 'Radiant 100 (R)', hpp: 12000000 },
  RSE60: { nama: 'Radiant SE 60', hpp: 8500000 },
  RSE6R: { nama: 'Radiant SE 60 (R)', hpp: 10000000 },
  RSE80: { nama: 'Radiant SE 80', hpp: 10000000 },
  RSE8R: { nama: 'Radiant SE 80 (R)', hpp: 11000000 },
  RSE1H: { nama: 'Radiant SE 100', hpp: 11000000 },
  RSEHR: { nama: 'Radiant SE 100 (R)', hpp: 12000000 },
  A1A40: { nama: 'A1 40', hpp: 6000000 },
  A1A4R: { nama: 'A1 40 (R)', hpp: 7000000 },
  A1A60: { nama: 'A1 60', hpp: 7500000 },
  A1A6R: { nama: 'A1 60 (R)', hpp: 7500000 },
  A1A8R: { nama: 'A1 80 (R)', hpp: 12000000 },
  A1AHR: { nama: 'A1 100 (R)', hpp: 14000000 },
  FUNSP: { nama: 'FUN SP', hpp: 1500000 },
  FASTP: { nama: 'FAST P', hpp: 1200000 },
  VOLHP: { nama: 'VOLTA HPT', hpp: 1500000 },
  VOLPB: { nama: 'VOLTA PB', hpp: 1200000 },
  DRM60: { nama: 'Dream 600', hpp: 600000 },
  DRM50: { nama: 'Dream 500', hpp: 500000 },
  DEMFX: { nama: 'Demoflex', hpp: 2500000 },
  TK4SD: { nama: 'Trek 40 SP DEMO', hpp: 2000000 },
  TK8UD: { nama: 'Trek 80 UP DEMO', hpp: 2000000 },
  TK4UD: { nama: 'Trek 40 UP DEMO', hpp: 2000000 },
  E2OBD: { nama: 'Enchant SE 20 BTE DEMO', hpp: 2000000 },
  HP3G4: { nama: 'AS HP3 G4', hpp: 3500000 },
  RA1RD: { nama: 'Radiant 100 MNR TR DEMO', hpp: 2500000 },
};

// 2. MASTER HPP AKSESORIS (41 SKU)
export const MASTER_HPP_AKSESORIS: Record<string, { nama: string; kategori: string; hpp: number }> = {
  DRY01: { nama: 'Drying Jar – Standard', kategori: 'Aksesoris ABD', hpp: 50000 },
  DRY10: { nama: 'Drying Jar – Electric 1.0', kategori: 'Aksesoris ABD', hpp: 100000 },
  DRY20: { nama: 'Drying Jar – Electric 2.0', kategori: 'Aksesoris ABD', hpp: 200000 },
  WAX01: { nama: 'Wax Guard', kategori: 'Aksesoris ABD', hpp: 40000 },
  EHK01: { nama: 'Earhook', kategori: 'Aksesoris ABD', hpp: 20000 },
  BLW01: { nama: 'Blower', kategori: 'Aksesoris ABD', hpp: 20000 },
  POU01: { nama: 'Earsound Pouch', kategori: 'Aksesoris ABD', hpp: 35000 },
  RET01: { nama: 'HA Retainer / Gantungan ABD', kategori: 'Aksesoris ABD', hpp: 40000 },
  FLT01: { nama: 'Filter', kategori: 'Aksesoris ABD', hpp: 20000 },
  BATCK: { nama: 'Baterai Checker', kategori: 'Aksesoris ABD', hpp: 40000 },

  A1TRV: { nama: 'Charger A1 Travel', kategori: 'Charger ABD', hpp: 3250000 },
  RDTRV: { nama: 'Charger RADIANT Travel', kategori: 'Charger ABD', hpp: 2750000 },
  A1DSK: { nama: 'Charger A1 Desk', kategori: 'Charger ABD', hpp: 2750000 },
  RDDSK: { nama: 'Charger RADIANT Desk', kategori: 'Charger ABD', hpp: 1500000 },

  MIC01: { nama: 'Mic Signia / AS / Rexton', kategori: 'Spare Part dan Service', hpp: 400000 },
  RCV01: { nama: 'Receiver Signia / AS / Rexton', kategori: 'Spare Part dan Service', hpp: 400000 },
  SPKMF: { nama: 'miniFit Speaker', kategori: 'Spare Part dan Service', hpp: 500000 },
  SPK1H: { nama: 'miniFit Speaker A1.100', kategori: 'Spare Part dan Service', hpp: 750000 },
  SON20: { nama: 'Sonic Amplifier 20 Series', kategori: 'Spare Part dan Service', hpp: 2000000 },
  SON40: { nama: 'Sonic Amplifier 40 Series', kategori: 'Spare Part dan Service', hpp: 2000000 },
  SON60: { nama: 'Sonic Amplifier 60 Series', kategori: 'Spare Part dan Service', hpp: 2000000 },
  SON80: { nama: 'Sonic Amplifier 80 Series', kategori: 'Spare Part dan Service', hpp: 2000000 },
  SON1H: { nama: 'Sonic Amplifier 100 Series', kategori: 'Spare Part dan Service', hpp: 2500000 },

  S13SN: { nama: 'Baterai 13 Sonic', kategori: 'Baterai ABD', hpp: 25000 },
  S675N: { nama: 'Baterai 675 Sonic', kategori: 'Baterai ABD', hpp: 25000 },
  S312N: { nama: 'Baterai 312 Sonic', kategori: 'Baterai ABD', hpp: 25000 },
  S10SN: { nama: 'Baterai 10 Sonic', kategori: 'Baterai ABD', hpp: 25000 },
  P13PN: { nama: 'Baterai 13 Powerone', kategori: 'Baterai ABD', hpp: 30000 },
  P675N: { nama: 'Baterai 675 Powerone', kategori: 'Baterai ABD', hpp: 30000 },
  P312N: { nama: 'Baterai 312 Powerone', kategori: 'Baterai ABD', hpp: 30000 },
  P10PN: { nama: 'Baterai 10 Powerone', kategori: 'Baterai ABD', hpp: 30000 },
  OTH01: { nama: 'Tipe lain', kategori: 'Baterai ABD', hpp: 30000 },

  ATS01: { nama: 'Aidtip Size S', kategori: 'Aidtip & Earmould', hpp: 5000 },
  ATM01: { nama: 'Aidtip Size M', kategori: 'Aidtip & Earmould', hpp: 5000 },
  ATL01: { nama: 'Aidtip Size L', kategori: 'Aidtip & Earmould', hpp: 5000 },
  ATSET: { nama: 'Aidtip Set', kategori: 'Aidtip & Earmould', hpp: 5000 },
  TUB01: { nama: 'Selang Soft', kategori: 'Aidtip & Earmould', hpp: 5000 },
  PDM01: { nama: 'Power Dome M', kategori: 'Aidtip & Earmould', hpp: 10000 },
  PDL01: { nama: 'Power Dome L', kategori: 'Aidtip & Earmould', hpp: 10000 },
  HCA01: { nama: 'Hard Canal (H/C)', kategori: 'Aidtip & Earmould', hpp: 100000 },
  HFS01: { nama: 'Hard Full Shell (H/FS)', kategori: 'Aidtip & Earmould', hpp: 100000 },
  SCA01: { nama: 'Soft Canal (S/C)', kategori: 'Aidtip & Earmould', hpp: 100000 },
  SFS01: { nama: 'Soft Full Shell (S/FS)', kategori: 'Aidtip & Earmould', hpp: 100000 },
};

/**
 * Normalizes strings for robust matching
 */
function normalize(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Get HPP for an ABD unit by SKU or Tipe/Model
 */
export function getHppForABD(sku?: string, tipe?: string, model?: string, hargaJual?: number): number {
  if (sku) {
    const cleanSku = sku.trim().toUpperCase();
    if (MASTER_HPP_ABD[cleanSku]) {
      return MASTER_HPP_ABD[cleanSku].hpp;
    }
  }

  if (tipe) {
    const normTipe = normalize(tipe);
    for (const [s, item] of Object.entries(MASTER_HPP_ABD)) {
      if (normalize(item.nama) === normTipe || normTipe.includes(normalize(item.nama))) {
        return item.hpp;
      }
      if (normalize(s) === normTipe) {
        return item.hpp;
      }
    }
  }

  // Fallback: If price is available, standard ratio ~35%
  if (hargaJual && hargaJual > 0) {
    return Math.round(hargaJual * 0.35);
  }

  return 2500000; // Median default
}

/**
 * Get HPP for Aksesoris unit by SKU, Name, Subtype, or Category
 */
export function getHppForAksesoris(
  sku?: string,
  nama?: string,
  category?: string,
  subtype?: string,
  hargaJual?: number
): number {
  if (sku) {
    const cleanSku = sku.trim().toUpperCase();
    if (MASTER_HPP_AKSESORIS[cleanSku]) {
      return MASTER_HPP_AKSESORIS[cleanSku].hpp;
    }
  }

  const searchTarget = `${nama || ''} ${subtype || ''}`.trim();
  if (searchTarget) {
    const normTarget = normalize(searchTarget);
    for (const [s, item] of Object.entries(MASTER_HPP_AKSESORIS)) {
      if (normalize(item.nama) === normTarget || normTarget.includes(normalize(item.nama))) {
        return item.hpp;
      }
      if (normalize(s) === normTarget) {
        return item.hpp;
      }
    }
  }

  // Category based estimation
  if (category) {
    const catUpper = category.toUpperCase();
    if (catUpper.includes('BATERAI')) {
      if (normalize(searchTarget).includes('powerone') || normalize(searchTarget).includes('p13') || normalize(searchTarget).includes('p675') || normalize(searchTarget).includes('p312') || normalize(searchTarget).includes('p10')) {
        return 30000;
      }
      return 25000;
    }
    if (catUpper.includes('EARMOULD') || catUpper.includes('CANAL') || catUpper.includes('SHELL')) return 100000;
    if (catUpper.includes('AIDTIP') || catUpper.includes('SELANG')) return 5000;
    if (catUpper.includes('CHARGER')) return 2000000;
  }

  if (hargaJual && hargaJual > 0) {
    return Math.round(hargaJual * 0.40);
  }

  return 25000;
}
