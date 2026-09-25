/**
 * Utility functions for formatting and calculations in Earsound App
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function terbilang(nominal: number): string {
  if (isNaN(nominal) || nominal < 0) return 'Nol Rupiah';
  if (nominal === 0) return 'Nol Rupiah';

  const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function bilang(n: number): string {
    if (n < 12) return angka[n];
    if (n < 20) return bilang(n - 10) + ' Belas';
    if (n < 100) return bilang(Math.floor(n / 10)) + ' Puluh ' + bilang(n % 10);
    if (n < 200) return 'Seratus ' + bilang(n - 100);
    if (n < 1000) return bilang(Math.floor(n / 100)) + ' Ratus ' + bilang(n % 100);
    if (n < 2000) return 'Seribu ' + bilang(n - 1000);
    if (n < 1000000) return bilang(Math.floor(n / 1000)) + ' Ribu ' + bilang(n % 1000);
    if (n < 1000000000) return bilang(Math.floor(n / 1000000)) + ' Juta ' + bilang(n % 1000000);
    if (n < 1000000000000) return bilang(Math.floor(n / 1000000000)) + ' Miliar ' + bilang(n % 1000000000);
    return String(n);
  }

  const hasil = bilang(nominal).replace(/\s+/g, ' ').trim();
  return `${hasil} Rupiah`;
}

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function formatIndoDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = parseDateParts(dateString);
    if (parts) {
      const monthNamesIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${parts.day} ${monthNamesIndo[parts.month]} ${parts.year}`;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function generatePatientId(seq: number, branchCode: string = 'HQ'): string {
  const cleanBranch = branchCode && branchCode !== 'ALL' ? branchCode : 'HQ';
  const padded = String(seq + 1).padStart(5, '0');
  return `ES-${cleanBranch}-${padded}`;
}

export function generateFakturNumber(type: 'AKS' | 'ABD', seq: number): string {
  const padded = String(seq + 1).padStart(4, '0');
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `FKT-${type}/2026${month}/${padded}`;
}

export function generateKwitansiNumber(seq: number): string {
  const padded = String(seq + 1).padStart(4, '0');
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `KWT-JSA/2026${month}/${padded}`;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateParts(dateStr?: string | null): { year: number; month: number; day: number } | null {
  if (!dateStr || !dateStr.trim()) return null;
  const clean = dateStr.split('T')[0].trim();

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(clean)) {
    const p = clean.split(/[-/]/);
    const y = parseInt(p[0], 10);
    const m = parseInt(p[1], 10) - 1; // 0-indexed month
    const d = parseInt(p[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // 2. Text month format e.g. "1 September 2026", "01-Sep-2026", "01 September 2026", "1 Jan 2026"
  const monthMap: { [k: string]: number } = {
    jan: 0, januari: 0, january: 0,
    feb: 1, februari: 1, february: 1,
    mar: 2, maret: 2, march: 2,
    apr: 3, april: 3,
    mei: 4, may: 4,
    jun: 5, juni: 5, june: 5,
    jul: 6, juli: 6, july: 6,
    agu: 7, agust: 7, agustus: 7, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    okt: 9, oktober: 9, oct: 9, october: 9,
    nov: 10, november: 10,
    des: 11, desember: 11, dec: 11, december: 11,
  };

  const textMatch = clean.match(/^(\d{1,2})[\s\/-]+([a-zA-Z]+)[\s\/-]+(\d{2,4})$/);
  if (textMatch) {
    const d = parseInt(textMatch[1], 10);
    const mKey = textMatch[2].toLowerCase();
    let y = parseInt(textMatch[3], 10);
    if (y < 100) y += 2000;
    if (monthMap[mKey] !== undefined && d >= 1 && d <= 31) {
      return { year: y, month: monthMap[mKey], day: d };
    }
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY (Indonesian standard)
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(clean)) {
    const p = clean.split(/[-/]/);
    let d = parseInt(p[0], 10);
    let m = parseInt(p[1], 10) - 1; // 0-indexed month
    let y = parseInt(p[2], 10);
    if (y < 100) y += 2000;

    if (m > 11 && d <= 12) {
      const temp = d;
      d = m + 1;
      m = temp - 1;
    }
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // 4. Fallback to Javascript standard Date parsing
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
      };
    }
  } catch (e) {}

  return null;
}

export function isSalesTransaction(item: any): boolean {
  if (!item) return false;

  const fieldsToCheck = [
    item.category,
    item.subtype,
    Array.isArray(item.jenisPemeriksaan) ? item.jenisPemeriksaan.join(' ') : item.jenisPemeriksaan,
    item.tipeABD,
    item.caseType,
    item.transaksiItem,
    item.catatan,
    item.catatanHasil,
    item.keterangan
  ];

  const text = fieldsToCheck.filter(Boolean).join(' ').toLowerCase();

  if (
    text.includes('uang masuk') ||
    text.includes('kas masuk') ||
    text.includes('pelunasan piutang') ||
    text.includes('pelunasan') ||
    text.includes('dp / pelunasan')
  ) {
    return false;
  }

  return true;
}

export function formatPatientWithGelar(name?: string, gelar?: string): string {
  if (!name) return '-';
  const trimmed = name.trim();
  if (!gelar) return trimmed;
  const cleanGelar = gelar.replace(/\.$/, '').trim();
  if (!cleanGelar) return trimmed;

  const lowerName = trimmed.toLowerCase();
  const lowerGelar = cleanGelar.toLowerCase();
  if (lowerName.startsWith(lowerGelar)) {
    return trimmed;
  }

  const separator = cleanGelar === 'Ibu' ? ' ' : '. ';
  return `${cleanGelar}${separator}${trimmed}`;
}
