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
  const targetSkus = getSonicAmplifierTargetSkus(subtypeName);
  if (targetSkus.length === 0) return [];

  const available = getAvailableABDStockInBranch(inventoryABD, branchCode);
  return available.filter(item => targetSkus.includes(item.sku.toUpperCase()));
}
