import React, { useState } from 'react';
import { 
  JasaPeriksaTransaction, 
  Patient, 
  JenisPemeriksaan, 
  PaymentDetails,
  BranchCode,
  AppUser,
  AudiogramData
} from '../../types';
import { formatIndoDate, formatRupiah, formatPatientWithGelar, parseDateParts } from '../../utils/formatters';
import { generateKwitansiNumber, getDefaultBsiAccount } from '../../utils/branches';
import { generateWhatsAppReceiptMessage, openWhatsAppWithReceipt } from '../../utils/whatsappHelper';
import { PaymentSelector } from './PaymentSelector';
import { PinVerificationModal } from '../Common/PinVerificationModal';
import { EditTransactionModal } from './EditTransactionModal';
import { ReportFilterToolbar } from '../Common/ReportFilterToolbar';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';
import { exportJasaPeriksaCSV } from '../../utils/exportHelpers';
import { AudiogramInputModal } from '../Audiogram/AudiogramInputModal';
import { PrintAudiogramModal } from '../Audiogram/PrintAudiogramModal';
import { CloseTransactionConfirmModal } from './CloseTransactionConfirmModal';
import { 
  Stethoscope, 
  Plus, 
  Trash2, 
  Search, 
  Printer, 
  Activity, 
  Edit3, 
  MessageSquare,
  FileCheck,
  Sparkles,
  Volume2
} from 'lucide-react';

interface JasaPeriksaSectionProps {
  transactions: JasaPeriksaTransaction[];
  patients: Patient[];
  currentUser: AppUser;
  selectedBranch: BranchCode;
  onAddTransaction: (transaction: JasaPeriksaTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveTransaction?: (transaction: JasaPeriksaTransaction) => void;
  onPrintKwitansi?: (transaction: JasaPeriksaTransaction) => void;
}

const TARIFFS: { [key in JenisPemeriksaan]?: number } = {
  'Audiometri': 50000,
  'Audiometri (Rp 50.000)': 50000,
  'Audiometri Nada Murni': 100000,
  'Play Audiometri Anak': 100000,
  'Tympanometri': 100000,
  'Tympanometry': 200000,
  'OAE (Otoacoustic Emission)': 200000,
  'BERA (Brainstem Evoked Audiometry)': 1300000,
  'FFT (Free Field Test)': 100000,
};

const JENIS_PEMERIKSAAN_LIST: JenisPemeriksaan[] = [
  'Audiometri',
  'Audiometri Nada Murni',
  'Play Audiometri Anak',
  'Tympanometri',
  'Tympanometry',
  'OAE (Otoacoustic Emission)',
  'BERA (Brainstem Evoked Audiometry)',
  'FFT (Free Field Test)',
];

const AUDIOMETRIS_OPTIONS = [
  'Diana',
  'Agung',
  'Mutia',
  'Dila',
  'Adit',
  'Ira',
  'Fifah',
  'Rara',
  'Rendi',
  'Zidan',
  'Vivi'
];

export const JasaPeriksaSection: React.FC<JasaPeriksaSectionProps> = ({
  transactions = [],
  patients = [],
  currentUser,
  selectedBranch,
  onAddTransaction,
  onDeleteTransaction,
  onSaveTransaction,
  onPrintKwitansi,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [idPelanggan, setIdPelanggan] = useState('');
  const [namaCustomer, setNamaCustomer] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTypes, setSelectedTypes] = useState<JenisPemeriksaan[]>(['Audiometri']);
  const [subtotalBiaya, setSubtotalBiaya] = useState(50000);
  const [diskon, setDiskon] = useState(0);
  const [biayaJasaPeriksa, setBiayaJasaPeriksa] = useState(50000);
  const [resultKananDb, setResultKananDb] = useState('40');
  const [resultKiriDb, setResultKiriDb] = useState('45');
  const [resultTympanometri, setResultTympanometri] = useState<'Tipe A' | 'Tipe As' | 'Tipe Ad' | 'Tipe B' | 'Tipe C'>('Tipe A');
  const [resultOAE, setResultOAE] = useState<'PASS' | 'REFER'>('PASS');
  const [resultBERA, setResultBERA] = useState<'RESPONS' | 'NO RESPONSE'>('RESPONS');
  const [catatanHasil, setCatatanHasil] = useState('');
  const [audiometris, setAudiometris] = useState('Diana');
  const [payment, setPayment] = useState<PaymentDetails>({ method: 'Cash' });

  // HAC Fitting Trial & Potential Customer State
  const [adaFittingABD, setAdaFittingABD] = useState<boolean>(false);
  const [tipeABDFitting, setTipeABDFitting] = useState<string>('');
  const [potensiPembelian, setPotensiPembelian] = useState<'Sangat Potensial' | 'Potensial' | 'Ragu-ragu' | 'Kurang Potensial'>('Potensial');
  const [catatanHAC, setCatatanHAC] = useState<string>('');
  const [filterPotensialOnly, setFilterPotensialOnly] = useState<boolean>(false);

  // PIN & Edit Modal State
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTxToEdit, setSelectedTxToEdit] = useState<JasaPeriksaTransaction | null>(null);

  // Audiogram Input & Print Modal State
  const [audiogramModalOpen, setAudiogramModalOpen] = useState(false);
  const [printAudiogramModalOpen, setPrintAudiogramModalOpen] = useState(false);
  const [selectedTxForAudiogram, setSelectedTxForAudiogram] = useState<JasaPeriksaTransaction | null>(null);
  const [formAudiogramData, setFormAudiogramData] = useState<AudiogramData | undefined>(undefined);

  // Date Range & Export State
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState<string>('Semua Periode');
  const [patientGelar, setPatientGelar] = useState<string>('');

  const activeBranchCode: BranchCode = currentUser.branchCode === 'HQ' ? (selectedBranch === 'ALL' ? 'YM' : selectedBranch) : currentUser.branchCode;

  const handlePatientSelect = (patientId: string) => {
    setIdPelanggan(patientId);
    const p = patients.find((pat) => pat.id === patientId);
    if (p) {
      setNamaCustomer(p.nama);
      setPatientGelar(p.gelar || '');
    }
  };

  const calculateTotalTariff = (types: JenisPemeriksaan[]) => {
    return types.reduce((sum, t) => sum + (TARIFFS[t] || 0), 0);
  };

  const toggleType = (type: JenisPemeriksaan) => {
    let nextTypes: JenisPemeriksaan[];
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        nextTypes = selectedTypes.filter((t) => t !== type);
      } else {
        nextTypes = selectedTypes;
      }
    } else {
      nextTypes = [...selectedTypes, type];
    }
    setSelectedTypes(nextTypes);
    const newSubtotal = calculateTotalTariff(nextTypes);
    setSubtotalBiaya(newSubtotal);
    setBiayaJasaPeriksa(Math.max(0, newSubtotal - diskon));
  };

  const handleDiskonChange = (val: number) => {
    setDiskon(val);
    setBiayaJasaPeriksa(Math.max(0, subtotalBiaya - val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPelanggan) {
      alert('Mohon pilih Pasien / Customer terlebih dahulu.');
      return;
    }
    if (selectedTypes.length === 0) {
      alert('Pilih minimal 1 jenis pemeriksaan.');
      return;
    }
    if (biayaJasaPeriksa < 0) {
      alert('Total biaya setelah diskon tidak boleh bernilai negatif.');
      return;
    }
    if (diskon < 0) {
      alert('Diskon tidak boleh bernilai negatif.');
      return;
    }
    if (diskon > subtotalBiaya) {
      alert('Diskon tidak boleh lebih besar dari total biaya pemeriksaan.');
      return;
    }

    const branchCount = transactions.filter(t => t.branchCode === activeBranchCode).length;
    const nomorKwitansi = generateKwitansiNumber(activeBranchCode, branchCount + 1);

    const hasAudiogram = selectedTypes.some(t => t === 'Audiometri' || t === 'Audiometri (Rp 50.000)' || t === 'Audiometri Nada Murni' || t === 'Play Audiometri Anak' || t === 'FFT (Free Field Test)');
    const hasTympa = selectedTypes.includes('Tympanometri') || selectedTypes.includes('Tympanometry');
    const hasOAE = selectedTypes.includes('OAE (Otoacoustic Emission)');
    const hasBERA = selectedTypes.includes('BERA (Brainstem Evoked Audiometry)');

    const newTx: JasaPeriksaTransaction = {
      id: `JSA-${Date.now().toString().slice(-6)}`,
      tanggal,
      idPelanggan,
      gelar: patientGelar || patients.find(p => p.id === idPelanggan)?.gelar,
      namaCustomer,
      nomorKwitansi,
      jenisPemeriksaan: selectedTypes,
      subtotalBiaya,
      diskon,
      biayaJasaPeriksa,
      resultKananDb: hasAudiogram ? resultKananDb : undefined,
      resultKiriDb: hasAudiogram ? resultKiriDb : undefined,
      resultTympanometri: hasTympa ? resultTympanometri : undefined,
      resultOAE: hasOAE ? resultOAE : undefined,
      resultBERA: hasBERA ? resultBERA : undefined,
      catatanHasil,
      audiometris,
      audiogram: formAudiogramData,
      adaFittingABD,
      tipeABDFitting: adaFittingABD ? tipeABDFitting : undefined,
      potensiPembelian: (adaFittingABD || catatanHAC.trim()) ? potensiPembelian : undefined,
      catatanHAC: catatanHAC.trim() ? catatanHAC : undefined,
      payment: {
        ...payment,
        bsiAccount: (payment.method === 'Transfer' || payment.method === 'Split (Cash & Transfer)')
          ? (payment.bsiAccount || getDefaultBsiAccount(activeBranchCode))
          : undefined,
        splitBsiAccount: payment.method === 'Split (Cash & Transfer)'
          ? (payment.splitBsiAccount || payment.bsiAccount || getDefaultBsiAccount(activeBranchCode))
          : undefined,
      },
      branchCode: activeBranchCode,
      staffUser: currentUser.username,
    };

    onAddTransaction(newTx);
    setFormAudiogramData(undefined);
    setAdaFittingABD(false);
    setTipeABDFitting('');
    setPotensiPembelian('Potensial');
    setCatatanHAC('');
    setCatatanHasil('');
    setShowForm(false);
  };

  const handleOpenAudiogramInput = (t: JasaPeriksaTransaction) => {
    setSelectedTxForAudiogram(t);
    setAudiogramModalOpen(true);
  };

  const handleOpenPrintAudiogram = (t: JasaPeriksaTransaction) => {
    setSelectedTxForAudiogram(t);
    setPrintAudiogramModalOpen(true);
  };

  const handleSaveAudiogram = (updatedTx: JasaPeriksaTransaction, shouldOpenPrint?: boolean) => {
    if (updatedTx.id === 'DRAFT') {
      setFormAudiogramData(updatedTx.audiogram);
      if (updatedTx.resultKananDb) setResultKananDb(updatedTx.resultKananDb);
      if (updatedTx.resultKiriDb) setResultKiriDb(updatedTx.resultKiriDb);
      setAudiogramModalOpen(false);
      if (shouldOpenPrint) {
        setSelectedTxForAudiogram(updatedTx);
        setPrintAudiogramModalOpen(true);
      }
      return;
    }

    if (onSaveTransaction) {
      onSaveTransaction(updatedTx);
    }
    setSelectedTxForAudiogram(updatedTx);
    setAudiogramModalOpen(false);
    if (shouldOpenPrint) {
      setPrintAudiogramModalOpen(true);
    }
  };

  const handleSendWhatsApp = (t: JasaPeriksaTransaction) => {
    const p = patients.find((pat) => pat.id === t.idPelanggan);
    let targetPhone = p?.telepon && p.telepon !== '-' ? p.telepon : '';
    const displayName = formatPatientWithGelar(t.namaCustomer, t.gelar || p?.gelar);

    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 8) {
      const inputPhone = window.prompt(
        `Kirim Kwitansi via WhatsApp\n\nMasukkan Nomor WhatsApp untuk pasien ${displayName}:\n(Contoh: 08123456789 atau 628123456789)`,
        targetPhone || ''
      );
      if (inputPhone === null) return;
      targetPhone = inputPhone.trim();
    }

    if (!targetPhone || targetPhone.replace(/\D/g, '').length < 8) {
      alert('Nomor WhatsApp tidak valid (minimal 8 digit angka).');
      return;
    }

    const message = generateWhatsAppReceiptMessage({
      transaction: t,
      type: 'JSA',
      patient: p,
    });
    openWhatsAppWithReceipt(targetPhone, message);
  };

  const handleStartEdit = (tx: JasaPeriksaTransaction) => {
    setSelectedTxToEdit(tx);
    setPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    setPinModalOpen(false);
    setEditModalOpen(true);
  };

  const filteredTransactions = transactions.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      t.namaCustomer.toLowerCase().includes(term) ||
      t.idPelanggan.toLowerCase().includes(term) ||
      t.nomorKwitansi.toLowerCase().includes(term) ||
      t.audiometris.toLowerCase().includes(term) ||
      (t.tipeABDFitting && t.tipeABDFitting.toLowerCase().includes(term)) ||
      (t.catatanHAC && t.catatanHAC.toLowerCase().includes(term))
    );
    if (!matchesSearch) return false;

    if (filterPotensialOnly && !t.adaFittingABD && !t.catatanHAC && !t.potensiPembelian) return false;

    if (filterStartDate || filterEndDate) {
      const parts = parseDateParts(t.tanggal);
      if (parts) {
        const itemTime = new Date(parts.year, parts.month, parts.day).getTime();
        if (filterStartDate) {
          const startParts = parseDateParts(filterStartDate);
          if (startParts) {
            const startTime = new Date(startParts.year, startParts.month, startParts.day).getTime();
            if (itemTime < startTime) return false;
          }
        }
        if (filterEndDate) {
          const endParts = parseDateParts(filterEndDate);
          if (endParts) {
            const endTime = new Date(endParts.year, endParts.month, endParts.day).getTime();
            if (itemTime > endTime) return false;
          }
        }
      }
    }

    return true;
  });

  const totalFilteredAmount = filteredTransactions.reduce((sum, t) => sum + (t.biayaJasaPeriksa || 0), 0);

  const handleExportCSV = (periodLabel: string) => {
    exportJasaPeriksaCSV(filteredTransactions, patients, periodLabel, selectedBranch !== 'ALL' ? selectedBranch : undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#23277A]" />
            <span>Transaksi Jasa Periksa (Kwitansi KWT-[KodeCabang])</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pemeriksaan Audiometri Nada Murni, Play Audiometri, Tympanometri, OAE, BERA, & FFT dengan nomor kwitansi terformat standar cabang.
          </p>
        </div>

        <button
          id="btn-tambah-transaksi-jasa"
          onClick={() => {
            if (showForm) {
              setShowCloseConfirmModal(true);
            } else {
              setShowForm(true);
            }
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-sm shadow-md transition-all whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>{showForm ? 'Tutup Form' : '+ Transaksi Jasa Periksa'}</span>
        </button>
      </div>

      {/* Confirmation Modal Before Closing */}
      <CloseTransactionConfirmModal
        isOpen={showCloseConfirmModal}
        transactionTitle="Transaksi Jasa Periksa Pasien"
        onContinue={() => setShowCloseConfirmModal(false)}
        onCancelAndClose={() => {
          setShowCloseConfirmModal(false);
          setShowForm(false);
        }}
      />

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-indigo-200 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-base font-black text-slate-900">Form Transaksi Jasa Periksa Pasien (Cabang [{activeBranchCode}])</h3>
            <span className="text-xs font-bold text-[#23277A] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Format: KWT-{activeBranchCode}-00xxxx
            </span>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchablePatientSelect
                patients={patients}
                value={idPelanggan}
                onChange={(pid) => handlePatientSelect(pid)}
                required
                id="jasa-patient-select"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Customer
              </label>
              <input
                type="text"
                readOnly
                value={namaCustomer}
                className="w-full bg-slate-200/70 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Transaksi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#23277A] outline-none"
              />
            </div>
          </div>

          {/* Jenis Pemeriksaan Checkboxes with Tariffs */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Pilihan Jenis Pemeriksaan (Tarif Standar earsound):
              </label>
              <span className="text-xs font-bold text-[#23277A] bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                Total Tarif: {formatRupiah(biayaJasaPeriksa)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {JENIS_PEMERIKSAAN_LIST.map((item) => {
                const isSelected = selectedTypes.includes(item);
                const tariff = TARIFFS[item];

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleType(item)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#181B57] text-[#F5B438] border-[#181B57] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${isSelected ? 'border-[#F5B438] bg-[#F5B438]' : 'border-slate-400'}`}>
                        {isSelected && <span className="w-1.5 h-1.5 bg-slate-950 rounded-xs" />}
                      </div>
                      <span>{item}</span>
                    </div>
                    <span className="text-[10px] opacity-80">{formatRupiah(tariff)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Results & Audiometris Name */}
          <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#23277A] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#23277A]" />
              <span>Input Hasil Pemeriksaan Khusus & Petugas</span>
            </h4>

            {/* Audiogram Banner / Button */}
            {selectedTypes.some(t => t === 'Audiometri' || t === 'Audiometri (Rp 50.000)' || t === 'Audiometri Nada Murni' || t === 'Play Audiometri Anak' || t === 'FFT (Free Field Test)') && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-xl shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-950 block">
                      Hasil Audiogram Lengkap (AC & BC per Frekuensi)
                    </span>
                    <span className="text-[11px] text-blue-800">
                      {formAudiogramData 
                        ? `✓ Data Audiogram terisi (PTA R: ${formAudiogramData.kanan.pta ?? resultKananDb} dB | L: ${formAudiogramData.kiri.pta ?? resultKiriDb} dB)`
                        : 'Input ambang dengar 250Hz - 8000Hz, otomatis hitung derajat & jenis gangguan pendengaran.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const draftTx: JasaPeriksaTransaction = {
                      id: 'DRAFT',
                      tanggal,
                      idPelanggan: idPelanggan || 'PLG-DRAFT',
                      namaCustomer: namaCustomer || 'Pasien',
                      nomorKwitansi: 'DRAFT',
                      jenisPemeriksaan: selectedTypes,
                      biayaJasaPeriksa,
                      audiometris,
                      payment,
                      audiogram: formAudiogramData,
                      resultKananDb,
                      resultKiriDb,
                    };
                    setSelectedTxForAudiogram(draftTx);
                    setAudiogramModalOpen(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
                    formAudiogramData
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {formAudiogramData ? 'Edit Data Audiogram (AC/BC)' : '+ Desain / Input Audiogram (AC/BC)'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Audiogram dB Kanan & Kiri */}
              {selectedTypes.some(t => t === 'Audiometri' || t === 'Audiometri (Rp 50.000)' || t === 'Audiometri Nada Murni' || t === 'Play Audiometri Anak' || t === 'FFT (Free Field Test)') && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-red-700 mb-1">
                      Audiogram Kanan (R) dB
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 40 dB"
                      value={resultKananDb}
                      onChange={(e) => setResultKananDb(e.target.value)}
                      className="w-full bg-white border border-red-300 rounded-xl p-2 text-xs font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-700 mb-1">
                      Audiogram Kiri (L) dB
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 45 dB"
                      value={resultKiriDb}
                      onChange={(e) => setResultKiriDb(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded-xl p-2 text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Tympanometri (Tipe A, As, Ad, B, C) */}
              {(selectedTypes.includes('Tympanometri') || selectedTypes.includes('Tympanometry')) && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Hasil Kurva Tympanometri
                  </label>
                  <select
                    value={resultTympanometri}
                    onChange={(e) => setResultTympanometri(e.target.value as any)}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs font-bold text-[#23277A] focus:ring-2 focus:ring-[#23277A]"
                  >
                    <option value="Tipe A">Tipe A (Normal)</option>
                    <option value="Tipe As">Tipe As (Kaku/Shallow)</option>
                    <option value="Tipe Ad">Tipe Ad (Lentur/Deep)</option>
                    <option value="Tipe B">Tipe B (Datar/Fluid)</option>
                    <option value="Tipe C">Tipe C (Tekanan Negatif)</option>
                  </select>
                </div>
              )}

              {/* OAE (PASS / REFER) */}
              {selectedTypes.includes('OAE (Otoacoustic Emission)') && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Hasil OAE
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setResultOAE('PASS')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        resultOAE === 'PASS'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultOAE('REFER')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        resultOAE === 'REFER'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      REFER
                    </button>
                  </div>
                </div>
              )}

              {/* BERA (RESPONS / NO RESPONSE) */}
              {selectedTypes.includes('BERA (Brainstem Evoked Audiometry)') && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Hasil BERA
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setResultBERA('RESPONS')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        resultBERA === 'RESPONS'
                          ? 'bg-[#23277A] text-white border-[#23277A] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      RESPONS
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultBERA('NO RESPONSE')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        resultBERA === 'NO RESPONSE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      NO RESPONSE
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Audiometris / Pemeriksa <span className="text-red-500">*</span>
                </label>
                <select
                  value={audiometris}
                  onChange={(e) => setAudiometris(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#23277A]"
                >
                  {AUDIOMETRIS_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Potongan Diskon (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={diskon}
                  onChange={(e) => handleDiskonChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs font-bold text-rose-700 focus:ring-2 focus:ring-[#23277A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Total Bayar Final (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={biayaJasaPeriksa}
                  onChange={(e) => {
                    const finalVal = parseInt(e.target.value) || 0;
                    setBiayaJasaPeriksa(finalVal);
                    setDiskon(Math.max(0, subtotalBiaya - finalVal));
                  }}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2 text-xs font-black text-[#23277A] focus:ring-2 focus:ring-[#23277A]"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan / Keterangan Hasil Periksa (Ditulis di luar deskripsi kwitansi)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Ambangan pendengaran sedang pada telinga kanan, disarankan evaluasi berkala."
                  value={catatanHasil}
                  onChange={(e) => setCatatanHasil(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#23277A] outline-none"
                />
              </div>
            </div>
          </div>

            {/* Section: Trial Fitting ABD & Catatan Khusus HAC (Follow-Up CS & Rekam Medis) */}
            <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-4 space-y-3 mt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      Catatan Khusus HAC & Trial Fitting ABD
                      <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        Internal Rekam Medis & Follow-up CS
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Catatan evaluasi HAC jika pasien melakukan trial fitting ABD namun belum langsung membeli.
                    </p>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs hover:bg-amber-50 transition-all">
                  <input
                    type="checkbox"
                    checked={adaFittingABD}
                    onChange={(e) => setAdaFittingABD(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-amber-950">Pasien Melakukan Trial / Fitting ABD?</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {adaFittingABD && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Tipe / Model ABD yang Di-fitting (Trial)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Captivate 100 R / Rexton Emerald / Sonic"
                        value={tipeABDFitting}
                        onChange={(e) => setTipeABDFitting(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        Potensi Pembelian ABD (Status Leads)
                      </label>
                      <select
                        value={potensiPembelian}
                        onChange={(e) => setPotensiPembelian(e.target.value as any)}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="Sangat Potensial">🔥 Sangat Potensial (Prioritas Tinggi CS Follow-Up)</option>
                        <option value="Potensial">⭐ Potensial (Follow-Up Standar)</option>
                        <option value="Ragu-ragu">🤔 Ragu-ragu (Pertimbangan Anggaran / Keluarga)</option>
                        <option value="Kurang Potensial">🌱 Kurang Potensial (Peluang Kecil Saat Ini)</option>
                      </select>
                    </div>
                  </>
                )}

                <div className={adaFittingABD ? "col-span-1 md:col-span-2 lg:col-span-1" : "col-span-1 md:col-span-2 lg:col-span-3"}>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Catatan Khusus HAC (Tersimpan di Rekam Medis Pasien)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Pasien mencoba Captivate 100 R, respon sangat baik & nyaman. Belum beli karena tunggu keputusan anak. Follow up CS 2 minggu lagi."
                    value={catatanHAC}
                    onChange={(e) => setCatatanHAC(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

          {/* Payment Method Selector */}
          <PaymentSelector 
            value={payment} 
            branchCode={activeBranchCode}
            totalAmount={Math.max(0, (subtotalBiaya || 0) - diskon)}
            onChange={setPayment} 
          />

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              id="btn-batal-jasa-periksa"
              onClick={() => setShowCloseConfirmModal(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-xs shadow-md"
            >
              Simpan & Terbitkan Kwitansi KWT
            </button>
          </div>
        </form>
      )}

      {/* Filter & Export Toolbar */}
      <ReportFilterToolbar
        title="Laporan & Filter Tanggal Transaksi Jasa Periksa"
        totalRecords={transactions.length}
        filteredRecordsCount={filteredTransactions.length}
        totalAmount={totalFilteredAmount}
        amountLabel="Total Pendapatan Jasa"
        onFilterChange={(start, end, label) => {
          setFilterStartDate(start);
          setFilterEndDate(end);
          setCurrentPeriodLabel(label);
        }}
        onExportCSV={handleExportCSV}
      />

      {/* Search & Quick Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari kwitansi, nama, tipe ABD, catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A] outline-none"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => setFilterPotensialOnly(!filterPotensialOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              filterPotensialOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>🔥 Leads Potensial ABD {filterPotensialOnly ? '(Aktif)' : ''}</span>
          </button>

          <div className="text-xs font-semibold text-slate-500">
            Total: {filteredTransactions.length} Transaksi
          </div>
        </div>
      </div>

      {/* Mobile Card List (screens < md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Belum ada data transaksi jasa periksa.
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-[#23277A] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {t.nomorKwitansi}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">
                    {formatPatientWithGelar(t.namaCustomer, t.gelar || patients.find(p => p.id === t.idPelanggan)?.gelar)}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">ID: {t.idPelanggan} • [{t.branchCode || 'YM'}] Staff: @{t.staffUser || 'admin'}</p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleSendWhatsApp(t)}
                    className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl"
                    title="Kirim Kwitansi via WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(t)}
                    className="p-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl"
                    title="Edit Transaksi (Butuh PIN)"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {onPrintKwitansi && (
                    <button
                      onClick={() => onPrintKwitansi(t)}
                      className="p-2 bg-indigo-50 text-[#23277A] hover:bg-indigo-100 rounded-xl"
                      title="Cetak Kwitansi"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="font-bold text-slate-800">
                  {Array.isArray(t.jenisPemeriksaan) ? t.jenisPemeriksaan.join(', ') : (t.jenisPemeriksaan || 'Periksa')}
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {t.resultKananDb && (
                    <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded font-bold">
                      R: {t.resultKananDb}
                    </span>
                  )}
                  {t.resultKiriDb && (
                    <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-bold">
                      L: {t.resultKiriDb}
                    </span>
                  )}
                  {t.resultTympanometri && (
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-bold">
                      Tympa: {t.resultTympanometri}
                    </span>
                  )}
                  {t.resultOAE && (
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      t.resultOAE === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      OAE: {t.resultOAE}
                    </span>
                  )}
                  {t.resultBERA && (
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      t.resultBERA === 'RESPONS' ? 'bg-indigo-100 text-[#23277A]' : 'bg-amber-100 text-amber-800'
                    }`}>
                      BERA: {t.resultBERA}
                    </span>
                  )}
                </div>

                {/* Mobile Audiogram Section */}
                {t.audiogram ? (
                  <div className="flex items-center justify-between bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-xs">
                    <div>
                      <div className="font-bold text-blue-950 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                        <span>Audiogram: R {t.audiogram.kanan.pta ?? t.resultKananDb ?? '-'}dB | L {t.audiogram.kiri.pta ?? t.resultKiriDb ?? '-'}dB</span>
                      </div>
                      <div className="text-[10px] text-blue-800 mt-0.5 font-medium">
                        R: {t.audiogram.kanan.derajat} • L: {t.audiogram.kiri.derajat}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenPrintAudiogram(t)}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 shadow-2xs flex items-center gap-1"
                        title="Cetak Lembar Hasil Audiogram"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Cetak</span>
                      </button>
                      <button
                        onClick={() => handleOpenAudiogramInput(t)}
                        className="px-2 py-1 bg-white text-blue-700 border border-blue-300 rounded-lg text-[10px] font-bold hover:bg-blue-50"
                        title="Edit Data Audiogram"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (Array.isArray(t.jenisPemeriksaan) ? t.jenisPemeriksaan : [t.jenisPemeriksaan]).some(jp => jp?.includes('Audiometri')) ? (
                  <button
                    onClick={() => handleOpenAudiogramInput(t)}
                    className="w-full py-1.5 px-2 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-dashed border-blue-300 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ Input / Desain Hasil Audiogram (AC & BC)</span>
                  </button>
                ) : null}

                {(t.adaFittingABD || t.catatanHAC) && (
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] space-y-1 my-1">
                    <div className="flex items-center justify-between font-bold text-amber-950 border-b border-amber-200 pb-1">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-amber-600" />
                        <span>Catatan HAC / Trial Fitting</span>
                      </span>
                      {t.potensiPembelian && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          t.potensiPembelian === 'Sangat Potensial'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {t.potensiPembelian}
                        </span>
                      )}
                    </div>
                    {t.tipeABDFitting && (
                      <div className="text-slate-800 font-semibold">
                        <span className="text-amber-900 font-bold">ABD Trial: </span>
                        {t.tipeABDFitting}
                      </div>
                    )}
                    {t.catatanHAC && (
                      <div className="text-slate-700 font-medium italic bg-white/80 p-1.5 rounded border border-amber-200/60">
                        "{t.catatanHAC}"
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>Pemeriksa:</span>
                  <span className="font-semibold text-slate-700">{t.audiometris}</span>
                </div>
                {t.diskon ? (
                  <div className="flex justify-between text-[11px] text-rose-600 font-bold">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(t.diskon)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-[#23277A]">
                  <span>Total Bayar:</span>
                  <span className="text-sm font-black">
                    {formatRupiah(t.diskon ? Math.max(0, (t.subtotalBiaya || t.biayaJasaPeriksa) - t.diskon) : t.biayaJasaPeriksa)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Tanggal: {formatIndoDate(t.tanggal)}</span>
                <span className={`px-2 py-0.5 font-bold rounded-full ${
                  t.payment.method === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                  t.payment.method === 'Transfer' ? 'bg-indigo-100 text-[#23277A]' :
                  t.payment.method === 'Shopee' ? 'bg-orange-100 text-[#EE4D2D] border border-orange-300 font-extrabold' :
                  t.payment.method === 'Piutang BPJS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {t.payment.method === 'Shopee' ? `Shopee (YM)${t.payment.shopeeOrderNo ? ` - ${t.payment.shopeeOrderNo}` : ''}` : `${t.payment.method} ${t.payment.namaRSBPJS ? `(${t.payment.namaRSBPJS})` : t.payment.namaFaskes ? `(${t.payment.namaFaskes})` : ''}`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (screens >= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#181B57] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">Tgl Transaksi</th>
                <th className="p-3.5">No. Kwitansi</th>
                <th className="p-3.5">ID & Customer</th>
                <th className="p-3.5">Jenis Pemeriksaan</th>
                <th className="p-3.5 text-center">Result</th>
                <th className="p-3.5">Pemeriksa</th>
                <th className="p-3.5 text-right">Subtotal / Diskon</th>
                <th className="p-3.5 text-right">Total Bayar</th>
                <th className="p-3.5">Pembayaran</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Belum ada data transaksi jasa periksa.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {formatIndoDate(t.tanggal)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-bold text-[#23277A] block">{t.nomorKwitansi}</span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                        [{t.branchCode || 'YM'}]
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {formatPatientWithGelar(t.namaCustomer, t.gelar || patients.find(p => p.id === t.idPelanggan)?.gelar)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.idPelanggan}</div>

                      {(t.adaFittingABD || t.potensiPembelian) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                            t.potensiPembelian === 'Sangat Potensial'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            🔥 {t.potensiPembelian || 'Trial ABD'}
                          </span>
                          {t.tipeABDFitting && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                              Trial: {t.tipeABDFitting}
                            </span>
                          )}
                        </div>
                      )}

                      {t.catatanHAC && (
                        <div className="mt-1 text-[11px] text-amber-950 bg-amber-50 p-1.5 rounded-lg border border-amber-200/90 line-clamp-2 max-w-xs font-medium" title={t.catatanHAC}>
                          <span className="font-bold text-amber-900">Catatan HAC: </span>"{t.catatanHAC}"
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(t.jenisPemeriksaan) ? t.jenisPemeriksaan : [t.jenisPemeriksaan || 'Periksa']).map((jp, idx) => (
                          <span
                            key={idx}
                            className="bg-indigo-50 text-[#23277A] border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-bold"
                          >
                            {jp}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-center">
                        {t.audiogram ? (
                          <button
                            onClick={() => handleOpenPrintAudiogram(t)}
                            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-2 py-1 rounded-md text-[10px] font-bold transition-all shadow-2xs group cursor-pointer"
                            title="Klik untuk Lihat & Cetak Lembar Hasil Audiogram Pasien"
                          >
                            <Activity className="w-3 h-3 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span>Audiogram: R {t.audiogram.kanan.pta ?? t.resultKananDb ?? '-'}dB | L {t.audiogram.kiri.pta ?? t.resultKiriDb ?? '-'}dB</span>
                          </button>
                        ) : (t.resultKananDb || t.resultKiriDb) ? (
                          <div className="flex flex-col items-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                              {t.resultKananDb && <span className="text-red-600">R: {t.resultKananDb}</span>}
                              {t.resultKananDb && t.resultKiriDb && <span className="text-slate-300">|</span>}
                              {t.resultKiriDb && <span className="text-blue-600">L: {t.resultKiriDb}</span>}
                            </div>
                            {(Array.isArray(t.jenisPemeriksaan) ? t.jenisPemeriksaan : [t.jenisPemeriksaan]).some(jp => jp?.includes('Audiometri')) && (
                              <button
                                onClick={() => handleOpenAudiogramInput(t)}
                                className="text-[9px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 mt-0.5"
                                title="Input data lengkap AC & BC per frekuensi"
                              >
                                <Plus className="w-2.5 h-2.5" /> Input AC & BC
                              </button>
                            )}
                          </div>
                        ) : null}

                        {t.resultTympanometri && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            Tympa: {t.resultTympanometri}
                          </span>
                        )}
                        {t.resultOAE && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.resultOAE === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            OAE: {t.resultOAE}
                          </span>
                        )}
                        {t.resultBERA && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.resultBERA === 'RESPONS' ? 'bg-indigo-100 text-[#23277A]' : 'bg-amber-100 text-amber-800'
                          }`}>
                            BERA: {t.resultBERA}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-xs">
                      <div className="font-bold text-slate-800">{t.audiometris}</div>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="text-slate-600 font-medium">
                        {formatRupiah(t.subtotalBiaya || (t.diskon ? t.biayaJasaPeriksa + t.diskon : t.biayaJasaPeriksa))}
                      </div>
                      {t.diskon ? <div className="text-[10px] text-rose-600 font-bold">Disc: -{formatRupiah(t.diskon)}</div> : null}
                    </td>
                    <td className="p-3.5 text-right font-black text-[#23277A] whitespace-nowrap">
                      {formatRupiah(t.diskon ? Math.max(0, (t.subtotalBiaya || t.biayaJasaPeriksa) - t.diskon) : t.biayaJasaPeriksa)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.payment.method === 'Cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.payment.method === 'Transfer'
                            ? 'bg-indigo-100 text-[#23277A]'
                            : t.payment.method === 'Shopee'
                            ? 'bg-orange-100 text-[#EE4D2D] border border-orange-300 font-extrabold'
                            : t.payment.method === 'Piutang BPJS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {t.payment.method === 'Shopee' ? `Shopee (YM)${t.payment.shopeeOrderNo ? ` - ${t.payment.shopeeOrderNo}` : ''}` : `${t.payment.method} ${t.payment.namaRSBPJS ? `(${t.payment.namaRSBPJS})` : t.payment.namaFaskes ? `(${t.payment.namaFaskes})` : ''}`}
                      </span>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title={t.audiogram ? "Cetak / Lihat Lembar Audiogram Pasien" : "Input Hasil Audiogram Lengkap (AC & BC)"}
                          onClick={() => t.audiogram ? handleOpenPrintAudiogram(t) : handleOpenAudiogramInput(t)}
                          className={`p-1.5 rounded-lg transition-all ${
                            t.audiogram
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit Transaksi / Kwitansi (PIN)"
                          onClick={() => handleStartEdit(t)}
                          className="p-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          title="Kirim Kwitansi via WhatsApp"
                          onClick={() => handleSendWhatsApp(t)}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {onPrintKwitansi && (
                          <button
                            title="Cetak Kwitansi"
                            onClick={() => onPrintKwitansi(t)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="Hapus Transaksi"
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setSelectedTxToEdit(null);
        }}
        onSuccess={handlePinSuccess}
        title="Otorisasi Edit Transaksi Jasa"
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTxToEdit(null);
        }}
        transaction={selectedTxToEdit}
        type="JSA"
        patients={patients}
        onSaveJasa={(updated) => {
          if (onSaveTransaction) {
            onSaveTransaction(updated);
          }
          setEditModalOpen(false);
          setSelectedTxToEdit(null);
        }}
      />

      {/* Audiogram Input Modal */}
      <AudiogramInputModal
        isOpen={audiogramModalOpen}
        onClose={() => {
          setAudiogramModalOpen(false);
          setSelectedTxForAudiogram(null);
        }}
        transaction={selectedTxForAudiogram}
        patient={patients.find(p => p.id === selectedTxForAudiogram?.idPelanggan)}
        onSave={handleSaveAudiogram}
      />

      {/* Print Audiogram Modal */}
      <PrintAudiogramModal
        isOpen={printAudiogramModalOpen}
        onClose={() => {
          setPrintAudiogramModalOpen(false);
          setSelectedTxForAudiogram(null);
        }}
        transaction={selectedTxForAudiogram}
        patient={patients.find(p => p.id === selectedTxForAudiogram?.idPelanggan)}
      />
    </div>
  );
};

