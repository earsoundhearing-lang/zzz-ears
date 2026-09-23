import { ABDInventoryEntry, BranchCode } from '../types';
import { findABDSku } from '../data/skuCatalog';

// Mapping from Sonic Amplifier spare part name to target ABD SKUs
export const SONIC_AMPLIFIER_ABD_SKUS: Record<string, string[]> = {
  'Sonic Amplifier 20 Series': ['E2OBD'],
  'Sonic Amplifier 40 Series': ['T4SBD', 'T4UBD'],
  'Sonic Amplifier 80 Series': ['T8UBD'],
  'Sonic Amplifier 100 Series': ['A1MRD', 'A1DMR'],
};

/**
 * Check if an item subtype is a Sonic Amplifier spare part that deducts ABD stock
 */
export function isSonicAmplifierSubtype(subtypeName: string): boolean {
  if (!subtypeName) return false;
  return Object.keys(SONIC_AMPLIFIER_ABD_SKUS).some(key =>
    subtypeName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subtypeName.toLowerCase())
  );
}

/**
 * Get target ABD SKUs for a given Sonic Amplifier subtype
 */
export function getSonicAmplifierTargetSkus(subtypeName: string): string[] {
  for (const [key, skus] of Object.entries(SONIC_AMPLIFIER_ABD_SKUS)) {
    if (subtypeName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(subtypeName.toLowerCase())) {
      return skus;
    }
  }
  return [];
}

export interface AvailableABDRow {
  inventoryId: string;
  sku: string;
  tipeABD: string;
  model: string;
  noSeri: string;
  tanggal: string;
}

/**
 * Filter available physical ABD stock in a given branch
 */
export function getAvailableABDStockInBranch(
  inventoryABD: ABDInventoryEntry[],
  branchCode: BranchCode | string
): AvailableABDRow[] {
  if (!inventoryABD || inventoryABD.length === 0) return [];
  const stockMap = new Map<string, ABDInventoryEntry>();
  const branchInventory = inventoryABD.filter(item => (item.branchCode || 'YM') === branchCode);
  const sorted = [...branchInventory].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  sorted.forEach(item => {
    if (!item.noSeri) return;
    if (item.type === 'MASUK') {
      stockMap.set(item.noSeri, item);
    } else {
      stockMap.delete(item.noSeri);
    }
  });

  return Array.from(stockMap.values()).map(item => {
    const sku = item.sku || findABDSku(item.tipeABD, item.model) || '-';
    return {
      inventoryId: item.id,
      sku,
      tipeABD: item.tipeABD,
      model: item.model,
      noSeri: item.noSeri,
      tanggal: item.tanggal,
    };
  });
}

/**
 * Get available ABD items in branch for a specific Sonic Amplifier subtype
 */
export function getAvailableSonicABDStock(
  subtypeName: string,
  inventoryABD: ABDInventoryEntry[],
  branchCode: BranchCode | string
): AvailableABDRow[] {
  const available = getAvailableABDStockInBranch(inventoryABD, branchCode);
  if (available.length === 0) return [];

  const targetSkus = getSonicAmplifierTargetSkus(subtypeName).map(s => s.toUpperCase().trim());
  if (targetSkus.length === 0) return [];

  return available.filter(item => {
    const rawSku = (item.sku || '').toUpperCase().trim();
    const catalogSku = (findABDSku(item.tipeABD, item.model) || '').toUpperCase().trim();

    // 1. Exact SKU match against target SKUs (e.g. T4SBD, T4UBD)
    if (targetSkus.includes(rawSku) || targetSkus.includes(catalogSku)) {
      return true;
    }

    // 2. Strict matching for specific Sonic Amplifier DEMO BTE models
    const itemTipe = (item.tipeABD || '').toUpperCase().trim();
    const itemModel = (item.model || '').toUpperCase().trim();

    if (targetSkus.some(tsku => itemTipe.includes(tsku) || itemModel.includes(tsku))) {
      return true;
    }

    if (targetSkus.includes('T4SBD') && (itemTipe.includes('TREK 40 SP BTE DEMO') || itemTipe.includes('TREK 40 SP DEMO'))) return true;
    if (targetSkus.includes('T4UBD') && (itemTipe.includes('TREK 40 UP BTE DEMO') || itemTipe.includes('TREK 40 UP DEMO'))) return true;
    if (targetSkus.includes('E2OBD') && itemTipe.includes('ENCHANT SE 20 BTE DEMO')) return true;
    if (targetSkus.includes('T8UBD') && itemTipe.includes('TREK 80 UP BTE DEMO')) return true;
    if (targetSkus.includes('A1MRD') && itemTipe.includes('A1 100 MNR DEMO')) return true;
    if (targetSkus.includes('A1DMR') && itemTipe.includes('A1 DEMOFLEX')) return true;

    return false;
  });
}
