/**
 * Master SKU (Stock Keeping Unit) Catalog & Mappings for Earsound Hearing Care
 * Directly aligned with Official Product SKU Lists (Alat Bantu Dengar & Aksesoris)
 */

export interface ABDSkuItem {
  sku: string;
  tipeABD: string;
  model: string;
  aliasTipe?: string;
  aliasModel?: string;
  aliases?: string[];
  harga?: number;
}

export interface AksesorisSkuItem {
  sku: string;
  nama: string;
  kategori: string;
  aliases?: string[];
  harga?: number;
}

// 1. MASTER SKU ALAT BANTU DENGAR (ABD)
export const MASTER_ABD_SKU_LIST: ABDSkuItem[] = [
  // Gambar 3 items:
  { sku: 'A1MRD', tipeABD: 'A1 100 MNR DEMO', model: 'MNRT', aliases: ['A1 100 MNR DEMO', 'A1 100 MNR', 'A1MRD'], harga: 50000000 },
  { sku: 'A14MR', tipeABD: 'A1 40 MNB R', model: 'MNBT', aliases: ['A1 40 MNB R', 'A1 40 MNB', 'A14MR'], harga: 21500000 },
  { sku: 'E2OBD', tipeABD: 'Enchant SE 20 BTE DEMO', model: 'BTE', aliases: ['Enchant SE 20 BTE DEMO', 'Enchant SE 20 DEMO', 'E2OBD'], harga: 9000000 },
  { sku: 'T4SBD', tipeABD: 'Trek 40 SP BTE DEMO', model: 'BTE', aliases: ['Trek 40 SP BTE DEMO', 'Trek 40 SP DEMO', 'T4SBD'], harga: 12000000 },
  { sku: 'T4UBD', tipeABD: 'Trek 40 UP BTE DEMO', model: 'BTE', aliases: ['Trek 40 UP BTE DEMO', 'Trek 40 UP DEMO', 'T4UBD'], harga: 14000000 },
  { sku: 'T8UBD', tipeABD: 'Trek 80 UP BTE DEMO', model: 'BTE', aliases: ['Trek 80 UP BTE DEMO', 'Trek 80 UP DEMO', 'T8UBD'], harga: 25000000 },
  { sku: 'R2MBR', tipeABD: 'Radiant 20 MNB T R', model: 'MNBT', aliases: ['Radiant 20 MNB T R', 'Radiant 20 MNB T', 'R2MBR'], harga: 18500000 },
  { sku: 'AVQPM', tipeABD: 'VOLTA QUIX PM', model: 'BTE', aliases: ['VOLTA QUIX PM', 'VOLTA QUIX', 'AVQPM'], harga: 6000000 },
  { sku: 'USB3U', tipeABD: 'Stride B3 UP', model: 'BTE', aliases: ['Stride B3 UP', 'Stride B3', 'USB3U'], harga: 14000000 },
  { sku: 'P2ITC', tipeABD: 'PEP 20 ITC', model: 'ITC', aliases: ['PEP 20 ITC', 'PEP 20', 'P2ITC'], harga: 8000000 },
  { sku: 'AP3G4', tipeABD: 'P3 G4', model: 'BTE', aliases: ['P3 G4', 'Audio Service P3 G4', 'AP3G4'], harga: 6000000 },
  { sku: 'C108H', tipeABD: 'CLEAR 108H', model: 'BTE', aliases: ['CLEAR 108H', 'C108H'], harga: 5000000 },
  { sku: 'A1DMR', tipeABD: 'A1 DEMOFLEX MNB R', model: 'MNBT', aliases: ['A1 DEMOFLEX MNB R', 'A1 DEMOFLEX', 'A1DMR'], harga: 5000000 },

  { sku: 'ENS10', tipeABD: 'Enchant SE 10', model: 'BTE', harga: 7500000 },
  { sku: 'ENS1R', tipeABD: 'ENCHANT 10', model: 'MNRT', aliasTipe: 'Enchant 10', aliasModel: 'MNRT', harga: 8500000 },
  { sku: 'ENS20', tipeABD: 'Enchant SE 20', model: 'BTE', harga: 9000000 },
  { sku: 'Z1A20', tipeABD: 'Z1 20', model: 'MNRT', harga: 12000000 },
  { sku: 'Z1A2R', tipeABD: 'Z1 20 (R)', model: 'MNRT', harga: 15000000 },
  { sku: 'Z1A10', tipeABD: 'Z1 10', model: 'MNRT', harga: 10000000 },
  { sku: 'Z1A1R', tipeABD: 'Z1 10 (R)', model: 'MNRT', aliasTipe: 'Z1 10 -(R)', harga: 13750000 },
  { sku: 'TR4SP', tipeABD: 'Trek 40 SP', model: 'BTE', harga: 12000000 },
  { sku: 'TR4UP', tipeABD: 'Trek 40 UP', model: 'BTE', harga: 14000000 },
  { sku: 'TR8SP', tipeABD: 'Trek 80 SP', model: 'BTE', harga: 20000000 },
  { sku: 'TR8UP', tipeABD: 'Trek 80 UP', model: 'BTE', harga: 25000000 },
  { sku: 'CAP20', tipeABD: 'Captivate 20', model: 'BTE', harga: 10000000 },
  { sku: 'CAP2T', tipeABD: 'Captivate 20', model: 'MNRT', harga: 13000000 },
  { sku: 'CAP2R', tipeABD: 'Captivate 20 (R)', model: 'MNRT', harga: 13500000 },
  { sku: 'CAP40', tipeABD: 'Captivate 40', model: 'BTE', harga: 12500000 },
  { sku: 'CAP4R', tipeABD: 'Captivate 40 (R)', model: 'MNRT', harga: 15000000 },
  { sku: 'CAP60', tipeABD: 'Captivate 60', model: 'BTE', harga: 18000000 },
  { sku: 'CAP6R', tipeABD: 'Captivate 60 (R)', model: 'MNRT', aliasTipe: 'Trek 40 UP', aliasModel: 'BTE', harga: 21000000 },
  { sku: 'CAP80', tipeABD: 'Captivate 80', model: 'BTE', harga: 28000000 },
  { sku: 'CAP8R', tipeABD: 'Captivate 80 (R)', model: 'MNRT', aliasTipe: 'Trek 80 UP', aliasModel: 'BTE', harga: 32000000 },
  { sku: 'CAP1H', tipeABD: 'Captivate 100', model: 'BTE', harga: 32000000 },
  { sku: 'CAPHR', tipeABD: 'Captivate 100 (R)', model: 'MNRT', harga: 35000000 },
  { sku: 'RA2BT', tipeABD: 'Radiant 20', model: 'MNBT', harga: 12000000 },
  { sku: 'RA2RT', tipeABD: 'Radiant 20', model: 'MNRT', harga: 13000000 },
  { sku: 'RA2BR', tipeABD: 'Radiant 20 (R)', model: 'MNBT', aliasTipe: 'Radiant 20 MNB', aliasModel: 'TR', harga: 18500000 },
  { sku: 'RA4BT', tipeABD: 'Radiant 40', model: 'MNBT', harga: 15000000 },
  { sku: 'RA4RT', tipeABD: 'Radiant 40', model: 'MNRT', harga: 16000000 },
  { sku: 'RA4RR', tipeABD: 'Radiant 40 (R)', model: 'MNRT', aliasTipe: 'Radiant 40 R)', aliasModel: 'MNBT', harga: 22000000 },
  { sku: 'RA6BT', tipeABD: 'Radiant 60', model: 'MNBT', harga: 26000000 },
  { sku: 'RA6RT', tipeABD: 'Radiant 60', model: 'MNRT', harga: 27000000 },
  { sku: 'RA6BR', tipeABD: 'Radiant 60 (R)', model: 'MNBT', aliasTipe: 'Radiant 60 (R)', aliasModel: 'MNRT', harga: 30000000 },
  { sku: 'RA8BT', tipeABD: 'Radiant 80', model: 'MNBT', harga: 32000000 },
  { sku: 'RA8BR', tipeABD: 'Radiant 80 (R)', model: 'MNBT', harga: 35000000 },
  { sku: 'RA1BT', tipeABD: 'Radiant 100', model: 'MNBT', harga: 35000000 },
  { sku: 'RA1RR', tipeABD: 'Radiant 100 (R)', model: 'MNRT', aliasTipe: 'Radiant 100 MNR', aliasModel: 'TR', harga: 42000000 },
  { sku: 'RSE60', tipeABD: 'Radiant SE 60', model: 'MNRT', aliasTipe: 'Radiant SE 60', aliasModel: 'MNBT', harga: 30000000 },
  { sku: 'RSE6R', tipeABD: 'Radiant SE 60 (R)', model: 'MNBT', harga: 35000000 },
  { sku: 'RSE80', tipeABD: 'Radiant SE 80', model: 'MNBT', harga: 35000000 },
  { sku: 'RSE8R', tipeABD: 'Radiant SE 80 (R)', model: 'MNBT', harga: 40000000 },
  { sku: 'RSE1H', tipeABD: 'Radiant SE 100', model: 'MNBT', harga: 40000000 },
  { sku: 'RSEHR', tipeABD: 'Radiant SE 100 (R)', model: 'MNBT', harga: 43000000 },
  { sku: 'A1A40', tipeABD: 'A1 40', model: 'MNBT', aliasTipe: 'A1 40 MNR', aliasModel: 'JEBL', harga: 18000000 },
  { sku: 'A1A4R', tipeABD: 'A1 40 (R)', model: 'MNBT', aliasTipe: 'A1 40 MNB R', aliasModel: 'JEBL', harga: 21500000 },
  { sku: 'A1A60', tipeABD: 'A1 60', model: 'MNBT', aliasTipe: 'A1 60', aliasModel: 'MNRT', harga: 23000000 },
  { sku: 'A1A6R', tipeABD: 'A1 60 (R)', model: 'MNBT', aliasTipe: 'A1 60 (R)', aliasModel: 'MNRT', harga: 27000000 },
  { sku: 'A1A8R', tipeABD: 'A1 80 (R)', model: 'MNBT', aliasTipe: 'A1 80 (R)', aliasModel: 'MNRT', harga: 43000000 },
  { sku: 'A1AHR', tipeABD: 'A1 100 (R)', model: 'MNRT', aliasTipe: 'A1 100 MNR', aliasModel: 'SABE', harga: 50000000 },
  { sku: 'FUNSP', tipeABD: 'FUN SP', model: 'BTE', aliasTipe: 'Signia Fun', aliasModel: 'SP', harga: 6000000 },
  { sku: 'FASTP', tipeABD: 'FAST P', model: 'BTE', aliasTipe: 'Signia Fast', aliasModel: 'P', harga: 4000000 },
  { sku: 'VOLHP', tipeABD: 'VOLTA HPT', model: 'BTE', harga: 6000000 },
  { sku: 'VOLPB', tipeABD: 'VOLTA PB', model: 'BTE', aliasTipe: 'VOLTA PB', aliasModel: 'BTE', harga: 4000000 },
  { sku: 'DRM60', tipeABD: 'Dream 600', model: 'BTE', harga: 2000000 },
  { sku: 'DRM50', tipeABD: 'Dream 500', model: 'BTE', harga: 1600000 },
  { sku: 'DEMFX', tipeABD: 'Demoflex', model: 'BTE', aliasTipe: 'Demoflex', aliasModel: 'MNRT', harga: 5000000 },
  { sku: 'TK4SD', tipeABD: 'Trek 40 SP DEMO', model: 'BTE', aliasTipe: 'Trek 40 SP', aliasModel: 'DEMO', harga: 12000000 },
  { sku: 'TK8UD', tipeABD: 'Trek 80 UP DEMO', model: 'BTE', aliasTipe: 'Trek 80 UP', aliasModel: 'DEMO', harga: 25000000 },
  { sku: 'TK4UD', tipeABD: 'Trek 40 UP DEMO', model: 'BTE', aliasTipe: 'Trek 40 UP', aliasModel: 'DEMO', harga: 14000000 },
  { sku: 'HP3G4', tipeABD: 'AS HP3 G4', model: 'BTE', aliasTipe: 'HP3 G4', aliasModel: 'BTE', aliases: ['AS HP3 G4', 'HP3 G4', 'HP3G4', 'Audio Service HP3 G4', 'AS HP 3 G4', 'HP 3 G4'], harga: 6000000 },
  { sku: 'RA1RD', tipeABD: 'Radiant 100 MNR TR DEMO', model: 'MNRT', aliasTipe: 'Radiant 100 MNR TR', aliasModel: 'DEMO', aliases: ['Radiant 100 MNR TR DEMO', 'Radiant 100 DEMO', 'RA1RD'], harga: 42000000 },
];

// 2. MASTER SKU AKSESORIS
export const MASTER_AKSESORIS_SKU_LIST: AksesorisSkuItem[] = [
  // Gambar 2 items:
  { sku: 'R312V', nama: '312 RAYOVAC', kategori: 'Baterai ABD', aliases: ['312 Rayovac', 'Rayovac 312', 'Baterai 312 Rayovac', '312 RAYOVAC', 'R312V'], harga: 50000 },
  { sku: 'ELBOW', nama: 'ELBOW', kategori: 'Aidtip & Earmould', aliases: ['Elbow', 'Elbow Connector', 'ELBOW'], harga: 20000 },
  { sku: 'R2L10', nama: 'Speaker Unit 2L 100', kategori: 'Spare Part dan Service', aliases: ['Speaker Unit 2L 100', '2L 100 Speaker', 'Speaker 2L 100', 'Speaker Unit 2L', 'R2L10'], harga: 1000000 },
  { sku: 'R2R10', nama: 'Speaker Unit 2R 100', kategori: 'Spare Part dan Service', aliases: ['Speaker Unit 2R 100', '2R 100 Speaker', 'Speaker 2R 100', 'Speaker Unit 2R', 'R2R10'], harga: 1000000 },
  { sku: 'STCLP', nama: 'Stetoclip', kategori: 'Aksesoris ABD', aliases: ['Stetoclip', 'Stethoclip', 'STCLP'], harga: 150000 },

  { sku: 'DRY01', nama: 'Drying Jar – Standard', kategori: 'Aksesoris ABD', aliases: ['Drying Jar - Standard', 'Drying Jar Standard', 'Standard', 'Drying Jar'], harga: 150000 },
  { sku: 'DRY10', nama: 'Drying Jar – Electric 1.0', kategori: 'Aksesoris ABD', aliases: ['Drying Jar - Electric 1.0', 'Drying Jar Electric 1.0', 'Electric 1.0'], harga: 250000 },
  { sku: 'DRY20', nama: 'Drying Jar – Electric 2.0', kategori: 'Aksesoris ABD', aliases: ['Drying Jar - Electric 2.0', 'Drying Jar - Electrik 2.0', 'Drying Jar Electric 2.0', 'Electric 2.0'], harga: 500000 },
  { sku: 'WAX01', nama: 'Wax Guard', kategori: 'Aksesoris ABD', aliases: ['Wax Guard', 'Cerustop Wax Guard'], harga: 150000 },
  { sku: 'EHK01', nama: 'Earhook', kategori: 'Aksesoris ABD', aliases: ['Earhook Sonic', 'Ear Hook'], harga: 200000 },
  { sku: 'BLW01', nama: 'Blower', kategori: 'Aksesoris ABD', aliases: ['Blower Pembersih', 'Blower (Pembersih Selah)'], harga: 100000 },
  { sku: 'POU01', nama: 'Earsound Pouch', kategori: 'Aksesoris ABD', aliases: ['Exclusive Pouch', 'Pouch', 'Pouch Earsound'], harga: 100000 },
  { sku: 'RET01', nama: 'HA Retainer / Gantungan ABD', kategori: 'Aksesoris ABD', aliases: ['HA Retainer (Gantungan ABD)', 'HA Retainer', 'Gantungan ABD', 'Gantungan Alat Bantu Dengar'], harga: 100000 },
  { sku: 'FLT01', nama: 'Filter', kategori: 'Aksesoris ABD', aliases: ['Filter Mic', 'Filter ABD'], harga: 40000 },
  { sku: 'BATCK', nama: 'Baterai Checker', kategori: 'Aksesoris ABD', aliases: ['Batteray Checker', 'Cek Baterai', 'Battery Tester'], harga: 150000 },
  
  // Charger ABD
  { sku: 'A1TRV', nama: 'Charger A1 Travel', kategori: 'Charger ABD', aliases: ['Charger A1 Travel', 'A1 Travel Charger'], harga: 4500000 },
  { sku: 'RDTRV', nama: 'Charger RADIANT Travel', kategori: 'Charger ABD', aliases: ['Charger, RADIANT Travel', 'Radiant Travel Charger'], harga: 3850000 },
  { sku: 'A1DSK', nama: 'Charger A1 Desk', kategori: 'Charger ABD', aliases: ['Charger, A1 Desk', 'A1 Desk Charger'], harga: 2100000 },
  { sku: 'RDDSK', nama: 'Charger RADIANT Desk', kategori: 'Charger ABD', aliases: ['Charger, RADIANT Desk', 'Radiant Desk Charger'], harga: 2100000 },
  
  // Spare Part dan Service
  { sku: 'MIC01', nama: 'Mic Signia / AS / Rexton', kategori: 'Spare Part dan Service', aliases: ['Mic Signia, AS, Rexton', 'Mic Signia', 'Mic AS', 'Mic Rexton'], harga: 800000 },
  { sku: 'RCV01', nama: 'Receiver Signia / AS / Rexton', kategori: 'Spare Part dan Service', aliases: ['Receiver Signia, AS, Rexton', 'Receiver Signia', 'Receiver AS', 'Receiver Rexton'], harga: 1000000 },
  { sku: 'SPKMF', nama: 'miniFit Speaker', kategori: 'Spare Part dan Service', aliases: ['miniFit Speaker', 'Speaker miniFit'], harga: 750000 },
  { sku: 'SPK1H', nama: 'miniFit Speaker A1.100', kategori: 'Spare Part dan Service', aliases: ['miniFit Speaker A1.100', 'Speaker A1.100', 'Speaker Unit 2L 100', 'Speaker Unit 2R 100', 'Speaker Unit 100'], harga: 1000000 },
  { sku: 'SON20', nama: 'Sonic Amplifier 20 Series', kategori: 'Spare Part dan Service', aliases: ['Sonic Amp 20', 'Amplifier 20 Series'], harga: 2500000 },
  { sku: 'SON40', nama: 'Sonic Amplifier 40 Series', kategori: 'Spare Part dan Service', aliases: ['Sonic Amp 40', 'Amplifier 40 Series'], harga: 3500000 },
  { sku: 'SON60', nama: 'Sonic Amplifier 60 Series', kategori: 'Spare Part dan Service', aliases: ['Sonic Amp 60', 'Amplifier 60 Series', 'Sonic Amplifier 60'], harga: 4000000 },
  { sku: 'SON80', nama: 'Sonic Amplifier 80 Series', kategori: 'Spare Part dan Service', aliases: ['Sonic Amp 80', 'Amplifier 80 Series'], harga: 5000000 },
  { sku: 'SON1H', nama: 'Sonic Amplifier 100 Series', kategori: 'Spare Part dan Service', aliases: ['Sonic Amp 100', 'Amplifier 100 Series', 'Sonic Amplifier 100'], harga: 6000000 },
  
  // Baterai ABD
  { sku: 'S13SN', nama: 'Baterai 13 Sonic', kategori: 'Baterai ABD', aliases: ['13 Sonic', 'Baterai Sonic 13', 'Sonic 13', 'Baterai (1 Rol)', 'Baterai 1 Rol', 'Baterai (4 Rol)', 'Baterai 4 Rol', 'Baterai ABD', 'Baterai 13'], harga: 50000 },
  { sku: 'S675N', nama: 'Baterai 675 Sonic', kategori: 'Baterai ABD', aliases: ['675 Sonic', 'Baterai Sonic 675', 'Sonic 675', 'Baterai 675'], harga: 50000 },
  { sku: 'S312N', nama: 'Baterai 312 Sonic', kategori: 'Baterai ABD', aliases: ['312 Sonic', 'Baterai Sonic 312', 'Sonic 312', 'Baterai 312'], harga: 50000 },
  { sku: 'S10SN', nama: 'Baterai 10 Sonic', kategori: 'Baterai ABD', aliases: ['10 Sonic', 'Baterai Sonic 10', 'Sonic 10', 'Baterai 10'], harga: 50000 },
  { sku: 'P13PN', nama: 'Baterai 13 Powerone', kategori: 'Baterai ABD', aliases: ['13 Powerone', 'Baterai Powerone 13', 'Powerone 13'], harga: 50000 },
  { sku: 'P675N', nama: 'Baterai 675 Powerone', kategori: 'Baterai ABD', aliases: ['675 Powerone', 'Baterai Powerone 675', 'Powerone 675'], harga: 50000 },
  { sku: 'P312N', nama: 'Baterai 312 Powerone', kategori: 'Baterai ABD', aliases: ['312 Powerone', 'Baterai Powerone 312', 'Powerone 312'], harga: 50000 },
  { sku: 'P10PN', nama: 'Baterai 10 Powerone', kategori: 'Baterai ABD', aliases: ['10 Powerone', 'Baterai Powerone 10', 'Powerone 10'], harga: 50000 },
  { sku: 'OTH01', nama: 'Tipe lain', kategori: 'Baterai ABD', aliases: ['Tipe Lain', 'Baterai Lainnya'], harga: 50000 },
  
  // Aidtip & Earmould
  { sku: 'ATS01', nama: 'Aidtip Size S', kategori: 'Aidtip & Earmould', aliases: ['Aidtip S', 'Size S'], harga: 20000 },
  { sku: 'ATM01', nama: 'Aidtip Size M', kategori: 'Aidtip & Earmould', aliases: ['Aidtip M', 'Size M'], harga: 20000 },
  { sku: 'ATL01', nama: 'Aidtip Size L', kategori: 'Aidtip & Earmould', aliases: ['Aidtip L', 'Size L'], harga: 20000 },
  { sku: 'ATSET', nama: 'Aidtip Set', kategori: 'Aidtip & Earmould', aliases: ['Aidtip Set (1 set)', 'Aidtip 1 Set', 'Aidtip'], harga: 50000 },
  { sku: 'TUB01', nama: 'Selang Soft', kategori: 'Aidtip & Earmould', aliases: ['Selang Cetakan', 'Tubing Soft'], harga: 20000 },
  { sku: 'PDM01', nama: 'Power Dome M', kategori: 'Aidtip & Earmould', aliases: ['Power Dome Size M'], harga: 50000 },
  { sku: 'PDL01', nama: 'Power Dome L', kategori: 'Aidtip & Earmould', aliases: ['Power Dome Size L'], harga: 50000 },
  { sku: 'HCA01', nama: 'Hard Canal (H/C)', kategori: 'Aidtip & Earmould', aliases: ['H/C', 'Hard Canal', 'Earmould H/C'], harga: 250000 },
  { sku: 'HFS01', nama: 'Hard Full Shell (H/FS)', kategori: 'Aidtip & Earmould', aliases: ['H/FS', 'Hard Full Shell', 'Earmould H/FS'], harga: 250000 },
  { sku: 'SCA01', nama: 'Soft Canal (S/C)', kategori: 'Aidtip & Earmould', aliases: ['S/C', 'Soft Canal', 'Earmould S/C', 'Earmould (Cetakan Telinga)', 'Cetakan Telinga', 'Earmould'], harga: 250000 },
  { sku: 'SFS01', nama: 'Soft Full Shell (S/FS)', kategori: 'Aidtip & Earmould', aliases: ['S/FS', 'Soft Full Shell', 'Earmould S/FS'], harga: 250000 },
];

/**
 * Normalizes strings for resilient SKU matching (lowercases, removes punctuation/spaces)
 */
function cleanStr(s?: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds ABD SKU by tipe and model
 */
export function findABDSku(tipe?: string, model?: string): string {
  if (!tipe) return '-';
  const cleanTipe = cleanStr(tipe);
  const cleanMod = cleanStr(model);
  const upperTipe = tipe.trim().toUpperCase();

  // 0. Exact SKU match
  for (const item of MASTER_ABD_SKU_LIST) {
    if (item.sku.toUpperCase() === upperTipe) {
      return item.sku;
    }
  }

  // 1. Exact match on clean string
  for (const item of MASTER_ABD_SKU_LIST) {
    const itemTipe = cleanStr(item.tipeABD);
    const itemMod = cleanStr(item.model);
    if (itemTipe === cleanTipe && (!cleanMod || itemMod === cleanMod || cleanTipe.includes(itemMod))) {
      return item.sku;
    }
  }

  // 2. Check aliases
  for (const item of MASTER_ABD_SKU_LIST) {
    if (item.aliasTipe && cleanStr(item.aliasTipe) === cleanTipe) {
      if (!cleanMod || (item.aliasModel && cleanStr(item.aliasModel) === cleanMod)) {
        return item.sku;
      }
    }
    if (item.aliases) {
      for (const alias of item.aliases) {
        if (cleanStr(alias) === cleanTipe || cleanStr(alias) === `${cleanTipe}${cleanMod}`) {
          return item.sku;
        }
      }
    }
  }

  // 3. Substring matching for type and model
  for (const item of MASTER_ABD_SKU_LIST) {
    const itemTipe = cleanStr(item.tipeABD);
    const itemMod = cleanStr(item.model);
    if ((cleanTipe.includes(itemTipe) || itemTipe.includes(cleanTipe)) && (cleanMod === itemMod || !cleanMod)) {
      return item.sku;
    }
  }

  // 4. Fallback: match by cleanTipe alone if only 1 exists
  const candidates = MASTER_ABD_SKU_LIST.filter(item => cleanStr(item.tipeABD) === cleanTipe);
  if (candidates.length > 0) {
    return candidates[0].sku;
  }

  return '-';
}

/**
 * Finds Aksesoris SKU by product name/subtype
 */
export function findAksesorisSku(namaOrTipe?: string, kategori?: string): string {
  if (!namaOrTipe) return '-';
  const cleanTarget = cleanStr(namaOrTipe);
  const upperTarget = namaOrTipe.trim().toUpperCase();

  // 0. Exact SKU match
  for (const item of MASTER_AKSESORIS_SKU_LIST) {
    if (item.sku.toUpperCase() === upperTarget) {
      return item.sku;
    }
  }

  // 1. Exact match on clean string
  for (const item of MASTER_AKSESORIS_SKU_LIST) {
    if (cleanStr(item.nama) === cleanTarget) {
      return item.sku;
    }
    if (item.aliases) {
      for (const alias of item.aliases) {
        if (cleanStr(alias) === cleanTarget) {
          return item.sku;
        }
      }
    }
  }

  // 2. Substring matching
  for (const item of MASTER_AKSESORIS_SKU_LIST) {
    const itemClean = cleanStr(item.nama);
    if (cleanTarget.includes(itemClean) || itemClean.includes(cleanTarget)) {
      return item.sku;
    }
    if (item.aliases) {
      for (const alias of item.aliases) {
        const aliasClean = cleanStr(alias);
        if (cleanTarget.includes(aliasClean) || aliasClean.includes(cleanTarget)) {
          return item.sku;
        }
      }
    }
  }

  return '-';
}

/**
 * Returns item details by SKU
 */
export function getProductBySku(sku: string): { type: 'ABD' | 'AKSESORIS'; item: ABDSkuItem | AksesorisSkuItem } | null {
  const upper = sku.trim().toUpperCase();
  const abd = MASTER_ABD_SKU_LIST.find(i => i.sku.toUpperCase() === upper);
  if (abd) return { type: 'ABD', item: abd };
  
  const aks = MASTER_AKSESORIS_SKU_LIST.find(i => i.sku.toUpperCase() === upper);
  if (aks) return { type: 'AKSESORIS', item: aks };

  return null;
}

/**
 * Returns Aksesoris item by SKU
 */
export function getAksesorisBySku(sku?: string): AksesorisSkuItem | undefined {
  if (!sku || sku === '-') return undefined;
  const upper = sku.trim().toUpperCase();
  return MASTER_AKSESORIS_SKU_LIST.find(i => i.sku.toUpperCase() === upper);
}

/**
 * Finds canonical Aksesoris master item by name/subtype and/or category
 */
export function findMasterAksesoris(namaOrTipe?: string, kategori?: string): AksesorisSkuItem | undefined {
  if (!namaOrTipe) return undefined;
  const sku = findAksesorisSku(namaOrTipe, kategori);
  if (sku && sku !== '-') {
    return getAksesorisBySku(sku);
  }
  return undefined;
}

