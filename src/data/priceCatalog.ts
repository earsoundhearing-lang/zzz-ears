
import { MASTER_ABD_SKU_LIST, MASTER_AKSESORIS_SKU_LIST, findABDSku, findAksesorisSku } from './skuCatalog';

export { MASTER_ABD_SKU_LIST, MASTER_AKSESORIS_SKU_LIST, findABDSku, findAksesorisSku };

export interface ABDPriceItem {
  id: string;
  sku: string;
  tipe: string;
  model: string;
  harga: number;
}

export interface BundlingPackageItem {
  namaItem: string;
  hargaVal?: number;
}

export interface BundlingPackage {
  nama: 'Basic' | 'Essential' | 'Exclusive';
  totalHarga: number;
  items: BundlingPackageItem[];
}

export interface CatalogItem {
  sku?: string;
  kategori: 'Aksesoris ABD' | 'Charger ABD' | 'Spare Part dan Service' | 'Baterai ABD' | 'Aidtip & Earmould';
  nama: string;
  harga: number;
}

export const ABD_PRICE_CATALOG: ABDPriceItem[] = [
  { id: '1', sku: 'ENS10', tipe: 'Enchant SE 10', model: 'BTE', harga: 7500000 },
  { id: '2', sku: 'ENS1R', tipe: 'Enchant 10', model: 'MNRT', harga: 8500000 },
  { id: '3', sku: 'ENS20', tipe: 'Enchant SE 20', model: 'BTE', harga: 9000000 },
  { id: '4', sku: 'Z1A20', tipe: 'Z1 20', model: 'MNRT', harga: 12000000 },
  { id: '5', sku: 'Z1A2R', tipe: 'Z1 20 (R)', model: 'MNRT', harga: 15000000 },
  { id: '6', sku: 'Z1A10', tipe: 'Z1 10', model: 'MNRT', harga: 10000000 },
  { id: '7', sku: 'Z1A1R', tipe: 'Z1 10 (R)', model: 'MNRT', harga: 13750000 },
  { id: '8', sku: 'TR4SP', tipe: 'Trek 40 SP', model: 'BTE', harga: 12000000 },
  { id: '9', sku: 'TR4UP', tipe: 'Trek 40 UP', model: 'BTE', harga: 14000000 },
  { id: '10', sku: 'TR8SP', tipe: 'Trek 80 SP', model: 'BTE', harga: 20000000 },
  { id: '11', sku: 'TR8UP', tipe: 'Trek 80 UP', model: 'BTE', harga: 25000000 },
  { id: '12', sku: 'CAP20', tipe: 'Captivate 20', model: 'BTE', harga: 10000000 },
  { id: '13', sku: 'CAP2T', tipe: 'Captivate 20', model: 'MNRT', harga: 13000000 },
  { id: '14', sku: 'CAP2R', tipe: 'Captivate 20 (R)', model: 'MNRT', harga: 13500000 },
  { id: '15', sku: 'CAP40', tipe: 'Captivate 40', model: 'BTE', harga: 12500000 },
  { id: '16', sku: 'CAP4R', tipe: 'Captivate 40 (R)', model: 'MNRT', harga: 15000000 },
  { id: '17', sku: 'CAP60', tipe: 'Captivate 60', model: 'BTE', harga: 18000000 },
  { id: '18', sku: 'CAP6R', tipe: 'Captivate 60 (R)', model: 'MNRT', harga: 21000000 },
  { id: '19', sku: 'CAP80', tipe: 'Captivate 80', model: 'BTE', harga: 28000000 },
  { id: '20', sku: 'CAP8R', tipe: 'Captivate 80 (R)', model: 'MNRT', harga: 32000000 },
  { id: '21', sku: 'CAP1H', tipe: 'Captivate 100', model: 'BTE', harga: 32000000 },
  { id: '22', sku: 'CAPHR', tipe: 'Captivate 100 (R)', model: 'MNRT', harga: 35000000 },
  { id: '23', sku: 'RA2BT', tipe: 'Radiant 20', model: 'MNBT', harga: 12000000 },
  { id: '24', sku: 'RA2RT', tipe: 'Radiant 20', model: 'MNRT', harga: 13000000 },
  { id: '25', sku: 'RA2BR', tipe: 'Radiant 20 (R)', model: 'MNBT', harga: 18500000 },
  { id: '26', sku: 'RA4BT', tipe: 'Radiant 40', model: 'MNBT', harga: 15000000 },
  { id: '27', sku: 'RA4RT', tipe: 'Radiant 40', model: 'MNRT', harga: 16000000 },
  { id: '28', sku: 'RA4RR', tipe: 'Radiant 40 (R)', model: 'MNRT', harga: 22000000 },
  { id: '29', sku: 'RA6BT', tipe: 'Radiant 60', model: 'MNBT', harga: 26000000 },
  { id: '30', sku: 'RA6RT', tipe: 'Radiant 60', model: 'MNRT', harga: 27000000 },
  { id: '31', sku: 'RA6BR', tipe: 'Radiant 60 (R)', model: 'MNBT', harga: 30000000 },
  { id: '32', sku: 'RA8BT', tipe: 'Radiant 80', model: 'MNBT', harga: 32000000 },
  { id: '33', sku: 'RA8BR', tipe: 'Radiant 80 (R)', model: 'MNBT', harga: 35000000 },
  { id: '34', sku: 'RA1BT', tipe: 'Radiant 100', model: 'MNBT', harga: 35000000 },
  { id: '35', sku: 'RA1RR', tipe: 'Radiant 100 (R)', model: 'MNRT', harga: 42000000 },
  { id: '36', sku: 'RSE60', tipe: 'Radiant SE 60', model: 'MNRT', harga: 30000000 },
  { id: '37', sku: 'RSE6R', tipe: 'Radiant SE 60 (R)', model: 'MNBT', harga: 35000000 },
  { id: '38', sku: 'RSE80', tipe: 'Radiant SE 80', model: 'MNBT', harga: 35000000 },
  { id: '39', sku: 'RSE8R', tipe: 'Radiant SE 80 (R)', model: 'MNBT', harga: 40000000 },
  { id: '40', sku: 'RSE1H', tipe: 'Radiant SE 100', model: 'MNBT', harga: 40000000 },
  { id: '41', sku: 'RSEHR', tipe: 'Radiant SE 100 (R)', model: 'MNBT', harga: 43000000 },
  { id: '42', sku: 'A1A40', tipe: 'A1 40', model: 'MNBT', harga: 18000000 },
  { id: '43', sku: 'A1A4R', tipe: 'A1 40 (R)', model: 'MNBT', harga: 21500000 },
  { id: '44', sku: 'A1A60', tipe: 'A1 60', model: 'MNBT', harga: 23000000 },
  { id: '45', sku: 'A1A6R', tipe: 'A1 60 (R)', model: 'MNBT', harga: 27000000 },
  { id: '46', sku: 'A1A8R', tipe: 'A1 80 (R)', model: 'MNBT', harga: 43000000 },
  { id: '47', sku: 'A1AHR', tipe: 'A1 100 (R)', model: 'MNRT', harga: 50000000 },
  { id: '48', sku: 'FUNSP', tipe: 'FUN SP', model: 'BTE', harga: 6000000 },
  { id: '49', sku: 'FASTP', tipe: 'FAST P', model: 'BTE', harga: 4000000 },
  { id: '50', sku: 'VOLHP', tipe: 'VOLTA HPT', model: 'BTE', harga: 6000000 },
  { id: '51', sku: 'VOLPB', tipe: 'VOLTA PB', model: 'BTE', harga: 4000000 },
  { id: '52', sku: 'DRM60', tipe: 'Dream 600', model: 'BTE', harga: 2000000 },
  { id: '53', sku: 'DRM50', tipe: 'Dream 500', model: 'BTE', harga: 1600000 },
  { id: '54', sku: 'DEMFX', tipe: 'Demoflex', model: 'BTE', harga: 5000000 },
  { id: '55', sku: 'TK4SD', tipe: 'Trek 40 SP DEMO', model: 'BTE', harga: 12000000 },
  { id: '56', sku: 'TK8UD', tipe: 'Trek 80 UP DEMO', model: 'BTE', harga: 25000000 },
  { id: '57', sku: 'TK4UD', tipe: 'Trek 40 UP DEMO', model: 'BTE', harga: 14000000 },
  { id: '58', sku: 'HP3G4', tipe: 'AS HP3 G4', model: 'BTE', harga: 6000000 },
  { id: '59', sku: 'RA1RD', tipe: 'Radiant 100 MNR TR DEMO', model: 'MNRT', harga: 42000000 },
];

export const PAKET_BUNDLING: BundlingPackage[] = [
  {
    nama: 'Basic',
    totalHarga: 320000,
    items: [
      { namaItem: 'Earmould (Cetakan Telinga )', hargaVal: 250000 },
      { namaItem: 'Batteray 1 Rol', hargaVal: 50000 },
      { namaItem: 'Aidtip 1 size', hargaVal: 20000 },
      { namaItem: 'Safety Instruction (Petunjuk Penggunaan)' },
      { namaItem: 'User Guide and Warranty Page' },
      { namaItem: 'Box Package' },
    ],
  },
  {
    nama: 'Essential',
    totalHarga: 900000,
    items: [
      { namaItem: 'Earmould (Cetakan Telinga )', hargaVal: 250000 },
      { namaItem: 'Drying Jar (Standard)', hargaVal: 150000 },
      { namaItem: 'Batteray Checker (Cek Baterai)', hargaVal: 150000 },
      { namaItem: 'Batteray (1 Rol)', hargaVal: 50000 },
      { namaItem: 'Aidtip Set (1 set)', hargaVal: 50000 },
      { namaItem: 'Blower (Pembersih Selah)', hargaVal: 100000 },
      { namaItem: 'Gantungan ABD (HA Retainer)' },
      { namaItem: 'Safety Instruction (Petunjuk Penggunaan)' },
      { namaItem: 'User Guide and Warranty Page' },
      { namaItem: 'Box Package' },
      { namaItem: 'Exclusive Pouch', hargaVal: 150000 },
    ],
  },
  {
    nama: 'Exclusive',
    totalHarga: 1500000,
    items: [
      { namaItem: 'Earmould (Cetakan Telinga )', hargaVal: 500000 },
      { namaItem: 'Drying Jar (Electric 1.0)', hargaVal: 250000 },
      { namaItem: 'Batteray Checker (Cek Baterai)', hargaVal: 150000 },
      { namaItem: 'Batteray (4 Rol)', hargaVal: 200000 },
      { namaItem: 'Aidtip Set (1 set)', hargaVal: 50000 },
      { namaItem: 'Blower (Pembersih Selah)', hargaVal: 100000 },
      { namaItem: 'Gantungan ABD (HA Retainer)', hargaVal: 100000 },
      { namaItem: 'Safety Instruction (Petunjuk Penggunaan)' },
      { namaItem: 'User Guide and Warranty Page' },
      { namaItem: 'Box Package' },
      { namaItem: 'Exclusive Pouch', hargaVal: 150000 },
    ],
  },
];

export const CATALOG_AKSESORIS_SERVICE: CatalogItem[] = [
  // Aksesoris ABD
  { sku: 'DRY01', kategori: 'Aksesoris ABD', nama: 'Drying Jar – Standard', harga: 150000 },
  { sku: 'DRY10', kategori: 'Aksesoris ABD', nama: 'Drying Jar – Electric 1.0', harga: 250000 },
  { sku: 'DRY20', kategori: 'Aksesoris ABD', nama: 'Drying Jar – Electric 2.0', harga: 500000 },
  { sku: 'WAX01', kategori: 'Aksesoris ABD', nama: 'Wax Guard', harga: 150000 },
  { sku: 'EHK01', kategori: 'Aksesoris ABD', nama: 'Earhook', harga: 200000 },
  { sku: 'BLW01', kategori: 'Aksesoris ABD', nama: 'Blower', harga: 100000 },
  { sku: 'POU01', kategori: 'Aksesoris ABD', nama: 'Earsound Pouch', harga: 100000 },
  { sku: 'RET01', kategori: 'Aksesoris ABD', nama: 'HA Retainer / Gantungan ABD', harga: 100000 },
  { sku: 'FLT01', kategori: 'Aksesoris ABD', nama: 'Filter', harga: 40000 },
  { sku: 'BATCK', kategori: 'Aksesoris ABD', nama: 'Baterai Checker', harga: 150000 },
  
  // Charger ABD
  { sku: 'A1TRV', kategori: 'Charger ABD', nama: 'Charger A1 Travel', harga: 4500000 },
  { sku: 'RDTRV', kategori: 'Charger ABD', nama: 'Charger RADIANT Travel', harga: 3850000 },
  { sku: 'A1DSK', kategori: 'Charger ABD', nama: 'Charger A1 Desk', harga: 2100000 },
  { sku: 'RDDSK', kategori: 'Charger ABD', nama: 'Charger RADIANT Desk', harga: 2100000 },
  
  // Spare Part dan Service
  { sku: 'MIC01', kategori: 'Spare Part dan Service', nama: 'Mic Signia / AS / Rexton', harga: 800000 },
  { sku: 'RCV01', kategori: 'Spare Part dan Service', nama: 'Receiver Signia / AS / Rexton', harga: 1000000 },
  { sku: 'SPKMF', kategori: 'Spare Part dan Service', nama: 'miniFit Speaker', harga: 750000 },
  { sku: 'SPK1H', kategori: 'Spare Part dan Service', nama: 'miniFit Speaker A1.100', harga: 1000000 },
  { sku: 'SON20', kategori: 'Spare Part dan Service', nama: 'Sonic Amplifier 20 Series', harga: 2500000 },
  { sku: 'SON40', kategori: 'Spare Part dan Service', nama: 'Sonic Amplifier 40 Series', harga: 3500000 },
  { sku: 'SON60', kategori: 'Spare Part dan Service', nama: 'Sonic Amplifier 60 Series', harga: 4000000 },
  { sku: 'SON80', kategori: 'Spare Part dan Service', nama: 'Sonic Amplifier 80 Series', harga: 5000000 },
  { sku: 'SON1H', kategori: 'Spare Part dan Service', nama: 'Sonic Amplifier 100 Series', harga: 6000000 },
  
  // Baterai ABD
  { sku: 'S13SN', kategori: 'Baterai ABD', nama: 'Baterai 13 Sonic', harga: 50000 },
  { sku: 'S675N', kategori: 'Baterai ABD', nama: 'Baterai 675 Sonic', harga: 50000 },
  { sku: 'S312N', kategori: 'Baterai ABD', nama: 'Baterai 312 Sonic', harga: 50000 },
  { sku: 'S10SN', kategori: 'Baterai ABD', nama: 'Baterai 10 Sonic', harga: 50000 },
  { sku: 'P13PN', kategori: 'Baterai ABD', nama: 'Baterai 13 Powerone', harga: 50000 },
  { sku: 'P675N', kategori: 'Baterai ABD', nama: 'Baterai 675 Powerone', harga: 50000 },
  { sku: 'P312N', kategori: 'Baterai ABD', nama: 'Baterai 312 Powerone', harga: 50000 },
  { sku: 'P10PN', kategori: 'Baterai ABD', nama: 'Baterai 10 Powerone', harga: 50000 },
  { sku: 'OTH01', kategori: 'Baterai ABD', nama: 'Tipe lain', harga: 50000 },
  
  // Aidtip & Earmould
  { sku: 'ATS01', kategori: 'Aidtip & Earmould', nama: 'Aidtip Size S', harga: 20000 },
  { sku: 'ATM01', kategori: 'Aidtip & Earmould', nama: 'Aidtip Size M', harga: 20000 },
  { sku: 'ATL01', kategori: 'Aidtip & Earmould', nama: 'Aidtip Size L', harga: 20000 },
  { sku: 'ATSET', kategori: 'Aidtip & Earmould', nama: 'Aidtip Set', harga: 50000 },
  { sku: 'TUB01', kategori: 'Aidtip & Earmould', nama: 'Selang Soft', harga: 20000 },
  { sku: 'PDM01', kategori: 'Aidtip & Earmould', nama: 'Power Dome M', harga: 50000 },
  { sku: 'PDL01', kategori: 'Aidtip & Earmould', nama: 'Power Dome L', harga: 50000 },
  { sku: 'HCA01', kategori: 'Aidtip & Earmould', nama: 'Hard Canal (H/C)', harga: 250000 },
  { sku: 'HFS01', kategori: 'Aidtip & Earmould', nama: 'Hard Full Shell (H/FS)', harga: 250000 },
  { sku: 'SCA01', kategori: 'Aidtip & Earmould', nama: 'Soft Canal (S/C)', harga: 250000 },
  { sku: 'SFS01', kategori: 'Aidtip & Earmould', nama: 'Soft Full Shell (S/FS)', harga: 250000 },
];

export const AKSESORIS_CATEGORY_LIST = [
  'Aksesoris ABD',
  'Charger ABD',
  'Spare Part dan Service',
  'Baterai ABD',
  'Aidtip & Earmould',
] as const;
