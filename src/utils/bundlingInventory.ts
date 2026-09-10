import { ABDTransaction, AksesorisInventoryEntry } from '../types';
import { findAksesorisSku, getAksesorisBySku } from '../data/skuCatalog';

export interface BundlingStockItem {
  sku?: string;
  tipe: string;
  qty: number;
  kategori: string;
}

/**
 * Returns list of accessory stock items that are consumed by a bundling package
 */
export function getBundlingStockItems(paketName: string, isBinaural: boolean, abdType?: string): BundlingStockItem[] {
  const earmouldQty = isBinaural ? 2 : 1;

  // Determine battery type based on ABD model if detectable
  let batterySku = 'S13SN';
  let batteryName = 'Baterai 13 Sonic';
  if (abdType) {
    const lower = abdType.toLowerCase();
    if (lower.includes('675') || lower.includes('captivate 20 bte') || lower.includes('captivate 40 bte') || lower.includes('captivate 80 bte')) {
      batterySku = 'S675N';
      batteryName = 'Baterai 675 Sonic';
    } else if (lower.includes('312') || lower.includes('minirite') || lower.includes('itc')) {
      batterySku = 'S312N';
      batteryName = 'Baterai 312 Sonic';
    } else if (lower.includes('10') || lower.includes('cic')) {
      batterySku = 'S10SN';
      batteryName = 'Baterai 10 Sonic';
    }
  }

  // Earmould is custom fabricated in Lab Earmould (tracked via EarmouldReport),
  // so it does NOT require or deduct physical warehouse stock.

  if (paketName === 'Basic') {
    return [
      { sku: batterySku, tipe: batteryName, qty: 1, kategori: 'Baterai ABD' },
      { sku: 'ATSET', tipe: 'Aidtip Set', qty: 1, kategori: 'Aidtip & Earmould' },
    ];
  }

  if (paketName === 'Essential') {
    return [
      { sku: 'DRY01', tipe: 'Drying Jar – Standard', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: 'BATCK', tipe: 'Baterai Checker', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: batterySku, tipe: batteryName, qty: 1, kategori: 'Baterai ABD' },
      { sku: 'ATSET', tipe: 'Aidtip Set', qty: 1, kategori: 'Aidtip & Earmould' },
      { sku: 'BLW01', tipe: 'Blower', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: 'RET01', tipe: 'HA Retainer / Gantungan ABD', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: 'POU01', tipe: 'Earsound Pouch', qty: 1, kategori: 'Aksesoris ABD' },
    ];
  }

  if (paketName === 'Exclusive') {
    return [
      { sku: 'DRY10', tipe: 'Drying Jar – Electric 1.0', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: 'BATCK', tipe: 'Baterai Checker', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: batterySku, tipe: batteryName, qty: 4, kategori: 'Baterai ABD' },
      { sku: 'ATSET', tipe: 'Aidtip Set', qty: 1, kategori: 'Aidtip & Earmould' },
      { sku: 'BLW01', tipe: 'Blower', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: 'RET01', tipe: 'HA Retainer / Gantungan ABD', qty: 1, kategori: 'Aksesoris ABD' },
      { sku: 'POU01', tipe: 'Earsound Pouch', qty: 1, kategori: 'Aksesoris ABD' },
    ];
  }

  return [];
}

/**
 * Generate Aksesoris inventory deduction records for Bundling package in ABD sales
 */
export function generateBundlingInventoryEntries(
  tx: ABDTransaction,
  branchCode: string
): AksesorisInventoryEntry[] {
  if (!tx.paketBundling) return [];

  const isBinaural = tx.fittingType === 'Binaural' || !!tx.tipeABD2;
  const stockItems = getBundlingStockItems(tx.paketBundling, isBinaural, tx.tipeABD);

  return stockItems.map((item, index) => {
    const itemSku = item.sku || findAksesorisSku(item.tipe, item.kategori);
    const master = (itemSku && itemSku !== '-') ? getAksesorisBySku(itemSku) : undefined;
    const finalTipe = master?.nama || item.tipe;
    const finalKategori = master?.kategori || item.kategori;
    const finalSku = master?.sku || (itemSku && itemSku !== '-' ? itemSku : undefined);

    return {
      id: `inv-aks-bundle-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'KELUAR_TERJUAL',
      tanggal: tx.tanggal || new Date().toISOString().split('T')[0],
      sumberTujuan: tx.namaPasien || 'Pasien',
      kategori: finalKategori,
      tipe: finalTipe,
      sku: finalSku,
      qty: item.qty,
      keterangan: `Item Bundling [${tx.paketBundling}] - ${finalTipe} (${item.qty} pcs) | Pasien: ${tx.namaPasien || '-'} | Faktur: ${tx.nomorFakturPenjualan || '-'}`,
      noInvoice: tx.nomorFakturPenjualan,
      namaCustomer: tx.namaPasien,
      cabangTujuan: branchCode,
      branchCode: branchCode || 'YM'
    };
  });
}
