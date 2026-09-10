import React, { useState, useMemo, useEffect } from 'react';
import { 
  Patient, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  AksesorisTransaction, 
  EarmouldReport, 
  ReparasiService,
  RFMSegment,
  PatientRFMData,
  CRMNote,
  BranchCode
} from '../../types';
import { 
  Search, 
  MapPin, 
  Phone, 
  Calendar, 
  Globe, 
  Building2, 
  Stethoscope, 
  Volume2, 
  ShoppingBag, 
  Disc, 
  Wrench, 
  Clock, 
  Download,
  Crown,
  HeartHandshake,
  Sparkles,
  UserCheck,
  BellRing,
  AlertTriangle,
  UserX,
  UserPlus,
  Send,
  MessageSquare,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  BookOpen,
  X,
  DollarSign,
  TrendingUp,
  Plus,
  PieChart as ChartIcon
} from 'lucide-react';
import { formatIndoDate, formatRupiah } from '../../utils/formatters';
import { getBranchByCode, BRANCHES } from '../../utils/branches';
import { 
  calculateGlobalPatientRFM, 
  RFM_SEGMENT_DETAILS 
} from '../../utils/rfmEngine';
import { getCRMNotes, saveCRMNotes } from '../../utils/storage';
import { RFMVisualization } from './RFMVisualization';

interface GlobalPatientDirectoryProps {
  allPatients: Patient[];
  allJasa: JasaPeriksaTransaction[];
  allABD: ABDTransaction[];
  allAksesoris: AksesorisTransaction[];
  allEarmould: EarmouldReport[];
  allReparasi: ReparasiService[];
  currentUserBranch?: BranchCode;
  crmNotes?: CRMNote[];
  onAddCRMNote?: (note: CRMNote) => void;
  onDeleteCRMNote?: (id: string) => void;
}

export const GlobalPatientDirectory: React.FC<GlobalPatientDirectoryProps> = ({
  allPatients = [],
  allJasa = [],
  allABD = [],
  allAksesoris = [],
  allEarmould = [],
  allReparasi = [],
  crmNotes: propCrmNotes,
  onAddCRMNote,
  onDeleteCRMNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<RFMSegment | 'ALL'>('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'rfm' | 'recency_asc' | 'recency_desc' | 'monetary' | 'frequency' | 'name'>('monetary');
  const [viewMode, setViewMode] = useState<'visual' | 'grid' | 'table'>('visual');
  
  // Selected Patient for Detailed Drawer / Modal
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [customWAMessage, setCustomWAMessage] = useState<string>('');
  const [copiedWA, setCopiedWA] = useState(false);
  
  // Show RFM Info Modal
  const [showRFMGuide, setShowRFMGuide] = useState(false);
  
  // CRM Notes state
  const [localCrmNotes, setLocalCrmNotes] = useState<CRMNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteChannel, setNewNoteChannel] = useState<'WhatsApp' | 'Telepon' | 'Kunjungan Langsung' | 'Lainnya'>('WhatsApp');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Staf CRM');

  // Load CRM notes from storage initially as fallback
  useEffect(() => {
    setLocalCrmNotes(getCRMNotes());
  }, []);

  const activeCrmNotes = propCrmNotes && propCrmNotes.length > 0 ? propCrmNotes : localCrmNotes;

  // Compute RFM Dataset for all patients
  const rfmDataset = useMemo(() => {
    return calculateGlobalPatientRFM({
      allPatients,
      allJasa,
      allABD,
      allAksesoris,
      allEarmould,
      allReparasi,
    });
  }, [allPatients, allJasa, allABD, allAksesoris, allEarmould, allReparasi]);

  // Aggregate KPI Metrics
  const metrics = useMemo(() => {
    const totalPatientsCount = rfmDataset.length;
    const totalMonetary = rfmDataset.reduce((acc, item) => acc + item.monetaryTotal, 0);
    const avgMonetary = totalPatientsCount > 0 ? Math.round(totalMonetary / totalPatientsCount) : 0;
    
    const countChampions = rfmDataset.filter(i => i.segment === 'Champions').length;
    const countLoyal = rfmDataset.filter(i => i.segment === 'Loyal Customers').length;
    const countPotential = rfmDataset.filter(i => i.segment === 'Potential Loyalists').length;
    const countNeedAttention = rfmDataset.filter(i => i.segment === 'Need Attention').length;
    const countAtRisk = rfmDataset.filter(i => i.segment === 'At Risk' || i.segment === 'Hibernating').length;
    
    // Average recency in days
    const activeWithTx = rfmDataset.filter(i => i.lastTransactionDate !== null);
    const avgRecency = activeWithTx.length > 0 
      ? Math.round(activeWithTx.reduce((acc, item) => acc + item.recencyDays, 0) / activeWithTx.length)
      : 0;

    return {
      totalPatientsCount,
      totalMonetary,
      avgMonetary,
      countChampions,
      countLoyal,
      countPotential,
      countNeedAttention,
      countAtRisk,
      avgRecency,
    };
  }, [rfmDataset]);

  // Filtered and sorted patient RFM dataset
  const filteredDataset = useMemo(() => {
    return rfmDataset.filter(item => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.patient.nama?.toLowerCase().includes(q);
        const matchId = item.patient.id?.toLowerCase().includes(q);
        const matchPhone = item.patient.telepon?.includes(q);
        const matchCity = item.patient.alamat?.kabupatenKota?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPhone && !matchCity) return false;
      }

      // Segment filter
      if (selectedSegment !== 'ALL' && item.segment !== selectedSegment) {
        return false;
      }

      // Branch filter
      if (selectedBranchFilter !== 'ALL' && item.patient.branchCode !== selectedBranchFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'monetary') {
        return b.monetaryTotal - a.monetaryTotal;
      }
      if (sortBy === 'frequency') {
        return b.frequencyCount - a.frequencyCount;
      }
      if (sortBy === 'recency_asc') {
        return a.recencyDays - b.recencyDays;
      }
      if (sortBy === 'recency_desc') {
        return b.recencyDays - a.recencyDays;
      }
      if (sortBy === 'rfm') {
        return parseInt(b.rfmScoreString, 10) - parseInt(a.rfmScoreString, 10);
      }
      if (sortBy === 'name') {
        return a.patient.nama.localeCompare(b.patient.nama);
      }
      return 0;
    });
  }, [rfmDataset, searchTerm, selectedSegment, selectedBranchFilter, sortBy]);

  // Selected Patient Details
  const selectedPatientData = useMemo(() => {
    if (!selectedPatientId) return null;
    return rfmDataset.find(item => item.patient.id === selectedPatientId) || null;
  }, [selectedPatientId, rfmDataset]);

  // Update WA message when selected patient changes
  useEffect(() => {
    if (selectedPatientData) {
      setCustomWAMessage(selectedPatientData.waTemplate);
      setCopiedWA(false);
    }
  }, [selectedPatientData]);

  // Filtered Notes for current selected patient
  const selectedPatientNotes = useMemo(() => {
    if (!selectedPatientId) return [];
    return activeCrmNotes.filter(n => n.patientId === selectedPatientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPatientId, activeCrmNotes]);

  // Add CRM note handler
  const handleAddCRMNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !newNoteText.trim()) return;

    const newNote: CRMNote = {
      id: `NOTE-${Date.now()}`,
      patientId: selectedPatientId,
      date: new Date().toISOString(),
      author: newNoteAuthor || 'Staf CRM',
      channel: newNoteChannel,
      note: newNoteText.trim(),
    };

    if (onAddCRMNote) {
      onAddCRMNote(newNote);
    }
    const updated = [newNote, ...localCrmNotes];
    setLocalCrmNotes(updated);
    saveCRMNotes(updated);
    setNewNoteText('');
  };

  // WhatsApp Sender
  const handleSendWA = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleCopyWA = () => {
    navigator.clipboard.writeText(customWAMessage);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Full Transaction History for Selected Patient
  const patientHistory = useMemo(() => {
    if (!selectedPatientData) return [];
    const pid = selectedPatientData.patient.id;
    const history: any[] = [];

    allJasa.filter(tx => tx.idPelanggan === pid).forEach(tx => {
      history.push({ 
        ...tx, 
        type: 'JSA', 
        label: 'Jasa Periksa', 
        date: tx.tanggal, 
        amount: tx.biayaJasaPeriksa, 
        icon: <Stethoscope className="w-4 h-4 text-emerald-500" /> 
      });
    });

    allABD.filter(tx => tx.idPelanggan === pid).forEach(tx => {
      history.push({ 
        ...tx, 
        type: 'ABD', 
        label: 'Penjualan ABD', 
        date: tx.tanggal, 
        amount: tx.jumlah || tx.hargaJual, 
        icon: <Volume2 className="w-4 h-4 text-blue-500" /> 
      });
    });

    allAksesoris.filter(tx => tx.idPelanggan === pid).forEach(tx => {
      history.push({ 
        ...tx, 
        type: 'AKS', 
        label: 'Aksesoris', 
        date: tx.tanggal, 
        amount: tx.jumlah, 
        icon: <ShoppingBag className="w-4 h-4 text-amber-500" /> 
      });
    });

    allEarmould.filter(tx => tx.idPelanggan === pid).forEach(tx => {
      history.push({ 
        ...tx, 
        type: 'EMD', 
        label: 'Lab Earmould', 
        date: tx.tanggalMasukLab, 
        amount: 0, 
        icon: <Disc className="w-4 h-4 text-purple-500" /> 
      });
    });

    allReparasi.filter(tx => tx.idPelanggan === pid).forEach(tx => {
      history.push({ 
        ...tx, 
        type: 'REP', 
        label: 'Reparasi', 
        date: tx.tanggalMasuk, 
        amount: 0, 
        icon: <Wrench className="w-4 h-4 text-rose-500" /> 
      });
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPatientData, allJasa, allABD, allAksesoris, allEarmould, allReparasi]);

  // Export Comprehensive RFM CSV
  const handleDownloadRFMCSV = () => {
    const headers = [
      'ID Pelanggan',
      'Nama Pasien',
      'Gender',
      'No. Telepon / WA',
      'Cabang Registrasi',
      'Usia (Tahun)',
      'Kabupaten / Kota',
      'Provinsi',
      'Segmen RFM',
      'Skor RFM (R-F-M)',
      'Recency (Hari Lalu)',
      'Skor Recency (1-5)',
      'Tgl Terakhir Transaksi',
      'Tipe Transaksi Terakhir',
      'Total Frekuensi (Kunjungan)',
      'Skor Frekuensi (1-5)',
      'Total Belanja (LTV Rp)',
      'Skor Monetary (1-5)',
      'Belanja ABD (Rp)',
      'Belanja Aksesoris (Rp)',
      'Belanja Jasa Periksa (Rp)',
      'Belanja Reparasi (Rp)',
      'Rekomendasi Tindakan CRM'
    ];

    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '';
      const text = String(str);
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return '"' + text.replace(/"/g, '""') + '"';
      }
      return text;
    };

    const rows = filteredDataset.map(item => {
      return [
        item.patient.id,
        item.patient.nama,
        item.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        item.patient.telepon,
        getBranchByCode(item.patient.branchCode).name,
        item.patient.usia,
        item.patient.alamat.kabupatenKota,
        item.patient.alamat.provinsi,
        item.segment,
        item.rfmScoreString,
        item.recencyDays,
        item.recencyScore,
        item.lastTransactionDate || '-',
        item.lastTransactionType || '-',
        item.frequencyCount,
        item.frequencyScore,
        item.monetaryTotal,
        item.monetaryScore,
        item.categoryBreakdown.abd,
        item.categoryBreakdown.aksesoris,
        item.categoryBreakdown.jasa,
        item.categoryBreakdown.reparasi,
        item.suggestedAction
      ].map(escapeCSV).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(',') + '\n' 
      + rows.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRM_RFM_Pasien_Earsound_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSegmentIcon = (segment: RFMSegment) => {
    switch (segment) {
      case 'Champions': return <Crown className="w-4 h-4 text-emerald-500" />;
      case 'Loyal Customers': return <HeartHandshake className="w-4 h-4 text-blue-500" />;
      case 'Potential Loyalists': return <Sparkles className="w-4 h-4 text-indigo-500" />;
      case 'New Customers': return <UserCheck className="w-4 h-4 text-cyan-500" />;
      case 'Need Attention': return <BellRing className="w-4 h-4 text-amber-500" />;
      case 'At Risk': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'Hibernating': return <UserX className="w-4 h-4 text-rose-500" />;
      case 'Unconverted Leads': return <UserPlus className="w-4 h-4 text-slate-500" />;
      default: return <Globe className="w-4 h-4 text-slate-500" />;
    }
  };

  const segmentList: RFMSegment[] = [
    'Champions',
    'Loyal Customers',
    'Potential Loyalists',
    'New Customers',
    'Need Attention',
    'At Risk',
    'Hibernating',
    'Unconverted Leads',
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-slate-950 via-[#1B1E5C] to-[#252B82] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="w-64 h-64 text-indigo-300" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-xs font-bold mb-3 backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>CRM Pasien Global & Segmentasi RFM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Sistem CRM Pasien Berbasis RFM
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Segmentasi cerdas <strong>Recency (R)</strong>, <strong>Frequency (F)</strong>, & <strong>Monetary (M)</strong> lintas seluruh cabang untuk meningkatkan retensi pasien, follow-up perawatan berkala, re-aktivasi pasien berisiko, dan penawaran personalisasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowRFMGuide(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Panduan Sistem RFM</span>
            </button>
            <button
              onClick={handleDownloadRFMCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Data RFM (.CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Patients */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pasien CRM</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {metrics.totalPatientsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Terhubung dari 8 cabang & pusat
          </p>
        </div>

        {/* Total Monetary LTV */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Lifetime Value (M)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black text-emerald-700 truncate">
            {formatRupiah(metrics.totalMonetary)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Rata-rata: {formatRupiah(metrics.avgMonetary)} / pasien
          </p>
        </div>

        {/* Champions & Loyal */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">VIP & Champions</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600">
            {metrics.countChampions} <span className="text-xs font-semibold text-slate-400">({metrics.countChampions + metrics.countLoyal} Loyal)</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Kontributor omset terbesar
          </p>
        </div>

        {/* At Risk & Follow Up */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Butuh Follow-Up Segera</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600">
            {metrics.countNeedAttention + metrics.countAtRisk}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            {metrics.countNeedAttention} Need Attention • {metrics.countAtRisk} At Risk
          </p>
        </div>
      </div>

      {/* Interactive Segment Filter Cards */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Filter Berdasarkan Segmen RFM
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Klik salah satu segmen untuk memfilter pasien
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2">
          {/* ALL Option */}
          <button
            onClick={() => setSelectedSegment('ALL')}
            className={`p-2.5 rounded-2xl text-left transition-all border cursor-pointer ${
              selectedSegment === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Semua</div>
            <div className="text-lg font-black mt-0.5">{rfmDataset.length}</div>
            <div className="text-[10px] truncate opacity-70">Seluruh Pasien</div>
          </button>

          {/* 8 RFM Segments */}
          {segmentList.map((seg) => {
            const count = rfmDataset.filter(i => i.segment === seg).length;
            const details = RFM_SEGMENT_DETAILS[seg];
            const isSelected = selectedSegment === seg;

            return (
              <button
                key={seg}
                onClick={() => setSelectedSegment(seg)}
                className={`p-2.5 rounded-2xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? `${details.badgeColor} border-transparent shadow-md ring-2 ring-indigo-400`
                    : `${details.bgLight} ${details.borderColor} hover:brightness-95`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : details.textColor}`}>
                    {seg.split(' ')[0]}
                  </div>
                  {getSegmentIcon(seg)}
                </div>
                <div className={`text-lg font-black mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {count}
                </div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                  {details.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Search, Branch, Sort, View Toggle */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pasien (Nama, ID Pelanggan, No WA, Kota)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#1E2269] outline-none"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-transparent outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Semua Cabang</option>
              {BRANCHES.map(b => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent outline-none cursor-pointer pr-1"
            >
              <option value="monetary">Nilai Belanja Terbesar (M)</option>
              <option value="frequency">Kunjungan Terbanyak (F)</option>
              <option value="recency_asc">Kunjungan Paling Baru (R)</option>
              <option value="recency_desc">Kunjungan Paling Lama (At Risk)</option>
              <option value="rfm">Skor RFM Tertinggi</option>
              <option value="name">Nama Pasien (A-Z)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'visual' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visualisasi & Bubble Chart"
            >
              <ChartIcon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Visual & Bubble</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel RFM"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Patient List Content */}
      <div className="space-y-4">
        {viewMode === 'visual' && (
          <RFMVisualization
            rfmDataset={rfmDataset}
            onSelectPatient={(id) => setSelectedPatientId(id)}
            selectedSegmentFilter={selectedSegment}
            onSelectSegmentFilter={(seg) => setSelectedSegment(seg)}
          />
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span>Menampilkan {filteredDataset.length} dari {rfmDataset.length} pasien</span>
          {selectedSegment !== 'ALL' && (
            <button
              onClick={() => setSelectedSegment('ALL')}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              Reset Filter Segmen (Tampilkan Semua)
            </button>
          )}
        </div>

        {filteredDataset.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
            <Globe className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Data Pasien Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada pasien yang cocok dengan kriteria pencarian atau filter segmen yang dipilih.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-3">Pasien & ID</th>
                    <th className="p-3">Segmen RFM</th>
                    <th className="p-3 text-center">Skor RFM</th>
                    <th className="p-3">Recency (Terakhir)</th>
                    <th className="p-3 text-center">Frekuensi</th>
                    <th className="p-3 text-right">Monetary (LTV)</th>
                    <th className="p-3">Cabang</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDataset.map((item) => {
                    const segDetails = RFM_SEGMENT_DETAILS[item.segment];
                    return (
                      <tr key={item.patient.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.patient.nama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.patient.id} • {item.patient.telepon}</div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${segDetails.badgeColor}`}>
                            {item.segment}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-950">
                          {item.rfmScoreString}
                        </td>
                        <td className="p-3">
                          {item.lastTransactionDate ? (
                            <div>
                              <div className="font-bold text-slate-900">{item.recencyDays} hari lalu</div>
                              <div className="text-[10px] text-slate-400">{formatIndoDate(item.lastTransactionDate)}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum ada transaksi</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {item.frequencyCount} kali
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {formatRupiah(item.monetaryTotal)}
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {getBranchByCode(item.patient.branchCode).name}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSendWA(item.patient.telepon, item.waTemplate)}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                              title="Kirim Pesan WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedPatientId(item.patient.id)}
                              className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-colors cursor-pointer"
                              title="Buka Profil Lengkap"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View (for 'grid' and 'visual' modes) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDataset.map((item) => {
              const segDetails = RFM_SEGMENT_DETAILS[item.segment];
              return (
                <div
                  key={item.patient.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-md group"
                >
                  <div>
                    {/* Header: Segment badge & RFM Score */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${segDetails.badgeColor}`}>
                        {getSegmentIcon(item.segment)}
                        <span>{item.segment}</span>
                      </span>

                      <span className="font-mono text-[11px] font-extrabold text-indigo-950 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg" title="Skor Recency - Frequency - Monetary (1-5)">
                        RFM: {item.rfmScoreString}
                      </span>
                    </div>

                    {/* Patient Name & ID */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {item.patient.nama}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {item.patient.id} • {item.patient.usia} Thn ({item.patient.gender === 'L' ? 'L' : 'P'})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getBranchByCode(item.patient.branchCode).code}
                      </span>
                    </div>

                    {/* Location & Phone */}
                    <div className="mt-2.5 space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.patient.alamat.kabupatenKota}, {item.patient.alamat.provinsi}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-medium text-slate-700">{item.patient.telepon}</span>
                      </div>
                    </div>

                    {/* RFM Metrics Mini Matrix */}
                    <div className="grid grid-cols-3 gap-1.5 my-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Recency</div>
                        <div className="text-xs font-black text-slate-800">
                          {item.lastTransactionDate ? `${item.recencyDays} hr` : '-'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold">Skor: {item.recencyScore}/5</div>
                      </div>

                      <div className="border-x border-slate-200 px-1">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Frequency</div>
                        <div className="text-xs font-black text-slate-800">
                          {item.frequencyCount}x
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold">Skor: {item.frequencyScore}/5</div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Monetary</div>
                        <div className="text-xs font-black text-emerald-700 truncate" title={formatRupiah(item.monetaryTotal)}>
                          {formatRupiah(item.monetaryTotal)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold">Skor: {item.monetaryScore}/5</div>
                      </div>
                    </div>

                    {/* Suggested Action preview */}
                    <div className="text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200/60 p-2 rounded-xl leading-snug line-clamp-2">
                      <strong className="text-amber-900">Saran CRM: </strong>
                      {item.suggestedAction}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleSendWA(item.patient.telepon, item.waTemplate)}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      title="Hubungi via WhatsApp dengan template otomatis"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim WA</span>
                    </button>

                    <button
                      onClick={() => setSelectedPatientId(item.patient.id)}
                      className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold transition-colors border border-indigo-200 cursor-pointer"
                    >
                      Profil & Riwayat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient 360° Detail & CRM Drawer Modal */}
      {selectedPatientData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-[#1E2269] text-white p-4 sm:p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black">{selectedPatientData.patient.nama}</h2>
                    <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      {selectedPatientData.patient.id}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {selectedPatientData.patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {selectedPatientData.patient.usia} Tahun • Cabang {getBranchByCode(selectedPatientData.patient.branchCode).name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientId(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with internal scrolling */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* RFM Score & Analytics Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Klasifikasi Pasien</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${RFM_SEGMENT_DETAILS[selectedPatientData.segment].badgeColor}`}>
                        {selectedPatientData.segment}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        Skor RFM: {selectedPatientData.rfmScoreString}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Belanja (LTV)</div>
                    <div className="text-xl font-black text-emerald-700">
                      {formatRupiah(selectedPatientData.monetaryTotal)}
                    </div>
                  </div>
                </div>

                {/* RFM 3 Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {/* Recency */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold text-slate-700">Recency (R)</span>
                      <span className="font-extrabold text-indigo-700">Skor {selectedPatientData.recencyScore} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full" 
                        style={{ width: `${(selectedPatientData.recencyScore / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      {selectedPatientData.lastTransactionDate 
                        ? `${selectedPatientData.recencyDays} hari lalu (${formatIndoDate(selectedPatientData.lastTransactionDate)})`
                        : 'Belum pernah bertransaksi'}
                    </p>
                  </div>

                  {/* Frequency */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold text-slate-700">Frequency (F)</span>
                      <span className="font-extrabold text-blue-700">Skor {selectedPatientData.frequencyScore} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full" 
                        style={{ width: `${(selectedPatientData.frequencyScore / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Total {selectedPatientData.frequencyCount} kali transaksi di seluruh cabang
                    </p>
                  </div>

                  {/* Monetary */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-bold text-slate-700">Monetary (M)</span>
                      <span className="font-extrabold text-emerald-700">Skor {selectedPatientData.monetaryScore} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full" 
                        style={{ width: `${(selectedPatientData.monetaryScore / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Nominal akumulasi {formatRupiah(selectedPatientData.monetaryTotal)}
                    </p>
                  </div>
                </div>

                {/* CRM Actionable Insight Box */}
                <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                        Rekomendasi Tindakan CRM Petugas:
                      </h4>
                      <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                        {selectedPatientData.suggestedAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Generator Box */}
              <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                      Template Pesan WhatsApp Personalisasi ({selectedPatientData.segment})
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 font-bold">
                    Tujuan: {selectedPatientData.patient.telepon}
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={customWAMessage}
                  onChange={(e) => setCustomWAMessage(e.target.value)}
                  className="w-full p-3 bg-emerald-50/40 border border-emerald-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWA}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedWA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWA ? 'Tersalin!' : 'Salin Pesan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWA(selectedPatientData.patient.telepon, customWAMessage)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buka & Kirim WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* CRM Follow-Up Notes & Log History */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                      Catatan Follow-Up CRM Pasien
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">
                    {selectedPatientNotes.length} Catatan Tersimpan
                  </span>
                </div>

                {/* Add new note form */}
                <form onSubmit={handleAddCRMNote} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <select
                      value={newNoteChannel}
                      onChange={(e: any) => setNewNoteChannel(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-700 outline-none"
                    >
                      <option value="WhatsApp">Kanal: WhatsApp</option>
                      <option value="Telepon">Kanal: Telepon</option>
                      <option value="Kunjungan Langsung">Kanal: Kunjungan Langsung</option>
                      <option value="Lainnya">Kanal: Lainnya</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Nama Petugas CRM..."
                      value={newNoteAuthor}
                      onChange={(e) => setNewNoteAuthor(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none w-36 font-medium"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tulis hasil follow up / catatan interaksi dengan pasien..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newNoteText.trim()}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan</span>
                    </button>
                  </div>
                </form>

                {/* Notes History list */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedPatientNotes.length > 0 ? (
                    selectedPatientNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded-md text-[10px]">
                              {note.channel}
                            </span>
                            <span className="font-bold text-slate-700">{note.author}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{formatIndoDate(note.date)}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed pl-1">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-3 italic">
                      Belum ada catatan follow-up khusus untuk pasien ini.
                    </p>
                  )}
                </div>
              </div>

              {/* Full Multi-Branch Transaction Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                      Riwayat Transaksi Lintas Cabang ({patientHistory.length} Transaksi)
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {patientHistory.length > 0 ? (
                    patientHistory.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-100">
                            {h.icon}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {h.label} <span className="font-normal text-slate-400 font-mono text-[11px]">({h.id})</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {formatIndoDate(h.date)} • @ Cabang {getBranchByCode(h.branchCode).name}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {h.amount ? (
                            <div className="font-extrabold text-emerald-700 text-xs">{formatRupiah(h.amount)}</div>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Belum ada riwayat transaksi.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPatientId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RFM Education & Guide Modal */}
      {showRFMGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-[#1E2269] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-base sm:text-lg">Panduan Sistem RFM dalam CRM Earsound</h3>
              </div>
              <button
                onClick={() => setShowRFMGuide(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed custom-scrollbar">
              <div>
                <h4 className="font-black text-sm text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Apa itu Sistem RFM (Recency, Frequency, Monetary)?
                </h4>
                <p className="text-slate-600">
                  Model RFM adalah metodologi analisis perilaku pelanggan yang terbukti efektif di industri medis dan ritel pendengaran untuk mengelompokkan pasien berdasarkan riwayat transaksi nyata:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                  <div className="font-black text-indigo-900 text-sm mb-1">R - Recency</div>
                  <p className="text-[11px] text-slate-600">
                    Berapa hari sejak kunjungan/transaksi terakhir pasien. Skor 5 (&lt; 30 hari) hingga skor 1 (&gt; 1 tahun).
                  </p>
                </div>
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <div className="font-black text-blue-900 text-sm mb-1">F - Frequency</div>
                  <p className="text-[11px] text-slate-600">
                    Berapa kali pasien berkunjung atau membeli layanan di seluruh cabang Earsound.
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="font-black text-emerald-900 text-sm mb-1">M - Monetary</div>
                  <p className="text-[11px] text-slate-600">
                    Akumulasi nilai nominal rupiah belanja pasien seumur hidup (Customer Lifetime Value).
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900 mb-2">Penjelasan 8 Segmen Pasien & Tindakan CRM</h4>
                <div className="space-y-2">
                  {segmentList.map(seg => {
                    const d = RFM_SEGMENT_DETAILS[seg];
                    return (
                      <div key={seg} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                        <div className="mt-0.5">{getSegmentIcon(seg)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{d.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{d.description}</p>
                          <div className="text-[11px] font-semibold text-indigo-900 mt-1 bg-white p-1.5 rounded-lg border border-slate-200">
                            💡 <strong>Tindakan Petugas:</strong> {d.suggestedAction}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRFMGuide(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
