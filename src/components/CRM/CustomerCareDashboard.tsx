import React, { useState, useMemo, useEffect } from 'react';
import { 
  Patient, 
  ABDTransaction, 
  JasaPeriksaTransaction, 
  AksesorisTransaction, 
  ReparasiService,
  CRMNote 
} from '../../types';
import { BRANCHES } from '../../utils/branches';
import { 
  Cake, 
  HeartHandshake, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  MessageSquare, 
  Phone, 
  Sparkles, 
  Volume2, 
  BatteryCharging, 
  Stethoscope, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  User, 
  MapPin, 
  Send,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Lock
} from 'lucide-react';

interface CustomerCareDashboardProps {
  patients: Patient[];
  abd: ABDTransaction[];
  jasaPeriksa: JasaPeriksaTransaction[];
  aksesoris: AksesorisTransaction[];
  reparasi: ReparasiService[];
  crmNotes: CRMNote[];
  currentUserBranch?: string;
  currentUserRole?: string;
  currentUserAllowedBranches?: string[];
  currentUserName?: string;
  activeAppBranch?: string;
  onSaveCRMNote: (note: CRMNote) => void;
  onDeleteCRMNote: (id: string) => void;
}

type CareCategory = 
  | 'BIRTHDAY'
  | 'ADAPTASI'
  | 'KONTROL_3_BULAN'
  | 'LEAD_PERIKSA'
  | 'BATERAI'
  | 'GARANSI_UPGRADE'
  | 'ALL';

type BirthdayFilter = 'TODAY' | 'NEXT_7_DAYS' | 'THIS_MONTH';
type ProspectFilter = 'ALL' | 'TRIALED' | 'NOT_TRIALED';

// Helper to extract numeric hearing threshold in dB from raw string, PTA, or audiogram
const extractDb = (val?: string, pta?: number, earData?: any): number | null => {
  if (typeof pta === 'number' && !isNaN(pta)) return Math.round(pta);
  if (val) {
    const match = val.replace(/,/g, '.').match(/[-+]?[0-9]*\.?[0-9]+/);
    if (match) {
      const parsed = parseFloat(match[0]);
      if (!isNaN(parsed)) return Math.round(parsed);
    }
  }
  if (earData?.ac) {
    const freqs = [500, 1000, 2000, 4000];
    const valid = freqs.map((f: number) => earData.ac[f]).filter((v: unknown): v is number => typeof v === 'number');
    if (valid.length > 0) {
      return Math.round(valid.reduce((a: number, b: number) => a + b, 0) / valid.length);
    }
    const allAc = Object.values(earData.ac).filter((v: unknown): v is number => typeof v === 'number');
    if (allAc.length > 0) {
      return Math.round(allAc.reduce((a: number, b: number) => a + b, 0) / allAc.length);
    }
  }
  if (earData?.derajat) {
    const der = String(earData.derajat).toLowerCase();
    if (der.includes('sangat berat')) return 95;
    if (der.includes('berat')) return 75;
    if (der.includes('sedang-berat')) return 65;
    if (der.includes('sedang')) return 55;
  }
  return null;
};

export const CustomerCareDashboard: React.FC<CustomerCareDashboardProps> = ({
  patients,
  abd,
  jasaPeriksa,
  aksesoris,
  reparasi,
  crmNotes,
  currentUserBranch = 'ALL',
  currentUserRole = 'STAFF',
  currentUserAllowedBranches,
  currentUserName = 'Staf Earsound',
  activeAppBranch,
  onSaveCRMNote,
  onDeleteCRMNote
}) => {
  const isCEO = currentUserRole === 'CEO';

  // Compute strictly allowed branches for this user
  const userAllowedBranches: string[] = useMemo(() => {
    if (isCEO) {
      return ['ALL', ...BRANCHES.map(b => b.code)];
    }
    // For non-CEO users (including SUPERVISOR, BRANCH_MANAGER, STAFF, etc.):
    // Non-CEO is strictly forbidden from network-wide 'ALL' or 'HQ'
    if (currentUserAllowedBranches && currentUserAllowedBranches.length > 0) {
      const filtered = currentUserAllowedBranches.filter(b => b !== 'ALL' && b !== 'HQ');
      if (filtered.length > 0) return filtered;
    }
    if (currentUserBranch && currentUserBranch !== 'ALL' && currentUserBranch !== 'HQ') {
      return [currentUserBranch];
    }
    return ['YM'];
  }, [isCEO, currentUserAllowedBranches, currentUserBranch]);

  // Initial branch selection
  const getInitialBranch = (): string => {
    if (isCEO) {
      if (activeAppBranch && (activeAppBranch === 'ALL' || userAllowedBranches.includes(activeAppBranch))) {
        return activeAppBranch;
      }
      return 'ALL';
    }
    // For non-CEO, default to activeAppBranch if permitted, else first permitted branch
    if (activeAppBranch && userAllowedBranches.includes(activeAppBranch)) {
      return activeAppBranch;
    }
    return userAllowedBranches[0] || 'YM';
  };

  const [selectedBranch, setSelectedBranch] = useState<string>(getInitialBranch);

  // Strictly enforce that non-CEO cannot hold an unauthorized branch or 'ALL'
  useEffect(() => {
    if (!isCEO) {
      if (!userAllowedBranches.includes(selectedBranch)) {
        setSelectedBranch(userAllowedBranches[0] || 'YM');
      }
    }
  }, [isCEO, userAllowedBranches, selectedBranch]);

  // Safe effective branch
  const effectiveBranch = useMemo(() => {
    if (isCEO) return selectedBranch;
    return userAllowedBranches.includes(selectedBranch) ? selectedBranch : (userAllowedBranches[0] || 'YM');
  }, [isCEO, selectedBranch, userAllowedBranches]);

  const currentBranchInfo = useMemo(() => {
    return BRANCHES.find(b => b.code === effectiveBranch) || null;
  }, [effectiveBranch]);

  const [activeCategory, setActiveCategory] = useState<CareCategory>('BIRTHDAY');
  const [searchTerm, setSearchTerm] = useState('');
  const [birthdayFilter, setBirthdayFilter] = useState<BirthdayFilter>('THIS_MONTH');
  const [prospectFilter, setProspectFilter] = useState<ProspectFilter>('ALL');

  // Modal State for Note
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activePatientForNote, setActivePatientForNote] = useState<Patient | null>(null);
  const [noteChannel, setNoteChannel] = useState<'WhatsApp' | 'Telepon' | 'Kunjungan Langsung' | 'Lainnya'>('WhatsApp');
  const [noteContent, setNoteContent] = useState('');

  // Modal State for WA Preview
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);
  const [waModalData, setWaModalData] = useState<{
    patient: Patient;
    phone: string;
    message: string;
    topic: string;
  } | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayMonth = today.getMonth() + 1; // 1-12
  const todayDate = today.getDate(); // 1-31

  // Map transactions to patients
  const patientCareProfiles = useMemo(() => {
    return patients.map(p => {
      // Find all transactions for this patient
      const patientABD = abd.filter(a => a.idPelanggan === p.id || a.namaPasien?.toLowerCase() === p.nama?.toLowerCase());
      const patientJasa = jasaPeriksa.filter(j => j.idPelanggan === p.id || j.namaCustomer?.toLowerCase() === p.nama?.toLowerCase());
      const patientAksesoris = aksesoris.filter(ak => ak.idPelanggan === p.id || ak.namaCustomer?.toLowerCase() === p.nama?.toLowerCase());
      const patientReparasi = reparasi.filter(r => r.idPelanggan === p.id || r.namaCustomer?.toLowerCase() === p.nama?.toLowerCase());
      const patientNotes = crmNotes.filter(n => n.patientId === p.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Find latest transaction date across all types
      const allDates: { date: Date; type: string; details?: string }[] = [];

      patientABD.forEach(a => {
        if (a.tanggal) allDates.push({ date: new Date(a.tanggal), type: 'ABD', details: a.tipeABD });
      });
      patientJasa.forEach(j => {
        if (j.tanggal) allDates.push({ date: new Date(j.tanggal), type: 'Jasa Periksa', details: j.jenisPemeriksaan?.join(', ') });
      });
      patientAksesoris.forEach(ak => {
        if (ak.tanggal) allDates.push({ date: new Date(ak.tanggal), type: 'Aksesoris', details: ak.category });
      });
      patientReparasi.forEach(r => {
        if (r.tanggalMasuk) allDates.push({ date: new Date(r.tanggalMasuk), type: 'Reparasi', details: r.tipeAlat });
      });

      allDates.sort((a, b) => b.date.getTime() - a.date.getTime());
      const latestActivity = allDates[0] || null;

      // Latest ABD
      const sortedABD = [...patientABD].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      const latestABD = sortedABD[0] || null;

      // Days since last visit
      let daysSinceLastVisit = 9999;
      if (latestActivity) {
        const diffMs = today.getTime() - latestActivity.date.getTime();
        daysSinceLastVisit = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      // Days since latest ABD purchase
      let daysSinceABDPurchase: number | null = null;
      if (latestABD && latestABD.tanggal) {
        const diffMs = today.getTime() - new Date(latestABD.tanggal).getTime();
        daysSinceABDPurchase = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      // Birthday logic
      let isBirthdayToday = false;
      let isBirthdayNext7Days = false;
      let isBirthdayThisMonth = false;
      let daysUntilBirthday = 999;
      let calculatedAge = p.usia || 0;

      if (p.tanggalLahir) {
        const parts = p.tanggalLahir.split('-');
        if (parts.length === 3) {
          const birthMonth = parseInt(parts[1], 10);
          const birthDay = parseInt(parts[2], 10);
          const birthYear = parseInt(parts[0], 10);

          if (!isNaN(birthMonth) && !isNaN(birthDay)) {
            // Check if this month
            if (birthMonth === todayMonth) {
              isBirthdayThisMonth = true;
            }

            // Check if today
            if (birthMonth === todayMonth && birthDay === todayDate) {
              isBirthdayToday = true;
              daysUntilBirthday = 0;
            } else {
              // Calculate next birthday date this year or next year
              let nextBday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
              if (nextBday.getTime() < today.getTime() - (24 * 60 * 60 * 1000)) {
                nextBday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay);
              }
              const diffMs = nextBday.getTime() - today.getTime();
              daysUntilBirthday = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
                isBirthdayNext7Days = true;
              }
            }

            if (!isNaN(birthYear) && birthYear > 1900) {
              calculatedAge = today.getFullYear() - birthYear;
            }
          }
        }
      }

      // Check battery purchase (days since last battery purchase)
      const batteryPurchases = patientAksesoris.filter(ak => 
        ak.category?.toLowerCase().includes('baterai') || 
        (ak.items && ak.items.some(it => it.category?.toLowerCase().includes('baterai')))
      ).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      let daysSinceBattery = 9999;
      if (batteryPurchases.length > 0 && batteryPurchases[0].tanggal) {
        const diffMs = today.getTime() - new Date(batteryPurchases[0].tanggal).getTime();
        daysSinceBattery = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      // Check Audiometry records, hearing thresholds, and fitting trial status
      const audiometriExams = patientJasa.filter(j => {
        const isAudioType = j.jenisPemeriksaan?.some(jp => 
          jp.toLowerCase().includes('audiometri') || 
          jp.toLowerCase().includes('fft') || 
          jp.toLowerCase().includes('play')
        );
        return isAudioType || Boolean(j.resultKananDb || j.resultKiriDb || j.audiogram);
      });

      const sortedAudiometri = [...audiometriExams].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      const latestAudiometri = sortedAudiometri[0] || null;

      let audKananDb: number | null = null;
      let audKiriDb: number | null = null;
      let hasFittingTrial = false;
      let trialedABDName: string | null = null;
      let leadPotensi: string | null = null;
      let leadHACNotes: string | null = null;

      if (latestAudiometri) {
        audKananDb = extractDb(
          latestAudiometri.resultKananDb, 
          latestAudiometri.audiogram?.kanan?.pta ?? latestAudiometri.audiogram?.kanan?.pta3, 
          latestAudiometri.audiogram?.kanan
        );
        audKiriDb = extractDb(
          latestAudiometri.resultKiriDb, 
          latestAudiometri.audiogram?.kiri?.pta ?? latestAudiometri.audiogram?.kiri?.pta3, 
          latestAudiometri.audiogram?.kiri
        );
      }

      // Check fitting/trial and notes across all examinations
      patientJasa.forEach(j => {
        if (j.adaFittingABD || j.tipeABDFitting) {
          hasFittingTrial = true;
          if (!trialedABDName && j.tipeABDFitting) trialedABDName = j.tipeABDFitting;
        }
        if (!leadPotensi && j.potensiPembelian) leadPotensi = j.potensiPembelian;
        if (!leadHACNotes && j.catatanHAC) leadHACNotes = j.catatanHAC;
      });

      // User Rule:
      // "setiap pasien yang periksa audiometri, dan ambang dengar kanan dan kirinya lebih dari 50 dB tapi belum beli alat walaupun sudah dicobakan alat bantu dengar ataupun belum, masukan ke dalam prospek."
      const hasPurchasedABD = patientABD.length > 0;
      const hasAudiometryRecord = latestAudiometri !== null;

      const isThresholdOver50 = (audKananDb !== null && audKiriDb !== null)
        ? (audKananDb > 50 && audKiriDb > 50)
        : ((audKananDb !== null && audKananDb > 50) || (audKiriDb !== null && audKiriDb > 50));

      const isAudiometryProspect = !hasPurchasedABD && hasAudiometryRecord && isThresholdOver50;

      // Warranty & Renewal logic
      const isWarrantyExpiringSoon = daysSinceABDPurchase !== null && daysSinceABDPurchase >= 300 && daysSinceABDPurchase <= 365;
      const isRenewalCandidate = daysSinceABDPurchase !== null && daysSinceABDPurchase > 1095; // > 3 years

      return {
        patient: p,
        patientABD,
        patientJasa,
        patientAksesoris,
        patientReparasi,
        latestActivity,
        latestABD,
        daysSinceLastVisit,
        daysSinceABDPurchase,
        daysSinceBattery,
        isBirthdayToday,
        isBirthdayNext7Days,
        isBirthdayThisMonth,
        daysUntilBirthday,
        calculatedAge,
        isAudiometryProspect,
        audKananDb,
        audKiriDb,
        hasFittingTrial,
        trialedABDName,
        leadPotensi,
        leadHACNotes,
        latestAudiometri,
        isWarrantyExpiringSoon,
        isRenewalCandidate,
        notes: patientNotes
      };
    });
  }, [patients, abd, jasaPeriksa, aksesoris, reparasi, crmNotes, today, todayMonth, todayDate]);

  // Branch filter with strict role-based isolation
  const branchFilteredProfiles = useMemo(() => {
    if (effectiveBranch === 'ALL' && isCEO) return patientCareProfiles;

    return patientCareProfiles.filter(item => {
      // 1. Patient's primary registered branchCode
      if (item.patient.branchCode && item.patient.branchCode === effectiveBranch) return true;

      // 2. Patient's transactions and activities in this branch
      if (item.latestABD?.branchCode === effectiveBranch) return true;
      if (item.patientJasa.some(j => j.branchCode === effectiveBranch)) return true;
      if (item.patientAksesoris.some(a => a.branchCode === effectiveBranch)) return true;
      if (item.patientReparasi.some(r => r.branchCode === effectiveBranch)) return true;

      // 3. Fallback: check patient ID prefix/code e.g. ES-JB-00001
      if (!item.patient.branchCode && item.patient.id?.includes(`-${effectiveBranch}-`)) return true;

      return false;
    });
  }, [patientCareProfiles, effectiveBranch, isCEO]);

  // Search filter
  const searchedProfiles = useMemo(() => {
    if (!searchTerm.trim()) return branchFilteredProfiles;
    const term = searchTerm.toLowerCase();
    return branchFilteredProfiles.filter(item => {
      const nama = item.patient.nama?.toLowerCase() || '';
      const id = item.patient.id?.toLowerCase() || '';
      const telp = item.patient.telepon?.toLowerCase() || '';
      const abdName = item.latestABD?.tipeABD?.toLowerCase() || '';
      return nama.includes(term) || id.includes(term) || telp.includes(term) || abdName.includes(term);
    });
  }, [branchFilteredProfiles, searchTerm]);

  // Specific Category Filtering
  const displayedProfiles = useMemo(() => {
    switch (activeCategory) {
      case 'BIRTHDAY':
        return searchedProfiles.filter(item => {
          if (birthdayFilter === 'TODAY') return item.isBirthdayToday;
          if (birthdayFilter === 'NEXT_7_DAYS') return item.isBirthdayToday || item.isBirthdayNext7Days;
          return item.isBirthdayThisMonth || item.isBirthdayNext7Days;
        }).sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

      case 'ADAPTASI':
        // Pasien beli ABD 0-30 hari terakhir
        return searchedProfiles.filter(item => 
          item.daysSinceABDPurchase !== null && item.daysSinceABDPurchase <= 35
        ).sort((a, b) => (a.daysSinceABDPurchase || 0) - (b.daysSinceABDPurchase || 0));

      case 'KONTROL_3_BULAN':
        // Pasien yang kunjungan terakhirnya > 90 hari (3 bulan)
        return searchedProfiles.filter(item => 
          item.daysSinceLastVisit >= 90 && item.latestActivity !== null
        ).sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

      case 'LEAD_PERIKSA':
        // Pasien tes audiometri ambang dengar > 50 dB belum beli ABD (baik sudah coba demo ataupun belum)
        return searchedProfiles.filter(item => {
          if (!item.isAudiometryProspect) return false;
          if (prospectFilter === 'TRIALED') return item.hasFittingTrial;
          if (prospectFilter === 'NOT_TRIALED') return !item.hasFittingTrial;
          return true;
        }).sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit);

      case 'BATERAI':
        // Pasien beli baterai 30-75 hari lalu (estimasi habis)
        return searchedProfiles.filter(item => 
          item.daysSinceBattery >= 30 && item.daysSinceBattery <= 90
        ).sort((a, b) => a.daysSinceBattery - b.daysSinceBattery);

      case 'GARANSI_UPGRADE':
        // Menjelang habis garansi 11-12 bulan ATAU usia alat > 3 tahun
        return searchedProfiles.filter(item => 
          item.isWarrantyExpiringSoon || item.isRenewalCandidate
        ).sort((a, b) => (b.daysSinceABDPurchase || 0) - (a.daysSinceABDPurchase || 0));

      case 'ALL':
      default:
        return searchedProfiles;
    }
  }, [searchedProfiles, activeCategory, birthdayFilter, prospectFilter]);

  // Counts for KPIs
  const kpiCounts = useMemo(() => {
    const birthdayTodayCount = branchFilteredProfiles.filter(i => i.isBirthdayToday).length;
    const birthdayMonthCount = branchFilteredProfiles.filter(i => i.isBirthdayThisMonth).length;
    const adaptasiCount = branchFilteredProfiles.filter(i => i.daysSinceABDPurchase !== null && i.daysSinceABDPurchase <= 35).length;
    const kontrolCount = branchFilteredProfiles.filter(i => i.daysSinceLastVisit >= 90 && i.latestActivity !== null).length;
    const leadsCount = branchFilteredProfiles.filter(i => i.isAudiometryProspect).length;
    const leadsTrialedCount = branchFilteredProfiles.filter(i => i.isAudiometryProspect && i.hasFittingTrial).length;
    const leadsNotTrialedCount = branchFilteredProfiles.filter(i => i.isAudiometryProspect && !i.hasFittingTrial).length;
    const batteryCount = branchFilteredProfiles.filter(i => i.daysSinceBattery >= 30 && i.daysSinceBattery <= 90).length;
    const warrantyCount = branchFilteredProfiles.filter(i => i.isWarrantyExpiringSoon || i.isRenewalCandidate).length;

    return {
      birthdayTodayCount,
      birthdayMonthCount,
      adaptasiCount,
      kontrolCount,
      leadsCount,
      leadsTrialedCount,
      leadsNotTrialedCount,
      batteryCount,
      warrantyCount,
      totalPatients: branchFilteredProfiles.length
    };
  }, [branchFilteredProfiles]);

  // Helpers to format WhatsApp
  const cleanPhoneNumber = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const getGreeting = (p: Patient) => {
    const sapaan = p.gelar ? `${p.gelar} ` : (p.gender === 'P' ? 'Ibu ' : 'Bpk ');
    return `${sapaan}${p.nama}`;
  };

  // Generate tailored WhatsApp templates
  const openWAModal = (item: typeof patientCareProfiles[0], topic: CareCategory) => {
    const p = item.patient;
    const greeting = getGreeting(p);
    const branchName = BRANCHES.find(b => b.code === (p.branchCode || effectiveBranch || currentUserBranch))?.name || 'Earsound';

    let message = '';

    switch (topic) {
      case 'BIRTHDAY':
        message = `Halo ${greeting},\n\nKami segenap keluarga besar *Earsound Hearing Care (${branchName})* mengucapkan *Selamat Ulang Tahun* yang ke-${item.calculatedAge}! 🎂🎉\n\nSemoga Bpk/Ibu senantiasa dikaruniai kesehatan, kebahagiaan, dan kemudahan dalam segala urusan.\n\nSebagai bentuk apresiasi dan kado spesial dari kami, Bpk/Ibu berhak mendapatkan:\n🎁 *Voucher Diskon 15%* untuk Pembelian Baterai & Aksesori\n🎁 *Layanan Pembersihan Alat & Cuci Earmould GRATIS*\n\nSilakan berkunjung ke klinik Earsound kapan pun Bpk/Ibu luang. Salam hangat untuk seluruh keluarga! 💙`;
        break;

      case 'ADAPTASI':
        const abdName = item.latestABD?.tipeABD || 'Alat Bantu Dengar';
        message = `Halo ${greeting},\n\nMenyapa dari klinik *Earsound Hearing Care (${branchName})*.\n\nBagaimana kabar dan pengalaman Bpk/Ibu selama menggunakan alat bantu dengar *${abdName}* beberapa hari ini?\n\nApakah kenyamanan suara dan volumenya sudah pas saat beraktivitas? Jika ada rasa mengganjal di telinga atau suara terasa terlalu bising/mendengung, jangan sungkan mengabari kami ya Bpk/Ibu. Kami siap membantu fine-tuning agar pendengaran semakin jernih dan nyaman. Terima kasih! 🙏`;
        break;

      case 'KONTROL_3_BULAN':
        message = `Halo ${greeting},\n\nSemoga Bpk/Ibu dan keluarga senantiasa sehat selalu.\n\nMenurut catatan layanan klinik kami di *Earsound Hearing Care (${branchName})*, sudah 3 bulan sejak kunjungan pemeriksaan terakhir Bpk/Ibu.\n\nAgar performa pendengaran tetap prima dan alat bantu dengar tetap awet bebas dari sumbatan kotoran (wax), kami mengundang Bpk/Ibu untuk:\n✅ Pengecekan Fungsi & Pembersihan Mesin Alat (GRATIS)\n✅ Cuci & Sterilisasi Earmould/Aidtip (GRATIS)\n✅ Evaluasi Pendengaran Berkala\n\nKira-kira hari apa Bpk/Ibu ada waktu luang untuk mampir ke klinik? Kami akan siapkan jadwal temu terbaik. Terima kasih! 🙏`;
        break;

      case 'LEAD_PERIKSA': {
        const thresholdText = (item.audKananDb !== null || item.audKiriDb !== null) 
          ? ` (Kanan: ${item.audKananDb !== null ? item.audKananDb + ' dB' : '-'}, Kiri: ${item.audKiriDb !== null ? item.audKiriDb + ' dB' : '-'})`
          : '';
        if (item.hasFittingTrial) {
          message = `Halo ${greeting},\n\nMenyapa dari klinik *Earsound Hearing Care (${branchName})*.\n\nKami ingin menanyakan kabar dan kenyamanan pendengaran Bpk/Ibu setelah sebelumnya mencoba demo alat bantu dengar *${item.trialedABDName || 'alat bantu dengar'}* di klinik kami.\n\nMengingat hasil tes audiometri menunjukkan ambang dengar Bpk/Ibu berada di atas 50 dB${thresholdText} yang tergolong indikasi kuat memerlukan amplifikasi suara, pemakaian alat bantu dengar akan sangat membantu menjaga kejelasan komunikasi sehari-hari bersama keluarga.\n\nApakah ada pertanyaan atau hal terkait kecocokan alat yang ingin didiskusikan kembali bersama tim kami? Kami siap mendampingi Bpk/Ibu dengan senang hati. Terima kasih! 🙏`;
        } else {
          message = `Halo ${greeting},\n\nTerima kasih telah berkunjung dan melakukan pemeriksaan audiometri di klinik *Earsound Hearing Care (${branchName})*.\n\nBerdasarkan hasil tes audiometri terakhir, ambang dengar Bpk/Ibu berada di atas 50 dB${thresholdText}. Pada rentang pendengaran tersebut, Bpk/Ibu sudah sangat disarankan menggunakan alat bantu dengar agar percakapan sehari-hari tidak terhambat dan saraf pendengaran tetap terstimulasi dengan baik.\n\nKami mengundang Bpk/Ibu untuk *Sesi Uji Coba Alat Bantu Dengar GRATIS (Free Demo Hearing Aid)* di klinik Earsound, agar Bpk/Ibu dapat langsung merasakan perbedaan mendengar suara keluarga secara jernih dan nyaman tanpa dipungut biaya.\n\nKira-kira hari apa Bpk/Ibu ada waktu luang untuk mencoba? Kami siap menyiapkan jadwal terbaik untuk Bpk/Ibu. Terima kasih! 💙`;
        }
        break;
      }

      case 'BATERAI':
        message = `Halo ${greeting},\n\nMenyapa dari *Earsound Hearing Care (${branchName})*.\n\nBerdasarkan perkiraan riwayat pemakaian rutin, persediaan baterai alat bantu dengar Bpk/Ibu mungkin sudah mulai menipis.\n\nApakah persediaan baterai saat ini masih mencukupi? Jika membutuhkan pengiriman stok baru atau ingin sekalian mampir ke klinik untuk cek alat, tim kami siap melayani dengan senang hati. Terima kasih! 🔋`;
        break;

      case 'GARANSI_UPGRADE':
        if (item.isWarrantyExpiringSoon) {
          message = `Halo ${greeting},\n\nMengingatkan dari *Earsound Hearing Care (${branchName})*, masa garansi resmi pabrikan untuk alat bantu dengar *${item.latestABD?.tipeABD || ''}* Bpk/Ibu akan berakhir dalam 30 hari ke depan.\n\nKami sarankan Bpk/Ibu membawa alat ke klinik untuk kami lakukan *General Check-Up & Servis Menyeluruh GRATIS* ke pabrik sebelum garansi berakhir. Ditunggu kedatangannya ya Bpk/Ibu! 🛡️`;
        } else {
          message = `Halo ${greeting},\n\nSemoga Bpk/Ibu senantiasa sehat. Mengingat alat bantu dengar Bpk/Ibu telah setia menemani lebih dari 3 tahun, kami ingin menginformasikan bahwa saat ini di *Earsound* telah hadir teknologi peredam bising terbaru dengan koneksi langsung ke smartphone.\n\nTersedia pula *Program Trade-In (Tukar Tambah Spesial)* bagi pasien setia Earsound. Silakan mampir untuk mencoba demo teknologinya ya Bpk/Ibu! 👂✨`;
        }
        break;

      default:
        message = `Halo ${greeting},\n\nMenyapa dari *Earsound Hearing Care (${branchName})*. Semoga Bpk/Ibu sekeluarga selalu dalam keadaan sehat walafiat. Ada yang bisa tim kami bantu terkait perawatan pendengaran atau alat bantu dengar Bpk/Ibu hari ini? Terima kasih! 🙏`;
        break;
    }

    setWaModalData({
      patient: p,
      phone: cleanPhoneNumber(p.telepon),
      message,
      topic: topic
    });
    setIsWAModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!waModalData) return;
    const url = `https://wa.me/${waModalData.phone}?text=${encodeURIComponent(waModalData.message)}`;
    window.open(url, '_blank');
    setIsWAModalOpen(false);

    // Prompt to log interaction
    setActivePatientForNote(waModalData.patient);
    setNoteChannel('WhatsApp');
    setNoteContent(`Kirim pesan WA tindak lanjut (${waModalData.topic}): ${waModalData.message.slice(0, 100)}...`);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!activePatientForNote || !noteContent.trim()) return;

    const newNote: CRMNote = {
      id: 'NOTE-' + Date.now(),
      patientId: activePatientForNote.id,
      date: new Date().toISOString(),
      author: currentUserName,
      channel: noteChannel,
      note: noteContent.trim()
    };

    onSaveCRMNote(newNote);
    setIsNoteModalOpen(false);
    setNoteContent('');
    setActivePatientForNote(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#181B57] via-[#23277A] to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#F5B438]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>Customer Care & Hearing Patient Retention</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              CRM & Layanan Pasien Earsound
            </h1>
            <p className="text-xs md:text-sm text-indigo-200 max-w-2xl leading-relaxed">
              Pusat interaksi proaktif pasien: Pengingat Ulang Tahun, Jadwal Kontrol Rutin 3 Bulan, Pendampingan Adaptasi Alat Baru, dan Siklus Kebutuhan Baterai.
            </p>
          </div>

          {/* Quick Branch Selector */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex items-center gap-3 w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-[#F5B438] shrink-0" />
            <div className="w-full">
              <label className="block text-[10px] uppercase font-bold text-indigo-200">
                Filter Cabang:
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer w-full"
              >
                <option value="ALL" className="text-slate-900">🌐 Semua Cabang Earsound</option>
                {BRANCHES.map(b => (
                  <option key={b.code} value={b.code} className="text-slate-900">
                    [{b.code}] {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Top KPI Cards (Interactive Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          {/* Ulang Tahun */}
          <button
            type="button"
            onClick={() => setActiveCategory('BIRTHDAY')}
            className={`p-3.5 rounded-2xl text-left transition-all relative overflow-hidden border ${
              activeCategory === 'BIRTHDAY'
                ? 'bg-amber-500/25 border-[#F5B438] shadow-md ring-2 ring-[#F5B438]/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[#F5B438] mb-1">
              <Cake className="w-4 h-4" />
              {kpiCounts.birthdayTodayCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-black animate-pulse">
                  {kpiCounts.birthdayTodayCount} Hari Ini
                </span>
              )}
            </div>
            <div className="text-xl font-black text-white">{kpiCounts.birthdayMonthCount}</div>
            <div className="text-[11px] font-semibold text-indigo-200 leading-tight mt-0.5">
              Ulang Tahun Bulan Ini
            </div>
          </button>

          {/* Adaptasi Baru */}
          <button
            type="button"
            onClick={() => setActiveCategory('ADAPTASI')}
            className={`p-3.5 rounded-2xl text-left transition-all border ${
              activeCategory === 'ADAPTASI'
                ? 'bg-emerald-500/25 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="text-emerald-400 mb-1">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-white">{kpiCounts.adaptasiCount}</div>
            <div className="text-[11px] font-semibold text-indigo-200 leading-tight mt-0.5">
              Adaptasi ABD (0-30 Hari)
            </div>
          </button>

          {/* Kontrol 3 Bulan */}
          <button
            type="button"
            onClick={() => setActiveCategory('KONTROL_3_BULAN')}
            className={`p-3.5 rounded-2xl text-left transition-all border ${
              activeCategory === 'KONTROL_3_BULAN'
                ? 'bg-blue-500/25 border-blue-400 shadow-md ring-2 ring-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="text-blue-300 mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-white">{kpiCounts.kontrolCount}</div>
            <div className="text-[11px] font-semibold text-indigo-200 leading-tight mt-0.5">
              Kontrol Rutin (&gt; 3 Bln)
            </div>
          </button>

          {/* Leads Periksa Audiometri > 50 dB */}
          <button
            type="button"
            onClick={() => setActiveCategory('LEAD_PERIKSA')}
            className={`p-3.5 rounded-2xl text-left transition-all border ${
              activeCategory === 'LEAD_PERIKSA'
                ? 'bg-purple-500/25 border-purple-400 shadow-md ring-2 ring-purple-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="text-purple-300 mb-1 flex items-center justify-between">
              <Stethoscope className="w-4 h-4" />
              <span className="text-[9px] px-1.5 py-0.2 bg-purple-400/30 text-purple-200 rounded-full font-bold">
                &gt; 50 dB
              </span>
            </div>
            <div className="text-xl font-black text-white">{kpiCounts.leadsCount}</div>
            <div className="text-[11px] font-semibold text-indigo-200 leading-tight mt-0.5">
              Prospek Tes (&gt; 50 dB)
            </div>
            <div className="text-[10px] text-purple-200/70 mt-1">
              Demo: {kpiCounts.leadsTrialedCount} | Blm: {kpiCounts.leadsNotTrialedCount}
            </div>
          </button>

          {/* Baterai & Aksesori */}
          <button
            type="button"
            onClick={() => setActiveCategory('BATERAI')}
            className={`p-3.5 rounded-2xl text-left transition-all border ${
              activeCategory === 'BATERAI'
                ? 'bg-cyan-500/25 border-cyan-400 shadow-md ring-2 ring-cyan-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="text-cyan-300 mb-1">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-white">{kpiCounts.batteryCount}</div>
            <div className="text-[11px] font-semibold text-indigo-200 leading-tight mt-0.5">
              Estimasi Baterai Habis
            </div>
          </button>

          {/* Garansi & Upgrade */}
          <button
            type="button"
            onClick={() => setActiveCategory('GARANSI_UPGRADE')}
            className={`p-3.5 rounded-2xl text-left transition-all border ${
              activeCategory === 'GARANSI_UPGRADE'
                ? 'bg-rose-500/25 border-rose-400 shadow-md ring-2 ring-rose-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10'
            }`}
          >
            <div className="text-rose-300 mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-white">{kpiCounts.warrantyCount}</div>
            <div className="text-[11px] font-semibold text-indigo-200 leading-tight mt-0.5">
              Garansi / Upgrade (&gt; 3 Thn)
            </div>
          </button>
        </div>
      </div>

      {/* Control Bar: Categories & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveCategory('BIRTHDAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'BIRTHDAY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cake className="w-3.5 h-3.5 text-[#F5B438]" />
              <span>Ulang Tahun</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">
                {kpiCounts.birthdayMonthCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('ADAPTASI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'ADAPTASI'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Adaptasi ABD Baru</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {kpiCounts.adaptasiCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('KONTROL_3_BULAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'KONTROL_3_BULAN'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Kontrol Rutin 3 Bln</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-100 text-blue-800 font-bold">
                {kpiCounts.kontrolCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('LEAD_PERIKSA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'LEAD_PERIKSA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
              <span>Prospek Tes (&gt; 50 dB)</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-purple-100 text-purple-800 font-bold">
                {kpiCounts.leadsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('BATERAI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'BATERAI'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5 text-cyan-600" />
              <span>Baterai Habis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('GARANSI_UPGRADE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'GARANSI_UPGRADE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>Garansi & Upgrade</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Semua Pasien ({kpiCounts.totalPatients})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari pasien, no. HP, alat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#23277A] outline-none"
            />
          </div>
        </div>

        {/* Sub-Filter for Birthday Category */}
        {activeCategory === 'BIRTHDAY' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Rentang Waktu Ulang Tahun:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setBirthdayFilter('TODAY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    birthdayFilter === 'TODAY'
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🎉 Hari Ini ({kpiCounts.birthdayTodayCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBirthdayFilter('NEXT_7_DAYS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    birthdayFilter === 'NEXT_7_DAYS'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📅 7 Hari Mendatang
                </button>
                <button
                  type="button"
                  onClick={() => setBirthdayFilter('THIS_MONTH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    birthdayFilter === 'THIS_MONTH'
                      ? 'bg-[#23277A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🗓️ Sepanjang Bulan Ini ({kpiCounts.birthdayMonthCount})
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic">
              * Kirimkan ucapan hangat & voucher hadiah servis gratis/diskon baterai untuk mempererat loyalitas pasien.
            </p>
          </div>
        )}

        {/* Sub-Filter for Leads Audiometri > 50 dB Category */}
        {activeCategory === 'LEAD_PERIKSA' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Status Uji Coba Demo:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setProspectFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    prospectFilter === 'ALL'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📋 Semua Prospek (&gt; 50 dB) ({kpiCounts.leadsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setProspectFilter('TRIALED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    prospectFilter === 'TRIALED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🎧 Sudah Dicobakan Alat ({kpiCounts.leadsTrialedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setProspectFilter('NOT_TRIALED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    prospectFilter === 'NOT_TRIALED'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ⏳ Belum Dicobakan Alat ({kpiCounts.leadsNotTrialedCount})
                </button>
              </div>
            </div>

            <p className="text-xs text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-medium">
              💡 Pasien tes audiometri dengan ambang dengar &gt; 50 dB (indikasi kuat ABD) yang belum membeli alat.
            </p>
          </div>
        )}
      </div>

      {/* Patient Cards List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs text-slate-500 px-1 font-semibold">
          <span>Menampilkan <strong>{displayedProfiles.length}</strong> pasien sesuai kriteria:</span>
          <span>{selectedBranch === 'ALL' ? 'Seluruh Cabang' : `Cabang: ${selectedBranch}`}</span>
        </div>

        {displayedProfiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Tidak ada pasien dalam kategori ini saat ini</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Semua pasien pada filter ini sudah terlayani atau belum memasuki siklus follow-up. Coba ubah kategori atau filter pencarian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedProfiles.map((item) => {
              const p = item.patient;
              const hasValidPhone = Boolean(p.telepon && p.telepon.length >= 8);

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between hover:shadow-md ${
                    item.isBirthdayToday
                      ? 'border-amber-400 shadow-xs ring-1 ring-amber-400/40 bg-gradient-to-b from-amber-50/40 to-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Branch & Context Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[#23277A] font-bold text-[10px]">
                        Cabang {p.branchCode || 'Pusat'}
                      </span>

                      {/* Status Badges */}
                      {item.isBirthdayToday && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] animate-pulse flex items-center gap-1">
                          <Cake className="w-3 h-3" />
                          <span>ULANG TAHUN HARI INI!</span>
                        </span>
                      )}

                      {!item.isBirthdayToday && item.isBirthdayThisMonth && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1">
                          <Cake className="w-3 h-3 text-amber-600" />
                          <span>Ultah: {p.tanggalLahir ? p.tanggalLahir.split('-').slice(1).join('/') : ''} ({item.daysUntilBirthday} hr lagi)</span>
                        </span>
                      )}

                      {activeCategory === 'ADAPTASI' && item.daysSinceABDPurchase !== null && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-emerald-600" />
                          <span>Adaptasi Hari ke-{item.daysSinceABDPurchase}</span>
                        </span>
                      )}

                      {activeCategory === 'KONTROL_3_BULAN' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-bold text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>{item.daysSinceLastVisit} Hari Belum Kontrol</span>
                        </span>
                      )}

                      {activeCategory === 'LEAD_PERIKSA' && (
                        <>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-bold text-[10px] flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-purple-600" />
                            <span>Ambang &gt; 50 dB (Indikasi ABD)</span>
                          </span>
                          {item.hasFittingTrial ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-emerald-600" />
                              <span>Sudah Demo: {item.trialedABDName || 'Pernah Dicoba'}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Belum Dicobakan Alat</span>
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Patient Name & Age */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-base font-extrabold text-slate-900 truncate">
                        {p.gelar ? `${p.gelar} ` : ''}{p.nama}
                      </h4>
                      <span className="text-xs font-semibold text-slate-500 shrink-0">
                        {item.calculatedAge > 0 ? `${item.calculatedAge} Thn` : ''} ({p.gender === 'P' ? 'Wanita' : 'Pria'})
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-400 mb-3">
                      ID: {p.id}
                    </p>

                    {/* Key Info Details */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs text-slate-600 mb-3">
                      {/* Tanggal Lahir */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                          <Cake className="w-3.5 h-3.5 text-amber-500" /> Tanggal Lahir:
                        </span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {p.tanggalLahir || '-'}
                        </span>
                      </div>

                      {/* Device / Alat Terakhir */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                          <Volume2 className="w-3.5 h-3.5 text-[#23277A]" /> Alat Dimiliki:
                        </span>
                        <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px]" title={item.latestABD?.tipeABD || '-'}>
                          {item.latestABD?.tipeABD || (item.patientJasa.length > 0 ? 'Hanya Jasa Periksa' : '-')}
                        </span>
                      </div>

                      {/* Terakhir Berkunjung */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Kunjungan Terakhir:
                        </span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {item.latestActivity ? `${item.latestActivity.date.toISOString().split('T')[0]} (${item.daysSinceLastVisit} hr)` : 'Belum ada'}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-indigo-500" /> Telepon:
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {p.telepon || '-'}
                        </span>
                      </div>

                      {/* Audiometri Info for LEAD_PERIKSA or patients with audiometry */}
                      {(activeCategory === 'LEAD_PERIKSA' || item.isAudiometryProspect) && (
                        <div className="pt-2 mt-1 border-t border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-purple-700 font-bold flex items-center gap-1.5 text-[11px]">
                              <Stethoscope className="w-3.5 h-3.5 text-purple-600" /> Ambang Dengar:
                            </span>
                            <span className="font-bold text-[11px]">
                              R: <span className="text-rose-600">{item.audKananDb !== null ? `${item.audKananDb} dB` : '-'}</span> | L: <span className="text-blue-600">{item.audKiriDb !== null ? `${item.audKiriDb} dB` : '-'}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                              <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> Status Demo Alat:
                            </span>
                            <span className={`font-bold text-[11px] ${item.hasFittingTrial ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {item.hasFittingTrial ? `✅ ${item.trialedABDName || 'Pernah Dicoba'}` : '⏳ Belum Dicobakan'}
                            </span>
                          </div>

                          {item.leadPotensi && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                                ⭐ Minat/Potensi:
                              </span>
                              <span className="font-bold text-slate-800 text-[11px]">
                                {item.leadPotensi}
                              </span>
                            </div>
                          )}

                          {item.leadHACNotes && (
                            <div className="text-[10px] text-slate-600 bg-purple-50/80 p-1.5 rounded-lg border border-purple-100">
                              <span className="font-bold text-purple-900">Catatan Audiometris:</span> "{item.leadHACNotes}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Latest CRM Note if exists */}
                    {item.notes.length > 0 && (
                      <div className="mb-3 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-indigo-700 font-bold">
                          <span>Catatan Terakhir ({item.notes[0].channel}):</span>
                          <span>{item.notes[0].date.split('T')[0]}</span>
                        </div>
                        <p className="text-slate-700 italic line-clamp-2">
                          "{item.notes[0].note}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!hasValidPhone}
                      onClick={() => openWAModal(item, activeCategory)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                        hasValidPhone
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={hasValidPhone ? 'Kirim Pesan WhatsApp Otomatis' : 'Nomor Telepon Tidak Tersedia'}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim WA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePatientForNote(p);
                        setIsNoteModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-[#23277A] border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Catat Interaksi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: WhatsApp Preview & Send */}
      {isWAModalOpen && waModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                  Template WhatsApp Customer Care
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Kirim Pesan ke {waModalData.patient.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  No. Tujuan: <strong className="font-mono text-emerald-700">+{waModalData.phone}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWAModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pratinjau Pesan (Dapat Disesuaikan Sebelum Kirim):
              </label>
              <textarea
                rows={9}
                value={waModalData.message}
                onChange={(e) => setWaModalData({ ...waModalData, message: e.target.value })}
                className="w-full p-3 text-xs leading-relaxed border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-sans text-slate-800 bg-emerald-50/20"
              />
              <p className="text-[11px] text-slate-400 mt-1 italic">
                * Teks di atas akan otomatis dimuat ke WhatsApp Web atau aplikasi WhatsApp Anda.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWAModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Buka WhatsApp & Kirim</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Catatan Interaksi (CRM Note) */}
      {isNoteModalOpen && activePatientForNote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold uppercase">
                  Log Interaksi Pasien
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Catat Komunikasi: {activePatientForNote.nama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Saluran Komunikasi
                </label>
                <select
                  value={noteChannel}
                  onChange={(e) => setNoteChannel(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#23277A] outline-none"
                >
                  <option value="WhatsApp">💬 WhatsApp</option>
                  <option value="Telepon">📞 Sambungan Telepon Langsung</option>
                  <option value="Kunjungan Langsung">🏬 Kunjungan Langsung ke Klinik</option>
                  <option value="Lainnya">📝 Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hasil / Catatan Respon Pasien
                </label>
                <textarea
                  rows={4}
                  placeholder="Contoh: Pasien merespon ramah, mengeluh alat sebelah kanan peluit kadang berdenging, janji kontrol Sabtu siang."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>

              {/* Existing Notes for this patient */}
              {(() => {
                const existing = crmNotes
                  .filter(n => n.patientId === activePatientForNote.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                if (existing.length === 0) return null;

                return (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      Riwayat Catatan Sebelumnya ({existing.length}):
                    </label>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {existing.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#23277A]">
                              <span>{n.channel}</span>
                              <span>•</span>
                              <span>{n.date.split('T')[0]}</span>
                              <span>•</span>
                              <span className="text-slate-500">{n.author}</span>
                            </div>
                            <p className="text-slate-700 text-[11px]">{n.note}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteCRMNote(n.id)}
                            className="text-slate-300 hover:text-red-500 p-1"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                  noteContent.trim()
                    ? 'bg-[#23277A] hover:bg-indigo-900 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Simpan Catatan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
