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
