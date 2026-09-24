/**
 * Product Normalization Utility
 * Standardizes product names, types, categories, and subtypes
 * for consistent aggregation across dashboards, reports, charts, and transaction records.
 */

import { MASTER_ABD_SKU_LIST } from '../data/skuCatalog';

// 1. ABD Type Normalization
export function normalizeABDTipe(tipe?: string): string {
  if (!tipe) return '';
  const trimmed = tipe.trim();
  const lower = trimmed.toLowerCase();

  // Rule 3: FAST P = signia fast P
  // Any variation of Signia Fast P, FAST P, Fast-P, Signia Fast, Fast P BTE
  if (
    lower === 'fast p' ||
    lower === 'signia fast p' ||
    lower === 'signia fast' ||
    lower === 'fastp' ||
    lower === 'signiafastp' ||
    lower === 'signia fast-p' ||
    lower.includes('fast p') ||
    (lower.includes('signia') && lower.includes('fast'))
  ) {
    return 'FAST P';
  }

  // Related Signia family: FUN SP
  if (
    lower === 'fun sp' ||
    lower === 'signia fun sp' ||
    lower === 'signia fun' ||
    lower === 'funsp' ||
    lower === 'signiafunsp' ||
    (lower.includes('signia') && lower.includes('fun'))
  ) {
    return 'FUN SP';
  }

  // Audio Service HP3 G4
  if (lower.includes('hp3') && (lower.includes('g4') || lower.includes('audio service') || lower.includes('as '))) {
    return 'AS HP3 G4';
  }

  // Check against master SKU list aliases
  for (const item of MASTER_ABD_SKU_LIST) {
    if (item.tipeABD.toLowerCase() === lower) {
      return item.tipeABD;
    }
    if (item.aliasTipe && item.aliasTipe.toLowerCase() === lower) {
      return item.tipeABD;
    }
    if (item.aliases) {
      for (const alias of item.aliases) {
        if (alias.toLowerCase() === lower) {
          return item.tipeABD;
        }
      }
    }
  }

  return trimmed;
}

// 2. Aksesoris Product Normalization
export interface NormalizedAksesoris {
  category: string;
  subtype: string;
  displayName: string;
}

/**
 * Normalizes category and subtype for physical accessories and batteries.
 * Specifically handles:
 * 1. Baterai Alat Bantu Dengar (13 Sonic) = Baterai Alat Bantu Dengar (Baterai 13 Sonic)
 * 2. Baterai Alat Bantu Dengar (Baterai 312 Sonic) = Baterai ABD (Baterai 312 Sonic)
 * Standardizes category to 'Baterai Alat Bantu Dengar' and canonical subtype names.
 */
export function normalizeAksesorisProduct(category?: string, subtype?: string): NormalizedAksesoris {
  const cat = (category || '').trim();
  const sub = (subtype || '').trim();
  const catLower = cat.toLowerCase();
  const subLower = sub.toLowerCase();

  const isBattery = 
    catLower.includes('baterai') || 
    catLower.includes('battery') ||
    subLower.includes('baterai') ||
    subLower.includes('sonic') ||
    subLower.includes('powerone') ||
    subLower.includes('rayovac') ||
    /\b(10|13|312|675)\b/.test(subLower);

  if (isBattery) {
    const canonicalCategory = 'Baterai Alat Bantu Dengar';
    let canonicalSubtype = sub;

    // Detect size and brand
    const hasPowerone = subLower.includes('powerone');
    const hasRayovac = subLower.includes('rayovac');

    if (subLower.includes('13')) {
      if (hasPowerone) {
        canonicalSubtype = 'Baterai 13 Powerone';
      } else {
        // Sonic is default for 13
        canonicalSubtype = 'Baterai 13 Sonic';
      }
    } else if (subLower.includes('312')) {
      if (hasPowerone) {
        canonicalSubtype = 'Baterai 312 Powerone';
      } else if (hasRayovac) {
        canonicalSubtype = '312 RAYOVAC';
      } else {
        // Sonic is default for 312
        canonicalSubtype = 'Baterai 312 Sonic';
      }
    } else if (subLower.includes('675')) {
      if (hasPowerone) {
        canonicalSubtype = 'Baterai 675 Powerone';
      } else {
        canonicalSubtype = 'Baterai 675 Sonic';
      }
    } else if (subLower.includes('10')) {
      if (hasPowerone) {
        canonicalSubtype = 'Baterai 10 Powerone';
      } else {
        canonicalSubtype = 'Baterai 10 Sonic';
      }
    } else if (hasRayovac) {
      canonicalSubtype = '312 RAYOVAC';
    } else if (!canonicalSubtype || canonicalSubtype === 'Std') {
      canonicalSubtype = 'Baterai 13 Sonic';
    }

    return {
      category: canonicalCategory,
      subtype: canonicalSubtype,
      displayName: `${canonicalCategory} (${canonicalSubtype})`
    };
  }

  // Drying Jar normalization
  if (catLower.includes('drying') || subLower.includes('drying')) {
    const canonicalCategory = 'Drying Jar';
    let canonicalSubtype = 'Drying Jar – Standard';
    if (subLower.includes('2.0') || subLower.includes('electric 2')) {
      canonicalSubtype = 'Drying Jar – Electric 2.0';
    } else if (subLower.includes('1.0') || subLower.includes('electric 1')) {
      canonicalSubtype = 'Drying Jar – Electric 1.0';
    }
    return {
      category: canonicalCategory,
      subtype: canonicalSubtype,
      displayName: `${canonicalCategory} (${canonicalSubtype})`
    };
  }

  // Aidtip normalization
  if (catLower.includes('aidtip') || subLower.includes('aidtip')) {
    const canonicalCategory = 'Aidtip';
    let canonicalSubtype = sub || 'Aidtip Size M';
    if (subLower.includes('power dome') && subLower.includes('m')) canonicalSubtype = 'Power Dome M';
    else if (subLower.includes('power dome') && subLower.includes('l')) canonicalSubtype = 'Power Dome L';
    else if (subLower.includes('size s') || subLower.includes('size-s') || subLower === 's') canonicalSubtype = 'Aidtip Size S';
    else if (subLower.includes('size m') || subLower.includes('size-m') || subLower === 'm') canonicalSubtype = 'Aidtip Size M';
    else if (subLower.includes('size l') || subLower.includes('size-l') || subLower === 'l') canonicalSubtype = 'Aidtip Size L';
    else if (subLower.includes('set')) canonicalSubtype = 'Aidtip Set';

    return {
      category: canonicalCategory,
      subtype: canonicalSubtype,
      displayName: `${canonicalCategory} (${canonicalSubtype})`
    };
  }

  // Default fallback for other items
  const resolvedCategory = cat || 'Aksesoris ABD';
  const resolvedSubtype = sub || 'Std';
  return {
    category: resolvedCategory,
    subtype: resolvedSubtype,
    displayName: `${resolvedCategory} (${resolvedSubtype})`
  };
}
