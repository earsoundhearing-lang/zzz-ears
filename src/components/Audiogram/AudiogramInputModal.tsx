import React, { useState, useEffect, useMemo } from 'react';
import { 
  JasaPeriksaTransaction, 
  Patient, 
  AudiogramData, 
  AudiogramEarThresholds 
} from '../../types';
import { 
  AUDIOGRAM_FREQUENCIES, 
  CORE_AC_FREQUENCIES, 
  CORE_BC_FREQUENCIES,
  INTENSITY_LEVELS,
  calculatePTA4,
  calculatePTA3,
  getDerajatGangguan,
  getJenisGangguan,
  createEmptyEarThresholds,
  createEmptyAudiogramData,
  generateAutoConclusionAndRecommendation,
  AUDIOGRAM_PRESETS
} from '../../utils/audiogramHelper';
import { formatPatientWithGelar, formatIndoDate } from '../../utils/formatters';
import { AudiogramChart } from './AudiogramChart';
import { 
  Activity, 
  Save, 
  X, 
  Printer, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  Copy, 
  Volume2, 
  Stethoscope, 
  CheckCircle2,
  Sliders,
  FileText
} from 'lucide-react';

interface AudiogramInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: JasaPeriksaTransaction | null;
  patient?: Patient | null;
  onSave: (updatedTx: JasaPeriksaTransaction, shouldOpenPrint?: boolean) => void;
}

export const AudiogramInputModal: React.FC<AudiogramInputModalProps> = ({
  isOpen,
  onClose,
  transaction,
  patient,
  onSave,
}) => {
  if (!isOpen || !transaction) return null;

  // Initial State from transaction or blank
  const [audiogramState, setAudiogramState] = useState<AudiogramData>(() => {
    if (transaction.audiogram) {
      return JSON.parse(JSON.stringify(transaction.audiogram));
    }
    const initial = createEmptyAudiogramData(transaction.audiometris || 'Diana');
    // Pre-populate single dB if previously filled in simple form
    if (transaction.resultKananDb) {
      const num = parseInt(transaction.resultKananDb.replace(/\D/g, ''), 10);
      if (!isNaN(num)) {
        CORE_AC_FREQUENCIES.forEach(f => {
          initial.kanan.ac[f] = num;
        });
      }
    }
    if (transaction.resultKiriDb) {
      const num = parseInt(transaction.resultKiriDb.replace(/\D/g, ''), 10);
      if (!isNaN(num)) {
        CORE_AC_FREQUENCIES.forEach(f => {
          initial.kiri.ac[f] = num;
        });
      }
    }
    return initial;
  });

  const [activeTab, setActiveTab] = useState<'grid' | 'speech_tympa' | 'conclusion'>('grid');
  const [selectedEarInteractive, setSelectedEarInteractive] = useState<'kanan' | 'kiri'>('kanan');
  const [selectedTypeInteractive, setSelectedTypeInteractive] = useState<'ac' | 'bc'>('ac');
  const [showSpeechBanana, setShowSpeechBanana] = useState(true);
  const [showDegreeBands, setShowDegreeBands] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [previewEarMode, setPreviewEarMode] = useState<'split' | 'kanan' | 'kiri'>('split');

  // Re-sync if transaction changes
  useEffect(() => {
    if (transaction?.audiogram) {
      setAudiogramState(JSON.parse(JSON.stringify(transaction.audiogram)));
    }
  }, [transaction?.id]);

  // Live Auto-Diagnostics
  const ptaKanan = useMemo(() => calculatePTA4(audiogramState.kanan.ac), [audiogramState.kanan.ac]);
  const pta3Kanan = useMemo(() => calculatePTA3(audiogramState.kanan.ac), [audiogramState.kanan.ac]);
  const derajatKanan = useMemo(() => getDerajatGangguan(ptaKanan), [ptaKanan]);
  const jenisKanan = useMemo(() => getJenisGangguan(audiogramState.kanan.ac, audiogramState.kanan.bc, ptaKanan), [audiogramState.kanan.ac, audiogramState.kanan.bc, ptaKanan]);

  const ptaKiri = useMemo(() => calculatePTA4(audiogramState.kiri.ac), [audiogramState.kiri.ac]);
  const pta3Kiri = useMemo(() => calculatePTA3(audiogramState.kiri.ac), [audiogramState.kiri.ac]);
  const derajatKiri = useMemo(() => getDerajatGangguan(ptaKiri), [ptaKiri]);
  const jenisKiri = useMemo(() => getJenisGangguan(audiogramState.kiri.ac, audiogramState.kiri.bc, ptaKiri), [audiogramState.kiri.ac, audiogramState.kiri.bc, ptaKiri]);

  // Handle cell value change in table
  const handleThresholdChange = (
    ear: 'kanan' | 'kiri', 
    type: 'ac' | 'bc', 
    freq: number, 
    valueStr: string
  ) => {
    const parsed = valueStr === '' ? null : parseInt(valueStr, 10);
    const validVal = isNaN(parsed as number) ? null : parsed;

    setAudiogramState(prev => {
      const next = { ...prev };
      next[ear] = {
        ...next[ear],
        [type]: {
          ...next[ear][type],
          [freq]: validVal,
        }
      };
      return next;
    });
  };

  // Load Preset
  const handleApplyPreset = (presetId: string) => {
    const found = AUDIOGRAM_PRESETS.find(p => p.id === presetId);
    if (!found) return;

    setAudiogramState(prev => ({
      ...prev,
      kanan: {
        ...prev.kanan,
        ac: { ...found.kanan.ac },
        bc: { ...found.kanan.bc },
      },
      kiri: {
        ...prev.kiri,
        ac: { ...found.kiri.ac },
        bc: { ...found.kiri.bc },
      }
    }));
    setSelectedPreset(presetId);
  };

  // Quick action: Copy Right AC to BC
  const handleCopyAcToBc = (ear: 'kanan' | 'kiri') => {
    setAudiogramState(prev => {
      const next = { ...prev };
      const acData = next[ear].ac;
      const newBc: Record<number, number | null> = { ...next[ear].bc };
      CORE_BC_FREQUENCIES.forEach(f => {
        if (acData[f] !== undefined && acData[f] !== null) {
          newBc[f] = acData[f];
        }
      });
      next[ear] = { ...next[ear], bc: newBc };
      return next;
    });
  };

  // Quick action: Copy Right to Left
  const handleCopyRightToLeft = () => {
    setAudiogramState(prev => ({
      ...prev,
      kiri: {
        ...prev.kiri,
        ac: { ...prev.kanan.ac },
        bc: { ...prev.kanan.bc },
      }
    }));
  };

  // Quick action: Clear ear
  const handleClearEar = (ear: 'kanan' | 'kiri') => {
    setAudiogramState(prev => ({
      ...prev,
      [ear]: createEmptyEarThresholds()
    }));
  };

  // Auto-generate Clinical Conclusion & Recommendations
  const handleAutoGenerateSummary = () => {
    const auto = generateAutoConclusionAndRecommendation(
      { ...audiogramState.kanan, pta: ptaKanan || undefined },
      { ...audiogramState.kiri, pta: ptaKiri || undefined }
    );
    setAudiogramState(prev => ({
      ...prev,
      kesimpulan: auto.conclusion,
      rekomendasi: auto.recommendation,
    }));
    setActiveTab('conclusion');
  };

  // Save changes
  const handleSave = (shouldOpenPrint: boolean = false) => {
    // Compile final object
    const finalKanan: AudiogramEarThresholds = {
      ...audiogramState.kanan,
      pta: ptaKanan ?? undefined,
      pta3: pta3Kanan ?? undefined,
      derajat: derajatKanan.derajat,
      jenis: jenisKanan.jenis,
    };

    const finalKiri: AudiogramEarThresholds = {
      ...audiogramState.kiri,
      pta: ptaKiri ?? undefined,
      pta3: pta3Kiri ?? undefined,
      derajat: derajatKiri.derajat,
      jenis: jenisKiri.jenis,
    };

    // Auto-fill conclusion if blank
    let finalConclusion = audiogramState.kesimpulan;
    let finalRec = audiogramState.rekomendasi;
    if (!finalConclusion || !finalRec) {
      const auto = generateAutoConclusionAndRecommendation(finalKanan, finalKiri);
      if (!finalConclusion) finalConclusion = auto.conclusion;
      if (!finalRec) finalRec = auto.recommendation;
    }

    const updatedAudiogram: AudiogramData = {
      ...audiogramState,
      kanan: finalKanan,
      kiri: finalKiri,
      kesimpulan: finalConclusion,
      rekomendasi: finalRec,
      updatedAt: new Date().toISOString(),
    };

    const updatedTx: JasaPeriksaTransaction = {
      ...transaction,
      audiogram: updatedAudiogram,
      // Update quick display strings as well
      resultKananDb: ptaKanan !== null ? `${ptaKanan} dB` : transaction.resultKananDb,
      resultKiriDb: ptaKiri !== null ? `${ptaKiri} dB` : transaction.resultKiriDb,
    };

    onSave(updatedTx, shouldOpenPrint);
  };

  const displayName = formatPatientWithGelar(
    transaction.namaCustomer, 
    transaction.gelar || patient?.gelar
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Input & Evaluasi Hasil Audiogram (AC & BC)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-mono font-bold">
                  {transaction.nomorKwitansi}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5 flex items-center gap-2">
                <span>Pasien: <strong className="text-white">{displayName}</strong></span>
                <span>•</span>
                <span>Tgl: {formatIndoDate(transaction.tanggal)}</span>
                <span>•</span>
                <span>Audiometris: {audiogramState.audiometris || transaction.audiometris}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 flex flex-col gap-5">
          
          {/* TOP BAR: Presets & Live Summary Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Presets Selector */}
            <div className="lg:col-span-4 bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>⚡ Preset Cepat Audiogram</span>
                <span className="text-[10px] text-blue-600 font-normal">Autofill 1-Klik</span>
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Pilih Template / Pola Audiogram --</option>
                {AUDIOGRAM_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Diagnosis Summary Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Right Ear Summary */}
              <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    AD
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-red-900 uppercase">Telinga Kanan (Red)</div>
                    <div className="text-xs font-semibold text-slate-800">
                      Ambang Dengar: <strong className="text-red-700 font-mono text-sm">{ptaKanan !== null ? `${ptaKanan} dB` : '-'}</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${derajatKanan.badgeBg} ${derajatKanan.badgeColor} ${derajatKanan.badgeBorder}`}>
                    {derajatKanan.derajat}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${jenisKanan.badgeBg} ${jenisKanan.badgeColor} ${jenisKanan.badgeBorder}`}>
                    {jenisKanan.jenis}
                  </span>
                </div>
              </div>

              {/* Left Ear Summary */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    AS
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-blue-900 uppercase">Telinga Kiri (Blue)</div>
                    <div className="text-xs font-semibold text-slate-800">
                      Ambang Dengar: <strong className="text-blue-700 font-mono text-sm">{ptaKiri !== null ? `${ptaKiri} dB` : '-'}</strong>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${derajatKiri.badgeBg} ${derajatKiri.badgeColor} ${derajatKiri.badgeBorder}`}>
                    {derajatKiri.derajat}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${jenisKiri.badgeBg} ${jenisKiri.badgeColor} ${jenisKiri.badgeBorder}`}>
                    {jenisKiri.jenis}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN SPLIT VIEW: Table Data on Left, Visual SVG Chart on Right */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: Input Tabs & Grid (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              
              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('grid')}
                  className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'grid'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Ambang Dengar Frekuensi (AC & BC)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('speech_tympa')}
                  className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'speech_tympa'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Wicara & Tympanometri
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('conclusion')}
                  className={`pb-2.5 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'conclusion'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Kesimpulan & Saran ABD
                </button>
              </div>

              {/* TAB 1: FREQUENCY GRID */}
              {activeTab === 'grid' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  
                  {/* Grid Quick Tools */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span>Input intensitas dalam satuan <strong>dB HL</strong> (rentang -10 s/d 120 dB):</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyRightToLeft}
                        title="Salin seluruh nilai Kanan ke Kiri"
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Salin Kanan ke Kiri
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoGenerateSummary}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Auto-Diagnosa & Saran
                      </button>
                    </div>
                  </div>

                  {/* FREQUENCY MATRIX TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <th className="p-2 text-left font-bold w-28 sticky left-0 bg-slate-100 z-10">
                            Frekuensi (Hz)
                          </th>
                          {AUDIOGRAM_FREQUENCIES.map((freq) => {
                            const isMajor = [250, 500, 1000, 2000, 4000, 8000].includes(freq);
                            return (
                              <th
                                key={`head-${freq}`}
                                className={`p-2 text-center font-bold ${
                                  isMajor ? 'bg-blue-50/70 text-blue-900 border-x border-slate-200' : 'text-slate-600'
                                }`}
                              >
                                {freq >= 1000 ? `${freq / 1000}k` : freq}
                              </th>
                            );
                          })}
                          <th className="p-2 text-center font-bold bg-slate-200/80 w-16">
                            PTA
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* 1. RIGHT EAR - AC (Air Conduction) */}
                        <tr className="hover:bg-red-50/30 transition-colors">
                          <td className="p-2 font-bold text-red-700 bg-red-50/50 border-r border-slate-200 sticky left-0 z-10 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full border-2 border-red-600 bg-white inline-block"></span>
                              AD AC (O)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyAcToBc('kanan')}
                              title="Salin AC Kanan ke BC Kanan"
                              className="text-[9px] px-1 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-normal"
                            >
                              ke BC
                            </button>
                          </td>
                          {AUDIOGRAM_FREQUENCIES.map((freq) => {
                            const val = audiogramState.kanan.ac[freq];
                            return (
                              <td key={`r-ac-${freq}`} className="p-1 text-center">
                                <select
                                  value={val !== null && val !== undefined ? val : ''}
                                  onChange={(e) => handleThresholdChange('kanan', 'ac', freq, e.target.value)}
                                  className={`w-full text-center py-1 font-mono text-xs font-bold rounded border ${
                                    val !== null && val !== undefined
                                      ? 'bg-red-50 border-red-300 text-red-900'
                                      : 'bg-white border-slate-200 text-slate-400'
                                  } focus:ring-1 focus:ring-red-500 outline-none`}
                                >
                                  <option value="">-</option>
                                  {INTENSITY_LEVELS.map((db) => (
                                    <option key={db} value={db}>
                                      {db}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}
                          <td className="p-1 text-center font-mono font-bold text-red-700 bg-red-50/40">
                            {ptaKanan !== null ? `${ptaKanan}` : '-'}
                          </td>
                        </tr>

                        {/* 2. RIGHT EAR - BC (Bone Conduction) */}
                        <tr className="hover:bg-red-50/30 transition-colors border-b-2 border-slate-200">
                          <td className="p-2 font-bold text-red-600 bg-red-50/30 border-r border-slate-200 sticky left-0 z-10">
                            <span className="flex items-center gap-1.5">
                              <span className="font-mono text-red-600 font-bold">&lt;</span>
                              AD BC (&lt;)
                            </span>
                          </td>
                          {AUDIOGRAM_FREQUENCIES.map((freq) => {
                            const isBcStandard = [250, 500, 1000, 2000, 4000].includes(freq);
                            const val = audiogramState.kanan.bc[freq];
                            return (
                              <td key={`r-bc-${freq}`} className="p-1 text-center">
                                {isBcStandard ? (
                                  <select
                                    value={val !== null && val !== undefined ? val : ''}
                                    onChange={(e) => handleThresholdChange('kanan', 'bc', freq, e.target.value)}
                                    className={`w-full text-center py-1 font-mono text-xs font-bold rounded border ${
                                      val !== null && val !== undefined
                                        ? 'bg-red-50/70 border-red-300 text-red-800'
                                        : 'bg-white border-slate-200 text-slate-400'
                                    } focus:ring-1 focus:ring-red-500 outline-none`}
                                  >
                                    <option value="">-</option>
                                    {INTENSITY_LEVELS.map((db) => (
                                      <option key={db} value={db}>
                                        {db}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-slate-300 text-[10px]">•</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-1 text-center text-slate-400 text-[11px] bg-slate-50">
                            -
                          </td>
                        </tr>

                        {/* 3. LEFT EAR - AC (Air Conduction) */}
                        <tr className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-2 font-bold text-blue-700 bg-blue-50/50 border-r border-slate-200 sticky left-0 z-10 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="font-mono text-blue-600 font-bold">✕</span>
                              AS AC (X)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyAcToBc('kiri')}
                              title="Salin AC Kiri ke BC Kiri"
                              className="text-[9px] px-1 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-normal"
                            >
                              ke BC
                            </button>
                          </td>
                          {AUDIOGRAM_FREQUENCIES.map((freq) => {
                            const val = audiogramState.kiri.ac[freq];
                            return (
                              <td key={`l-ac-${freq}`} className="p-1 text-center">
                                <select
                                  value={val !== null && val !== undefined ? val : ''}
                                  onChange={(e) => handleThresholdChange('kiri', 'ac', freq, e.target.value)}
                                  className={`w-full text-center py-1 font-mono text-xs font-bold rounded border ${
                                    val !== null && val !== undefined
                                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                                      : 'bg-white border-slate-200 text-slate-400'
                                  } focus:ring-1 focus:ring-blue-500 outline-none`}
                                >
                                  <option value="">-</option>
                                  {INTENSITY_LEVELS.map((db) => (
                                    <option key={db} value={db}>
                                      {db}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}
                          <td className="p-1 text-center font-mono font-bold text-blue-700 bg-blue-50/40">
                            {ptaKiri !== null ? `${ptaKiri}` : '-'}
                          </td>
                        </tr>

                        {/* 4. LEFT EAR - BC (Bone Conduction) */}
                        <tr className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-2 font-bold text-blue-600 bg-blue-50/30 border-r border-slate-200 sticky left-0 z-10">
                            <span className="flex items-center gap-1.5">
                              <span className="font-mono text-blue-600 font-bold">&gt;</span>
                              AS BC (&gt;)
                            </span>
                          </td>
                          {AUDIOGRAM_FREQUENCIES.map((freq) => {
                            const isBcStandard = [250, 500, 1000, 2000, 4000].includes(freq);
                            const val = audiogramState.kiri.bc[freq];
                            return (
                              <td key={`l-bc-${freq}`} className="p-1 text-center">
                                {isBcStandard ? (
                                  <select
                                    value={val !== null && val !== undefined ? val : ''}
                                    onChange={(e) => handleThresholdChange('kiri', 'bc', freq, e.target.value)}
                                    className={`w-full text-center py-1 font-mono text-xs font-bold rounded border ${
                                      val !== null && val !== undefined
                                        ? 'bg-blue-50/70 border-blue-300 text-blue-800'
                                        : 'bg-white border-slate-200 text-slate-400'
                                    } focus:ring-1 focus:ring-blue-500 outline-none`}
                                  >
                                    <option value="">-</option>
                                    {INTENSITY_LEVELS.map((db) => (
                                      <option key={db} value={db}>
                                        {db}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-slate-300 text-[10px]">•</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-1 text-center text-slate-400 text-[11px] bg-slate-50">
                            -
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Quick Reset Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>* Catatan: Kolom 500, 1k, 2k, 4k digunakan untuk perhitungan <strong>PTA (Pure Tone Average)</strong> otomatis.</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleClearEar('kanan')}
                        className="text-red-600 hover:text-red-700 underline text-[11px]"
                      >
                        Reset Kanan
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleClearEar('kiri')}
                        className="text-blue-600 hover:text-blue-700 underline text-[11px]"
                      >
                        Reset Kiri
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SPEECH & TYMPANOMETRY */}
              {activeTab === 'speech_tympa' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    Speech Audiometry & Pemeriksaan Penunjang
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Speech Kanan */}
                    <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-red-900 uppercase">Telinga Kanan (AD)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">SRT (dB HL):</label>
                          <input
                            type="number"
                            placeholder="e.g. 40"
                            value={audiogramState.kanan.srt ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              setAudiogramState(p => ({ ...p, kanan: { ...p.kanan, srt: val } }));
                            }}
                            className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">SDS / WRS (%):</label>
                          <input
                            type="number"
                            placeholder="e.g. 88"
                            value={audiogramState.kanan.sds ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              setAudiogramState(p => ({ ...p, kanan: { ...p.kanan, sds: val } }));
                            }}
                            className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Speech Kiri */}
                    <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-blue-900 uppercase">Telinga Kiri (AS)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">SRT (dB HL):</label>
                          <input
                            type="number"
                            placeholder="e.g. 45"
                            value={audiogramState.kiri.srt ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              setAudiogramState(p => ({ ...p, kiri: { ...p.kiri, srt: val } }));
                            }}
                            className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600">SDS / WRS (%):</label>
                          <input
                            type="number"
                            placeholder="e.g. 84"
                            value={audiogramState.kiri.sds ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              setAudiogramState(p => ({ ...p, kiri: { ...p.kiri, sds: val } }));
                            }}
                            className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata: Alat & Kondisi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Alat Audiometer:</label>
                      <input
                        type="text"
                        value={audiogramState.alatAudiometer || ''}
                        onChange={(e) => setAudiogramState(p => ({ ...p, alatAudiometer: e.target.value }))}
                        placeholder="Interacoustics AD226 / Resonance Pure Tone"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Kondisi Pasien:</label>
                      <input
                        type="text"
                        value={audiogramState.kondisiPasien || ''}
                        onChange={(e) => setAudiogramState(p => ({ ...p, kondisiPasien: e.target.value }))}
                        placeholder="Kooperatif / Tenang / Anak-anak"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONCLUSION & RECOMMENDATIONS */}
              {activeTab === 'conclusion' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Kesimpulan Diagnosa & Rekomendasi Solusi
                    </h3>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSummary}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Regenerate Rekomendasi
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Kesimpulan Hasil Pemeriksaan (Akan dicetak di Lembar Hasil):
                    </label>
                    <textarea
                      rows={3}
                      value={audiogramState.kesimpulan || ''}
                      onChange={(e) => setAudiogramState(p => ({ ...p, kesimpulan: e.target.value }))}
                      placeholder="Contoh: Telinga Kanan (AD): Ambang dengar 45 dB (Gangguan Sedang, Tuli Sensorineural). Telinga Kiri (AS): Ambang dengar 50 dB (Gangguan Sedang, Tuli Sensorineural)..."
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Saran / Rekomendasi Penanganan & Alat Bantu Dengar:
                    </label>
                    <textarea
                      rows={3}
                      value={audiogramState.rekomendasi || ''}
                      onChange={(e) => setAudiogramState(p => ({ ...p, rekomendasi: e.target.value }))}
                      placeholder="Contoh: Disarankan menggunakan Alat Bantu Dengar (ABD) tipe RIC atau BTE Binaural (Kanan & Kiri) untuk optimalisasi lokalisasi suara..."
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Catatan Tambahan Pemeriksa (Opsional):
                    </label>
                    <input
                      type="text"
                      value={audiogramState.catatanPemeriksa || ''}
                      onChange={(e) => setAudiogramState(p => ({ ...p, catatanPemeriksa: e.target.value }))}
                      placeholder="Catatan internal klinis atau anamnesa singkat..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Real-Time Audiogram Chart Preview (5 cols) */}
            <div className="xl:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center gap-3">
              <div className="w-full flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-red-600" />
                  Pratinjau Grafik Audiogram
                </span>
                
                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewEarMode('split')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      previewEarMode === 'split'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2 Grafik (Kanan & Kiri)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewEarMode('kanan')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      previewEarMode === 'kanan'
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'text-red-700 hover:text-red-800'
                    }`}
                  >
                    🔴 Kanan (AD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewEarMode('kiri')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      previewEarMode === 'kiri'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-blue-700 hover:text-blue-800'
                    }`}
                  >
                    🔵 Kiri (AS)
                  </button>
                </div>
              </div>

              {/* Chart Display Area */}
              <div className="w-full overflow-x-auto flex flex-col items-center gap-3 py-1">
                {previewEarMode === 'split' ? (
                  <div className="w-full grid grid-cols-1 gap-3">
                    {/* Right Ear Chart (AD) */}
                    <div className="p-2.5 bg-red-50/20 rounded-xl border border-red-200/70 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between border-b border-red-100 pb-1 mb-1 px-1">
                        <span className="font-bold text-[11px] text-red-900 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                          TELINGA KANAN (AD)
                        </span>
                        <span className="text-[10px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded">
                          PTA: {ptaKanan !== null ? `${ptaKanan} dB` : '-'} • {derajatKanan.derajat}
                        </span>
                      </div>
                      <AudiogramChart
                        kanan={audiogramState.kanan}
                        mode="kanan"
                        showSpeechBanana={showSpeechBanana}
                        showDegreeBands={showDegreeBands}
                        showLegend={true}
                        width={430}
                        height={240}
                      />
                    </div>

                    {/* Left Ear Chart (AS) */}
                    <div className="p-2.5 bg-blue-50/20 rounded-xl border border-blue-200/70 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between border-b border-blue-100 pb-1 mb-1 px-1">
                        <span className="font-bold text-[11px] text-blue-900 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                          TELINGA KIRI (AS)
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                          PTA: {ptaKiri !== null ? `${ptaKiri} dB` : '-'} • {derajatKiri.derajat}
                        </span>
                      </div>
                      <AudiogramChart
                        kiri={audiogramState.kiri}
                        mode="kiri"
                        showSpeechBanana={showSpeechBanana}
                        showDegreeBands={showDegreeBands}
                        showLegend={true}
                        width={430}
                        height={240}
                      />
                    </div>
                  </div>
                ) : previewEarMode === 'kanan' ? (
                  <div className="w-full flex flex-col items-center p-2 bg-red-50/20 rounded-xl border border-red-200">
                    <div className="w-full flex items-center justify-between border-b border-red-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-red-900">
                        🔴 TELINGA KANAN (RIGHT EAR / AD)
                      </span>
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        PTA: {ptaKanan !== null ? `${ptaKanan} dB` : '-'} ({derajatKanan.derajat} - {jenisKanan.jenis})
                      </span>
                    </div>
                    <AudiogramChart
                      kanan={audiogramState.kanan}
                      mode="kanan"
                      showSpeechBanana={showSpeechBanana}
                      showDegreeBands={showDegreeBands}
                      showLegend={true}
                      width={450}
                      height={360}
                    />
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center p-2 bg-blue-50/20 rounded-xl border border-blue-200">
                    <div className="w-full flex items-center justify-between border-b border-blue-200 pb-1.5 mb-2">
                      <span className="font-bold text-xs text-blue-900">
                        🔵 TELINGA KIRI (LEFT EAR / AS)
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        PTA: {ptaKiri !== null ? `${ptaKiri} dB` : '-'} ({derajatKiri.derajat} - {jenisKiri.jenis})
                      </span>
                    </div>
                    <AudiogramChart
                      kiri={audiogramState.kiri}
                      mode="kiri"
                      showSpeechBanana={showSpeechBanana}
                      showDegreeBands={showDegreeBands}
                      showLegend={true}
                      width={450}
                      height={360}
                    />
                  </div>
                )}
              </div>

              {/* Quick Interpretation Matrix Table */}
              <div className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] flex flex-col gap-1">
                <div className="font-bold text-slate-700 flex justify-between">
                  <span>Diagnosa Audiometris:</span>
                  <span className="text-slate-500">Metode WHO 2021 (4-Freq PTA)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>🔴 Kanan (AD): <strong>{ptaKanan !== null ? `${ptaKanan} dB` : '-'}</strong></span>
                  <span className="font-semibold text-slate-800">{derajatKanan.derajat} • {jenisKanan.jenis}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>🔵 Kiri (AS): <strong>{ptaKiri !== null ? `${ptaKiri} dB` : '-'}</strong></span>
                  <span className="font-semibold text-slate-800">{derajatKiri.derajat} • {jenisKiri.jenis}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Data tersimpan akan langsung otomatis terhubung ke Rekam Medis & siap dicetak.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Simpan Audiogram
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Simpan & Cetak Hasil Periksa
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
