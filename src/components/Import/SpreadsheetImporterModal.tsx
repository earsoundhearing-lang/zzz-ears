import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, X, ArrowRight, 
  HelpCircle, Sparkles, Filter, Database, Copy, RefreshCw, UserCheck, Stethoscope, Trash2
} from 'lucide-react';
import { purgeJanuaryData } from '../../services/dbOperations';
import { 
  Patient, JasaPeriksaTransaction, AksesorisTransaction, 
  ABDTransaction, ReparasiService, BranchCode, PaymentDetails, ReferalSource 
} from '../../types';
import { BRANCHES, getDefaultBsiAccount } from '../../utils/branches';
import { getTodayDateString, calculateAge } from '../../utils/formatters';
import { matchOfficialDoctorName } from '../../data/doctors';

interface SpreadsheetImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPatients: Patient[];
  defaultBranch: BranchCode;
  currentUserRole?: string;
  onSavePatient: (p: Patient) => void;
  onSaveJasaPeriksa: (tx: JasaPeriksaTransaction) => void;
  onSaveAksesoris: (tx: AksesorisTransaction) => void;
  onSaveABD: (tx: ABDTransaction) => void;
  onSaveReparasi: (rep: ReparasiService) => void;
}

export interface ParsedRow {
  id: string;
  selected: boolean;
  tanggal: string;
  tanggalLahir: string;
  gender: 'L' | 'P';
  umur: number;
  gelar: string;
  namaPasien: string;
  telepon: string;
  alamat: string;
  kecamatan: string;
  caseType: 'Jasa Periksa' | 'Aksesoris' | 'Fitting ABD' | 'Reparasi' | 'Uang Masuk';
  transaksiItem: string;
  qty: number;
  hargaSatuan: number;
  totalBayar: number;
  pembayaran: string;
  ref: string;
  hac: string;
  hasilPemeriksaan: string;
  audKananDb: string;
  audKiriDb: string;
  noSeri: string;
  keterangan: string;
  matchedPatientId?: string;
  isNewPatient: boolean;
  isValid: boolean;
  validationError?: string;
}

export const SpreadsheetImporterModal: React.FC<SpreadsheetImporterModalProps> = ({
  isOpen,
  onClose,
  existingPatients,
  defaultBranch,
  currentUserRole,
  onSavePatient,
  onSaveJasaPeriksa,
  onSaveAksesoris,
  onSaveABD,
  onSaveReparasi,
}) => {
  const [targetBranch, setTargetBranch] = useState<BranchCode>(
    defaultBranch === 'ALL' || defaultBranch === 'HQ' ? 'YM' : defaultBranch
  );
  const [pasteContent, setPasteContent] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [activeStep, setActiveStep] = useState<'INPUT' | 'PREVIEW' | 'SUCCESS'>('INPUT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const executePurge = async (purgeAll: boolean = false) => {
    setPurgeConfirmOpen(false);
    setIsPurging(true);
    setPurgeResult(null);

    try {
      const res = await purgeJanuaryData(purgeAll);
      setPurgeResult({
        success: true,
        message: purgeAll 
          ? "Seluruh data transaksi dan customer berhasil dibersihkan dari database!" 
          : "Seluruh data transaksi dan customer bulan Januari berhasil dibersihkan dari database!",
        details: res
      });
    } catch (err: any) {
      setPurgeResult({
        success: false,
        message: "Gagal menghapus data: " + (err?.message || String(err))
      });
    } finally {
      setIsPurging(false);
    }
  };
  const [importSummary, setImportSummary] = useState<{
    patientsCreated: number;
    jasaCount: number;
    aksesorisCount: number;
    abdCount: number;
    reparasiCount: number;
  }>({
    patientsCreated: 0,
    jasaCount: 0,
    aksesorisCount: 0,
    abdCount: 0,
    reparasiCount: 0,
  });

  // Total summary of selected rows
  const selectedRows = useMemo(() => parsedRows.filter(r => r.selected), [parsedRows]);
  const totalImportNominal = useMemo(() => selectedRows.reduce((acc, r) => acc + r.totalBayar, 0), [selectedRows]);

  if (!isOpen) return null;

  // Sample spreadsheet format text to demonstrate to user
  const SAMPLE_SPREADSHEET_TEXT = `No\tTanggal\tTanggal lahir\tGender\tUMUR\tNama Pasien\tNo. Hp (WA)\tAlamat\tKecamatan\tCase\tTransaksi\tQty\tHarga Satuan\tTotal Bayar\tPembayaran\tRef\tHA\tHasil Pemeriksaan\tNo. Seri\tKeterangan
1\t2026-01-02\t03/05/1970\tP\t56\tTn. Edi Likson Saragih\t081375907970\tJl. Karya Bakti\tMedan\tJasa Periksa\tAudiometri\t1\t50.000\t50000\tCash\tPlang\tTM\tR. 63 L. 58\t\t
2\t2026-01-02\t24/05/1968\tP\t58\tNy. Zuraida Batubara\t0831 9917 9572\tJl. Camar xvii no.317\tPercut Seituan\tJasa Periksa\tAudiometri\t1\t0\t0\tFree\tdr. Budi Mulyana\tTM\tR. 52 L. 46\t\t
3\t2026-01-03\t13/02/1949\tP\t77\tNy. Rosiana Helmi\t085261755667\tJl. Jendral Sudirman\tTanjung Balai\tFitting\tSONIC | Trek40\t1\t0\t0\tFree\tdr. Sweet\tVR\t\tSN-99812\t
4\t2026-01-03\t15/05/1949\tP\t77\tNy. Yusra\t081265227812\tDumai timur\tDumai\tAksesoris\tBatt 13 SO\t2\t20.000\t40000\tTransfer\tPasien Lama\tDZ\t\t\t`;

  // Helper to normalize dates (YYYY-MM-DD)
  const normalizeDate = (val: string, fallbackDate?: string): string => {
    if (!val || !val.trim()) return fallbackDate ?? '';

    const s = val.trim();

    // 1. Check Excel serial number (5 digits e.g. 45658 or 46023)
    if (/^\d{5}$/.test(s)) {
      const num = parseInt(s, 10);
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    // 2. YYYY-MM-DD or YYYY/MM/DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(s)) {
      const parts = s.split(/[-/]/);
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // 3. DD/MM/YYYY or DD-MM-YYYY or D/M/YYYY or D-M-YYYY
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(s)) {
      const parts = s.split(/[-/]/);
      let day = parts[0].padStart(2, '0');
      let month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;

      // Swap if month > 12 (means user entered MM/DD/YYYY)
      if (parseInt(month, 10) > 12 && parseInt(day, 10) <= 12) {
        const temp = day;
        day = month;
        month = temp;
      }

      return `${year}-${month}-${day}`;
    }

    // 4. Text with month names e.g. "2 Januari 2026", "02-Jan-2026", "2 Jan 2026", "Jan 2, 2026"
    const monthMap: { [k: string]: string } = {
      jan: '01', januari: '01',
      feb: '02', februari: '02',
      mar: '03', maret: '03',
      apr: '04', april: '04',
      mei: '05', may: '05',
      jun: '06', juni: '06',
      jul: '07', juli: '07',
      agu: '08', agust: '08', agustus: '08', aug: '08',
      sep: '09', september: '09',
      okt: '10', oktober: '10', oct: '10',
      nov: '11', november: '11',
      des: '12', desember: '12', dec: '12',
    };

    const textMatch = s.match(/(\d{1,2})[\s\/-]+([a-zA-Z]+)[\s\/-]+(\d{2,4})/);
    if (textMatch) {
      let day = textMatch[1].padStart(2, '0');
      const monthStr = textMatch[2].toLowerCase();
      let year = textMatch[3];
      if (year.length === 2) year = '20' + year;

      const month = monthMap[monthStr];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    return fallbackDate ?? '';
  };

  // Helper to parse referral source smartly
  const parseReferalSource = (rawRef: string): { referal: ReferalSource; namaDokter?: string; namaRS?: string } => {
    if (!rawRef || !rawRef.trim()) {
      return { referal: 'Plang Toko, Neonbox, Google Maps / Walk-in' };
    }

    const s = rawRef.trim();
    const lower = s.toLowerCase();

    // 1. Doctor / Physician
    if (
      lower.includes('dr.') || 
      lower.includes('dr ') || 
      lower.includes('dokter') || 
      lower.includes('sp.tht') || 
      lower.includes('tht') ||
      lower.includes('sweet') ||
      lower.includes('maesarah') ||
      lower.includes('maesyara') ||
      lower.includes('carlo') ||
      lower.includes('hotmaida')
    ) {
      const officialDoc = matchOfficialDoctorName(s);
      return {
        referal: 'Dokter Umum dan Dokter Spesialis',
        namaDokter: officialDoc || s
      };
    }

    // 2. Hospital / Lab / Clinic
    if (lower.includes('rs') || lower.includes('rumah sakit') || lower.includes('klinik') || lower.includes('lab')) {
      return {
        referal: 'RS/LAB/KLINIK',
        namaRS: s
      };
    }

    // 3. Google / Maps
    if (lower.includes('google') || lower.includes('gmaps') || lower.includes('maps')) {
      return { referal: 'Google' };
    }

    // 4. Plang Toko / Neonbox / Walk-in
    if (
      lower.includes('plang') || 
      lower.includes('neon') || 
      lower.includes('box') || 
      lower.includes('walk') || 
      lower.includes('toko') || 
      lower.includes('papan') || 
      lower.includes('spanduk') || 
      lower.includes('banner')
    ) {
      return { referal: 'Plang Toko, Neonbox, Google Maps / Walk-in' };
    }

    // 5. Social Media (FB, IG, Tiktok)
    if (
      lower.includes('fb') || 
      lower.includes('facebook') || 
      lower.includes('ig') || 
      lower.includes('instagram') || 
      lower.includes('tiktok') || 
      lower.includes('sosmed') || 
      lower.includes('social') || 
      lower.includes('ads') || 
      lower.includes('iklan')
    ) {
      return { referal: 'Social Media (FB, IG, Tiktok)' };
    }

    // 6. Shopee / E-commerce
    if (lower.includes('shopee') || lower.includes('tokopedia') || lower.includes('online')) {
      return { referal: 'Shopee' };
    }

    // 7. Saudara / Teman
    if (lower.includes('teman') || lower.includes('saudara') || lower.includes('keluarga') || lower.includes('kerabat') || lower.includes('rekan')) {
      return { referal: 'Saudara atau Teman Dekat' };
    }

    // 8. Brosur
    if (lower.includes('brosur') || lower.includes('pamflet') || lower.includes('flyer')) {
      return { referal: 'Brosur' };
    }

    // 9. Pasien Lama / Repeat
    if (lower.includes('pasien lama') || lower.includes('pelanggan lama') || lower.includes('repeat')) {
      return { referal: 'Pasien Lama' };
    }

    return { referal: 'Plang Toko, Neonbox, Google Maps / Walk-in' };
  };

  // Helper to extract Gelar & Clean Name
  const extractGelarAndName = (rawName: string): { gelar: string; cleanName: string } => {
    if (!rawName) return { gelar: '', cleanName: 'Pasien Tanpa Nama' };
    const name = rawName.trim();
    const gelars = ['Tn', 'Ny', 'Nn', 'Dr', 'Bpk', 'Ibu', 'Sdr', 'Sdri'];
    for (const g of gelars) {
      if (name.toLowerCase().startsWith(g.toLowerCase() + '.') || name.toLowerCase().startsWith(g.toLowerCase() + ' ')) {
        const cleanName = name.slice(g.length + 1).trim();
        return { gelar: g, cleanName: cleanName || name };
      }
    }
    return { gelar: '', cleanName: name };
  };

  // Helper to extract dB from Hasil Pemeriksaan e.g. "R. 63 L. 58" or "R:63 dB L:58 dB"
  const extractDbFromHasil = (hasilStr: string): { kananDb: string; kiriDb: string } => {
    if (!hasilStr) return { kananDb: '', kiriDb: '' };

    let kananDb = '';
    let kiriDb = '';

    // Match R. 63 or R 63 or R: 63
    const matchR = hasilStr.match(/R[.:\s]*(\d+)/i);
    if (matchR) kananDb = matchR[1];

    // Match L. 58 or L 58 or L: 58
    const matchL = hasilStr.match(/L[.:\s]*(\d+)/i);
    if (matchL) kiriDb = matchL[1];

    return { kananDb, kiriDb };
  };

  // Parse Raw Text (CSV or TSV paste)
  const handleParseData = (textToParse: string) => {
    if (!textToParse.trim()) {
      alert('Silakan tempel (paste) data dari Google Spreadsheet atau upload file CSV terlebih dahulu.');
      return;
    }

    const lines = textToParse.trim().split(/\r?\n/);
    if (lines.length === 0) return;

    // Detect delimiter (\t or , or ;)
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes(',')) delimiter = ',';

    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Header index mapping
    const colIdx = {
      tanggal: headers.findIndex(h => h.includes('tanggal') && !h.includes('lahir')),
      tanggalLahir: headers.findIndex(h => h.includes('lahir') || h.includes('dob')),
      gender: headers.findIndex(h => h.includes('gender') || h.includes('jk') || h.includes('kelamin')),
      umur: headers.findIndex(h => h.includes('umur') || h.includes('usia') || h.includes('age')),
      namaPasien: headers.findIndex(h => h.includes('nama') || h.includes('pasien') || h.includes('customer')),
      telepon: headers.findIndex(h => h.includes('hp') || h.includes('wa') || h.includes('telp') || h.includes('phone')),
      alamat: headers.findIndex(h => h.includes('alamat')),
      kecamatan: headers.findIndex(h => h.includes('kecamatan') || h.includes('kota')),
      caseType: headers.findIndex(h => h.includes('case') || h.includes('kategori') || h.includes('jenis')),
      transaksi: headers.findIndex(h => h.includes('transaksi') || h.includes('item') || h.includes('produk') || h.includes('alat')),
      qty: headers.findIndex(h => h.includes('qty') || h.includes('jumlah')),
      hargaSatuan: headers.findIndex(h => h.includes('hargasatuan') || h.includes('satuan') || h.includes('harga')),
      totalBayar: headers.findIndex(h => h.includes('total') || h.includes('bayar') || h.includes('subtotal')),
      pembayaran: headers.findIndex(h => h.includes('pembayaran') || h.includes('metode') || h.includes('pay')),
      ref: headers.findIndex(h => h.includes('ref') || h.includes('rujukan') || h.includes('sumber')),
      hac: headers.findIndex(h => h === 'ha' || h.includes('hac') || h.includes('audiometris') || h.includes('staf')),
      hasil: headers.findIndex(h => h.includes('hasil') || h.includes('pemeriksaan') || h.includes('db')),
      noSeri: headers.findIndex(h => h.includes('seri') || h.includes('sn')),
      keterangan: headers.findIndex(h => h.includes('keterangan') || h.includes('ket') || h.includes('notes')),
    };

    const parsed: ParsedRow[] = [];
    const isHeaderLine = headers.some(h => ['tanggal', 'namapasien', 'transaksi', 'casetype'].includes(h));
    const startLineIdx = isHeaderLine ? 1 : 0;
    let lastParsedDate = '2026-01-02';

    for (let i = startLineIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(delimiter).map(c => c.trim().replace(/^"(.*)"$/, '$1'));

      const getCol = (idx: number): string => (idx !== -1 && cols[idx] !== undefined) ? cols[idx] : '';

      const rawNama = getCol(colIdx.namaPasien) || getCol(5) || 'Pasien';
      const { gelar, cleanName } = extractGelarAndName(rawNama);

      const rawDate = getCol(colIdx.tanggal) || getCol(1);
      const tanggal = normalizeDate(rawDate, lastParsedDate);
      if (rawDate && rawDate.trim()) {
        lastParsedDate = tanggal;
      }

      const rawDob = colIdx.tanggalLahir !== -1 ? getCol(colIdx.tanggalLahir) : '';
      let tanggalLahir = (rawDob && rawDob.trim()) ? normalizeDate(rawDob, '') : '';
      if (tanggalLahir) {
        const y = parseInt(tanggalLahir.substring(0, 4), 10);
        if (isNaN(y) || y >= 2025 || y < 1910) {
          tanggalLahir = '';
        }
      }

      const genderRaw = (getCol(colIdx.gender) || (colIdx.gender === -1 && getCol(3)) || 'P').toUpperCase();
      const gender: 'L' | 'P' = genderRaw.startsWith('L') ? 'L' : 'P';

      const rawUmurVal = colIdx.umur !== -1 ? getCol(colIdx.umur) : '';
      let umur = parseInt(rawUmurVal || '0', 10) || 0;
      if (umur > 110 || umur < 0) umur = 0;
      const telepon = getCol(colIdx.telepon) || getCol(6) || '';
      const alamat = getCol(colIdx.alamat) || getCol(7) || '';
      const kecamatan = getCol(colIdx.kecamatan) || getCol(8) || '';

      const rawCase = (getCol(colIdx.caseType) || getCol(9) || 'Jasa Periksa').toLowerCase();
      const rawItem = (getCol(colIdx.transaksi) || getCol(10) || '').toLowerCase();

      let caseType: ParsedRow['caseType'] = 'Jasa Periksa';
      if (rawCase.includes('uang masuk') || rawCase.includes('kas masuk') || rawCase.includes('pelunasan') || rawItem.includes('uang masuk') || rawItem.includes('pelunasan')) {
        caseType = 'Uang Masuk';
      } else if (rawCase.includes('aksesoris') || rawCase.includes('baterai') || rawCase.includes('aidtip') || rawCase.includes('earmould')) {
        caseType = 'Aksesoris';
      } else if (rawCase.includes('fitting') || rawCase.includes('abd') || rawCase.includes('alat')) {
        caseType = 'Fitting ABD';
      } else if (rawCase.includes('reparasi') || rawCase.includes('servis')) {
        caseType = 'Reparasi';
      } else {
        caseType = 'Jasa Periksa';
      }

      const transaksiItem = getCol(colIdx.transaksi) || getCol(10) || 'Pemeriksaan / Transaksi';
      const qty = parseInt(getCol(colIdx.qty) || getCol(11) || '1', 10) || 1;

      // Clean currency formats like 50.000 or Rp 50,000
      const cleanMoney = (valStr: string) => {
        if (!valStr) return 0;
        const numOnly = valStr.replace(/[^0-9]/g, '');
        return parseInt(numOnly, 10) || 0;
      };

      const hargaSatuan = cleanMoney(getCol(colIdx.hargaSatuan) || getCol(12));
      let totalBayar = cleanMoney(getCol(colIdx.totalBayar) || getCol(13));
      if (!totalBayar && hargaSatuan) totalBayar = hargaSatuan * qty;

      const pembayaran = getCol(colIdx.pembayaran) || getCol(14) || 'Cash';
      const ref = getCol(colIdx.ref) || getCol(15) || 'Plang Toko, Neonbox, Google Maps / Walk-in';
      const hac = getCol(colIdx.hac) || getCol(16) || 'Staf';
      const hasilPemeriksaan = getCol(colIdx.hasil) || getCol(17) || '';
      const { kananDb, kiriDb } = extractDbFromHasil(hasilPemeriksaan);
      const noSeri = getCol(colIdx.noSeri) || getCol(18) || '';
      const keterangan = getCol(colIdx.keterangan) || getCol(19) || '';

      // Check if patient exists in existing database
      const matched = existingPatients.find(p => {
        if (telepon && p.telepon && p.telepon.replace(/[^0-9]/g, '') === telepon.replace(/[^0-9]/g, '')) return true;
        if (p.nama.toLowerCase().trim() === cleanName.toLowerCase().trim()) return true;
        return false;
      });

      parsed.push({
        id: `row-${Date.now()}-${i}`,
        selected: true,
        tanggal,
        tanggalLahir,
        gender,
        umur,
        gelar,
        namaPasien: cleanName,
        telepon,
        alamat,
        kecamatan,
        caseType,
        transaksiItem,
        qty,
        hargaSatuan,
        totalBayar,
        pembayaran,
        ref,
        hac,
        hasilPemeriksaan,
        audKananDb: kananDb,
        audKiriDb: kiriDb,
        noSeri,
        keterangan,
        matchedPatientId: matched?.id,
        isNewPatient: !matched,
        isValid: Boolean(cleanName && tanggal)
      });
    }

    setParsedRows(parsed);
    if (parsed.length > 0) {
      setActiveStep('PREVIEW');
    } else {
      alert('Tidak ada baris data valid yang terdeteksi. Pastikan format teks sesuai.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteContent(content);
        handleParseData(content);
      }
    };
    reader.readAsText(file);
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (selectedRows.length === 0) {
      alert('Pilih setidaknya 1 baris transaksi untuk di-import.');
      return;
    }

    setIsProcessing(true);

    let createdPatientCount = 0;
    let jasaCount = 0;
    let aksesorisCount = 0;
    let abdCount = 0;
    let reparasiCount = 0;

    const patientMap = new Map<string, string>(); // Name/Phone -> Patient ID

    for (const row of selectedRows) {
      let patientId = row.matchedPatientId;

      // Ensure no duplicate patient creation by checking normalized name
      const normName = row.namaPasien.trim().toLowerCase();
      
      if (!patientId) {
        const matchedByName = existingPatients.find(p => p.nama.trim().toLowerCase() === normName);
        if (matchedByName) {
          patientId = matchedByName.id;
        } else if (patientMap.has(normName)) {
          patientId = patientMap.get(normName)!;
        } else if (row.telepon && patientMap.has(row.telepon.replace(/[^0-9]/g, ''))) {
          patientId = patientMap.get(row.telepon.replace(/[^0-9]/g, ''))!;
        } else {
          // Create new Patient
          const newPatientId = `ES-${targetBranch}-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
          const referalData = parseReferalSource(row.ref);
          const newPatient: Patient = {
            id: newPatientId,
            gelar: row.gelar || 'Tn',
            nama: row.namaPasien,
            tanggalLahir: row.tanggalLahir || '',
            usia: row.umur || (row.tanggalLahir ? calculateAge(row.tanggalLahir) : 0),
            gender: row.gender,
            telepon: row.telepon,
            alamat: {
              jalanNo: row.alamat,
              kecamatan: row.kecamatan,
              kabupatenKota: 'Kota/Kab',
              provinsi: 'Provinsi'
            },
            referal: referalData.referal,
            namaDokter: referalData.namaDokter,
            namaRS: referalData.namaRS,
            createdAt: row.tanggal + 'T08:00:00.000Z',
            branchCode: targetBranch,
            staffUser: row.hac || 'Import System'
          };

          onSavePatient(newPatient);
          patientId = newPatientId;
          patientMap.set(normName, newPatientId);
          if (row.telepon) {
            patientMap.set(row.telepon.replace(/[^0-9]/g, ''), newPatientId);
          }
          createdPatientCount++;
        }
      }

      // Map Payment Details
      const payment: PaymentDetails = {
        method: row.pembayaran.toLowerCase().includes('transfer') ? 'Transfer' : 
                row.pembayaran.toLowerCase().includes('shopee') ? 'Shopee' : 'Cash',
        bsiAccount: getDefaultBsiAccount(targetBranch)
      };

      // Save Transaction based on caseType
      if (row.caseType === 'Jasa Periksa') {
        const tx: JasaPeriksaTransaction = {
          id: `KWT-${targetBranch}-IMP-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
          tanggal: row.tanggal,
          idPelanggan: patientId,
          gelar: row.gelar,
          namaCustomer: row.namaPasien,
          nomorKwitansi: `KWT-${targetBranch}-IMP-${Math.floor(Math.random() * 8999 + 1000)}`,
          jenisPemeriksaan: [row.transaksiItem as any || 'Audiometri'],
          biayaJasaPeriksa: row.totalBayar,
          resultKananDb: row.audKananDb ? `${row.audKananDb} dB` : undefined,
          resultKiriDb: row.audKiriDb ? `${row.audKiriDb} dB` : undefined,
          catatanHasil: row.hasilPemeriksaan ? `Hasil Pemeriksaan: ${row.hasilPemeriksaan}` : undefined,
          audiometris: row.hac || 'HAC',
          payment,
          branchCode: targetBranch,
          staffUser: row.hac || 'Import System'
        };
        onSaveJasaPeriksa(tx);
        jasaCount++;
      } else if (row.caseType === 'Fitting ABD') {
        const tx: ABDTransaction = {
          id: `ABD-${targetBranch}-IMP-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
          tanggal: row.tanggal,
          idPelanggan: patientId,
          gelar: row.gelar,
          namaPasien: row.namaPasien,
          hac: row.hac || 'HAC',
          tipeABD: row.transaksiItem,
          nomorSeriABD: row.noSeri || `SN-IMP-${Date.now()}`,
          fittingType: 'Monoaural (Kanan)',
          nomorFakturPenjualan: `INV-${targetBranch}-IMP-${Math.floor(Math.random() * 8999 + 1000)}`,
          hargaJual: row.totalBayar,
          diskon: 0,
          jumlah: row.totalBayar,
          sisaPembayaran: 0,
          payment,
          branchCode: targetBranch,
          staffUser: row.hac || 'Import System'
        };
        onSaveABD(tx);
        abdCount++;
      } else if (row.caseType === 'Aksesoris') {
        const tx: AksesorisTransaction = {
          id: `INV-${targetBranch}-IMP-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
          tanggal: row.tanggal,
          idPelanggan: patientId,
          gelar: row.gelar,
          namaCustomer: row.namaPasien,
          category: 'Aksesoris ABD',
          subtype: row.transaksiItem,
          qty: row.qty,
          nomorFaktur: `INV-${targetBranch}-IMP-${Math.floor(Math.random() * 8999 + 1000)}`,
          hargaJual: row.hargaSatuan || row.totalBayar,
          jumlah: row.totalBayar,
          payment,
          branchCode: targetBranch,
          staffUser: row.hac || 'Import System'
        };
        onSaveAksesoris(tx);
        aksesorisCount++;
      } else if (row.caseType === 'Reparasi') {
        const rep: ReparasiService = {
          id: `REP-${targetBranch}-IMP-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
          idPelanggan: patientId,
          namaPelanggan: row.namaPasien,
          jenisABD: row.transaksiItem,
          nomorSeri: row.noSeri || 'SN-IMP',
          garansi: false,
          keluhan: row.keterangan || 'Reparasi / Service',
          tanggalMasuk: row.tanggal,
          tanggalMasukLab: row.tanggal,
          tanggalKonfirmasi: row.tanggal,
          status: 'Selesai Perbaikan',
          tanggalSelesai: row.tanggal,
          keterangan: row.keterangan || 'Di-import dari Google Sheets',
          branchCode: targetBranch,
          staffUser: row.hac || 'Import System'
        };
        onSaveReparasi(rep);
        reparasiCount++;
      }
    }

    setImportSummary({
      patientsCreated: createdPatientCount,
      jasaCount,
      aksesorisCount,
      abdCount,
      reparasiCount
    });

    setIsProcessing(false);
    setActiveStep('SUCCESS');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Title */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Pusat Integrasi Data Spreadsheet / Excel</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Import Laporan Harian Pasien Google Sheets
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
              Salin (Copy) sel dari Google Spreadsheet atau upload file CSV/Excel untuk menginput seluruh riwayat pasien & transaksi secara otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-xl"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* STEP 1: INPUT CONTENT */}
        {activeStep === 'INPUT' && (
          <div className="space-y-6">
            
            {/* Purge Data Banner & Controls */}
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl flex-shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">Bersihkan / Hapus Data Bulan Januari</h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Hapus transaksi & data customer yang perlu dirapikan ulang sebelum di-upload kembali.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isPurging}
                  onClick={() => setPurgeConfirmOpen(!purgeConfirmOpen)}
                  className="whitespace-nowrap px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPurging ? 'Sedang Memproses...' : 'Hapus Seluruh Data Januari'}</span>
                </button>
              </div>

              {/* Confirmation Card */}
              {purgeConfirmOpen && (
                <div className="mt-3 p-3.5 bg-white rounded-xl border border-rose-300 space-y-3 animate-fadeIn">
                  <p className="text-xs font-bold text-rose-900">
                    Konfirmasi Pembersihan Data Database:
                  </p>
                  <p className="text-xs text-slate-600">
                    Pilih opsi pembersihan data yang Anda inginkan. Tindakan ini akan langsung menghapus dokumen terkait dari Firebase Firestore secara permanen.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isPurging}
                      onClick={() => executePurge(false)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Hapus Khusus Data Januari
                    </button>
                    <button
                      type="button"
                      disabled={isPurging}
                      onClick={() => executePurge(true)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Hapus SELURUH Data Transaksi & Pasien
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurgeConfirmOpen(false)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isPurging && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                  <RefreshCw className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                  <span>Proses pembersihan data sedang berjalan di Firestore... Mohon tunggu sebentar.</span>
                </div>
              )}

              {/* Purge Result Display */}
              {purgeResult && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  purgeResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-100 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{purgeResult.message}</span>
                  </div>
                  {purgeResult.details && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-slate-700">
                      <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                        <span className="text-slate-400 block">Customer:</span>
                        <span className="font-bold">{purgeResult.details.deletedPatientsCount} dihapus</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                        <span className="text-slate-400 block">Jasa Periksa:</span>
                        <span className="font-bold">{purgeResult.details.deletedJasaCount} dihapus</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                        <span className="text-slate-400 block">Aksesoris:</span>
                        <span className="font-bold">{purgeResult.details.deletedAksesorisCount} dihapus</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded border border-emerald-100">
                        <span className="text-slate-400 block">ABD / Earmould / Servis:</span>
                        <span className="font-bold">
                          {purgeResult.details.deletedABDCount + purgeResult.details.deletedEarmouldCount + purgeResult.details.deletedReparasiCount} dihapus
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Target Branch Selector */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-indigo-900">
                  Target Cabang Import Data:
                </label>
                <p className="text-xs text-indigo-700">
                  Seluruh transaksi yang di-import akan didaftarkan ke cabang ini.
                </p>
              </div>
              <select
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value as BranchCode)}
                className="bg-white font-bold text-xs text-slate-800 px-4 py-2 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {BRANCHES.map(b => (
                  <option key={b.code} value={b.code}>
                    [{b.code}] {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Options: Paste vs File Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Option A: Paste directly from Google Sheets */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Copy className="w-4 h-4 text-emerald-600" />
                    Metode 1: Tempel (Paste) Sel Google Sheets
                  </label>
                  <button
                    type="button"
                    onClick={() => setPasteContent(SAMPLE_SPREADSHEET_TEXT)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Gunakan Contoh Teks
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Buka Google Spreadsheet -> Blok/Select baris data (termasuk header) -> Tekan Ctrl+C -> Tempel (Ctrl+V) di sini..."
                  className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-[#23277A] outline-none leading-relaxed text-slate-800 bg-slate-50/50"
                />
              </div>

              {/* Option B: Upload CSV File */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  Metode 2: Upload File CSV Google Sheets
                </label>
                
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center space-y-3 h-[210px]">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Pilih file `.csv` dari komputer Anda
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      (Di Google Sheets: Menu File → Download → Comma-separated values .csv)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv, .txt, .tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="spreadsheet-file-input"
                  />
                  <label
                    htmlFor="spreadsheet-file-input"
                    className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File CSV
                  </label>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-900">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Kolom Google Spreadsheet yang Terdeteksi Otomatis:
                  </div>
                  <p className="leading-normal">
                    <code className="font-bold bg-white/80 px-1 rounded">Tanggal</code>, <code className="font-bold bg-white/80 px-1 rounded">Tanggal lahir</code>, <code className="font-bold bg-white/80 px-1 rounded">Nama Pasien</code>, <code className="font-bold bg-white/80 px-1 rounded">No. Hp</code>, <code className="font-bold bg-white/80 px-1 rounded">Alamat</code>, <code className="font-bold bg-white/80 px-1 rounded">Case</code>, <code className="font-bold bg-white/80 px-1 rounded">Transaksi</code>, <code className="font-bold bg-white/80 px-1 rounded">Qty</code>, <code className="font-bold bg-white/80 px-1 rounded">Total Bayar</code>, <code className="font-bold bg-white/80 px-1 rounded">Pembayaran</code>, <code className="font-bold bg-white/80 px-1 rounded">Ref</code>, <code className="font-bold bg-white/80 px-1 rounded">HA</code>, <code className="font-bold bg-white/80 px-1 rounded">Hasil Pemeriksaan</code>.
                  </p>
                </div>

              </div>

            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleParseData(pasteContent)}
                disabled={!pasteContent.trim()}
                className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                  pasteContent.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Proses & Pratinjau Baris Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: PREVIEW & VALIDATION */}
        {activeStep === 'PREVIEW' && (
          <div className="space-y-5">
            
            {/* Top Bar Stats */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-indigo-300">
                  Pratinjau Hasil Parser:
                </span>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <span>Terdeteksi <strong>{parsedRows.length}</strong> Baris Transaksi</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    {selectedRows.length} Dipilih
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Target Cabang:</span>
                  <span className="font-bold text-[#F5B438]">[{targetBranch}] {BRANCHES.find(b => b.code === targetBranch)?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Total Nominal:</span>
                  <span className="font-bold text-emerald-400">Rp {totalImportNominal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Table Preview */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 border-b border-slate-200 z-10">
                    <th className="p-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setParsedRows(prev => prev.map(r => ({ ...r, selected: val })));
                        }}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Nama Pasien & Kontak</th>
                    <th className="p-3">Kategori (Case)</th>
                    <th className="p-3">Transaksi / Item</th>
                    <th className="p-3 text-right">Total Bayar</th>
                    <th className="p-3">Hasil / Reff / HAC</th>
                    <th className="p-3">Status Pasien</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-indigo-50/40 transition-colors ${!row.selected ? 'opacity-50 bg-slate-50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setParsedRows(prev => prev.map(r => r.id === row.id ? { ...r, selected: val } : r));
                          }}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 shrink-0">
                        {row.tanggal}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">
                          {row.gelar ? `${row.gelar} ` : ''}{row.namaPasien}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {row.telepon || 'Tanpa No. HP'} • {row.kecamatan || row.alamat || 'Alamat -'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          row.caseType === 'Jasa Periksa' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                          row.caseType === 'Fitting ABD' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          row.caseType === 'Aksesoris' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {row.caseType}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {row.transaksiItem} (x{row.qty})
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        Rp {row.totalBayar.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        {row.audKananDb || row.audKiriDb ? (
                          <div className="font-bold text-purple-800">
                            🎧 dB: R.{row.audKananDb || '-'} L.{row.audKiriDb || '-'}
                          </div>
                        ) : null}
                        <div className="text-[10px] text-slate-500">
                          Ref: {row.ref} • HAC: {row.hac}
                        </div>
                      </td>
                      <td className="p-3">
                        {row.isNewPatient ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Sparkles className="w-3 h-3 text-emerald-600" /> Pasien Baru
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <UserCheck className="w-3 h-3 text-indigo-600" /> Pasien Lama
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep('INPUT')}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                ← Kembali ke Input Teks
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing || selectedRows.length === 0}
                className="px-6 py-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengimpor Data ke Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Eksekusi Import ({selectedRows.length} Transaksi)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: SUCCESS RESULT */}
        {activeStep === 'SUCCESS' && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                Import Data Google Spreadsheet Berhasil!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Seluruh data laporan harian pasien telah berhasil dimasukkan ke database sistem Earsound Care cabang <strong>[{targetBranch}]</strong>.
              </p>
            </div>

            {/* Summary Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-2xl mx-auto text-left">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Pasien Baru</span>
                <span className="text-xl font-black text-emerald-900">{importSummary.patientsCreated}</span>
              </div>
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Jasa Periksa</span>
                <span className="text-xl font-black text-purple-900">{importSummary.jasaCount}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Fitting ABD</span>
                <span className="text-xl font-black text-emerald-900">{importSummary.abdCount}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-center">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">Aksesoris</span>
                <span className="text-xl font-black text-blue-900">{importSummary.aksesorisCount}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Reparasi</span>
                <span className="text-xl font-black text-amber-900">{importSummary.reparasiCount}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPasteContent('');
                  setParsedRows([]);
                  setActiveStep('INPUT');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Import Spreadsheet Lain
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
