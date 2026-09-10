import React, { useState } from 'react';
import { 
  JasaPeriksaTransaction, 
  Patient, 
  BranchCode 
} from '../../types';
import { 
  AUDIOGRAM_FREQUENCIES, 
  CORE_AC_FREQUENCIES, 
  calculatePTA4, 
  getDerajatGangguan, 
  getJenisGangguan 
} from '../../utils/audiogramHelper';
import { getBranchByCode } from '../../utils/branches';
import { formatPatientWithGelar, formatIndoDate } from '../../utils/formatters';
import { AudiogramChart } from './AudiogramChart';
import { 
  Printer, 
  Download, 
  Send, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  FileCheck,
  Stethoscope,
  Phone,
  MapPin
} from 'lucide-react';
import { 
  printHtmlElement, 
  createPdfBlobFromElement, 
  triggerFileDownload 
} from '../../utils/printHelper';
import { openWhatsAppWithReceipt } from '../../utils/whatsappHelper';

interface PrintAudiogramModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: JasaPeriksaTransaction | null;
  patient?: Patient | null;
  currentBranch?: BranchCode;
}

export const PrintAudiogramModal: React.FC<PrintAudiogramModalProps> = ({
  isOpen,
  onClose,
  transaction,
  patient,
  currentBranch = 'YM',
}) => {
  if (!isOpen || !transaction) return null;

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const branchKey = (transaction.branchCode || currentBranch) as BranchCode;
  const branchInfo = getBranchByCode(branchKey);

  const audiogram = transaction.audiogram;
  const displayName = formatPatientWithGelar(
    transaction.namaCustomer, 
    transaction.gelar || patient?.gelar
  );

  // Derived Diagnostics
  const ptaKanan = audiogram?.kanan?.pta ?? (audiogram?.kanan ? calculatePTA4(audiogram.kanan.ac) : null);
  const ptaKiri = audiogram?.kiri?.pta ?? (audiogram?.kiri ? calculatePTA4(audiogram.kiri.ac) : null);

  const diagKanan = getDerajatGangguan(ptaKanan);
  const typeKanan = audiogram?.kanan ? getJenisGangguan(audiogram.kanan.ac, audiogram.kanan.bc, ptaKanan) : { jenis: 'Normal', label: 'Normal' };

  const diagKiri = getDerajatGangguan(ptaKiri);
  const typeKiri = audiogram?.kiri ? getJenisGangguan(audiogram.kiri.ac, audiogram.kiri.bc, ptaKiri) : { jenis: 'Normal', label: 'Normal' };

  const elementId = 'printable-audiogram-report';
  const cleanPatientName = transaction.namaCustomer.replace(/[^a-zA-Z0-9]/g, '_');
  const pdfFilename = `Hasil_Audiogram_${cleanPatientName}_${transaction.nomorKwitansi}.pdf`;

  // Direct Print Action
  const handlePrint = async () => {
    setIsExporting(true);
    try {
      await printHtmlElement(elementId);
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download PDF Action
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setExportMessage('Membuat file PDF hasil periksa...');
    try {
      const pdfBlob = await createPdfBlobFromElement(elementId);
      triggerFileDownload(pdfBlob, pdfFilename);
      setExportMessage('PDF berhasil diunduh!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err) {
      console.error('Download PDF failed:', err);
      setExportMessage('Gagal membuat PDF. Silakan gunakan tombol Cetak.');
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // WhatsApp Share Action
  const handleShareWhatsApp = () => {
    const phone = patient?.telepon || '';
    const message = `*HASIL PEMERIKSAAN PENDENGARAN (AUDIOGRAM)*\n` +
      `*Pusat Alat Bantu Dengar Earsound - Cabang ${branchInfo.name}*\n\n` +
      `Yth. Bpk/Ibu *${displayName}*,\n` +
      `Berikut adalah ringkasan hasil tes audiometri Anda:\n` +
      `• No. Kwitansi: ${transaction.nomorKwitansi}\n` +
      `• Tanggal Periksa: ${formatIndoDate(transaction.tanggal)}\n` +
      `• Telinga Kanan (AD): Ambang Dengar ${ptaKanan !== null ? `${ptaKanan} dB` : '-'} (${diagKanan.derajat} - ${typeKanan.label})\n` +
      `• Telinga Kiri (AS): Ambang Dengar ${ptaKiri !== null ? `${ptaKiri} dB` : '-'} (${diagKiri.derajat} - ${typeKiri.label})\n\n` +
      `*Kesimpulan:* ${audiogram?.kesimpulan || '-'}\n` +
      `*Rekomendasi:* ${audiogram?.rekomendasi || '-'}\n\n` +
      `Audiometris: ${audiogram?.audiometris || transaction.audiometris}\n` +
      `Terima kasih telah mempercayakan kesehatan pendengaran Anda kepada Earsound.`;

    openWhatsAppWithReceipt(phone, message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* MODAL CONTROL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Cetak Hasil Pemeriksaan Audiogram
              </h3>
              <p className="text-xs text-slate-400">
                {displayName} • {transaction.nomorKwitansi}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim WA</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isExporting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS NOTIFICATION BANNER */}
        {exportMessage && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs font-semibold text-blue-800 flex items-center justify-between">
            <span>{exportMessage}</span>
            <button onClick={() => setExportMessage(null)} className="text-blue-500 hover:text-blue-800 font-bold">×</button>
          </div>
        )}

        {/* DOCUMENT PREVIEW CONTAINER (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex justify-center">
          
          {/* A4 PRINTABLE DOCUMENT */}
          <div
            id={elementId}
            className="bg-white w-full max-w-[210mm] p-5 sm:p-6 text-slate-900 shadow-lg rounded-sm flex flex-col font-sans relative"
            style={{ minHeight: '297mm', boxSizing: 'border-box' }}
          >
            
            {/* 1. CLINIC LETTERHEAD (KOP SURAT RESMI) */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-xs shrink-0">
                  ES
                </div>
                <div>
                  <h1 className="text-base font-black text-blue-950 tracking-tight leading-none uppercase">
                    Pusat Alat Bantu Dengar Earsound
                  </h1>
                  <p className="text-[11px] font-bold text-blue-700 tracking-wide mt-0.5">
                    CABANG {branchInfo.name.toUpperCase()}
                  </p>
                  <p className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">
                    {branchInfo.address}
                  </p>
                  <p className="text-[9.5px] text-slate-600">
                    Telp / WhatsApp: {branchInfo.phone}
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end shrink-0">
                <div className="border border-blue-900 px-3 py-1 rounded-md text-center bg-blue-50">
                  <span className="block text-[8px] font-bold tracking-wider uppercase text-blue-900 leading-tight">
                    No. Pemeriksaan
                  </span>
                  <span className="block font-mono font-bold text-xs text-blue-950 leading-tight">
                    {transaction.nomorKwitansi}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5">
                  Tgl: {formatIndoDate(transaction.tanggal)}
                </span>
              </div>
            </div>

            {/* 2. DOCUMENT TITLE */}
            <div className="text-center mb-2">
              <h2 className="text-xs sm:text-sm font-black tracking-wide uppercase text-slate-900 border-b border-slate-300 pb-0.5 inline-block">
                Lembar Hasil Pemeriksaan Audiometri (Audiogram)
              </h2>
            </div>

            {/* 3. PATIENT & CLINICAL METADATA */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] mb-2">
              {/* Left Column */}
              <table className="w-full text-[11px] border-collapse">
                <tbody>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">Nama Pasien</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="font-bold text-slate-900 py-0.5 align-top">{displayName}</td>
                  </tr>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">No. RM / ID</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="font-mono font-semibold text-slate-800 py-0.5 align-top">{transaction.idPelanggan}</td>
                  </tr>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">Usia / Gender</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="text-slate-800 py-0.5 align-top">
                      {patient?.usia ? `${patient.usia} Thn` : '-'} / {patient?.jenisKelamin === 'L' ? 'Laki-laki' : patient?.jenisKelamin === 'P' ? 'Perempuan' : '-'}
                    </td>
                  </tr>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">No. Telepon</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="text-slate-800 py-0.5 align-top">{patient?.telepon || '-'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Right Column */}
              <table className="w-full text-[11px] border-collapse">
                <tbody>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">Tgl Periksa</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="font-semibold text-slate-900 py-0.5 align-top">{formatIndoDate(transaction.tanggal)}</td>
                  </tr>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">Dokter Referal</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="text-slate-800 py-0.5 align-top">{transaction.namaDokterReferal || transaction.referal || 'Atas Permintaan Sendiri'}</td>
                  </tr>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">Audiometris</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="font-bold text-blue-900 py-0.5 align-top">{audiogram?.audiometris || transaction.audiometris}</td>
                  </tr>
                  <tr className="leading-relaxed">
                    <td className="text-slate-500 font-medium w-28 py-0.5 align-top whitespace-nowrap">Alat Audiometer</td>
                    <td className="text-slate-500 w-3 py-0.5 align-top text-center">:</td>
                    <td className="text-slate-800 py-0.5 align-top">{audiogram?.alatAudiometer || 'Diagnostic Pure Tone Audiometer'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. AUDIOGRAM CHART VISUAL (SEPARATED RIGHT & LEFT EAR - ENLARGED & PROPORTIONAL) */}
            <div className="grid grid-cols-2 gap-2.5 my-1.5">
              {/* Right Ear Audiogram (AD - Red) */}
              <div className="p-2 bg-red-50 rounded-lg border border-red-200 flex flex-col items-center shadow-2xs">
                <div className="w-full flex items-center justify-between border-b border-red-200 pb-1 mb-1.5 px-1">
                  <span className="font-bold text-[11px] text-red-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                    TELINGA KANAN (AD - RIGHT EAR)
                  </span>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                    PTA: {ptaKanan !== null ? `${ptaKanan} dB` : '-'} ({diagKanan.derajat})
                  </span>
                </div>
                <AudiogramChart
                  kanan={audiogram?.kanan}
                  mode="kanan"
                  showSpeechBanana={true}
                  showDegreeBands={true}
                  showLegend={true}
                  width={348}
                  height={245}
                  isPrintMode={true}
                />
              </div>

              {/* Left Ear Audiogram (AS - Blue) */}
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 flex flex-col items-center shadow-2xs">
                <div className="w-full flex items-center justify-between border-b border-blue-200 pb-1 mb-1.5 px-1">
                  <span className="font-bold text-[11px] text-blue-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                    TELINGA KIRI (AS - LEFT EAR)
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                    PTA: {ptaKiri !== null ? `${ptaKiri} dB` : '-'} ({diagKiri.derajat})
                  </span>
                </div>
                <AudiogramChart
                  kiri={audiogram?.kiri}
                  mode="kiri"
                  showSpeechBanana={true}
                  showDegreeBands={true}
                  showLegend={true}
                  width={348}
                  height={245}
                  isPrintMode={true}
                />
              </div>
            </div>

            {/* 5. THRESHOLD DATA TABLE (dB HL) */}
            <div className="my-1.5">
              <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                <span>Tabel Nilai Ambang Dengar (dB HL)</span>
                <span className="text-[9px] text-slate-500 font-normal">Standard ISO / ANSI</span>
              </div>
              <table className="w-full text-[9.5px] border border-slate-300 border-collapse text-center">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-1 px-1 border-r border-slate-300 text-left pl-2">Frekuensi (Hz)</th>
                    {AUDIOGRAM_FREQUENCIES.map(f => (
                      <th key={`print-head-${f}`} className="py-1 px-0.5 border-r border-slate-300">
                        {f >= 1000 ? `${f / 1000}k` : f}
                      </th>
                    ))}
                    <th className="py-1 px-1 bg-slate-200 font-bold">PTA (4-Freq)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Right Ear AC */}
                  <tr className="border-b border-slate-200">
                    <td className="py-1 px-1 border-r border-slate-300 text-left pl-2 font-bold text-red-700 bg-red-50">
                      🔴 Kanan (AD) - AC (O)
                    </td>
                    {AUDIOGRAM_FREQUENCIES.map(f => (
                      <td key={`print-r-ac-${f}`} className="py-1 px-0.5 border-r border-slate-200 font-mono font-semibold text-red-900">
                        {audiogram?.kanan?.ac[f] !== null && audiogram?.kanan?.ac[f] !== undefined ? audiogram.kanan.ac[f] : '-'}
                      </td>
                    ))}
                    <td className="py-1 px-1 font-mono font-bold text-red-700 bg-red-50">
                      {ptaKanan !== null ? `${ptaKanan} dB` : '-'}
                    </td>
                  </tr>

                  {/* Right Ear BC */}
                  <tr className="border-b border-slate-200">
                    <td className="py-1 px-1 border-r border-slate-300 text-left pl-2 font-bold text-red-600 bg-red-50">
                      🔴 Kanan (AD) - BC (&lt;)
                    </td>
                    {AUDIOGRAM_FREQUENCIES.map(f => (
                      <td key={`print-r-bc-${f}`} className="py-1 px-0.5 border-r border-slate-200 font-mono text-red-800">
                        {audiogram?.kanan?.bc[f] !== null && audiogram?.kanan?.bc[f] !== undefined ? audiogram.kanan.bc[f] : '-'}
                      </td>
                    ))}
                    <td className="py-1 px-1 font-mono text-slate-400 bg-slate-50">-</td>
                  </tr>

                  {/* Left Ear AC */}
                  <tr className="border-b border-slate-200">
                    <td className="py-1 px-1 border-r border-slate-300 text-left pl-2 font-bold text-blue-700 bg-blue-50">
                      🔵 Kiri (AS) - AC (X)
                    </td>
                    {AUDIOGRAM_FREQUENCIES.map(f => (
                      <td key={`print-l-ac-${f}`} className="py-1 px-0.5 border-r border-slate-200 font-mono font-semibold text-blue-900">
                        {audiogram?.kiri?.ac[f] !== null && audiogram?.kiri?.ac[f] !== undefined ? audiogram.kiri.ac[f] : '-'}
                      </td>
                    ))}
                    <td className="py-1 px-1 font-mono font-bold text-blue-700 bg-blue-50">
                      {ptaKiri !== null ? `${ptaKiri} dB` : '-'}
                    </td>
                  </tr>

                  {/* Left Ear BC */}
                  <tr>
                    <td className="py-1 px-1 border-r border-slate-300 text-left pl-2 font-bold text-blue-600 bg-blue-50">
                      🔵 Kiri (AS) - BC (&gt;)
                    </td>
                    {AUDIOGRAM_FREQUENCIES.map(f => (
                      <td key={`print-l-bc-${f}`} className="py-1 px-0.5 border-r border-slate-200 font-mono text-blue-800">
                        {audiogram?.kiri?.bc[f] !== null && audiogram?.kiri?.bc[f] !== undefined ? audiogram.kiri.bc[f] : '-'}
                      </td>
                    ))}
                    <td className="py-1 px-1 font-mono text-slate-400 bg-slate-50">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. CLINICAL EVALUATION & DIAGNOSIS SUMMARY */}
            <div className="grid grid-cols-2 gap-2.5 my-1 text-[10px]">
              {/* Right Ear Diagnosis */}
              <div className="p-2 rounded-lg border border-red-200 bg-red-50 space-y-0.5">
                <div className="font-bold text-red-900 border-b border-red-200 pb-0.5 flex justify-between">
                  <span>HASIL TELINGA KANAN (AD):</span>
                  <span className="font-mono text-red-700">{ptaKanan !== null ? `${ptaKanan} dB` : '-'}</span>
                </div>
                <div className="text-[9.5px] text-slate-700 space-y-0.5">
                  <div><strong>Derajat Gangguan:</strong> {diagKanan.derajat}</div>
                  <div><strong>Jenis Gangguan:</strong> {typeKanan.label}</div>
                  {audiogram?.kanan?.sds !== undefined && audiogram?.kanan?.sds !== null && (
                    <div><strong>Speech Discrim. (SDS):</strong> {audiogram.kanan.sds}%</div>
                  )}
                </div>
              </div>

              {/* Left Ear Diagnosis */}
              <div className="p-2 rounded-lg border border-blue-200 bg-blue-50 space-y-0.5">
                <div className="font-bold text-blue-900 border-b border-blue-200 pb-0.5 flex justify-between">
                  <span>HASIL TELINGA KIRI (AS):</span>
                  <span className="font-mono text-blue-700">{ptaKiri !== null ? `${ptaKiri} dB` : '-'}</span>
                </div>
                <div className="text-[9.5px] text-slate-700 space-y-0.5">
                  <div><strong>Derajat Gangguan:</strong> {diagKiri.derajat}</div>
                  <div><strong>Jenis Gangguan:</strong> {typeKiri.label}</div>
                  {audiogram?.kiri?.sds !== undefined && audiogram?.kiri?.sds !== null && (
                    <div><strong>Speech Discrim. (SDS):</strong> {audiogram.kiri.sds}%</div>
                  )}
                </div>
              </div>
            </div>

            {/* 7. CONCLUSION & RECOMMENDATIONS */}
            <div className="space-y-1 my-1 text-[9.5px] border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div>
                <span className="font-bold text-slate-900 block text-[10px] uppercase">
                  Kesimpulan Hasil Pemeriksaan:
                </span>
                <p className="text-slate-800 text-[9.5px] mt-0.5 leading-snug">
                  {audiogram?.kesimpulan || transaction.catatanHasil || 'Pemeriksaan audiometri telah selesai dilaksanakan.'}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-1">
                <span className="font-bold text-blue-950 block text-[10px] uppercase">
                  Saran / Rekomendasi Solusi Pendengaran:
                </span>
                <p className="text-slate-800 text-[9.5px] mt-0.5 leading-snug">
                  {audiogram?.rekomendasi || 'Disarankan konsultasi lebih lanjut dengan konsultan pendengaran Earsound.'}
                </p>
              </div>
            </div>

            {/* 8. SIGNATURE BLOCK */}
            <div className="mt-auto pt-2 grid grid-cols-2 text-center text-[10px] text-slate-800">
              <div className="flex flex-col items-center">
                <span className="text-[10px]">Pasien / Keluarga Pasien,</span>
                <div className="h-11"></div>
                <span className="font-bold border-t border-slate-400 px-6 pt-0.5">
                  ( {displayName} )
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px]">
                  {branchInfo.city}, {formatIndoDate(transaction.tanggal)}
                </span>
                <span className="text-[10px] font-semibold text-slate-700">
                  Audiometris / Tenaga Ahli,
                </span>
                <div className="h-11"></div>
                <span className="font-bold border-t border-slate-400 px-6 pt-0.5 text-blue-950">
                  ( {audiogram?.audiometris || transaction.audiometris} )
                </span>
              </div>
            </div>

            {/* FOOTER WATERMARK */}
            <div className="mt-2 pt-1 border-t border-slate-200 text-center text-[8.5px] text-slate-400 flex items-center justify-between">
              <span>Dicetak resmi oleh Sistem Informasi Manajemen Earsound</span>
              <span>Halaman 1 / 1 (A4)</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
