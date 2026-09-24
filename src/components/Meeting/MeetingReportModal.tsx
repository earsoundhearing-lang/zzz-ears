import React, { useState, useMemo, useRef } from 'react';
import { 
  Patient, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  KasKecilEntry,
  EarmouldReport,
  ReparasiService,
  ABDInventoryEntry,
  AksesorisInventoryEntry,
  AppUser,
  BranchCode
} from '../../types';
import { BRANCHES, getBranchByCode } from '../../utils/branches';
import { formatRupiah, formatIndoDate, getTodayDateString, parseDateParts, isSalesTransaction } from '../../utils/formatters';
import { normalizeABDTipe, normalizeAksesorisProduct } from '../../utils/productNormalizer';
import { matchOfficialDoctorName } from '../../data/doctors';
import { 
  getBranchMonthlyTarget2026, 
  getBranchYearlyTarget2026, 
  MONTH_NAMES_INDONESIA 
} from '../../data/branchTargets2026';
import { EarsoundLogo } from '../Common/EarsoundLogo';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  X, 
  Calendar, 
  Building2, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Layers,
  ChevronDown,
  Sparkles,
  FileText
} from 'lucide-react';

export type MeetingPeriodType = 'mingguan' | 'bulanan' | 'tahunan' | 'kustom';

interface MeetingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AppUser;
  selectedBranch?: BranchCode;
  patients?: Patient[];
  aksesoris?: AksesorisTransaction[];
  jasaPeriksa?: JasaPeriksaTransaction[];
  abd?: ABDTransaction[];
  kasKecil?: KasKecilEntry[];
  earmould?: EarmouldReport[];
  reparasi?: ReparasiService[];
  inventoryABD?: ABDInventoryEntry[];
  inventoryAksesoris?: AksesorisInventoryEntry[];
  allPatients?: Patient[];
  allAksesoris?: AksesorisTransaction[];
  allJasaPeriksa?: JasaPeriksaTransaction[];
  allABD?: ABDTransaction[];
  allEarmould?: EarmouldReport[];
  allReparasi?: ReparasiService[];
  initialPeriodType?: MeetingPeriodType;
  initialFocusedSection?: 'all' | 'products' | 'referrals';
}

export const MeetingReportModal: React.FC<MeetingReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedBranch = 'ALL',
  patients = [],
  aksesoris = [],
  jasaPeriksa = [],
  abd = [],
  kasKecil = [],
  earmould = [],
  reparasi = [],
  inventoryABD = [],
  inventoryAksesoris = [],
  allPatients = [],
  allAksesoris = [],
  allJasaPeriksa = [],
  allABD = [],
  allEarmould = [],
  allReparasi = [],
  initialPeriodType = 'bulanan',
  initialFocusedSection = 'all',
}) => {
  if (!isOpen) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();

  // Period state
  const [periodType, setPeriodType] = useState<MeetingPeriodType>(initialPeriodType);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedWeekPreset, setSelectedWeekPreset] = useState<'7days' | 'thisWeek' | 'lastWeek'>('7days');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString());

  // Branch filter state
  const [branchFilter, setBranchFilter] = useState<BranchCode>(selectedBranch);

  // Agenda / Section visibility toggles
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(true);
  const [showTargetEvaluation, setShowTargetEvaluation] = useState(true);
  const [showProductSales, setShowProductSales] = useState(true);
  const [showReferrals, setShowReferrals] = useState(true);
  const [showBranchComparison, setShowBranchComparison] = useState(true);
  const [showOutstandingWork, setShowOutstandingWork] = useState(true);
  const [showInventoryHealth, setShowInventoryHealth] = useState(true);
  const [showActionPlan, setShowActionPlan] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  // Optional customizable meeting meta
  const [meetingTitle, setMeetingTitle] = useState(() => {
    if (initialPeriodType === 'mingguan') return 'BAHAN RAPAT EVALUASI MINGGUAN (WEEKLY REVIEW)';
    if (initialPeriodType === 'tahunan') return 'BAHAN RAPAT EVALUASI TAHUNAN (ANNUAL REVIEW)';
    return 'BAHAN RAPAT EVALUASI BULANAN (MONTHLY REVIEW)';
  });
  const [meetingLeader, setMeetingLeader] = useState('Pimpinan Cabang / Direksi Earsound');
  const [meetingNotesInput, setMeetingNotesInput] = useState('');

  // Update meeting title if period type changes
  const handlePeriodChange = (type: MeetingPeriodType) => {
    setPeriodType(type);
    if (type === 'mingguan') {
      setMeetingTitle('BAHAN RAPAT EVALUASI MINGGUAN (WEEKLY REVIEW)');
    } else if (type === 'bulanan') {
      setMeetingTitle('BAHAN RAPAT EVALUASI BULANAN (MONTHLY REVIEW)');
    } else if (type === 'tahunan') {
      setMeetingTitle('BAHAN RAPAT EVALUASI TAHUNAN (ANNUAL REVIEW)');
    } else {
      setMeetingTitle('BAHAN RAPAT EVALUASI KHUSUS (PERIODIC REVIEW)');
    }
  };

  // Determine Effective Date Range
  const { startDate, endDate, dateRangeLabel } = useMemo(() => {
    if (periodType === 'mingguan') {
      const now = new Date();
      if (selectedWeekPreset === '7days') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        const sStr = start.toISOString().split('T')[0];
        const eStr = now.toISOString().split('T')[0];
        return {
          startDate: sStr,
          endDate: eStr,
          dateRangeLabel: `${formatIndoDate(sStr)} s/d ${formatIndoDate(eStr)} (7 Hari Terakhir)`,
        };
      } else if (selectedWeekPreset === 'thisWeek') {
        // Monday to Sunday of current week
        const dayOfWeek = now.getDay();
        const diffToMon = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        const start = new Date(now.setDate(diffToMon));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const sStr = start.toISOString().split('T')[0];
        const eStr = end.toISOString().split('T')[0];
        return {
          startDate: sStr,
          endDate: eStr,
          dateRangeLabel: `${formatIndoDate(sStr)} s/d ${formatIndoDate(eStr)} (Minggu Berjalan)`,
        };
      } else {
        // Last week
        const dayOfWeek = now.getDay();
        const diffToMon = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7;
        const start = new Date(now.setDate(diffToMon));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const sStr = start.toISOString().split('T')[0];
        const eStr = end.toISOString().split('T')[0];
        return {
          startDate: sStr,
          endDate: eStr,
          dateRangeLabel: `${formatIndoDate(sStr)} s/d ${formatIndoDate(eStr)} (Minggu Lalu)`,
        };
      }
    } else if (periodType === 'bulanan') {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0); // Last day of month
      const sStr = start.toISOString().split('T')[0];
      const eStr = end.toISOString().split('T')[0];
      return {
        startDate: sStr,
        endDate: eStr,
        dateRangeLabel: `Bulan ${MONTH_NAMES_INDONESIA[selectedMonth]} ${selectedYear} (${formatIndoDate(sStr)} - ${formatIndoDate(eStr)})`,
      };
    } else if (periodType === 'tahunan') {
      const sStr = `${selectedYear}-01-01`;
      const eStr = `${selectedYear}-12-31`;
      return {
        startDate: sStr,
        endDate: eStr,
        dateRangeLabel: `Tahun Buku ${selectedYear} (1 Jan - 31 Des ${selectedYear})`,
      };
    } else {
      return {
        startDate: customStart,
        endDate: customEnd,
        dateRangeLabel: `${formatIndoDate(customStart)} s/d ${formatIndoDate(customEnd)}`,
      };
    }
  }, [periodType, selectedMonth, selectedYear, selectedWeekPreset, customStart, customEnd]);

  // Source datasets based on branch filter
  const basePatients = branchFilter === 'ALL' ? (allPatients.length > 0 ? allPatients : patients) : patients.filter(p => p.branchCode === branchFilter);
  const baseAksesoris = branchFilter === 'ALL' ? (allAksesoris.length > 0 ? allAksesoris : aksesoris) : aksesoris.filter(a => a.branchCode === branchFilter);
  const baseJasaPeriksa = branchFilter === 'ALL' ? (allJasaPeriksa.length > 0 ? allJasaPeriksa : jasaPeriksa) : jasaPeriksa.filter(j => j.branchCode === branchFilter);
  const baseABD = branchFilter === 'ALL' ? (allABD.length > 0 ? allABD : abd) : abd.filter(b => b.branchCode === branchFilter);
  const baseKasKecil = branchFilter === 'ALL' ? kasKecil : kasKecil.filter(k => k.branchCode === branchFilter);
  const baseEarmould = branchFilter === 'ALL' ? (allEarmould.length > 0 ? allEarmould : earmould) : earmould.filter(e => e.branchCode === branchFilter);
  const baseReparasi = branchFilter === 'ALL' ? (allReparasi.length > 0 ? allReparasi : reparasi) : reparasi.filter(r => r.branchCode === branchFilter);

  // Filter transactions within Date Range
  const isDateWithinRange = (dateStr?: string) => {
    if (!dateStr) return false;
    const clean = String(dateStr).split('T')[0].trim();
    if (startDate && clean < startDate) return false;
    if (endDate && clean > endDate) return false;
    return true;
  };

  const periodAksesoris = useMemo(() => baseAksesoris.filter(a => isSalesTransaction(a) && isDateWithinRange(a.tanggal)), [baseAksesoris, startDate, endDate]);
  const periodJasaPeriksa = useMemo(() => baseJasaPeriksa.filter(j => isSalesTransaction(j) && isDateWithinRange(j.tanggal)), [baseJasaPeriksa, startDate, endDate]);
  const periodABD = useMemo(() => baseABD.filter(b => isSalesTransaction(b) && isDateWithinRange(b.tanggal)), [baseABD, startDate, endDate]);
  const periodPatients = useMemo(() => basePatients.filter(p => isDateWithinRange(p.createdAt)), [basePatients, startDate, endDate]);
  const periodKasKecil = useMemo(() => baseKasKecil.filter(k => isDateWithinRange(k.tanggal)), [baseKasKecil, startDate, endDate]);
  const periodEarmould = useMemo(() => baseEarmould.filter(e => isDateWithinRange(e.tanggalCetak || e.tanggalOrder)), [baseEarmould, startDate, endDate]);
  const periodReparasi = useMemo(() => baseReparasi.filter(r => isDateWithinRange(r.tanggalMasuk)), [baseReparasi, startDate, endDate]);

  // Aggregate Key Executive Numbers
  const totalOmsetAksesoris = periodAksesoris.reduce((sum, a) => sum + (a.jumlah || 0), 0);
  const totalOmsetJasa = periodJasaPeriksa.reduce((sum, j) => sum + (j.biayaJasaPeriksa || 0), 0);
  const totalOmsetABD = periodABD.reduce((sum, b) => sum + (b.jumlah || 0), 0);
  const grandTotalOmset = totalOmsetAksesoris + totalOmsetJasa + totalOmsetABD;
  const totalTxCount = periodAksesoris.length + periodJasaPeriksa.length + periodABD.length;
  const aov = totalTxCount > 0 ? Math.round(grandTotalOmset / totalTxCount) : 0;

  // Hearing Aid unit breakdown (Monaural vs Binaural)
  const abdUnitsSummary = useMemo(() => {
    let totalUnits = 0;
    let monauralCount = 0;
    let binauralCount = 0;

    periodABD.forEach(b => {
      const isBinaural = b.fittingType === 'Binaural';
      if (isBinaural) {
        binauralCount += 1;
        totalUnits += 2;
      } else {
        monauralCount += 1;
        totalUnits += 1;
      }
    });

    return { totalUnits, monauralCount, binauralCount };
  }, [periodABD]);

  // Target Evaluation Logic
  const targetInfo = useMemo(() => {
    let targetNominal = 0;
    let targetLabel = '';

    if (periodType === 'bulanan') {
      targetNominal = getBranchMonthlyTarget2026(branchFilter, selectedMonth);
      targetLabel = `Target Bulan ${MONTH_NAMES_INDONESIA[selectedMonth]} 2026`;
    } else if (periodType === 'tahunan') {
      targetNominal = getBranchYearlyTarget2026(branchFilter);
      targetLabel = `Target Tahun 2026`;
    } else if (periodType === 'mingguan') {
      // Pro-rata weekly target from monthly target (approx 1/4 of month)
      const fullMonthTarget = getBranchMonthlyTarget2026(branchFilter, currentMonthIdx);
      targetNominal = Math.round(fullMonthTarget / 4);
      targetLabel = `Target Mingguan (Estimasi 1/4 Bulan)`;
    } else {
      // Pro-rata based on days
      targetNominal = getBranchMonthlyTarget2026(branchFilter, currentMonthIdx);
      targetLabel = `Estimasi Target Proporsional`;
    }

    const achievementPercent = targetNominal > 0 ? Number(((grandTotalOmset / targetNominal) * 100).toFixed(1)) : 0;
    const gap = grandTotalOmset - targetNominal;

    return {
      targetNominal,
      targetLabel,
      achievementPercent,
      gap,
      isAchieved: gap >= 0,
    };
  }, [branchFilter, periodType, selectedMonth, grandTotalOmset, currentMonthIdx]);

  // =========================================================
  // Product Sales Breakdown Table (ABD + Accessories/Batteries)
  // With name standardization as requested by user
  // =========================================================
  const { productStats, sumProductQty, sumProductValue } = useMemo(() => {
    const map: { [key: string]: { name: string; category: string; qty: number; value: number } } = {};

    // 1. ABD Units
    periodABD.forEach(a => {
      const canonicalTipe = normalizeABDTipe(a.tipeABD) || 'Alat Bantu Dengar';
      const isBinaural = a.fittingType === 'Binaural';
      const tipe2 = a.tipeABD2 ? normalizeABDTipe(a.tipeABD2) : undefined;

      if (isBinaural && tipe2 && tipe2 !== canonicalTipe) {
        if (!map[canonicalTipe]) {
          map[canonicalTipe] = { name: canonicalTipe, category: 'Alat Bantu Dengar', qty: 0, value: 0 };
        }
        map[canonicalTipe].qty += 1;
        map[canonicalTipe].value += Math.round((a.jumlah || 0) / 2);

        if (!map[tipe2]) {
          map[tipe2] = { name: tipe2, category: 'Alat Bantu Dengar', qty: 0, value: 0 };
        }
        map[tipe2].qty += 1;
        map[tipe2].value += Math.round((a.jumlah || 0) / 2);
      } else {
        if (!map[canonicalTipe]) {
          map[canonicalTipe] = { name: canonicalTipe, category: 'Alat Bantu Dengar', qty: 0, value: 0 };
        }
        const qty = isBinaural ? 2 : 1;
        map[canonicalTipe].qty += qty;
        map[canonicalTipe].value += (a.jumlah || 0);
      }
    });

    // 2. Aksesoris & Baterai
    periodAksesoris.forEach(acc => {
      if (acc.items && acc.items.length > 0) {
        acc.items.forEach(item => {
          const norm = normalizeAksesorisProduct(item.category, item.subtype);
          const name = norm.displayName;
          if (!map[name]) {
            map[name] = { name, category: norm.category, qty: 0, value: 0 };
          }
          map[name].qty += (item.qty || 1);
          map[name].value += (item.subtotal || 0);
        });
      } else {
        const norm = normalizeAksesorisProduct(acc.category, acc.subtype);
        const name = norm.displayName;
        if (!map[name]) {
          map[name] = { name, category: norm.category, qty: 0, value: 0 };
        }
        map[name].qty += (acc.qty || 1);
        map[name].value += (acc.jumlah || 0);
      }
    });

    const list = Object.values(map);
    const totalQ = list.reduce((sum, item) => sum + item.qty, 0);
    const totalV = list.reduce((sum, item) => sum + item.value, 0);

    const sorted = list
      .map(item => ({
        ...item,
        percentQty: totalQ > 0 ? Number(((item.qty / totalQ) * 100).toFixed(1)) : 0,
        percentValue: totalV > 0 ? Number(((item.value / totalV) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.qty - a.qty || b.value - a.value);

    return {
      productStats: sorted,
      sumProductQty: totalQ,
      sumProductValue: totalV,
    };
  }, [periodABD, periodAksesoris]);

  // =========================================================
  // Referral & Marketing Channel Breakdown
  // =========================================================
  const { channelStats, topDoctorsList } = useMemo(() => {
    // Map patient ID to patient
    const pMap = new Map<string, Patient>();
    periodPatients.forEach(p => pMap.set(p.id, p));

    // Channels map
    const catMap: { [cat: string]: { name: string; patientCount: number; salesCount: number; omset: number } } = {
      'Dokter & Rumah Sakit': { name: 'Dokter & RS (Medical Referral)', patientCount: 0, salesCount: 0, omset: 0 },
      'Online & Digital': { name: 'Saluran Online & Media Sosial', patientCount: 0, salesCount: 0, omset: 0 },
      'Offline & Walk-In': { name: 'Walk-In & Rekomendasi Offline', patientCount: 0, salesCount: 0, omset: 0 },
    };

    const docMap: { [docName: string]: { name: string; hospital?: string; patientCount: number; salesCount: number; omset: number } } = {};

    // Group patients into categories
    periodPatients.forEach(p => {
      const src = p.referalChannel || p.referal || 'Walk-in / Datang Langsung';
      const doc = p.namaDokter ? matchOfficialDoctorName(p.namaDokter) : null;

      if (src === 'Dokter' || src === 'Rumah Sakit' || src === 'Dokter Umum dan Dokter Spesialis' || src === 'RS/LAB/KLINIK' || doc) {
        catMap['Dokter & Rumah Sakit'].patientCount += 1;
        const officialName = doc || p.namaDokter || 'Dokter Spesialis THT';
        if (!docMap[officialName]) {
          docMap[officialName] = { name: officialName, hospital: p.namaRS, patientCount: 0, salesCount: 0, omset: 0 };
        }
        docMap[officialName].patientCount += 1;
      } else if (
        ['Instagram', 'Facebook', 'TikTok', 'Google', 'Website', 'Shopee'].some(k => src.includes(k))
      ) {
        catMap['Online & Digital'].patientCount += 1;
      } else {
        catMap['Offline & Walk-In'].patientCount += 1;
      }
    });

    // Map sales to channels
    [...periodABD, ...periodJasaPeriksa, ...periodAksesoris].forEach(tx => {
      const p = pMap.get(tx.idPelanggan);
      const val = 'jumlah' in tx ? tx.jumlah : 'biayaJasaPeriksa' in tx ? tx.biayaJasaPeriksa : 0;
      const src = p?.referalChannel || p?.referal || 'Walk-in / Datang Langsung';
      const doc = p?.namaDokter ? matchOfficialDoctorName(p.namaDokter) : null;

      if (src === 'Dokter' || src === 'Rumah Sakit' || src === 'Dokter Umum dan Dokter Spesialis' || src === 'RS/LAB/KLINIK' || doc) {
        catMap['Dokter & Rumah Sakit'].salesCount += 1;
        catMap['Dokter & Rumah Sakit'].omset += val;
        const officialName = doc || p?.namaDokter || 'Dokter Spesialis THT';
        if (docMap[officialName]) {
          docMap[officialName].salesCount += 1;
          docMap[officialName].omset += val;
        }
      } else if (
        ['Instagram', 'Facebook', 'TikTok', 'Google', 'Website', 'Shopee'].some(k => src.includes(k))
      ) {
        catMap['Online & Digital'].salesCount += 1;
        catMap['Online & Digital'].omset += val;
      } else {
        catMap['Offline & Walk-In'].salesCount += 1;
        catMap['Offline & Walk-In'].omset += val;
      }
    });

    const topDocs = Object.values(docMap).sort((a, b) => b.omset - a.omset || b.patientCount - a.patientCount);

    return {
      channelStats: Object.values(catMap),
      topDoctorsList: topDocs,
    };
  }, [periodPatients, periodABD, periodJasaPeriksa, periodAksesoris]);

  // =========================================================
  // 8 Branches Comparison Table (When branchFilter is ALL)
  // =========================================================
  const branchComparisonList = useMemo(() => {
    if (branchFilter !== 'ALL') return [];

    const realBranches = BRANCHES.filter(b => b.code !== 'ALL' && b.code !== 'HQ');
    return realBranches.map(b => {
      const bAks = (allAksesoris.length > 0 ? allAksesoris : aksesoris).filter(a => a.branchCode === b.code && isSalesTransaction(a) && isDateWithinRange(a.tanggal));
      const bJsa = (allJasaPeriksa.length > 0 ? allJasaPeriksa : jasaPeriksa).filter(j => j.branchCode === b.code && isSalesTransaction(j) && isDateWithinRange(j.tanggal));
      const bAbd = (allABD.length > 0 ? allABD : abd).filter(a => a.branchCode === b.code && isSalesTransaction(a) && isDateWithinRange(a.tanggal));
      const bPat = (allPatients.length > 0 ? allPatients : patients).filter(p => p.branchCode === b.code && isDateWithinRange(p.createdAt));

      const aksOmset = bAks.reduce((sum, a) => sum + (a.jumlah || 0), 0);
      const jsaOmset = bJsa.reduce((sum, j) => sum + (j.biayaJasaPeriksa || 0), 0);
      const abdOmset = bAbd.reduce((sum, a) => sum + (a.jumlah || 0), 0);
      const totalOmset = aksOmset + jsaOmset + abdOmset;

      let bUnits = 0;
      bAbd.forEach(item => {
        bUnits += (item.fittingType === 'Binaural' ? 2 : 1);
      });

      const bTarget = periodType === 'bulanan'
        ? getBranchMonthlyTarget2026(b.code, selectedMonth)
        : periodType === 'tahunan'
        ? getBranchYearlyTarget2026(b.code)
        : Math.round(getBranchMonthlyTarget2026(b.code, currentMonthIdx) / 4);

      const achPercent = bTarget > 0 ? Number(((totalOmset / bTarget) * 100).toFixed(1)) : 0;

      return {
        code: b.code,
        name: b.name,
        totalOmset,
        target: bTarget,
        achievementPercent: achPercent,
        abdUnits: bUnits,
        patientCount: bPat.length,
        txCount: bAks.length + bJsa.length + bAbd.length,
      };
    }).sort((a, b) => b.totalOmset - a.totalOmset);
  }, [branchFilter, periodType, selectedMonth, allAksesoris, allJasaPeriksa, allABD, allPatients, startDate, endDate, currentMonthIdx]);

  // Inventory Critical Alerts
  const criticalStockList = useMemo(() => {
    const list: Array<{ name: string; category: string; stock: number; min: number }> = [];
    inventoryABD.forEach(item => {
      const totalStock = item.readyStock + item.indentStock;
      if (totalStock <= 2) {
        list.push({ name: item.tipe, category: 'ABD Hearing Aid', stock: totalStock, min: 3 });
      }
    });
    inventoryAksesoris.forEach(item => {
      if (item.stok <= 3) {
        list.push({ name: `${item.category} (${item.subtype || ''})`, category: 'Aksesoris & Baterai', stock: item.stok, min: 5 });
      }
    });
    return list.slice(0, 10);
  }, [inventoryABD, inventoryAksesoris]);

  // Print Action handler
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV Action
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `LAPORAN BAHAN MEETING EARSOUND HEARING CARE\r\n`;
    csvContent += `Periode:;${dateRangeLabel}\r\n`;
    csvContent += `Cabang:;${branchFilter === 'ALL' ? 'Semua Cabang' : getBranchByCode(branchFilter).name}\r\n`;
    csvContent += `Tanggal Cetak:;${formatIndoDate(getTodayDateString())}\r\n\r\n`;

    // 1. Ringkasan Eksekutif
    csvContent += `RINGKASAN EKSEKUTIF\r\n`;
    csvContent += `Total Omset Realisasi:;${grandTotalOmset}\r\n`;
    csvContent += `Target Omset:;${targetInfo.targetNominal}\r\n`;
    csvContent += `% Pencapaian Target:;${targetInfo.achievementPercent}%\r\n`;
    csvContent += `Total Transaksi:;${totalTxCount}\r\n`;
    csvContent += `Total Pasien Baru:;${periodPatients.length}\r\n`;
    csvContent += `Total Unit ABD Terjual:;${abdUnitsSummary.totalUnits} unit\r\n\r\n`;

    // 2. Produk Terjual
    csvContent += `RINCIAN PENJUALAN PRODUK FISIK (ABD & AKSESORIS/BATERAI)\r\n`;
    csvContent += `No;Nama Produk;Kategori;Volume Terjual (Unit);Pangsa Volume (%);Total Penjualan (Rp);Pangsa Nilai (%)\r\n`;
    productStats.forEach((p, idx) => {
      csvContent += `${idx + 1};"${p.name}";"${p.category}";${p.qty};${p.percentQty}%;${p.value};${p.percentValue}%\r\n`;
    });
    csvContent += `Total;Semua Produk;;${sumProductQty};100%;${sumProductValue};100%\r\n\r\n`;

    // 3. Sumber Referal
    csvContent += `ANALISIS SUMBER REFERAL DOKTER & MARKETING\r\n`;
    csvContent += `Saluran / Kategori;Jumlah Pasien;Closing Penjualan;Total Omset (Rp)\r\n`;
    channelStats.forEach(ch => {
      csvContent += `"${ch.name}";${ch.patientCount};${ch.salesCount};${ch.omset}\r\n`;
    });
    csvContent += `\r\n`;

    if (topDoctorsList.length > 0) {
      csvContent += `DAFTAR DOKTER SPESIALIS THT PERUJUK TERBANYAK\r\n`;
      csvContent += `Nama Dokter;Rumah Sakit/Klinik;Pasien Rujukan;Closing Sales;Total Omset (Rp)\r\n`;
      topDoctorsList.forEach(d => {
        csvContent += `"${d.name}";"${d.hospital || '-'}";${d.patientCount};${d.salesCount};${d.omset}\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bahan_Meeting_Earsound_${periodType}_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const branchNameDisplay = branchFilter === 'ALL'
    ? 'Semua 8 Cabang (Konsolidasi Pusat)'
    : `Cabang ${getBranchByCode(branchFilter).name} (${branchFilter})`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Container Card */}
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* ======================================================== */}
        {/* 1. TOP INTERACTIVE TOOLBAR (HIDDEN DURING PRINT)        */}
        {/* ======================================================== */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col gap-4 border-b border-slate-800 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#F5B438] text-[#181B57] flex items-center justify-center font-black shadow-md">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Generator Bahan Cetak Meeting</span>
                  <span className="text-[11px] font-semibold bg-[#23277A] text-[#F5B438] px-2 py-0.5 rounded-full border border-[#3A42A8]">
                    Executive Report
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Format cetak resmi untuk Rapat Mingguan, Bulanan, dan Tahunan Earsound Hearing Care
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-[#F5B438] hover:bg-[#e0a22a] text-[#181B57] font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#181B57]" />
                <span>Cetak Dokumen (Print / PDF)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Unduh Data Mentah untuk Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Ekspor Excel</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Period Mode Selector & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            {/* 1. Mode Periode */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Jenis Rapat / Periode</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-800 p-1 rounded-xl">
                {(['mingguan', 'bulanan', 'tahunan', 'kustom'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handlePeriodChange(t)}
                    className={`py-1.5 text-[11px] font-semibold rounded-lg capitalize transition-colors ${
                      periodType === t ? 'bg-[#23277A] text-[#F5B438] shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {t === 'mingguan' ? 'Mingguan' : t === 'bulanan' ? 'Bulanan' : t === 'tahunan' ? 'Tahunan' : 'Kustom'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Detail Periode */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Pilihan Rentang</label>
              {periodType === 'mingguan' && (
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setSelectedWeekPreset('7days')}
                    className={`py-1.5 text-[10px] font-medium rounded-lg ${
                      selectedWeekPreset === '7days' ? 'bg-[#23277A] text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    7 Hari Ini
                  </button>
                  <button
                    onClick={() => setSelectedWeekPreset('thisWeek')}
                    className={`py-1.5 text-[10px] font-medium rounded-lg ${
                      selectedWeekPreset === 'thisWeek' ? 'bg-[#23277A] text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    Minggu Ini
                  </button>
                  <button
                    onClick={() => setSelectedWeekPreset('lastWeek')}
                    className={`py-1.5 text-[10px] font-medium rounded-lg ${
                      selectedWeekPreset === 'lastWeek' ? 'bg-[#23277A] text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    Minggu Lalu
                  </button>
                </div>
              )}

              {periodType === 'bulanan' && (
                <div className="flex gap-1.5">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full bg-slate-800 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 border border-slate-700 focus:outline-none"
                  >
                    {MONTH_NAMES_INDONESIA.map((name, idx) => (
                      <option key={name} value={idx}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-24 bg-slate-800 text-white text-xs font-semibold rounded-xl px-2 py-1.5 border border-slate-700 focus:outline-none"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              )}

              {periodType === 'tahunan' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-800 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 border border-slate-700 focus:outline-none"
                >
                  <option value={2026}>Tahun 2026 (Tahun Berjalan)</option>
                  <option value={2025}>Tahun 2025</option>
                </select>
              )}

              {periodType === 'kustom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-1/2 bg-slate-800 text-white text-[11px] font-medium rounded-xl px-2 py-1.5 border border-slate-700"
                  />
                  <span className="text-slate-400 text-xs">s/d</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-1/2 bg-slate-800 text-white text-[11px] font-medium rounded-xl px-2 py-1.5 border border-slate-700"
                  />
                </div>
              )}
            </div>

            {/* 3. Filter Cabang */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Cakupan Cabang</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value as BranchCode)}
                className="w-full bg-slate-800 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua 8 Cabang (Konsolidasi Pusat)</option>
                {BRANCHES.filter(b => b.code !== 'ALL' && b.code !== 'HQ').map(b => (
                  <option key={b.code} value={b.code}>Cabang {b.name} ({b.code})</option>
                ))}
              </select>
            </div>

            {/* 4. Agenda Checkboxes / Toggles */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Pengaturan Agenda Bahan</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setShowProductSales(!showProductSales)}
                  className={`text-[10px] px-2 py-1 rounded-md border font-medium ${
                    showProductSales ? 'bg-indigo-900/60 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                  }`}
                >
                  Produk Terjual
                </button>
                <button
                  onClick={() => setShowReferrals(!showReferrals)}
                  className={`text-[10px] px-2 py-1 rounded-md border font-medium ${
                    showReferrals ? 'bg-indigo-900/60 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                  }`}
                >
                  Rujukan Dokter
                </button>
                <button
                  onClick={() => setShowActionPlan(!showActionPlan)}
                  className={`text-[10px] px-2 py-1 rounded-md border font-medium ${
                    showActionPlan ? 'bg-indigo-900/60 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                  }`}
                >
                  Notulen & Aksi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. THE PRINTABLE DOCUMENT AREA (#printable-meeting-report)*/}
        {/* ======================================================== */}
        <div 
          id="printable-meeting-report"
          className="p-6 sm:p-10 text-slate-900 bg-white print:p-4 print:text-black space-y-6 overflow-y-auto"
        >
          {/* Header Kop Surat Rapat Resmi */}
          <div className="border-b-2 border-[#181B57] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <EarsoundLogo variant="light" size="md" />
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#181B57] tracking-tight uppercase">
                  PT EARSOUND HEARING CARE INDONESIA
                </h1>
                <p className="text-xs text-slate-600 font-semibold tracking-wide">
                  Management Information System &middot; Bahan Rapat Koordinasi & Evaluasi
                </p>
                <p className="text-[11px] text-slate-500">
                  {branchNameDisplay}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-200 sm:border-0">
              <div className="font-black text-sm text-[#23277A] uppercase">{meetingTitle}</div>
              <div className="font-semibold text-slate-700 flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Periode: {dateRangeLabel}</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Dicetak pada: {formatIndoDate(getTodayDateString())} | Pukul: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </div>
            </div>
          </div>

          {/* Section 1: Executive KPI Matrix */}
          {showExecutiveSummary && (
            <div className="space-y-3 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs sm:text-sm font-black text-[#181B57] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F5B438]" />
                  <span>I. Ringkasan Eksekutif & Capaian Kinerja Operasional</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">Metrik Utama</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Realisasi Omset</span>
                  <span className="text-base sm:text-lg font-black text-[#181B57] block mt-0.5">
                    {formatRupiah(grandTotalOmset)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {totalTxCount} Transaksi Closing
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Penjualan Unit ABD</span>
                  <span className="text-base sm:text-lg font-black text-[#23277A] block mt-0.5">
                    {abdUnitsSummary.totalUnits} <span className="text-xs font-normal text-slate-600">Unit</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {abdUnitsSummary.binauralCount} Binaural | {abdUnitsSummary.monauralCount} Monaural
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Kunjungan Pasien Baru</span>
                  <span className="text-base sm:text-lg font-black text-slate-800 block mt-0.5">
                    {periodPatients.length} <span className="text-xs font-normal text-slate-600">Pasien</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Database Rekam Medis
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Rata-rata Transaksi (AOV)</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 block mt-0.5">
                    {formatRupiah(aov)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Per Transaksi Kasir
                  </span>
                </div>
              </div>

              {/* Composition row */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#181B57]">Komposisi Omset:</span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-700">
                    ABD: <strong className="text-[#181B57]">{formatRupiah(totalOmsetABD)}</strong> ({grandTotalOmset > 0 ? ((totalOmsetABD/grandTotalOmset)*100).toFixed(1) : 0}%)
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-700">
                    Aksesoris & Baterai: <strong className="text-[#181B57]">{formatRupiah(totalOmsetAksesoris)}</strong> ({grandTotalOmset > 0 ? ((totalOmsetAksesoris/grandTotalOmset)*100).toFixed(1) : 0}%)
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-700">
                    Jasa Audiometri: <strong className="text-[#181B57]">{formatRupiah(totalOmsetJasa)}</strong> ({grandTotalOmset > 0 ? ((totalOmsetJasa/grandTotalOmset)*100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Target Evaluation */}
          {showTargetEvaluation && targetInfo.targetNominal > 0 && (
            <div className="space-y-3 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs sm:text-sm font-black text-[#181B57] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>II. Evaluasi Pencapaian Target Omset 2026</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">{targetInfo.targetLabel}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Target Ditentukan</span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">
                    {formatRupiah(targetInfo.targetNominal)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Realisasi Dicapai</span>
                  <span className="text-base font-black text-[#181B57] block mt-0.5">
                    {formatRupiah(grandTotalOmset)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Persentase Capaian</span>
                  <span className={`text-base font-black block mt-0.5 ${
                    targetInfo.achievementPercent >= 100 ? 'text-emerald-700' : targetInfo.achievementPercent >= 75 ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {targetInfo.achievementPercent}%
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Status / Selisih Gap</span>
                  <span className={`text-xs font-bold block mt-1 ${
                    targetInfo.gap >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {targetInfo.gap >= 0 ? `+ Surplus ${formatRupiah(targetInfo.gap)}` : `- Defisit ${formatRupiah(Math.abs(targetInfo.gap))}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Physical Product Sales Breakdown (Requested by user) */}
          {showProductSales && (
            <div className="space-y-3 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#181B57] uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#23277A]" />
                    <span>III. Laporan Penjualan Produk Fisik (Volume & Pangsa Unit ABD dan Aksesoris)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Distribusi kuantitas dan kontribusi nilai per tipe alat bantu dengar, aksesoris, dan baterai
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  Total: {sumProductQty} Unit
                </span>
              </div>

              {productStats.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 italic">
                  Tidak ada transaksi penjualan produk fisik pada periode yang dipilih.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#181B57] text-white text-[11px] uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">No</th>
                        <th className="py-2.5 px-3">Nama Produk & Spesifikasi</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-right">Volume (Unit)</th>
                        <th className="py-2.5 px-3 text-right">Pangsa Volume (%)</th>
                        <th className="py-2.5 px-3 text-right">Total Penjualan (Rp)</th>
                        <th className="py-2.5 px-3 text-right">Pangsa Nilai (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {productStats.map((item, idx) => (
                        <tr key={item.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.name}</td>
                          <td className="py-2 px-3 text-slate-600">{item.category}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">{item.qty}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-mono">{item.percentQty}%</td>
                          <td className="py-2 px-3 text-right font-bold text-[#181B57] font-mono">{formatRupiah(item.value)}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-mono">{item.percentValue}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right uppercase">Total Penjualan Produk Fisik:</td>
                        <td className="py-2 px-3 text-right font-mono">{sumProductQty} unit</td>
                        <td className="py-2 px-3 text-right font-mono">100.0%</td>
                        <td className="py-2 px-3 text-right font-mono text-[#181B57]">{formatRupiah(sumProductValue)}</td>
                        <td className="py-2 px-3 text-right font-mono">100.0%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Referral Sources & Marketing Analysis (Requested by user) */}
          {showReferrals && (
            <div className="space-y-3 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#181B57] uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>IV. Analisis Sumber Referal & Efektivitas Marketing</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Evaluasi akuisisi pasien melalui rujukan Dokter THT, Rumah Sakit, Saluran Online, dan Rekomendasi Offline
                  </p>
                </div>
              </div>

              {/* Summary 3 Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {channelStats.map(ch => (
                  <div key={ch.name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-xs font-black text-[#181B57] block truncate">{ch.name}</span>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500">Pasien Terdaftar:</span>
                      <strong className="text-slate-800 font-mono">{ch.patientCount} orang</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Closing Penjualan:</span>
                      <strong className="text-slate-800 font-mono">{ch.salesCount} transaksi</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                      <span className="text-slate-600 font-bold">Total Nilai Omset:</span>
                      <strong className="text-[#23277A] font-bold font-mono">{formatRupiah(ch.omset)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Dokter Rujukan THT */}
              {topDoctorsList.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Dokter Spesialis THT / Rumah Sakit Perujuk
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {topDoctorsList.length} Dokter / Faskes Terdata
                    </span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-8">No</th>
                        <th className="py-2 px-3">Nama Dokter Spesialis / Faskes</th>
                        <th className="py-2 px-3">Rumah Sakit / Asal</th>
                        <th className="py-2 px-3 text-right">Pasien Dirujuk</th>
                        <th className="py-2 px-3 text-right">Closing Transaksi</th>
                        <th className="py-2 px-3 text-right">Total Omset (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {topDoctorsList.slice(0, 10).map((doc, idx) => (
                        <tr key={doc.name} className="hover:bg-slate-50/50">
                          <td className="py-1.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{doc.name}</td>
                          <td className="py-1.5 px-3 text-slate-600">{doc.hospital || '-'}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{doc.patientCount}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{doc.salesCount}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-[#181B57] font-mono">{formatRupiah(doc.omset)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Section 5: Branch Comparison (When All Branches Selected) */}
          {showBranchComparison && branchFilter === 'ALL' && branchComparisonList.length > 0 && (
            <div className="space-y-3 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs sm:text-sm font-black text-[#181B57] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span>V. Peringkat & Performa Komparasi 8 Cabang Earsound</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">Evaluasi Antar-Cabang</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#181B57] text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3 text-center w-10">Rank</th>
                      <th className="py-2 px-3">Nama Cabang</th>
                      <th className="py-2 px-3 text-right">Target 2026</th>
                      <th className="py-2 px-3 text-right">Realisasi Omset</th>
                      <th className="py-2 px-3 text-right">% Capaian</th>
                      <th className="py-2 px-3 text-right">Unit ABD</th>
                      <th className="py-2 px-3 text-right">Pasien Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {branchComparisonList.map((b, idx) => (
                      <tr key={b.code} className={idx === 0 ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}>
                        <td className="py-2 px-3 text-center font-bold font-mono">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          Cabang {b.name} <span className="text-[10px] text-slate-400 font-normal">({b.code})</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{formatRupiah(b.target)}</td>
                        <td className="py-2 px-3 text-right font-bold font-mono text-[#181B57]">{formatRupiah(b.totalOmset)}</td>
                        <td className="py-2 px-3 text-right font-bold font-mono">
                          <span className={b.achievementPercent >= 100 ? 'text-emerald-700' : 'text-slate-800'}>
                            {b.achievementPercent}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">{b.abdUnits} unit</td>
                        <td className="py-2 px-3 text-right font-mono">{b.patientCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 6: Action Plan / Notulen Rapat & Tindak Lanjut */}
          {showActionPlan && (
            <div className="space-y-3 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs sm:text-sm font-black text-[#181B57] uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <span>VI. Lembar Notulen Rapat & Rencana Tindak Lanjut (Action Items)</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">Hasil Kesepakatan Meeting</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-center w-8">No</th>
                      <th className="py-2 px-3 w-1/3">Topik Bahasan / Kendala Lapangan</th>
                      <th className="py-2 px-3 w-1/3">Rencana Aksi Solutif (Action Plan)</th>
                      <th className="py-2 px-3 text-center w-28">PIC Penanggung Jawab</th>
                      <th className="py-2 px-3 text-center w-24">Batas Waktu</th>
                      <th className="py-2 px-3 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {[1, 2, 3, 4].map((num) => (
                      <tr key={num} className="h-10">
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">{num}</td>
                        <td className="py-3 px-3 text-slate-400 italic">
                          {num === 1 ? 'Peningkatan rujukan dokter spesialis THT & faskes baru...' : ''}
                        </td>
                        <td className="py-3 px-3 text-slate-400 italic">
                          {num === 1 ? 'Kunjungan rutin marketing / audiometris ke poli THT...' : ''}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400">
                          {num === 1 ? 'Tim Audiometris' : ''}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400">
                          {num === 1 ? 'Minggu depan' : ''}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400">
                          {num === 1 ? '[ ] Open' : '[ ]'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-[11px] text-slate-600">
                <strong>Catatan Khusus Rapat:</strong>
                <p className="mt-1 text-slate-500 italic">
                  Dapat ditulis tangan langsung pada dokumen cetak ini atau diarsipkan sebagai berita acara resmi rapat manajemen.
                </p>
              </div>
            </div>
          )}

          {/* Section 7: Signatures / Pengesahan Dokumen */}
          {showSignatures && (
            <div className="pt-6 border-t-2 border-slate-200 break-inside-avoid">
              <div className="text-center mb-6">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Lembar Pengesahan Hasil Rapat Manajemen & Operasional
                </span>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 font-medium block">Disiapkan Oleh:</span>
                    <strong className="text-slate-800 block text-[11px]">Sekretaris Rapat / Audiometris</strong>
                  </div>
                  <div className="border-t border-slate-400 pt-1 mx-4">
                    <span className="text-[11px] text-slate-600 font-semibold">( {currentUser?.name || '...........................................'} )</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 font-medium block">Ditinjau & Disetujui:</span>
                    <strong className="text-slate-800 block text-[11px]">Pimpinan Rapat / Branch Manager</strong>
                  </div>
                  <div className="border-t border-slate-400 pt-1 mx-4">
                    <span className="text-[11px] text-slate-600 font-semibold">( ........................................... )</span>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 font-medium block">Mengetahui:</span>
                    <strong className="text-slate-800 block text-[11px]">Direktur Utama / Direksi Pusat</strong>
                  </div>
                  <div className="border-t border-slate-400 pt-1 mx-4">
                    <span className="text-[11px] text-slate-600 font-semibold">( ........................................... )</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[10px] text-slate-400">
            <span>Dokumen Rahasia Internal PT Earsound Hearing Care Indonesia</span>
            <span>Halaman 1 dari 1 &middot; MIS Earsound System</span>
          </div>
        </div>

      </div>
    </div>
  );
};
