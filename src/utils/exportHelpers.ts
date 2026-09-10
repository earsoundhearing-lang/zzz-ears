import { 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  AksesorisTransaction, 
  KasKecilEntry, 
  ReparasiService,
  Patient,
  ABDInventoryEntry,
  AksesorisInventoryEntry,
  EarmouldReport
} from '../types';
import { formatIndoDate, formatRupiah } from './formatters';
import { getBranchByCode } from './branches';
import { findABDSku, findAksesorisSku } from '../data/skuCatalog';

/**
 * Escapes values for safe CSV formatting (handles quotes, commas, newlines)
 */
function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a browser download of a CSV file with UTF-8 BOM
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  const csvContent = '\uFEFF' + headerRow + '\n' + dataRows;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. Export Jasa Periksa
export function exportJasaPeriksaCSV(
  transactions: JasaPeriksaTransaction[],
  patients: Patient[],
  periodLabel: string = 'Semua Periode',
  branchCode?: string
) {
  const branchName = branchCode ? getBranchByCode(branchCode).name : 'Semua Cabang';
  const filename = `Laporan_Jasa_Periksa_${branchCode || 'All'}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

  const headers = [
    'No. Kwitansi',
    'Tanggal',
    'ID Pasien',
    'Nama',
    'Cabang',
    'Audiometris',
    'Jenis Pemeriksaan',
    'Biaya Pemeriksaan',
    'Sumber Referal',
    'Hasil',
    'Trial/Fitting ABD',
    'Potensi Leads ABD',
    'Catatan Khusus HAC',
    'Metode Pembayaran'
  ];

  const rows: any[][] = [];

  transactions.forEach((t) => {
    const patient = patients.find(p => p.id === t.idPelanggan);
    let referal = patient?.referal || '-';
    if (referal === 'Dokter Umum dan Dokter Spesialis' && patient?.namaDokter) {
      referal = patient.namaDokter;
    }

    let paymentMethod = 'Cash';
    if (t.payment) {
      if (t.payment.method === 'Transfer') {
        paymentMethod = `TF ${t.payment.bsiAccount || ''}`.trim();
      } else if (t.payment.method === 'Piutang BPJS') {
        paymentMethod = `BPJS ${t.payment.namaRSBPJS || ''}`.trim();
      } else if (t.payment.method === 'Piutang RS/Klinik/Laboratorium') {
        paymentMethod = t.payment.namaFaskes || 'Piutang RS/Klinik/Lab';
      }
    }

    const branch = t.branchCode ? getBranchByCode(t.branchCode).name : branchName;

    const pemeriksaanItems: { jenis: string, biaya: number }[] = [];
    if (t.examinationItems && t.examinationItems.length > 0) {
      t.examinationItems.forEach(item => {
        pemeriksaanItems.push({ jenis: item.jenis, biaya: item.biaya });
      });
    } else {
      if (Array.isArray(t.jenisPemeriksaan)) {
        t.jenisPemeriksaan.forEach((j, i) => {
           pemeriksaanItems.push({ jenis: j, biaya: i === 0 ? (t.subtotalBiaya || t.biayaJasaPeriksa) : 0 });
        });
      } else if (t.jenisPemeriksaan) {
        pemeriksaanItems.push({ jenis: t.jenisPemeriksaan, biaya: t.biayaJasaPeriksa });
      }
    }

    if (pemeriksaanItems.length === 0) {
      // Fallback
      rows.push([
        t.nomorKwitansi,
        t.tanggal,
        t.idPelanggan,
        t.namaCustomer,
        branch,
        t.audiometris || '-',
        '-',
        t.biayaJasaPeriksa,
        referal,
        '-',
        t.adaFittingABD ? (t.tipeABDFitting || 'Ya (Trial ABD)') : 'Tidak',
        t.potensiPembelian || '-',
        t.catatanHAC || '-',
        paymentMethod
      ]);
      return;
    }

    pemeriksaanItems.forEach((item) => {
      let hasil = '-';
      const lowerJenis = item.jenis.toLowerCase();
      if (lowerJenis.includes('audiometri') || lowerJenis.includes('fft')) {
        hasil = `R : ${t.resultKananDb || '-'} dB dan L : ${t.resultKiriDb || '-'} dB`;
      } else if (lowerJenis.includes('tympanometri') || lowerJenis.includes('tympanometry')) {
        hasil = t.resultTympanometri || '-';
      } else if (lowerJenis.includes('oae')) {
        hasil = t.resultOAE || '-';
      } else if (lowerJenis.includes('bera')) {
        hasil = t.resultBERA || '-';
      } else {
        hasil = t.catatanHasil || '-';
      }

      rows.push([
        t.nomorKwitansi,
        t.tanggal,
        t.idPelanggan,
        t.namaCustomer,
        branch,
        t.audiometris || '-',
        item.jenis,
        item.biaya,
        referal,
        hasil,
        t.adaFittingABD ? (t.tipeABDFitting || 'Ya (Trial ABD)') : 'Tidak',
        t.potensiPembelian || '-',
        t.catatanHAC || '-',
        paymentMethod
      ]);
    });
  });

  downloadCSV(filename, headers, rows);
}

// 2. Export ABD
export function exportABDCSV(
  transactions: ABDTransaction[],
  patients: Patient[],
  periodLabel: string = 'Semua Periode',
  branchCode?: string
) {
  const branchName = branchCode ? getBranchByCode(branchCode).name : 'Semua Cabang';
  const filename = `Laporan_Penjualan_ABD_${branchCode || 'All'}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

  const headers = [
    'No. Invoice',
    'Tanggal',
    'ID Pasien',
    'Nama',
    'Cabang',
    'Konsultan',
    'SKU',
    'Tipe ABD',
    'QTY',
    'No. Seri',
    'Harga',
    'Diskon',
    'Jumlah',
    'Sumber Referal',
    'Paket Bundling',
    'Metode Pembayaran'
  ];

  const rows: any[][] = [];

  transactions.forEach((t) => {
    const patient = patients.find(p => p.id === t.idPelanggan);
    let referal = patient?.referal || '-';
    if (referal === 'Dokter Umum dan Dokter Spesialis' && patient?.namaDokter) {
      referal = patient.namaDokter;
    }

    let paymentMethod = 'Cash';
    if (t.payment) {
      if (t.payment.method === 'Transfer') {
        paymentMethod = `TF ${t.payment.bsiAccount || ''}`.trim();
      } else if (t.payment.method === 'Piutang BPJS') {
        paymentMethod = `BPJS ${t.payment.namaRSBPJS || ''}`.trim();
      } else if (t.payment.method === 'Piutang RS/Klinik/Laboratorium') {
        paymentMethod = t.payment.namaFaskes || 'Piutang RS/Klinik/Lab';
      }
    }

    const branch = t.branchCode ? getBranchByCode(t.branchCode).name : branchName;

    const isBinaural = t.fittingType === 'Binaural' || !!t.tipeABD2;
    const itemCount = isBinaural ? 2 : 1;

    // Distribute bundling and discount evenly across items if binaural
    const bundlingPerItem = (t.hargaBundling || 0) / itemCount;
    const diskonPerItem = (t.diskon || 0) / itemCount;

    // Item 1
    const hargaJual1 = (t.hargaABD1 || 0);
    const jumlahNet1 = hargaJual1 + bundlingPerItem - diskonPerItem;
    const sku1 = t.skuABD1 || t.sku || findABDSku(t.tipeABD, t.modelABD);
    
    rows.push([
      t.nomorFakturPenjualan,
      t.tanggal,
      t.idPelanggan,
      t.namaPasien,
      branch,
      t.hac || '-',
      sku1,
      `${t.tipeABD} (${t.modelABD || 'BTE'})`,
      1, // QTY per baris
      t.nomorSeriABD || '-',
      hargaJual1,
      diskonPerItem,
      jumlahNet1,
      referal,
      t.paketBundling || 'Tanpa Bundling',
      paymentMethod
    ]);

    // Item 2 (if Binaural)
    if (isBinaural) {
      const hargaJual2 = (t.hargaABD2 || 0);
      const jumlahNet2 = hargaJual2 + bundlingPerItem - diskonPerItem;
      const sku2 = t.skuABD2 || t.sku2 || findABDSku(t.tipeABD2 || '', t.modelABD2);
      
      rows.push([
        t.nomorFakturPenjualan,
        t.tanggal,
        t.idPelanggan,
        t.namaPasien,
        branch,
        t.hac || '-',
        sku2,
        `${t.tipeABD2 || '-'} (${t.modelABD2 || 'BTE'})`,
        1, // QTY per baris
        t.nomorSeriABD2 || '-',
        hargaJual2,
        diskonPerItem,
        jumlahNet2,
        referal,
        t.paketBundling || 'Tanpa Bundling',
        paymentMethod
      ]);
    }
  });

  downloadCSV(filename, headers, rows);
}

// 3. Export Aksesoris
export function exportAksesorisCSV(
  transactions: AksesorisTransaction[],
  periodLabel: string = 'Semua Periode',
  branchCode?: string
) {
  const branchName = branchCode ? getBranchByCode(branchCode).name : 'Semua Cabang';
  const filename = `Laporan_Penjualan_Aksesoris_${branchCode || 'All'}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

  const headers = [
    'No. Invoice',
    'Tanggal',
    'ID Pasien',
    'Nama',
    'Cabang',
    'SKU',
    'Item Aksesoris',
    'QTY',
    'Harga',
    'Jumlah',
    'Metode Pembayaran',
    'Petugas'
  ];

  const rows: any[][] = [];

  transactions.forEach((t) => {
    let paymentMethod = 'Cash';
    if (t.payment) {
      if (t.payment.method === 'Transfer') {
        paymentMethod = `TF ${t.payment.bsiAccount || ''}`.trim();
      } else if (t.payment.method === 'Piutang BPJS') {
        paymentMethod = `BPJS ${t.payment.namaRSBPJS || ''}`.trim();
      } else if (t.payment.method === 'Piutang RS/Klinik/Laboratorium') {
        paymentMethod = t.payment.namaFaskes || 'Piutang RS/Klinik/Lab';
      }
    }

    const branch = t.branchCode ? getBranchByCode(t.branchCode).name : branchName;

    if (t.items && t.items.length > 0) {
      const diskonPerItem = (t.diskon || 0) / t.items.length;
      t.items.forEach((item) => {
        const itemSku = item.sku || findAksesorisSku(item.subtype || item.category, item.category);
        const itemName = `${item.category} (${item.subtype || '-'})`;
        const itemJumlah = item.subtotal - diskonPerItem;

        rows.push([
          t.nomorFaktur,
          t.tanggal,
          t.idPelanggan,
          t.namaCustomer,
          branch,
          itemSku,
          itemName,
          item.qty,
          item.hargaJual,
          itemJumlah, // Use item's subtotal minus proportional discount
          paymentMethod,
          t.staffUser || 'Staff'
        ]);
      });
    } else {
      const itemSku = findAksesorisSku(t.subtype || t.category, t.category);
      const itemName = `${t.category} (${t.subtype || '-'})`;
      rows.push([
        t.nomorFaktur,
        t.tanggal,
        t.idPelanggan,
        t.namaCustomer,
        branch,
        itemSku,
        itemName,
        t.qty,
        t.hargaJual,
        t.jumlah,
        paymentMethod,
        t.staffUser || 'Staff'
      ]);
    }
  });

  downloadCSV(filename, headers, rows);
}

// 4. Export Kas Kecil
export function exportKasKecilCSV(
  entries: KasKecilEntry[],
  periodLabel: string = 'Semua Periode',
  branchCode?: string
) {
  const branchName = branchCode ? getBranchByCode(branchCode).name : 'Semua Cabang';
  const filename = `Laporan_Kas_Kecil_${branchCode || 'All'}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

  const headers = [
    'Tanggal',
    'Keterangan Keperluan',
    'Jenis Transaksi',
    'Jenis Pengeluaran Operasional',
    'Penambahan Kas (+) Rp',
    'Pengeluaran Kas (-) Rp',
    'Saldo Kas Kecil (Rp)',
    'Pemberi Kas',
    'Penerima Kas',
    'Pengeluar Kas',
    'No. Bukti / Bon / Lampiran',
    'Cabang'
  ];

  const rows = entries.map((e) => [
    e.tanggal,
    e.keterangan,
    (e.penambahanKas || 0) > 0 ? 'PENAMBAHAN / TOP-UP' : 'PENGELUARAN',
    e.jenisPengeluaran || '-',
    e.penambahanKas || 0,
    e.pengeluaran || 0,
    e.saldo || 0,
    e.pemberiKas || '-',
    e.penerimaKas || '-',
    e.pengeluarKas || '-',
    e.buktiPengeluaran || '-',
    e.branchCode ? getBranchByCode(e.branchCode).name : branchName
  ]);

  downloadCSV(filename, headers, rows);
}

// 5. Export Reparasi & Service
export function exportReparasiCSV(
  reparasiList: ReparasiService[],
  periodLabel: string = 'Semua Periode',
  branchCode?: string
) {
  const branchName = branchCode ? getBranchByCode(branchCode).name : 'Semua Cabang';
  const filename = `Laporan_Reparasi_Service_${branchCode || 'All'}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

  const headers = [
    'No. Servis / Tiket',
    'ID Pasien',
    'Nama Pasien',
    'Jenis / Tipe ABD',
    'Nomor Seri',
    'Status Garansi',
    'Keluhan Kerusakan',
    'Tanggal Masuk Servis',
    'Tanggal Masuk Lab',
    'Tanggal Konfirmasi Biaya',
    'Tanggal Selesai',
    'Status Reparasi',
    'Keterangan / Diagnosa Teknis',
    'Cabang'
  ];

  const rows = reparasiList.map((r) => [
    r.id,
    r.idPelanggan,
    r.namaPelanggan,
    r.jenisABD,
    r.nomorSeri,
    r.garansi ? 'Masih Garansi' : 'Habis Garansi',
    r.keluhan,
    r.tanggalMasuk,
    r.tanggalMasukLab || '-',
    r.tanggalKonfirmasi || '-',
    r.tanggalSelesai || '-',
    r.status,
    r.keterangan || '-',
    r.branchCode ? getBranchByCode(r.branchCode).name : branchName
  ]);

  downloadCSV(filename, headers, rows);
}

// 6. Export Laporan Cetak & Lab Earmould
export function exportEarmouldCSV(
  earmouldList: EarmouldReport[],
  periodLabel: string = 'Semua Periode',
  branchCode?: string
) {
  const branchName = branchCode ? getBranchByCode(branchCode).name : 'Semua Cabang';
  const filename = `Laporan_Earmould_${branchCode || 'All'}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

  const headers = [
    'No. Tiket / ID',
    'ID Pasien',
    'Nama Pasien',
    'Jenis Earmould',
    'Sisi / QTY',
    'Tanggal Cetak',
    'Tanggal Kirim Lab',
    'Tanggal Masuk Lab',
    'Tanggal Selesai',
    'Tanggal Diambil',
    'Status Earmould',
    'Catatan / Keterangan',
    'Cabang'
  ];

  const rows = earmouldList.map((e) => [
    e.id,
    e.idPelanggan,
    e.namaPelanggan,
    e.jenisEarmould,
    e.qty,
    e.tanggalCetak,
    e.tanggalKirim || '-',
    e.tanggalMasukLab || '-',
    e.tanggalSelesai || '-',
    e.tanggalDiambil || '-',
    e.status,
    e.catatan || '-',
    e.branchCode ? getBranchByCode(e.branchCode).name : branchName
  ]);

  downloadCSV(filename, headers, rows);
}

// 7. Export Laporan Stok Inventori ABD (Konsolidasi Masuk, Terjual & Retur)
export function exportABDInventoryCSV(
  consolidatedItems: {
    noSeri: string;
    tipeABD: string;
    model: string;
    sku?: string;
    tanggalMasuk: string;
    sumber: string;
    keteranganMasuk: string;
    tanggalTerjual: string;
    noInvoice: string;
    namaCustomer: string;
    cabangTerjual: string;
    tanggalRetur: string;
    tujuanRetur: string;
    alasanRetur: string;
  }[],
  branchCode?: string
) {
  const branchName = branchCode && branchCode !== 'ALL' ? getBranchByCode(branchCode).name : 'Semua Cabang & Gudang';
  const filename = `Laporan_Stok_Inventori_ABD_${branchCode || 'All'}_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = [
    'No. Seri',
    'SKU',
    'Tipe ABD',
    'Model',
    'Status Stok',
    'Tgl Masuk',
    'Sumber Pengirim',
    'Ket Masuk',
    'Tgl Terjual',
    'No. Invoice Terjual',
    'Nama Customer',
    'Cabang Terjual',
    'Tgl Mutasi',
    'Tujuan Mutasi',
    'Alasan Mutasi',
    'Cabang / Gudang'
  ];

  const rows = consolidatedItems.map((item) => {
    let statusStok = 'Tersedia di Stok';
    if (item.tanggalRetur && item.tanggalRetur !== '-') {
      statusStok = 'Dimutasi';
    } else if (item.tanggalTerjual && item.tanggalTerjual !== '-') {
      statusStok = 'Terjual';
    }
    const sku = item.sku || findABDSku(item.tipeABD, item.model);

    return [
      item.noSeri,
      sku,
      item.tipeABD,
      item.model,
      statusStok,
      item.tanggalMasuk || '-',
      item.sumber || '-',
      item.keteranganMasuk || '-',
      item.tanggalTerjual || '-',
      item.noInvoice || '-',
      item.namaCustomer || '-',
      item.cabangTerjual || '-',
      item.tanggalRetur || '-',
      item.tujuanRetur || '-',
      item.alasanRetur || '-',
      branchName
    ];
  });

  downloadCSV(filename, headers, rows);
}

// 8. Export Ringkasan Saldo Stok Aksesoris
export function exportAksesorisInventorySummaryCSV(
  summaryList: {
    kategori: string;
    tipe: string;
    sku?: string;
    totalMasuk: number;
    totalKeluar: number;
    sisaStok: number;
  }[],
  branchCode?: string
) {
  const branchName = branchCode && branchCode !== 'ALL' ? getBranchByCode(branchCode).name : 'Semua Cabang & Gudang';
  const filename = `Ringkasan_Saldo_Stok_Aksesoris_${branchCode || 'All'}_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = [
    'SKU',
    'Kategori',
    'Nama Produk / Tipe',
    'Total Stok Masuk',
    'Total Keluar (Terjual/Mutasi)',
    'Sisa Saldo Stok',
    'Status Ketersediaan',
    'Cabang / Gudang'
  ];

  const rows = summaryList.map((item) => {
    let status = 'Tersedia';
    if (item.sisaStok <= 0) status = 'Habis';
    else if (item.sisaStok <= 3) status = 'Menipis';
    const sku = item.sku || findAksesorisSku(item.tipe, item.kategori);

    return [
      sku,
      item.kategori,
      item.tipe,
      item.totalMasuk,
      item.totalKeluar,
      item.sisaStok,
      status,
      branchName
    ];
  });

  downloadCSV(filename, headers, rows);
}

// 9. Export Riwayat Mutasi Lengkap Inventori Aksesoris
export function exportAksesorisInventoryMutationsCSV(
  entries: AksesorisInventoryEntry[],
  branchCode?: string
) {
  const branchName = branchCode && branchCode !== 'ALL' ? getBranchByCode(branchCode).name : 'Semua Cabang & Gudang';
  const filename = `Riwayat_Mutasi_Stok_Aksesoris_${branchCode || 'All'}_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = [
    'ID Transaksi Stok',
    'Tanggal',
    'Jenis Mutasi',
    'Sumber / Tujuan',
    'SKU',
    'Kategori Aksesoris',
    'Tipe Produk',
    'QTY (Jumlah)',
    'Keterangan / Terjual Ke',
    'Cabang'
  ];

  const sorted = [...entries].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const rows = sorted.map((item) => {
    let keterangan = item.keterangan || '-';
    if (!item.keterangan && item.type === 'KELUAR_TERJUAL') {
      keterangan = `INV: ${item.noInvoice || '-'} - ${item.namaCustomer || '-'}`;
    }
    const sku = item.sku || findAksesorisSku(item.tipe, item.kategori);

    return [
      item.id,
      item.tanggal,
      item.type,
      item.sumberTujuan || item.cabangTujuan || '-',
      sku,
      item.kategori,
      item.tipe,
      item.qty,
      keterangan,
      item.branchCode ? getBranchByCode(item.branchCode).name : branchName
    ];
  });

  downloadCSV(filename, headers, rows);
}

