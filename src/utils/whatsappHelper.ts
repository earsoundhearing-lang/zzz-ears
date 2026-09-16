import { AksesorisTransaction, JasaPeriksaTransaction, ABDTransaction, Patient } from '../types';
import { getBranchByCode } from './branches';
import { formatIndoDate, formatRupiah, formatPatientWithGelar } from './formatters';

/**
 * Normalizes phone number into clean international format (e.g. 628123456789)
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters
  let clean = phone.replace(/\D/g, '');
  if (!clean) return '';

  // 08xx -> 628xx
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    // 8xx -> 628xx
    clean = '62' + clean;
  }
  return clean;
}

interface GenerateWhatsAppReceiptOptions {
  transaction: AksesorisTransaction | JasaPeriksaTransaction | ABDTransaction;
  type: 'AKS' | 'JSA' | 'ABD';
  patient?: Patient;
}

/**
 * Generates structured, professional WhatsApp receipt message
 */
export function generateWhatsAppReceiptMessage({
  transaction,
  type,
  patient,
}: GenerateWhatsAppReceiptOptions): string {
  const branchInfo = getBranchByCode(transaction.branchCode);
  const isAksesoris = type === 'AKS';
  const isJasa = type === 'JSA';
  const isABD = type === 'ABD';

  const aks = isAksesoris ? (transaction as AksesorisTransaction) : null;
  const jsa = isJasa ? (transaction as JasaPeriksaTransaction) : null;
  const abd = isABD ? (transaction as ABDTransaction) : null;

  const isAbdDP = isABD && (abd?.uangMuka || 0) > 0 && (abd?.sisaPembayaran || 0) > 0;

  const docTitle = isJasa
    ? 'KWITANSI JASA PERIKSA'
    : isABD
    ? isAbdDP
      ? 'KWITANSI TANDA TERIMA UANG MUKA (DP)'
      : 'FAKTUR PENJUALAN ALAT BANTU DENGAR'
    : 'FAKTUR PENJUALAN AKSESORIS';

  const refNumber = isAksesoris
    ? aks?.nomorFaktur
    : isJasa
    ? jsa?.nomorKwitansi
    : abd?.nomorFakturPenjualan;

  const rawName = isAksesoris
    ? aks?.namaCustomer
    : isJasa
    ? jsa?.namaCustomer
    : abd?.namaPasien;

  const patientGelar = patient?.gelar || (transaction as any)?.gelar;
  const displayName = formatPatientWithGelar(rawName, patientGelar);
  const patientId = isAksesoris ? aks?.idPelanggan : isJasa ? jsa?.idPelanggan : abd?.idPelanggan;

  const staffName = isAksesoris
    ? aks?.staffUser || 'Kasir Cabang'
    : isJasa
    ? jsa?.audiometris || 'Audiometris'
    : abd?.hac || 'HAC Cabang';

  const lines: string[] = [];

  // Header
  lines.push(`*EARSOUND HEARING CARE*`);
  lines.push(`_Pusat Alat Bantu Dengar & Pelayanan Pendengaran Profesional_`);
  lines.push(`Cabang: *${branchInfo.name}*`);
  lines.push(`Alamat: ${branchInfo.address}`);
  if (branchInfo.phone) {
    lines.push(`Kontak/WA Cabang: ${branchInfo.phone}`);
  }
  lines.push(`------------------------------------------`);

  // Document Info
  lines.push(`*${docTitle}*`);
  lines.push(`No. Dokumen: *${refNumber || '-'}*`);
  lines.push(`Tanggal: ${formatIndoDate(transaction.tanggal)}`);
  lines.push(``);

  // Customer Info
  lines.push(`*Kepada Yth:* ${displayName}`);
  lines.push(`ID Pasien: ${patientId || '-'}`);
  lines.push(`Petugas/Konsultan: ${staffName}`);
  lines.push(`------------------------------------------`);

  // Items breakdown
  if (isJasa && jsa) {
    lines.push(`*Rincian Jasa Pemeriksaan:*`);
    if (jsa.examinationItems && jsa.examinationItems.length > 0) {
      jsa.examinationItems.forEach((item) => {
        lines.push(`• ${item.jenis}: ${formatRupiah(item.biaya)}`);
      });
    } else if (jsa.jenisPemeriksaan && jsa.jenisPemeriksaan.length > 0) {
      jsa.jenisPemeriksaan.forEach((jp) => {
        lines.push(`• ${jp}`);
      });
    } else {
      lines.push(`• Pemeriksaan Pendengaran: ${formatRupiah(jsa.biayaJasaPeriksa)}`);
    }

    // Audiometry results if present
    if (jsa.resultKananDb || jsa.resultKiriDb) {
      lines.push(``);
      lines.push(`*Ringkasan Hasil:*`);
      if (jsa.resultKananDb) lines.push(`- Telinga Kanan: ${jsa.resultKananDb} dB`);
      if (jsa.resultKiriDb) lines.push(`- Telinga Kiri: ${jsa.resultKiriDb} dB`);
    }
    if (jsa.resultTympanometri) {
      lines.push(`- Tympanometri: ${jsa.resultTympanometri}`);
    }
    if (jsa.resultOAE) {
      lines.push(`- OAE: ${jsa.resultOAE}`);
    }
    if (jsa.resultBERA) {
      lines.push(`- BERA: ${jsa.resultBERA}`);
    }
    if (jsa.catatanHasil) {
      lines.push(`- Catatan: ${jsa.catatanHasil}`);
    }

    lines.push(``);
    if ((jsa.subtotalBiaya || 0) > 0 && (jsa.diskon || 0) > 0) {
      lines.push(`Subtotal: ${formatRupiah(jsa.subtotalBiaya || 0)}`);
      lines.push(`Diskon/Potongan: -${formatRupiah(jsa.diskon || 0)}`);
    }
    lines.push(`*Total Pembayaran: ${formatRupiah(jsa.biayaJasaPeriksa)}*`);
  } else if (isABD && abd) {
    lines.push(`*Rincian Alat Bantu Dengar:*`);
    lines.push(`• Tipe Unit 1: ${abd.tipeABD || '-'} ${abd.modelABD ? `(${abd.modelABD})` : ''}`);
    if (abd.skuABD1 || abd.sku) {
      lines.push(`  SKU: ${abd.skuABD1 || abd.sku}`);
    }
    lines.push(`  No. Seri / SN: ${abd.nomorSeriABD || '-'}`);
    lines.push(`  Harga Unit 1: ${formatRupiah(abd.hargaABD1 || abd.hargaJual || 0)}`);

    if (abd.fittingType === 'Binaural' && (abd.tipeABD2 || abd.nomorSeriABD2)) {
      lines.push(`• Tipe Unit 2: ${abd.tipeABD2 || abd.tipeABD} ${abd.modelABD2 ? `(${abd.modelABD2})` : ''}`);
      if (abd.skuABD2 || abd.sku2) {
        lines.push(`  SKU: ${abd.skuABD2 || abd.sku2}`);
      }
      lines.push(`  No. Seri / SN: ${abd.nomorSeriABD2 || '-'}`);
      lines.push(`  Harga Unit 2: ${formatRupiah(abd.hargaABD2 || 0)}`);
    }

    lines.push(`• Fitting: ${abd.fittingType || '-'}`);
    if (abd.paketBundling) {
      lines.push(`• Paket Bundling: ${abd.paketBundling}`);
    }

    lines.push(``);
    lines.push(`Subtotal: ${formatRupiah(abd.hargaJual)}`);
    if ((abd.diskon || 0) > 0) {
      lines.push(`Diskon: -${formatRupiah(abd.diskon || 0)}`);
    }
    lines.push(`*Total Keseluruhan: ${formatRupiah(abd.jumlah)}*`);

    if (isAbdDP) {
      lines.push(`*Uang Muka (DP) Dibayar: ${formatRupiah(abd.uangMuka || 0)}*`);
      lines.push(`*Sisa Pembayaran: ${formatRupiah(abd.sisaPembayaran || 0)}*`);
    }
  } else if (isAksesoris && aks) {
    lines.push(`*Rincian Produk Aksesoris:*`);
    if (aks.items && aks.items.length > 0) {
      aks.items.forEach((it, idx) => {
        lines.push(`• ${idx + 1}. ${it.category}${it.subtype ? ` - ${it.subtype}` : ''}`);
        if (it.sku) lines.push(`   SKU: ${it.sku}`);
        if (it.noSeri) lines.push(`   No. Seri: ${it.noSeri}`);
        lines.push(`   Qty: ${it.qty} Pcs | @${formatRupiah(it.hargaJual)} = ${formatRupiah(it.subtotal)}`);
      });
    } else {
      lines.push(`• ${aks.category} ${aks.subtype ? `(${aks.subtype})` : ''}`);
      if (aks.noSeri) lines.push(`   No. Seri: ${aks.noSeri}`);
      lines.push(`   Qty: ${aks.qty} Pcs | Total: ${formatRupiah(aks.hargaJual)}`);
    }

    lines.push(``);
    if ((aks.diskon || 0) > 0) {
      lines.push(`Diskon: -${formatRupiah(aks.diskon || 0)}`);
    }
    if ((aks.ongkosKirim || 0) > 0) {
      lines.push(`Ongkos Kirim: ${formatRupiah(aks.ongkosKirim || 0)}`);
    }
    lines.push(`*Total Pembayaran: ${formatRupiah(aks.jumlah)}*`);

    if (aks.isDP && (aks.uangMuka || 0) > 0) {
      lines.push(`*Uang Muka (DP): ${formatRupiah(aks.uangMuka || 0)}*`);
      lines.push(`*Sisa Tagihan: ${formatRupiah(aks.sisaPembayaran || 0)}*`);
    }
  }

  // Payment Details
  lines.push(`------------------------------------------`);
  lines.push(`Metode Pembayaran: *${transaction.payment.method}*`);
  if (transaction.payment.method === 'Split (Cash & Transfer)') {
    lines.push(`- Cash: ${formatRupiah(transaction.payment.cashAmount || 0)}`);
    lines.push(`- Transfer: ${formatRupiah(transaction.payment.transferAmount || 0)}`);
    if (transaction.payment.splitBsiAccount) {
      lines.push(`  (Rekening: ${transaction.payment.splitBsiAccount})`);
    }
  } else if (transaction.payment.bsiAccount) {
    lines.push(`Rekening: ${transaction.payment.bsiAccount}`);
  }
  if (transaction.payment.namaRSBPJS) {
    lines.push(`RS BPJS: ${transaction.payment.namaRSBPJS}`);
  }

  const isLunas = !isAbdDP && (!aks?.isDP || (aks?.sisaPembayaran || 0) === 0);
  lines.push(`Status Pembayaran: *${isLunas ? 'LUNAS ✅' : 'TANDA TERIMA DP ⏳'}*`);
  lines.push(`------------------------------------------`);

  // Footer & Courtesy
  lines.push(`📄 *Lampiran Dokumen:* Terlampir file PDF resmi (${refNumber || 'Kwitansi/Faktur'}).`);
  lines.push(`Terima kasih atas kunjungan dan kepercayaan Anda kepada *Earsound Hearing Care*.`);
  lines.push(`Simpan pesan dan file PDF ini sebagai bukti transaksi resmi yang sah.`);
  lines.push(`_Pesan ini dikirim resmi melalui Sistem Manajemen Earsound Hearing Care._`);

  return lines.join('\n');
}

/**
 * Triggers WhatsApp redirect to patient phone number
 */
export function openWhatsAppWithReceipt(phone: string, message: string): void {
  const cleanPhone = formatWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}` 
    : `https://wa.me/?text=${encodedText}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}
