import React, { useState, useMemo } from 'react';
import { 
  Patient, 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  EarmouldReport, 
  ReparasiService,
  ReferalSource 
} from '../../types';
import { formatRupiah, formatIndoDate } from '../../utils/formatters';
import { matchOfficialDoctorName } from '../../data/doctors';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  Share2, 
  Globe, 
  Stethoscope, 
  Building2, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Calendar, 
  Search, 
  X, 
  TrendingUp, 
  Award, 
  Filter, 
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface ReferalBreakdownSectionProps {
  patients?: Patient[];
  jasaPeriksa?: JasaPeriksaTransaction[];
  abd?: ABDTransaction[];
  aksesoris?: AksesorisTransaction[];
  earmould?: EarmouldReport[];
  reparasi?: ReparasiService[];
}

export type ReferalMainCategory = 'ALL' | 'ONLINE' | 'DOKTER_RS' | 'OFFLINE';
export type MetricDisplayMode = 'omset' | 'sales' | 'patients' | 'aov';

interface ChannelDetailItem {
  key: string;
  name: string;
  category: 'Online' | 'Dokter & RS' | 'Offline';
  subCategory?: string;
  doctorName?: string;
  hospitalName?: string;
  patientCount: number;
  salesCount: number;
  totalOmset: number;
  aov: number; // average order value
  conversionRate: number; // salesCount / patientCount
  color: string;
  patientsList: {
    patient: Patient;
    spending: number;
    transactions: Array<{
      type: string;
      fakturOrId: string;
      date: string;
      amount: number;
      label: string;
      branchCode?: string;
    }>;
  }[];
  monthlyStats: { [monthKey: string]: { omset: number; sales: number; patients: number } };
}

const CATEGORY_COLORS: { [key: string]: string } = {
  // Online Channels (Ads, Social Media & Marketplace)
  'Google Ads': '#3B82F6',
  'Meta / FB Ads': '#2563EB',
  'Instagram': '#E11D48',
  'TikTok': '#0F172A',
  'Website / Organik': '#0284C7',
  'Social Media (FB, IG, Tiktok)': '#D946EF',
  'Shopee': '#EE4D2D',
  'Shopee Official Store': '#EE4D2D',
  'Google': '#2563EB',
  // Dokter & RS
  'Dokter Umum dan Dokter Spesialis': '#0D9488',
  'RS/LAB/KLINIK': '#0891B2',
  'Rujukan Dokter': '#0D9488',
  'Rujukan RS / Faskes': '#0891B2',
  // Offline & Walk-in (Termasuk GMaps & Plang Toko)
  'Plang Toko, Neonbox, Google Maps / Walk-in': '#F59E0B',
  'Google Maps & Walk-in': '#F59E0B',
  'Google Maps (Walk-in)': '#F59E0B',
  'Pasien Lama': '#4F46E5',
  'Saudara atau Teman Dekat': '#8B5CF6',
  'Brosur': '#EA580C',
  'Lain-lain': '#64748B',
};

export const ReferalBreakdownSection: React.FC<ReferalBreakdownSectionProps> = ({
  patients = [],
  jasaPeriksa = [],
  abd = [],
  aksesoris = [],
  earmould = [],
  reparasi = [],
}) => {
  // Active Tab & Filters
  const [activeCategoryTab, setActiveCategoryTab] = useState<ReferalMainCategory>('ALL');
  const [metricMode, setMetricMode] = useState<MetricDisplayMode>('omset');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>('');
  
  // Drilldown modal state
  const [drilldownChannel, setDrilldownChannel] = useState<ChannelDetailItem | null>(null);

  // 1. Compile Unique Months List from data
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const extractMonth = (dateStr?: string) => {
      if (dateStr && dateStr.length >= 7) {
        monthSet.add(dateStr.slice(0, 7)); // e.g. "2026-08"
      }
    };

    patients.forEach(p => extractMonth(p.createdAt));
    jasaPeriksa.forEach(j => extractMonth(j.tanggal));
    abd.forEach(a => extractMonth(a.tanggal));
    aksesoris.forEach(aks => extractMonth(aks.tanggal));

    const sorted = Array.from(monthSet).sort().reverse();
    return sorted;
  }, [patients, jasaPeriksa, abd, aksesoris]);

  // Helper to format Month Key (e.g. "2026-08" -> "Agustus 2026")
  const formatMonthLabel = (monthKey: string) => {
    if (monthKey === 'ALL') return 'Semua Periode';
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const idx = parseInt(month, 10) - 1;
    return `${monthNames[idx] || month} ${year}`;
  };

  // 2. Full Aggregation Engine
  const {
    channelDataMap,
    allChannelsList,
    onlineChannelsList,
    doctorChannelsList,
    offlineChannelsList,
    grandTotalPatients,
    grandTotalSales,
    grandTotalOmset,
    categorySummaries,
  } = useMemo(() => {
    // Map patient by ID for fast lookup
    const patientMap = new Map<string, Patient>();
    const patientTxMap = new Map<string, {
      spending: number;
      txCount: number;
      txList: Array<{
        type: string;
        fakturOrId: string;
        date: string;
        amount: number;
        label: string;
        branchCode?: string;
      }>;
    }>();

    patients.forEach(p => {
      patientMap.set(p.id, p);
      patientTxMap.set(p.id, { spending: 0, txCount: 0, txList: [] });
    });

    // Helper to check month match
    const matchMonth = (dateStr?: string) => {
      if (selectedMonthFilter === 'ALL') return true;
      return dateStr && dateStr.startsWith(selectedMonthFilter);
    };

    // Accumulate transactions to patients
    abd.forEach(a => {
      if (!matchMonth(a.tanggal)) return;
      const pId = a.idPelanggan;
      let pData = patientTxMap.get(pId);
      if (!pData) {
        pData = { spending: 0, txCount: 0, txList: [] };
        patientTxMap.set(pId, pData);
      }
      const aAmount = Number(a.jumlah || a.hargaJual || ((a.payment?.cashAmount || 0) + (a.payment?.transferAmount || 0)) || 0);
      pData.spending += aAmount;
      pData.txCount += 1;
      pData.txList.push({
        type: 'ABD',
        fakturOrId: a.nomorFakturPenjualan || a.id,
        date: a.tanggal,
        amount: aAmount,
        label: `Alat Bantu Dengar: ${a.tipeABD || ''} (${a.fittingType || ''})`,
        branchCode: a.branchCode,
      });
    });

    jasaPeriksa.forEach(j => {
      if (!matchMonth(j.tanggal)) return;
      const pId = j.idPelanggan;
      let pData = patientTxMap.get(pId);
      if (!pData) {
        const foundP = patients.find(p => p.id === pId || (p.nama && j.namaCustomer && p.nama.trim().toLowerCase() === j.namaCustomer.trim().toLowerCase()));
        if (foundP) {
          pData = patientTxMap.get(foundP.id);
        }
      }
      if (!pData) {
        pData = { spending: 0, txCount: 0, txList: [] };
        patientTxMap.set(pId, pData);
      }

      // Calculate the real examination nominal
      let jAmount = Number(
        j.biayaJasaPeriksa ||
        (j as any).jumlah ||
        j.subtotalBiaya ||
        j.payment?.nominalTotal ||
        ((j.payment?.cashAmount || 0) + (j.payment?.transferAmount || 0)) ||
        0
      );

      // If still 0 or unrecorded, calculate from standard examination tariffs
      if (jAmount <= 0) {
        const exams = Array.isArray(j.jenisPemeriksaan) ? j.jenisPemeriksaan : (j.jenisPemeriksaan ? [j.jenisPemeriksaan] : []);
        let calc = 0;
        exams.forEach(ex => {
          if (!ex) return;
          const s = String(ex).toLowerCase();
          if (s.includes('bera')) calc += 1300000;
          else if (s.includes('oae')) calc += 200000;
          else if (s.includes('tympanometri') || s.includes('tympanometry')) calc += 100000;
          else if (s.includes('play')) calc += 100000;
          else if (s.includes('nada murni')) calc += 100000;
          else if (s.includes('fft')) calc += 100000;
          else if (s.includes('audiometri')) calc += 50000;
          else calc += 50000;
        });
        jAmount = calc > 0 ? calc : 50000;
      }

      const faktur = (j as any).nomorFaktur || j.nomorKwitansi || j.id;
      const examNames = Array.isArray(j.jenisPemeriksaan) ? j.jenisPemeriksaan.join(', ') : (j.jenisPemeriksaan || 'Jasa Pemeriksaan');

      pData.spending += jAmount;
      pData.txCount += 1;
      pData.txList.push({
        type: 'Jasa',
        fakturOrId: faktur,
        date: j.tanggal,
        amount: jAmount,
        label: `Pemeriksaan: ${examNames}`,
        branchCode: j.branchCode,
      });
    });

    aksesoris.forEach(aks => {
      if (!matchMonth(aks.tanggal)) return;
      const pId = aks.idPelanggan;
      let pData = patientTxMap.get(pId);
      if (!pData) {
        pData = { spending: 0, txCount: 0, txList: [] };
        patientTxMap.set(pId, pData);
      }
      const aksAmount = Number(aks.jumlah || ((aks.payment?.cashAmount || 0) + (aks.payment?.transferAmount || 0)) || 0);
      pData.spending += aksAmount;
      pData.txCount += 1;
      pData.txList.push({
        type: 'Aksesoris',
        fakturOrId: aks.nomorFaktur || aks.id,
        date: aks.tanggal,
        amount: aksAmount,
        label: `Aksesoris: ${aks.category || ''} (${aks.subtype || ''})`,
        branchCode: aks.branchCode,
      });
    });

    // Helper to categorize and normalize channel key
    const categorizeReferal = (p: Patient) => {
      let ref = p.referal || 'Lain-lain';
      let channel = p.referalChannel || '';
      let doctor = p.namaDokter?.trim() || '';
      let rs = p.namaRS?.trim() || '';
      let cat = p.referalCategory;

      // Check if patient's transactions have doctor/referral info if missing in patient profile
      if (!doctor && !rs) {
        const matchingJasa = jasaPeriksa.find(j => 
          (j.idPelanggan === p.id || (j.namaCustomer && j.namaCustomer.trim().toLowerCase() === p.nama?.trim().toLowerCase())) &&
          (j.namaDokterReferal || j.referal)
        );
        if (matchingJasa?.namaDokterReferal) {
          doctor = matchingJasa.namaDokterReferal.trim();
          cat = 'Dokter & Faskes';
          ref = matchingJasa.referal || 'Dokter Umum dan Dokter Spesialis';
        }
        if (!doctor) {
          const matchingABD = abd.find(a => 
            (a.idPelanggan === p.id || (a.namaPasien && a.namaPasien.trim().toLowerCase() === p.nama?.trim().toLowerCase())) &&
            (a.namaDokterReferal || a.referal)
          );
          if (matchingABD?.namaDokterReferal) {
            doctor = matchingABD.namaDokterReferal.trim();
            cat = 'Dokter & Faskes';
            ref = matchingABD.referal || 'Dokter Umum dan Dokter Spesialis';
          }
        }
      }

      // Check if doctor name should be normalized with official doctor list
      if (doctor) {
        const matched = matchOfficialDoctorName(doctor);
        if (matched) doctor = matched;
      }

      // 1. Dokter & Rumah Sakit
      if (cat === 'Dokter & Faskes' || ref === 'Dokter Umum dan Dokter Spesialis' || ref === 'RS/LAB/KLINIK' || doctor !== '' || rs !== '') {
        const docName = doctor || 'Dokter Spesialis / RS Mitra';
        return {
          key: `DOC_${docName.toLowerCase().replace(/\s+/g, '_')}`,
          name: docName,
          category: 'Dokter & RS' as const,
          doctorName: docName,
          hospitalName: rs || undefined,
          color: CATEGORY_COLORS['Dokter Umum dan Dokter Spesialis'] || '#0D9488',
        };
      }

      // Check if GMaps / Google Maps / Plang Toko / Walk-in -> Masuk ke Walk-in & Offline
      const isGMapsOrWalkIn = 
        ref === 'Plang Toko, Neonbox, Google Maps / Walk-in' ||
        channel.toLowerCase().includes('gmaps') ||
        channel.toLowerCase().includes('google maps') ||
        channel.toLowerCase().includes('maps') ||
        channel.toLowerCase().includes('gmb') ||
        ref.toLowerCase().includes('gmaps') ||
        ref.toLowerCase().includes('maps');

      if (isGMapsOrWalkIn) {
        const walkInName = (channel.toLowerCase().includes('gmaps') || channel.toLowerCase().includes('maps') || ref.toLowerCase().includes('maps'))
          ? 'Google Maps & Walk-in'
          : ref;
        return {
          key: `OFF_${walkInName.toLowerCase().replace(/\s+/g, '_')}`,
          name: walkInName,
          category: 'Offline' as const,
          color: CATEGORY_COLORS['Plang Toko, Neonbox, Google Maps / Walk-in'] || '#F59E0B',
        };
      }

      // 2. Online Marketing & Marketplace (Excludes Google Maps / GMaps)
      if (
        cat === 'Online' ||
        ref === 'Google' ||
        ref === 'Social Media (FB, IG, Tiktok)' ||
        ref === 'Shopee' ||
        channel.toLowerCase().includes('ads') ||
        channel.toLowerCase().includes('meta') ||
        channel.toLowerCase().includes('fb') ||
        channel.toLowerCase().includes('instagram') ||
        channel.toLowerCase().includes('tiktok') ||
        channel.toLowerCase().includes('website') ||
        channel.toLowerCase().includes('sosmed') ||
        channel.toLowerCase().includes('shopee')
      ) {
        let channelName = channel || (ref === 'Google' ? 'Google Ads' : ref === 'Shopee' ? 'Shopee Official Store' : 'Social Media (FB, IG, Tiktok)');
        if (channel.toLowerCase().includes('google ads') || channel.toLowerCase() === 'google') channelName = 'Google Ads';
        else if (channel.toLowerCase().includes('fb') || channel.toLowerCase().includes('meta')) channelName = 'Meta / FB Ads';
        else if (channel.toLowerCase().includes('instagram') || channel.toLowerCase().includes('ig')) channelName = 'Instagram';
        else if (channel.toLowerCase().includes('tiktok')) channelName = 'TikTok';
        else if (channel.toLowerCase().includes('web') || channel.toLowerCase().includes('organik')) channelName = 'Website / Organik';
        else if (channel.toLowerCase().includes('shopee') || ref === 'Shopee') channelName = channel || 'Shopee Official Store';

        return {
          key: `ONL_${channelName.toLowerCase().replace(/\s+/g, '_')}`,
          name: channelName,
          category: 'Online' as const,
          color: CATEGORY_COLORS[channelName] || (channelName.toLowerCase().includes('shopee') ? '#EE4D2D' : CATEGORY_COLORS['Google']) || '#3B82F6',
        };
      }

      // 3. Offline & Walk-in
      const offlineName = ref;
      return {
        key: `OFF_${offlineName.toLowerCase().replace(/\s+/g, '_')}`,
        name: offlineName,
        category: 'Offline' as const,
        color: CATEGORY_COLORS[offlineName] || '#64748B',
      };
    };

    // Synthesize patients from transactions if not present in patients list
    const patientMasterMap = new Map<string, Patient>();
    patients.forEach(p => patientMasterMap.set(p.id, p));

    jasaPeriksa.forEach(j => {
      if (j.idPelanggan && !patientMasterMap.has(j.idPelanggan)) {
        patientMasterMap.set(j.idPelanggan, {
          id: j.idPelanggan,
          nama: j.namaCustomer || 'Pasien Periksa',
          telepon: '-',
          alamat: { jalanNo: '-', kecamatan: '-', kabupatenKota: '-', provinsi: '-' },
          referal: j.referal || (j.namaDokterReferal ? 'Dokter Umum dan Dokter Spesialis' : 'Lain-lain'),
          namaDokter: j.namaDokterReferal ? matchOfficialDoctorName(j.namaDokterReferal) || j.namaDokterReferal : undefined,
          referalCategory: j.namaDokterReferal ? 'Dokter & Faskes' : undefined,
          createdAt: j.tanggal,
          branchCode: j.branchCode,
          usia: 0,
          gender: 'L',
          tanggalLahir: '',
        });
      }
    });

    abd.forEach(a => {
      if (a.idPelanggan && !patientMasterMap.has(a.idPelanggan)) {
        patientMasterMap.set(a.idPelanggan, {
          id: a.idPelanggan,
          nama: a.namaPasien || 'Pasien ABD',
          telepon: '-',
          alamat: { jalanNo: '-', kecamatan: '-', kabupatenKota: '-', provinsi: '-' },
          referal: a.referal || (a.namaDokterReferal ? 'Dokter Umum dan Dokter Spesialis' : 'Lain-lain'),
          namaDokter: a.namaDokterReferal ? matchOfficialDoctorName(a.namaDokterReferal) || a.namaDokterReferal : undefined,
          referalCategory: a.namaDokterReferal ? 'Dokter & Faskes' : undefined,
          createdAt: a.tanggal,
          branchCode: a.branchCode,
          usia: 0,
          gender: 'L',
          tanggalLahir: '',
        });
      }
    });

    const combinedPatients = Array.from(patientMasterMap.values());

    // Channels Map
    const channelsMap: { [key: string]: ChannelDetailItem } = {};

    // Group combined patients into channels
    combinedPatients.forEach(p => {
      // If month filter is applied to patient registration date
      const patientMonthMatch = selectedMonthFilter === 'ALL' || (p.createdAt && p.createdAt.startsWith(selectedMonthFilter));
      
      const { key, name, category, doctorName, hospitalName, color } = categorizeReferal(p);
      const txInfo = patientTxMap.get(p.id) || { spending: 0, txCount: 0, txList: [] };

      // If month filter is active and patient wasn't registered this month BUT has transactions this month, we still include their transaction stats
      const hasTxThisMonth = txInfo.txCount > 0;
      if (!patientMonthMatch && !hasTxThisMonth) return;

      if (!channelsMap[key]) {
        channelsMap[key] = {
          key,
          name,
          category,
          doctorName,
          hospitalName,
          patientCount: 0,
          salesCount: 0,
          totalOmset: 0,
          aov: 0,
          conversionRate: 0,
          color,
          patientsList: [],
          monthlyStats: {},
        };
      }

      if (patientMonthMatch) {
        channelsMap[key].patientCount += 1;
      }
      channelsMap[key].salesCount += txInfo.txCount;
      channelsMap[key].totalOmset += txInfo.spending;

      channelsMap[key].patientsList.push({
        patient: p,
        spending: txInfo.spending,
        transactions: txInfo.txList,
      });

      // Track monthly stats for this channel
      const regMonth = p.createdAt ? p.createdAt.slice(0, 7) : '2026-08';
      if (!channelsMap[key].monthlyStats[regMonth]) {
        channelsMap[key].monthlyStats[regMonth] = { omset: 0, sales: 0, patients: 0 };
      }
      channelsMap[key].monthlyStats[regMonth].patients += 1;
      channelsMap[key].monthlyStats[regMonth].sales += txInfo.txCount;
      channelsMap[key].monthlyStats[regMonth].omset += txInfo.spending;
    });

    // Calculate AOV and Conversion Rate for each channel
    Object.values(channelsMap).forEach(ch => {
      ch.aov = ch.salesCount > 0 ? Math.round(ch.totalOmset / ch.salesCount) : 0;
      ch.conversionRate = ch.patientCount > 0 
        ? Number(((ch.patientsList.filter(item => item.transactions.length > 0).length / ch.patientCount) * 100).toFixed(1)) 
        : (ch.salesCount > 0 ? 100 : 0);
    });

    const allChannels = Object.values(channelsMap).sort((a, b) => b.totalOmset - a.totalOmset);
    const onlineChannels = allChannels.filter(c => c.category === 'Online');
    const doctorChannels = allChannels.filter(c => c.category === 'Dokter & RS');
    const offlineChannels = allChannels.filter(c => c.category === 'Offline');

    const totalPatients = allChannels.reduce((sum, c) => sum + c.patientCount, 0);
    const totalSales = allChannels.reduce((sum, c) => sum + c.salesCount, 0);
    const totalOmset = allChannels.reduce((sum, c) => sum + c.totalOmset, 0);

    // Summaries per Category
    const categorySummaries = {
      Online: {
        patients: onlineChannels.reduce((sum, c) => sum + c.patientCount, 0),
        sales: onlineChannels.reduce((sum, c) => sum + c.salesCount, 0),
        omset: onlineChannels.reduce((sum, c) => sum + c.totalOmset, 0),
        percentOmset: totalOmset > 0 ? Number(((onlineChannels.reduce((sum, c) => sum + c.totalOmset, 0) / totalOmset) * 100).toFixed(1)) : 0,
      },
      DokterRS: {
        patients: doctorChannels.reduce((sum, c) => sum + c.patientCount, 0),
        sales: doctorChannels.reduce((sum, c) => sum + c.salesCount, 0),
        omset: doctorChannels.reduce((sum, c) => sum + c.totalOmset, 0),
        percentOmset: totalOmset > 0 ? Number(((doctorChannels.reduce((sum, c) => sum + c.totalOmset, 0) / totalOmset) * 100).toFixed(1)) : 0,
      },
      Offline: {
        patients: offlineChannels.reduce((sum, c) => sum + c.patientCount, 0),
        sales: offlineChannels.reduce((sum, c) => sum + c.salesCount, 0),
        omset: offlineChannels.reduce((sum, c) => sum + c.totalOmset, 0),
        percentOmset: totalOmset > 0 ? Number(((offlineChannels.reduce((sum, c) => sum + c.totalOmset, 0) / totalOmset) * 100).toFixed(1)) : 0,
      },
    };

    return {
      channelDataMap: channelsMap,
      allChannelsList: allChannels,
      onlineChannelsList: onlineChannels,
      doctorChannelsList: doctorChannels,
      offlineChannelsList: offlineChannels,
      grandTotalPatients: totalPatients,
      grandTotalSales: totalSales,
      grandTotalOmset: totalOmset,
      categorySummaries,
    };
  }, [patients, jasaPeriksa, abd, aksesoris, selectedMonthFilter]);

  // Filtered List based on Active Category Tab & Search
  const displayChannels = useMemo(() => {
    let list = allChannelsList;
    if (activeCategoryTab === 'ONLINE') list = onlineChannelsList;
    if (activeCategoryTab === 'DOKTER_RS') list = doctorChannelsList;
    if (activeCategoryTab === 'OFFLINE') list = offlineChannelsList;

    if (activeCategoryTab === 'DOKTER_RS' && doctorSearchQuery.trim()) {
      const q = doctorSearchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.hospitalName && c.hospitalName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeCategoryTab, allChannelsList, onlineChannelsList, doctorChannelsList, offlineChannelsList, doctorSearchQuery]);

  // Chart Data for Donut / Pie
  const chartData = useMemo(() => {
    const totalMetricValue = displayChannels.reduce((sum, ch) => {
      if (metricMode === 'omset') return sum + ch.totalOmset;
      if (metricMode === 'sales') return sum + ch.salesCount;
      if (metricMode === 'patients') return sum + ch.patientCount;
      if (metricMode === 'aov') return sum + ch.aov;
      return sum;
    }, 0);

    return displayChannels
      .filter(ch => {
        if (metricMode === 'omset') return ch.totalOmset > 0;
        if (metricMode === 'sales') return ch.salesCount > 0;
        if (metricMode === 'patients') return ch.patientCount > 0;
        if (metricMode === 'aov') return ch.aov > 0;
        return true;
      })
      .map(ch => {
        let value = 0;
        if (metricMode === 'omset') value = ch.totalOmset;
        else if (metricMode === 'sales') value = ch.salesCount;
        else if (metricMode === 'patients') value = ch.patientCount;
        else if (metricMode === 'aov') value = ch.aov;

        const percent = totalMetricValue > 0 ? Number(((value / totalMetricValue) * 100).toFixed(1)) : 0;
        return {
          key: ch.key,
          name: ch.name,
          value,
          percent,
          color: ch.color,
          category: ch.category,
          patientCount: ch.patientCount,
          salesCount: ch.salesCount,
          totalOmset: ch.totalOmset,
          aov: ch.aov,
        };
      });
  }, [displayChannels, metricMode]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* 1. Header with Period & Category Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-slate-800" />
            <span>Efektivitas Sumber Referal & Saluran Marketing</span>
          </h3>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Analisis penjualan & omset dari Marketing Online (Google Ads, Meta/FB Ads, Sosmed), Rujukan Dokter/RS, dan Walk-in Offline (Google Maps, Plang Toko, Pasien Lama).
          </p>
        </div>

        {/* Filter Bulan / Periode */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Periode</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Cards (Online vs Dokter/RS vs Offline) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Marketing Online */}
        <div 
          onClick={() => setActiveCategoryTab('ONLINE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeCategoryTab === 'ONLINE' 
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs' 
              : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Marketing Online</span>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
              {categorySummaries.Online.percentOmset}% Omset
            </span>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-slate-900 block">
              {formatRupiah(categorySummaries.Online.omset)}
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>👥 {categorySummaries.Online.patients} Pasien</span>
              <span>•</span>
              <span>🛍️ {categorySummaries.Online.sales} Transaksi</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
            <span>Google Ads, Meta/FB, IG, TikTok</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Card 2: Rujukan Dokter & RS */}
        <div 
          onClick={() => setActiveCategoryTab('DOKTER_RS')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeCategoryTab === 'DOKTER_RS' 
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-[#23277A]/20 shadow-xs' 
              : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-[#23277A] rounded-lg">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Rujukan Dokter & RS</span>
            </div>
            <span className="text-[11px] font-semibold text-[#23277A] bg-indigo-100/70 px-2 py-0.5 rounded-full">
              {categorySummaries.DokterRS.percentOmset}% Omset
            </span>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-slate-900 block">
              {formatRupiah(categorySummaries.DokterRS.omset)}
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>👥 {categorySummaries.DokterRS.patients} Pasien</span>
              <span>•</span>
              <span>🛍️ {categorySummaries.DokterRS.sales} Transaksi</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
            <span>dr. Spesialis THT, dr. Umum, RSUD</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Card 3: Offline & Organik */}
        <div 
          onClick={() => setActiveCategoryTab('OFFLINE')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeCategoryTab === 'OFFLINE' 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs' 
              : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Walk-in & Pasien Lama</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
              {categorySummaries.Offline.percentOmset}% Omset
            </span>
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-slate-900 block">
              {formatRupiah(categorySummaries.Offline.omset)}
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>👥 {categorySummaries.Offline.patients} Pasien</span>
              <span>•</span>
              <span>🛍️ {categorySummaries.Offline.sales} Transaksi</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex justify-between">
            <span>Google Maps, Plang Toko, Repeat Order</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 3. Category Tabs & Metric Switcher Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveCategoryTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Saluran ({allChannelsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryTab('ONLINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryTab === 'ONLINE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Online Marketing ({onlineChannelsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryTab('DOKTER_RS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryTab === 'DOKTER_RS'
                ? 'bg-[#23277A] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Rujukan Dokter & RS ({doctorChannelsList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategoryTab('OFFLINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategoryTab === 'OFFLINE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Offline & Walk-in ({offlineChannelsList.length})</span>
          </button>
        </div>

        {/* Metric Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Metrik:</span>
          <button
            type="button"
            onClick={() => setMetricMode('omset')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              metricMode === 'omset'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 Omset (Rp)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('sales')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              metricMode === 'sales'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛍️ Sales
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('patients')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              metricMode === 'patients'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👥 Pasien
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('aov')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              metricMode === 'aov'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Rata-rata/Order
          </button>
        </div>
      </div>

      {/* Special search input if Dokter Tab is active */}
      {activeCategoryTab === 'DOKTER_RS' && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Cari nama dokter perujuk spesialis THT atau rumah sakit..."
            value={doctorSearchQuery}
            onChange={(e) => setDoctorSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />
          {doctorSearchQuery && (
            <button 
              type="button"
              onClick={() => setDoctorSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 4. Chart & Ranking Breakdown View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Donut Chart */}
        <div className="lg:col-span-5 bg-slate-50/50 p-4 rounded-xl border border-slate-200/70 space-y-3 flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-full flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Proporsi Pangsa {metricMode === 'omset' ? 'Omset' : metricMode === 'sales' ? 'Sales Transaksi' : metricMode === 'patients' ? 'Jumlah Pasien' : 'Nilai Rata-rata'}</span>
            <span className="text-[11px] text-slate-500 font-normal">
              {formatMonthLabel(selectedMonthFilter)}
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any, item: any) => {
                      const payload = item.payload;
                      const formattedVal = metricMode === 'omset' || metricMode === 'aov' 
                        ? formatRupiah(Number(val)) 
                        : `${val} ${metricMode === 'patients' ? 'Pasien' : 'Transaksi'}`;
                      return [
                        `${formattedVal} (${payload.percent}%)`, 
                        payload.name
                      ];
                    }} 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 italic py-8">
                Belum ada data referal pada kategori / periode ini.
              </div>
            )}
          </div>

          {/* Mini Legend Summary */}
          <div className="w-full grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/60">
            {chartData.slice(0, 4).map(item => (
              <div key={item.key} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate font-medium">{item.name}</span>
                <span className="text-slate-900 font-bold ml-auto">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Leaderboard Ranking */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <span>Peringkat & Rincian Perolehan ({displayChannels.length} Saluran)</span>
            <span className="text-[11px] text-slate-500 font-normal">Klik untuk lihat rekap pasien & faktur</span>
          </div>

          {displayChannels.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400 italic">
              Tidak ditemukan data referal untuk kriteria pencarian ini.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {displayChannels.map((ch, idx) => {
                const totalOmsetClinic = grandTotalOmset > 0 ? grandTotalOmset : 1;
                const shareOmset = ((ch.totalOmset / totalOmsetClinic) * 100).toFixed(1);

                return (
                  <div
                    key={ch.key}
                    onClick={() => setDrilldownChannel(ch)}
                    className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-slate-800 block truncate">
                            {ch.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal block truncate">
                            {ch.category === 'Dokter & RS' 
                              ? (ch.hospitalName || 'Rujukan Dokter THT / Medis') 
                              : ch.category === 'Online'
                              ? 'Saluran Marketing Digital'
                              : 'Offline / Toko Fisik'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatRupiah(ch.totalOmset)}
                        </span>
                        <div className="flex items-center justify-end gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{ch.patientCount} Pasien</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{ch.salesCount} Sales</span>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                            {shareOmset}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Contribution */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${Math.min(100, Math.max(4, Number(shareOmset)))}%`, 
                          backgroundColor: ch.color 
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Special Online Marketing Channel Effectiveness Summary */}
      {activeCategoryTab === 'ONLINE' && onlineChannelsList.length > 0 && (
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-700" />
              <span>Evaluasi Efektivitas Marketing Online</span>
            </h4>
            <span className="text-[11px] font-semibold text-blue-700">
              Total Omset Online: {formatRupiah(categorySummaries.Online.omset)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {onlineChannelsList.map((oc) => (
              <div key={oc.key} className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 truncate">{oc.name}</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    CR: {oc.conversionRate}%
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-800 block">{formatRupiah(oc.totalOmset)}</span>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                  <span>{oc.patientCount} Lead Pasien</span>
                  <span className="font-semibold text-slate-700">{oc.salesCount} Deals Closed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Drilldown Modal (Rekap Pasien & Riwayat Transaksi per Dokter / Channel) */}
      {drilldownChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: drilldownChannel.color }}>
                  {drilldownChannel.category === 'Online' ? (
                    <Globe className="w-5 h-5 text-white" />
                  ) : drilldownChannel.category === 'Dokter & RS' ? (
                    <Stethoscope className="w-5 h-5 text-white" />
                  ) : (
                    <Building2 className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#F5B438] uppercase tracking-wider">
                    {drilldownChannel.category} • Detail Rujukan & Penjualan
                  </span>
                  <h3 className="text-base font-bold">{drilldownChannel.name}</h3>
                  {drilldownChannel.hospitalName && (
                    <p className="text-xs text-slate-300">Asal RS/Faskes: {drilldownChannel.hospitalName}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrilldownChannel(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metric Overview Strip */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Pasien Terdaftar</span>
                <span className="text-sm font-bold text-slate-900">{drilldownChannel.patientCount} Orang</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Total Transaksi Sales</span>
                <span className="text-sm font-bold text-slate-900">{drilldownChannel.salesCount} Faktur</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Total Omset Diperoleh</span>
                <span className="text-sm font-bold text-emerald-600">{formatRupiah(drilldownChannel.totalOmset)}</span>
              </div>
            </div>

            {/* Modal Body: List of Patients & Their Transactions */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-xs font-bold text-slate-900">
                Daftar Pasien & Riwayat Pembelian ({drilldownChannel.patientsList.length} Pasien)
              </h4>

              {drilldownChannel.patientsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  Belum ada pasien yang tercatat dari sumber ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {drilldownChannel.patientsList.map(({ patient, spending, transactions }) => (
                    <div key={patient.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{patient.nama}</span>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                              {patient.id}
                            </span>
                            {patient.branchCode && (
                              <span className="text-[10px] font-semibold text-[#23277A] bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                Cabang {patient.branchCode}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {patient.telepon} • Kec. {patient.alamat.kecamatan}, {patient.alamat.kabupatenKota}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 block">
                            {formatRupiah(spending)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {transactions.length} Transaksi
                          </span>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      {transactions.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                          {transactions.map((tx, txIdx) => (
                            <div key={txIdx} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="font-semibold text-slate-800 block">{tx.label}</span>
                                <span className="text-[10px] text-slate-400">
                                  {formatIndoDate(tx.date)} • Faktur: {tx.fakturOrId}
                                </span>
                              </div>
                              <span className="font-bold text-slate-900">{formatRupiah(tx.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDrilldownChannel(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Tutup Rekap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
