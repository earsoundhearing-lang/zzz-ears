export type Gender = 'L' | 'P';

export type BranchCode = 'YM' | 'PB' | 'JB' | 'BJ' | 'PK' | 'LS' | 'ST' | 'BT' | 'MD' | 'HQ' | 'ALL';

export type UserRole = 'CEO' | 'SUPERVISOR' | 'LOGISTIK' | 'BRANCH_MANAGER' | 'STAFF' | 'FINANCE' | 'AKUNTAN';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  branchCode: BranchCode; // Default branch e.g. 'YM', 'BT', or 'HQ'/'ALL' for CEO
  allowedBranches?: BranchCode[]; // For SUPERVISOR with multi-branch scope or CEO/LOGISTIK with all
  isActive: boolean;
  createdAt: string;
}

export type ReferalSource = 
  | 'Pasien Lama'
  | 'Plang Toko, Neonbox, Google Maps / Walk-in'
  | 'Dokter Umum dan Dokter Spesialis'
  | 'RS/LAB/KLINIK'
  | 'Google'
  | 'Social Media (FB, IG, Tiktok)'
  | 'Shopee'
  | 'Saudara atau Teman Dekat'
  | 'Brosur'
  | 'Lain-lain';

export type BsiAccount = 
  | 'BSI 8171219847'
  | 'BSI 7320688177'
  | 'BSI 7348014514'
  | 'BSI 7368736893'
  | 'BSI 7368737822'
  | 'BSI 8888977822'
  | 'BSI 9009343910';

export type PaymentMethod = 
  | 'Cash' 
  | 'Transfer' 
  | 'Shopee'
  | 'Piutang BPJS' 
  | 'Piutang RS/Klinik/Laboratorium'
  | 'Split (Cash & Transfer)';

export interface PaymentDetails {
  method: PaymentMethod;
  bsiAccount?: BsiAccount;
  namaRSBPJS?: string; // e.g. RSUD Dr. M. Djamil / RS Mitra
  namaFaskes?: string; // e.g. Klinik Utama Earsound / Lab Prodia
  shopeeOrderNo?: string; // No. Pesanan / Resi Shopee (Khusus Cabang Yamin / YM)
  // Split Payment (Cash + Transfer)
  isSplit?: boolean;
  cashAmount?: number;
  transferAmount?: number;
  splitBsiAccount?: BsiAccount;
}

export type LoyaltyTier = 'Reguler' | 'Silver' | 'Gold' | 'Platinum' | 'VIP';

export type RFMSegment = 
  | 'Champions'
  | 'Loyal Customers'
  | 'Potential Loyalists'
  | 'New Customers'
  | 'Need Attention'
  | 'At Risk'
  | 'Hibernating'
  | 'Unconverted Leads';

export interface PatientRFMData {
  patient: Patient;
  recencyDays: number;
  recencyScore: number; // 1 - 5
  lastTransactionDate: string | null;
  lastTransactionType: string | null;
  frequencyCount: number;
  frequencyScore: number; // 1 - 5
  monetaryTotal: number;
  monetaryScore: number; // 1 - 5
  rfmScoreString: string; // e.g. "545"
  segment: RFMSegment;
  suggestedAction: string;
  waTemplate: string;
  categoryBreakdown: {
    abd: number;
    aksesoris: number;
    jasa: number;
    earmould: number;
    reparasi: number;
  };
}

export interface CRMNote {
  id: string;
  patientId: string;
  date: string;
  author: string;
  channel: 'WhatsApp' | 'Telepon' | 'Kunjungan Langsung' | 'Lainnya';
  note: string;
}

export type GelarPasien = 'Tn' | 'Ny' | 'Nn' | 'Dr' | 'Bpk' | 'Ibu' | 'Sdr' | 'Sdri';

export interface Patient {
  id: string; // ID Pelanggan e.g. "ES-HQ-00001"
  gelar?: GelarPasien | string; // Gelar / Sapaan Pasien (Tn, Ny, Nn, Dr, Bpk, Ibu, Sdr, Sdri)
  nama: string;
  tanggalLahir: string; // YYYY-MM-DD
  usia: number; // calculated
  gender: Gender;
  telepon: string;
  alamat: {
    jalanNo?: string;
    kecamatan: string;
    kabupatenKota: string;
    provinsi: string;
  };
  referal: ReferalSource;
  namaDokter?: string; // if referal is Dokter
  namaRS?: string; // if referal is RS / Faskes Mitra
  referalChannel?: string; // e.g. 'Google Ads', 'FB / Meta Ads', 'Instagram', 'TikTok', 'Google Maps (Gmaps)', 'Website'
  referalCategory?: 'Online' | 'Offline' | 'Dokter & Faskes' | 'Lainnya';
  referalDetail?: string; // Additional marketing notes
  createdAt: string;
  branchCode?: string; // Branch where patient first registered
  staffUser?: string;
}

// 1. Aksesoris
export type AksesorisTypeCategory = 
  | 'Aksesoris ABD'
  | 'Charger ABD'
  | 'Spare Part dan Service'
  | 'Baterai ABD'
  | 'Aidtip & Earmould'
  | 'Baterai Alat Bantu Dengar'
  | 'Aidtip'
  | 'Earmould'
  | 'Selang Soft'
  | 'Drying Jar'
  | 'HA Retainer (Gantungan Alat Bantu Dengar)'
  | 'Wax Guard'
  | 'Earhook Sonic'
  | 'Blower'
  | 'Pouch'
  | 'Baterai Checker'
  | 'Paket Bundling ABD'
  | string;

export type EarmouldSide = 'Kanan' | 'Kiri' | 'Keduanya (Binaural)';

export type BateraiSubtype = 
  | '13 Sonic'
  | '675 Sonic'
  | '312 Sonic'
  | '10 Sonic'
  | '13 Powerone'
  | '675 Powerone'
  | '312 Powerone'
  | '10 Powerone'
  | 'Tipe lain';

export type AidtipSubtype = 
  | 'Size M'
  | 'Size L'
  | 'Power Dome M'
  | 'Power Dome L';

export type DryingJarSubtype = 
  | 'Standard'
  | 'Electric 1.0'
  | 'Electric 2.0';

export interface AksesorisCartItem {
  id: string;
  sku?: string;
  category: AksesorisTypeCategory;
  subtype: string;
  jenisEarmouldDetails?: JenisEarmould;
  sisiEarmouldDetails?: EarmouldSide;
  noSeri?: string; // Serial number for Spare Part & Service or custom items
  qty: number;
  hargaJual: number;
  subtotal: number;
}

export interface AksesorisTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  idPelanggan: string;
  gelar?: string; // Gelar Pasien
  namaCustomer: string;
  category: AksesorisTypeCategory; // primary category or "Multi-Item"
  subtype?: BateraiSubtype | AidtipSubtype | DryingJarSubtype | string;
  jenisEarmouldDetails?: JenisEarmould; // H/C, S/C, H/FS, S/FS
  jenisEarmouldDetails2?: JenisEarmould; // H/C, S/C, H/FS, S/FS for 2nd unit if Binaural
  sisiEarmouldDetails?: EarmouldSide; // Kanan, Kiri, Keduanya (Binaural)
  noSeri?: string; // Serial number for Spare Part & Service
  qty: number;
  items?: AksesorisCartItem[]; // Support 1 patient buying >1 item in 1 transaction
  nomorFaktur: string; // INV-YM-000001
  hargaJual: number;
  diskon?: number;
  jumlah: number; // sum of item subtotals - diskon
  ongkosKirim?: number;
  uangMuka?: number;
  sisaPembayaran?: number;
  isDP?: boolean;
  payment: PaymentDetails;
  branchCode?: string;
  staffUser?: string;
}

// 2. Jasa Periksa
export type JenisPemeriksaan = 
  | 'Audiometri'
  | 'Audiometri (Rp 50.000)'
  | 'Audiometri Nada Murni'
  | 'Play Audiometri Anak'
  | 'Tympanometri'
  | 'Tympanometry'
  | 'OAE (Otoacoustic Emission)'
  | 'BERA (Brainstem Evoked Audiometry)'
  | 'FFT (Free Field Test)';

export interface JasaPeriksaItem {
  jenis: JenisPemeriksaan;
  tariffOption?: number; // e.g., 50000 or 100000
  biaya: number;
}

export type DerajatGangguanPendengaran = 
  | 'Normal'
  | 'Batas Normal'
  | 'Ringan'
  | 'Sedang'
  | 'Sedang-Berat'
  | 'Berat'
  | 'Sangat Berat';

export type JenisGangguanPendengaran = 
  | 'Normal'
  | 'Tuli Konduktif'
  | 'Tuli Sensorineural'
  | 'Tuli Campuran';

export interface AudiogramEarThresholds {
  // Pure Tone Air Conduction (AC) per frequency (Hz) -> intensity (dB HL)
  ac: Record<number, number | null>;
  // Pure Tone Bone Conduction (BC) per frequency (Hz) -> intensity (dB HL)
  bc: Record<number, number | null>;
  // Masked values (optional)
  acMasked?: Record<number, number | null>;
  bcMasked?: Record<number, number | null>;
  // Calculated & Clinical Diagnosis
  pta?: number; // 4-frequency Pure Tone Average (500, 1000, 2000, 4000 Hz)
  pta3?: number; // 3-frequency Pure Tone Average (500, 1000, 2000 Hz)
  derajat?: DerajatGangguanPendengaran | string;
  jenis?: JenisGangguanPendengaran | string;
  // Speech Audiometry (optional)
  srt?: number | null; // Speech Reception Threshold (dB)
  sds?: number | null; // Speech Discrimination Score (%)
  mcl?: number | null; // Most Comfortable Level (dB)
  ucl?: number | null; // Uncomfortable Loudness Level (dB)
}

export interface AudiogramData {
  id?: string;
  tanggalPeriksa?: string;
  kanan: AudiogramEarThresholds; // Auris Dextra (AD) - Red
  kiri: AudiogramEarThresholds;  // Auris Sinistra (AS) - Blue
  alatAudiometer?: string;
  metodeTes?: string;
  kondisiPasien?: string;
  kesimpulan?: string;
  rekomendasi?: string;
  catatanPemeriksa?: string;
  audiometris?: string;
  updatedAt?: string;
}

export interface JasaPeriksaTransaction {
  id: string;
  tanggal: string;
  idPelanggan: string;
  gelar?: string; // Gelar Pasien
  namaCustomer: string;
  nomorKwitansi: string; // KWT-YM-000001
  jenisPemeriksaan: JenisPemeriksaan[];
  examinationItems?: JasaPeriksaItem[];
  subtotalBiaya?: number;
  diskon?: number; // Potongan Tarif
  biayaJasaPeriksa: number; // Final after discount
  referal?: ReferalSource;
  namaDokterReferal?: string;
  resultKananDb?: string; // e.g. "25" or "25 dB" (for Audiometri, FFT, Play Audiometri)
  resultKiriDb?: string;  // e.g. "30" or "30 dB"
  resultTympanometri?: 'Tipe A' | 'Tipe As' | 'Tipe Ad' | 'Tipe B' | 'Tipe C' | string;
  resultOAE?: 'PASS' | 'REFER' | string;
  resultBERA?: 'RESPONS' | 'NO RESPONSE' | string;
  catatanHasil?: string; // Keterangan tambahan hasil pemeriksaan
  audiometris: string;   // Nama HA (Audiometris: Diana, Agung, Mutia, Dila, Adit, Ira, Fifah, Rara, Rendi, Zidan)
  
  // Audiogram Data (Detailed AC & BC per frequency, PTA, Derajat & Jenis Gangguan)
  audiogram?: AudiogramData;

  // HAC Fitting & Follow-Up Notes (Rekam Medis & Follow-Up CS)
  adaFittingABD?: boolean;
  tipeABDFitting?: string;
  potensiPembelian?: 'Sangat Potensial' | 'Potensial' | 'Ragu-ragu' | 'Kurang Potensial' | string;
  catatanHAC?: string; // Catatan khusus HAC/Pemeriksa untuk rekam medis & follow-up CS

  payment: PaymentDetails;
  branchCode?: string;
  staffUser?: string;
}

// 3. ABD
export type FittingType = 'Monoaural (Kanan)' | 'Monoaural (Kiri)' | 'Binaural';

export interface ABDBonusItem {
  id: string;
  kategori: string;
  tipe: string;
  sku?: string;
  qty: number;
  harga?: number;
  noSeri?: string;
}

export interface ABDTransaction {
  id: string;
  tanggal: string;
  idPelanggan: string;
  gelar?: string; // Gelar Pasien
  namaPasien: string;
  hac: string; // Hearing Aid Consultant (Diana, Agung, Mutia, Dila, Adit, Ira, Fifah, Randi, Rara, Zidan)
  tipeABD: string; // Tipe ABD 1
  modelABD?: string; // Model: CIC, BTE, MNRT, MNBT
  sku?: string; // Alias for skuABD1
  skuABD1?: string; // Kode Produk / SKU ABD 1
  nomorSeriABD: string; // Nomor Seri ABD 1
  hargaABD1?: number; // Harga ABD 1
  tipeABD2?: string; // Tipe ABD 2 (jika Binaural)
  modelABD2?: string;
  sku2?: string; // Alias for skuABD2
  skuABD2?: string; // Kode Produk / SKU ABD 2
  nomorSeriABD2?: string; // Nomor Seri ABD 2 (jika Binaural)
  hargaABD2?: number; // Harga ABD 2 (jika Binaural)
  paketBundling?: 'Tanpa Bundling' | 'Basic' | 'Essential' | 'Exclusive' | string;
  keteranganBundling?: string; // Keterangan detail isi paket bundling
  hargaBundling?: number; // Harga Paket Bundling
  bonusItems?: ABDBonusItem[]; // Item Bonus Aksesoris Tambahan Manual
  pilihEarmould?: boolean; // Integrasi Earmould
  jenisEarmould?: JenisEarmould; // H/C, S/C, H/FS, S/FS
  jenisEarmould2?: JenisEarmould; // Jenis Earmould 2 jika binaural
  sisiEarmould?: EarmouldSide; // Kanan, Kiri, Keduanya (Binaural)
  fittingType: FittingType;
  nomorFakturPenjualan: string; // INV-YM-000001
  hargaJual: number; // Sum of (hargaABD1 + hargaABD2 + hargaBundling)
  diskon: number; // Diskon (Rp)
  jumlah: number; // Total Bersih = hargaJual - diskon
  uangMuka?: number; // Uang Muka / DP (Rp)
  sisaPembayaran?: number; // Sisa Pembayaran = max(0, jumlah - uangMuka)
  isDP?: boolean; // Flag status Uang Muka (DP)
  referal?: ReferalSource;
  namaDokterReferal?: string;
  payment: PaymentDetails;
  branchCode?: string;
  staffUser?: string;
}

// 4. Earmould Report
export type JenisEarmould = 'H/C' | 'S/C' | 'H/FS' | 'S/FS';
export type EarmouldStatus = 'Diambil' | 'Di Yamin' | 'Di Lab';

export interface EarmouldReport {
  id: string;
  idPelanggan: string;
  namaPelanggan: string;
  jenisEarmould: JenisEarmould;
  qty: FittingType;
  tanggalCetak: string;
  tanggalKirim: string;
  tanggalMasukLab: string;
  tanggalSelesai: string;
  tanggalDiambil: string;
  status: EarmouldStatus;
  catatan?: string;
  branchCode?: string;
  staffUser?: string;
}

// 5. Reparasi / Service
export type ReparasiStatus = 
  | 'Receiver'
  | 'Amplifier'
  | 'Microphone'
  | 'Korosi'
  | 'Sedang Diperiksa'
  | 'Selesai Perbaikan';

export interface ReparasiService {
  id: string;
  idPelanggan: string;
  namaPelanggan: string;
  jenisABD: string;
  nomorSeri: string;
  garansi: boolean; // Ya/Tidak
  keluhan: string;
  tanggalMasuk: string;
  tanggalMasukLab: string;
  tanggalKonfirmasi: string;
  status: ReparasiStatus;
  tanggalSelesai: string;
  keterangan: string;
  branchCode?: string;
  staffUser?: string;
}

// 6. Kas Kecil (Petty Cash)
export type JenisPengeluaranKasKecil = 
  | 'Biaya Transport'
  | 'Parkir'
  | 'Biaya Kirim'
  | 'Wifi'
  | 'ATK'
  | 'Pantry'
  | 'LPM'
  | 'Perawatan Bangunan'
  | 'Perlengkapan Kantor'
  | 'Lain-lain';

export interface KasKecilEntry {
  id: string;
  tanggal: string;
  keterangan: string;
  penambahanKas: number; // Nominal Rupiah (Penambahan)
  pengeluaran: number;    // Nominal Rupiah (Pengeluaran)
  saldo: number;          // Calculated running balance
  jenisPengeluaran?: JenisPengeluaranKasKecil;
  penerimaKas?: string;   // Penerima kas kecil (untuk Penambahan Kas)
  pemberiKas?: string;    // Pemberi kas kecil (untuk Penambahan Kas)
  pengeluarKas?: string;  // Yang mengeluarkan / menggunakan kas (untuk Pengeluaran Kas)
  buktiPengeluaran?: string; // Lampiran bukti pengeluaran (No. Bon / Faktur / Kwitansi / Keterangan)
  branchCode?: string;
  staffUser?: string;
}


// --- INVENTORY TYPES ---
export interface ABDInventoryEntry {
  id: string;
  type: 'MASUK' | 'KELUAR_RETUR' | 'KELUAR_TERJUAL';
  tanggal: string; // YYYY-MM-DD
  sumberTujuan: string; // Sumber if MASUK, Tujuan if RETUR
  tipeABD: string;
  model: string;
  sku?: string; // Kode Produk / SKU e.g. "ENS10", "RA2BT"
  noSeri: string;
  keterangan?: string;
  // If TERJUAL
  noInvoice?: string;
  namaCustomer?: string;
  cabangTujuan?: string;
  
  branchCode: string;
}

export interface AksesorisInventoryEntry {
  id: string;
  type: 'MASUK' | 'KELUAR_RETUR' | 'KELUAR_TERJUAL';
  tanggal: string; // YYYY-MM-DD
  sumberTujuan: string;
  kategori: string;
  tipe: string;
  sku?: string; // Kode Produk / SKU e.g. "DRY01", "S13SN"
  qty: number;
  keterangan?: string;
  
  // If TERJUAL
  noInvoice?: string;
  namaCustomer?: string;
  cabangTujuan?: string;
  
  branchCode: string;
}

// --- POS (POINT OF SALES) TYPES ---
export type POSItemCategory = 
  | 'Jasa Medis'
  | 'Alat Bantu Dengar'
  | 'Baterai'
  | 'Aksesoris & Charger'
  | 'Lab Earmould'
  | 'Servis & Reparasi'
  | 'Kustom';

export interface POSCartItem {
  id: string; // Unique id in cart
  sku?: string; // Product SKU
  category: POSItemCategory;
  name: string;
  subtype?: string;
  price: number;
  qty: number;
  discount: number; // in Rp
  subtotal: number; // (price * qty) - discount
  // Optional metadata based on category
  earSide?: EarmouldSide | 'Monoaural (Kanan)' | 'Monoaural (Kiri)' | 'Binaural';
  serialNumber?: string;
  serialNumber2?: string;
  sku2?: string;
  modelABD?: string;
  modelABD2?: string;
  tipeABD2?: string;
  bundlingPackage?: string;
  audiometris?: string;
  jenisEarmould?: JenisEarmould;
  notes?: string;
}

export interface POSTransactionReceipt {
  invoiceNumber: string;
  date: string;
  patient: Patient;
  items: POSCartItem[];
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  payment: PaymentDetails;
  cashGiven?: number;
  changeDue?: number;
  isDP?: boolean;
  uangMuka?: number;
  sisaPembayaran?: number;
  branchCode: BranchCode;
  staffUser: string;
  catatan?: string;
}

// --- FINANCIAL STATEMENT & COA (CHART OF ACCOUNTS) TYPES ---

export type COAAccountType = 
  | 'Aset Lancar'
  | 'Aset Tetap'
  | 'Kontra Aset'
  | 'Aset Tidak Berwujud'
  | 'Kewajiban Lancar'
  | 'Kewajiban Jangka Panjang'
  | 'Ekuitas'
  | 'Pendapatan'
  | 'Beban Pokok'
  | 'Beban Pokok Jasa'
  | 'Beban Operasional'
  | 'Beban Lain-lain';

export interface COAAccount {
  code: string; // e.g. "101", "401", "503"
  name: string; // e.g. "Kas Bank BSI", "Pendapatan Jasa Pemeriksaan"
  category: 'ASET' | 'KEWAJIBAN' | 'EKUITAS' | 'PENDAPATAN' | 'BEBAN';
  accountType: COAAccountType;
  normalBalance: 'DEBIT' | 'KREDIT';
  description: string;
  initialBalance?: number;
  branchCode?: BranchCode; // If specific to a branch or company-wide
}

export interface JournalLineItem {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  notes?: string;
}

export interface ManualJournalEntry {
  id: string;
  nomorJurnal: string; // e.g. "JV-2026-0001"
  tanggal: string; // YYYY-MM-DD
  keterangan: string;
  branchCode: BranchCode;
  lines: JournalLineItem[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  createdAt: string;
}

export interface DoctorFeeRecord {
  id: string;
  sourceType: 'JASA_PERIKSA' | 'PENJUALAN_ABD';
  sourceTransactionId: string;
  nomorInvoiceOrKwitansi: string;
  tanggal: string;
  branchCode: BranchCode;
  namaPasien: string;
  namaDokter: string;
  detailPemeriksaanOrItem: string;
  // ABD percentage option (10% or 15%)
  percentageOption?: 10 | 15;
  nilaiTransaksi: number;
  nominalFee: number;
  status: 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR';
  tanggalDibayar?: string;
  metodePembayaran?: 'Kas Bank BSI' | 'Kas Bank BNI' | 'Kas Kecil' | 'Kas Besar';
  noBuktiPembayaran?: string;
  catatan?: string;
}

export interface WakproSharingRecord {
  id: string;
  sourceTransactionId: string;
  nomorKwitansi: string;
  tanggal: string;
  branchCode: BranchCode;
  namaPasien: string;
  jenisPemeriksaan: string;
  nominalBagiHasil: number;
  isPaidToWakpro: boolean;
  tanggalDibayar?: string;
  isBeraJambiHospitalPaid?: boolean; // For BERA Jambi Rp 1.000.000 (after RS settles)
  catatan?: string;
}

export type MaindealerSupplyScheme = 'KONSINYASI' | 'TERMIN_PEMBAYARAN';

export interface MaindealerSupplyTransaction {
  id: string;
  nomorSuratJalan: string; // e.g. "SJ-MD-2026-001"
  tanggal: string;
  cabangTujuan: BranchCode;
  skema: MaindealerSupplyScheme;
  namaBarang: string;
  sku?: string;
  kategori: 'ABD' | 'Aksesoris' | 'Baterai' | 'Sparepart';
  qty: number;
  hargaModalMD: number;
  hargaJualKeCabang: number;
  totalNilai: number;
  statusPembayaran: 'BELUM_LUNAS' | 'LUNAS' | 'KONSINYASI_TERPAJANG';
  jatuhTempo?: string;
  catatan?: string;
  createdAt: string;
}

export type B2BCustomerType = 
  | 'Ritel ABD Rekanan' 
  | 'Dokter Spesialis' 
  | 'Rumah Sakit' 
  | 'Klinik Swasta' 
  | 'Instansi Pemerintah' 
  | 'Perorangan';

export interface MaindealerB2BTransaction {
  id: string;
  nomorInvoice: string; // e.g. "INV-B2B-2026-001"
  tanggal: string;
  namaCustomer: string;
  tipeCustomer: B2BCustomerType;
  kontak: string;
  alamat?: string;
  kategoriProduk: 'Instrumen Audiologi' | 'Alat Bantu Dengar (Grosir)' | 'Aksesoris & Part' | 'Support Retail (HiPRO/NOAHLINK)';
  itemDetail: string; // e.g. "Audiometer Resonance R27A", "Noahlink Wireless 2", "10 Unit Sonic Enchant 20"
  qty: number;
  hargaSatuan: number;
  subtotal: number;
  diskon?: number;
  totalTagihan: number;
  metodePembayaran: 'Transfer Bank BSI' | 'Transfer Bank BNI' | 'Termin 30 Hari' | 'Termin 60 Hari' | 'Cash';
  status: 'LUNAS' | 'PIUTANG_BERJALAN' | 'JATUH_TEMPO';
  jatuhTempo?: string;
  tanggalPelunasan?: string;
  catatan?: string;
  createdAt: string;
}

