import { 
  Patient, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  AksesorisTransaction, 
  EarmouldReport, 
  ReparasiService,
  PatientRFMData,
  RFMSegment
} from '../types';
import { formatRupiah, formatIndoDate } from './formatters';
import { getBranchByCode } from './branches';

export const RFM_SEGMENT_DETAILS: Record<RFMSegment, {
  label: string;
  badgeColor: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  description: string;
  suggestedAction: string;
  iconName: string;
}> = {
  'Champions': {
    label: 'Champions (VIP)',
    badgeColor: 'bg-[#23277A] text-white',
    bgLight: 'bg-[#23277A]/10',
    borderColor: 'border-[#23277A]/30',
    textColor: 'text-[#23277A]',
    description: 'Pasien terbaik: Baru berkunjung, sering bertransaksi, dan total belanja sangat tinggi.',
    suggestedAction: 'Berikan pelayanan VIP eksklusif, ucapan selamat ulang tahun, program referral, dan penawaran upgrade produk terkini.',
    iconName: 'Crown',
  },
  'Loyal Customers': {
    label: 'Loyal Customers',
    badgeColor: 'bg-[#181B57] text-white',
    bgLight: 'bg-[#181B57]/10',
    borderColor: 'border-[#181B57]/30',
    textColor: 'text-[#181B57]',
    description: 'Pasien setia: Rutin membeli kebutuhan pendengaran (baterai, drying jar, servis rutin).',
    suggestedAction: 'Tawarkan program bundling berkala, gratis pembersihan/servis berkala, dan diskon aksesoris.',
    iconName: 'HeartHandshake',
  },
  'Potential Loyalists': {
    label: 'Potential Loyalists',
    badgeColor: 'bg-[#3B41B2] text-white',
    bgLight: 'bg-[#3B41B2]/10',
    borderColor: 'border-[#3B41B2]/30',
    textColor: 'text-[#3B41B2]',
    description: 'Pasien potensial: Baru membeli produk utama (ABD/Layanan) dengan nilai belanja tinggi.',
    suggestedAction: 'Jadwalkan follow-up adaptasi ABD (1 minggu, 1 bulan, 3 bulan), survey kepuasan, dan edukasi perawatan.',
    iconName: 'Sparkles',
  },
  'New Customers': {
    label: 'New Customers',
    badgeColor: 'bg-[#F5B438] text-slate-900',
    bgLight: 'bg-[#F5B438]/10',
    borderColor: 'border-[#F5B438]/40',
    textColor: 'text-[#B38321]',
    description: 'Pasien baru: Pertama kali bertransaksi atau periksa pendengaran dalam 60 hari terakhir.',
    suggestedAction: 'Kirimkan sambutan hangat, panduan pemakaian alat, dan jadwalkan evaluasi audiometri berkala.',
    iconName: 'UserCheck',
  },
  'Need Attention': {
    label: 'Need Attention',
    badgeColor: 'bg-amber-600 text-white',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    description: 'Perlu Perhatian: Kunjungan terakhir 3 - 6 bulan lalu, biasanya stok baterai/drying silica mulai habis.',
    suggestedAction: 'Ingatkan isi ulang baterai, pembersihan earmould, dan pengecekan fungsi alat bantu dengar.',
    iconName: 'BellRing',
  },
  'At Risk': {
    label: 'At Risk (Hampir Pasif)',
    badgeColor: 'bg-orange-600 text-white',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    description: 'Berisiko Hilang: Terakhir berkunjung 6 - 12 bulan lalu. Membutuhkan tes audiometri ulang tahunan.',
    suggestedAction: 'Kirimkan undangan evaluasi pendengaran tahunan (Re-Audiometri Gratis/Diskon) & voucher servis.',
    iconName: 'AlertTriangle',
  },
  'Hibernating': {
    label: 'Hibernating / Churned',
    badgeColor: 'bg-rose-700 text-white',
    bgLight: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-800',
    description: 'Dorman / Lama Pasif: Tidak ada transaksi lebih dari 1 tahun. Berisiko pindah atau alat tidak dipakai.',
    suggestedAction: 'Jalankan kampanye "Kami Rindu Anda", tawarkan program Trade-In (tukar tambah) ABD lama dengan unit baru.',
    iconName: 'UserX',
  },
  'Unconverted Leads': {
    label: 'Leads (Belum Transaksi)',
    badgeColor: 'bg-slate-600 text-white',
    bgLight: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-700',
    description: 'Telah terdaftar dalam database pasien namun belum memiliki riwayat transaksi berbayar.',
    suggestedAction: 'Follow-up konsultasi awal, tawarkan screening pendengaran gratis atau trial fitting alat bantu dengar.',
    iconName: 'UserPlus',
  },
};

/**
 * Calculate difference in whole days between a date string and reference date (now)
 */
export function getDaysDifference(dateStr?: string | null, referenceDate: Date = new Date()): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 999;
  const diffTime = Math.abs(referenceDate.getTime() - target.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine Recency Score (1 - 5) based on days since last activity
 */
export function scoreRecency(days: number): number {
  if (days <= 30) return 5;      // < 1 month: Sangat baru
  if (days <= 90) return 4;      // 1 - 3 months: Baru
  if (days <= 180) return 3;     // 3 - 6 months: Sedang
  if (days <= 365) return 2;     // 6 - 12 months: Lama
  return 1;                      // > 1 year: Sangat lama / dorman
}

/**
 * Determine Frequency Score (1 - 5) based on total transaction count
 */
export function scoreFrequency(count: number): number {
  if (count >= 6) return 5;      // 6+ transaksi: Sangat sering
  if (count >= 4) return 4;      // 4 - 5 transaksi: Sering
  if (count >= 2) return 3;      // 2 - 3 transaksi: Berkembang
  if (count === 1) return 2;     // 1 transaksi: Baru 1x
  return 1;                      // 0 transaksi
}

/**
 * Determine Monetary Score (1 - 5) based on total spending in IDR
 */
export function scoreMonetary(totalRp: number): number {
  if (totalRp >= 15000000) return 5;  // > 15 Juta: VIP / High-end ABD
  if (totalRp >= 7000000) return 4;   // 7 - 15 Juta: Mid-range ABD
  if (totalRp >= 2000000) return 3;   // 2 - 7 Juta: Entry ABD / Bundling
  if (totalRp >= 300000) return 2;    // 300rb - 2 Juta: Aksesoris / Servis / Jasa
  return 1;                           // < 300rb
}

/**
 * Classify RFM scores into standard CRM customer segments
 */
export function classifyRFMSegment(r: number, f: number, m: number): RFMSegment {
  if (f === 0 || m === 0) {
    return 'Unconverted Leads';
  }

  // Champions: High on all 3
  if (r >= 4 && f >= 4 && m >= 4) {
    return 'Champions';
  }

  // Loyal Customers: High frequency or regular repeat visits
  if ((r >= 3 && f >= 3) || (f >= 4)) {
    return 'Loyal Customers';
  }

  // Potential Loyalists: High monetary/recency but low frequency yet (e.g. bought expensive ABD recently)
  if (r >= 4 && f <= 2 && m >= 3) {
    return 'Potential Loyalists';
  }

  // New Customers: First visit recently
  if (r >= 4 && f === 1) {
    return 'New Customers';
  }

  // Need Attention: 3-6 months since last visit
  if (r === 3) {
    return 'Need Attention';
  }

  // At Risk: 6-12 months since last visit
  if (r === 2) {
    return 'At Risk';
  }

  // Hibernating: > 1 year
  return 'Hibernating';
}

/**
 * Generate customized WhatsApp greeting template based on RFM segment
 */
export function generateWATemplate(patient: Patient, rfm: {
  segment: RFMSegment;
  recencyDays: number;
  lastTransactionDate: string | null;
  lastTransactionType: string | null;
  monetaryTotal: number;
}): string {
  const branchName = getBranchByCode(patient.branchCode).name;
  const honorific = patient.gender === 'L' ? 'Bapak' : 'Ibu';
  const name = patient.nama;

  switch (rfm.segment) {
    case 'Champions':
      return `Halo ${honorific} ${name}, salam hangat dari ${branchName} (Earsound Hearing Center). Kami ingin mengucapkan terima kasih atas kepercayaan Bapak/Ibu sebagai pasien VIP kami. Sebagai bentuk apresiasi, kami menyediakan layanan pemeriksaan & perawatan alat berkala gratis untuk Anda. Apakah ada kendala atau kebutuhan baterai/aksesoris yang dapat kami bantu hari ini?`;

    case 'Loyal Customers':
      return `Halo ${honorific} ${name}, salam sehat dari ${branchName} (Earsound Hearing Center). Kami ingin menanyakan kabar dan kenyamanan alat bantu dengar Bapak/Ibu. Kami siap membantu jika Anda membutuhkan pengiriman baterai baru, drying silica, atau pembersihan rutin alat di klinik kami.`;

    case 'Potential Loyalists':
      return `Halo ${honorific} ${name}, salam sehat dari tim ahli ${branchName} (Earsound Hearing Center). Bagaimana perkembangan adaptasi dan kenyamanan alat bantu dengar Anda sejauh ini? Kami siap membantu sesi konsultasi atau fine-tuning ulang agar pendengaran Anda semakin optimal.`;

    case 'New Customers':
      return `Halo ${honorific} ${name}, terima kasih telah mempercayakan kesehatan pendengaran Anda di ${branchName} (Earsound Hearing Center). Semoga pelayanan kami memuaskan. Jika ada pertanyaan mengenai petunjuk pemakaian alat atau perawatan telinga, jangan ragu untuk menghubungi kami kembali ya.`;

    case 'Need Attention':
      return `Halo ${honorific} ${name}, salam hangat dari ${branchName} (Earsound Hearing Center). Sudah sekitar beberapa bulan sejak kunjungan terakhir Anda. Kami ingin mengingatkan untuk mengecek sisa stok baterai dan kebersihan filter/earmould alat Anda agar performa suara tetap jernih dan nyaman.`;

    case 'At Risk':
      return `Halo ${honorific} ${name}, salam hangat dari ${branchName} (Earsound Hearing Center). Kami mencatat sudah cukup lama sejak kunjungan pemeriksaan terakhir Anda. Sangat dianjurkan untuk melakukan evaluasi pendengaran berkala (Re-Audiometri) setahun sekali. Mari jadwalkan sesi cek pendengaran dan perawatan alat gratis di klinik kami minggu ini.`;

    case 'Hibernating':
      return `Halo ${honorific} ${name}, apa kabar? Kami rindu melayani Anda di ${branchName} (Earsound Hearing Center). Kami memiliki program spesial bagi pasien lama kami, termasuk cek kesehatan pendengaran gratis dan program tukar tambah (Trade-In) alat bantu dengar lama dengan teknologi digital terbaru. Apakah Bapak/Ibu berkenan kami bantu?`;

    case 'Unconverted Leads':
    default:
      return `Halo ${honorific} ${name}, salam dari ${branchName} (Earsound Hearing Center). Kami siap membantu konsultasi kesehatan pendengaran, tes audiometri resmi, dan demo alat bantu dengar terbaru secara nyaman. Apakah ada jadwal yang cocok bagi Bapak/Ibu untuk berkunjung ke klinik kami?`;
  }
}

/**
 * Process all patients and transactions into structured RFM dataset
 */
export function calculateGlobalPatientRFM({
  allPatients = [],
  allJasa = [],
  allABD = [],
  allAksesoris = [],
  allEarmould = [],
  allReparasi = [],
}: {
  allPatients: Patient[];
  allJasa: JasaPeriksaTransaction[];
  allABD: ABDTransaction[];
  allAksesoris: AksesorisTransaction[];
  allEarmould: EarmouldReport[];
  allReparasi: ReparasiService[];
}): PatientRFMData[] {
  const now = new Date();

  return allPatients.map((patient) => {
    const pid = patient.id;

    // Collect all transactions for this patient
    const patientJasa = allJasa.filter(tx => tx.idPelanggan === pid);
    const patientABD = allABD.filter(tx => tx.idPelanggan === pid);
    const patientAksesoris = allAksesoris.filter(tx => tx.idPelanggan === pid);
    const patientEarmould = allEarmould.filter(tx => tx.idPelanggan === pid);
    const patientReparasi = allReparasi.filter(tx => tx.idPelanggan === pid);

    // Sum monetary value by category
    const jasaSum = patientJasa.reduce((acc, curr) => acc + (curr.biayaJasaPeriksa || 0), 0);
    const abdSum = patientABD.reduce((acc, curr) => acc + (curr.jumlah || curr.hargaJual || 0), 0);
    const aksesorisSum = patientAksesoris.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
    const reparasiSum = 0; // Reparasi is tracked as warranty/service workflow
    const earmouldSum = 0; // Earmould is usually bundled or listed under aksesoris/abd

    const totalMonetary = jasaSum + abdSum + aksesorisSum + reparasiSum;
    const totalFrequency = patientJasa.length + patientABD.length + patientAksesoris.length + patientEarmould.length + patientReparasi.length;

    // Find the latest transaction date
    const allDates: { date: string; type: string }[] = [];
    patientJasa.forEach(t => t.tanggal && allDates.push({ date: t.tanggal, type: 'Jasa Periksa' }));
    patientABD.forEach(t => t.tanggal && allDates.push({ date: t.tanggal, type: 'Alat Bantu Dengar' }));
    patientAksesoris.forEach(t => t.tanggal && allDates.push({ date: t.tanggal, type: 'Aksesoris' }));
    patientEarmould.forEach(t => t.tanggalMasukLab && allDates.push({ date: t.tanggalMasukLab, type: 'Earmould' }));
    patientReparasi.forEach(t => t.tanggalMasuk && allDates.push({ date: t.tanggalMasuk, type: 'Reparasi' }));

    // Sort by date descending
    allDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latestTx = allDates[0] || null;
    const effectiveLastDate = latestTx ? latestTx.date : (patient.createdAt || null);
    const recencyDays = getDaysDifference(effectiveLastDate, now);

    const recencyScore = scoreRecency(recencyDays);
    const frequencyScore = scoreFrequency(totalFrequency);
    const monetaryScore = scoreMonetary(totalMonetary);

    const segment = classifyRFMSegment(recencyScore, frequencyScore, monetaryScore);
    const rfmScoreString = `${recencyScore}${frequencyScore}${monetaryScore}`;
    const suggestedAction = RFM_SEGMENT_DETAILS[segment].suggestedAction;

    const waTemplate = generateWATemplate(patient, {
      segment,
      recencyDays,
      lastTransactionDate: latestTx ? latestTx.date : null,
      lastTransactionType: latestTx ? latestTx.type : null,
      monetaryTotal: totalMonetary,
    });

    return {
      patient,
      recencyDays,
      recencyScore,
      lastTransactionDate: latestTx ? latestTx.date : null,
      lastTransactionType: latestTx ? latestTx.type : null,
      frequencyCount: totalFrequency,
      frequencyScore,
      monetaryTotal: totalMonetary,
      monetaryScore,
      rfmScoreString,
      segment,
      suggestedAction,
      waTemplate,
      categoryBreakdown: {
        abd: abdSum,
        aksesoris: aksesorisSum,
        jasa: jasaSum,
        earmould: earmouldSum,
        reparasi: reparasiSum,
      },
    };
  });
}
