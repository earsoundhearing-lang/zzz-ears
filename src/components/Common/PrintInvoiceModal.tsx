import React, { useState, useEffect } from 'react';
import { AksesorisTransaction, JasaPeriksaTransaction, ABDTransaction, JenisPemeriksaan, Patient } from '../../types';
import { formatIndoDate, formatRupiah, terbilang, formatPatientWithGelar } from '../../utils/formatters';
import { getBranchByCode } from '../../utils/branches';
import { printHtmlElement, downloadElementAsPdf, sharePdfViaWhatsApp } from '../../utils/printHelper';
import { generateWhatsAppReceiptMessage, openWhatsAppWithReceipt } from '../../utils/whatsappHelper';
import { EarsoundLogo } from './EarsoundLogo';
import { 
  X, 
  Printer, 
  Stethoscope, 
  FileText, 
  CheckCircle2, 
  Download, 
  Loader2, 
  MessageSquare,
  Send,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AksesorisTransaction | JasaPeriksaTransaction | ABDTransaction | null;
  type: 'AKS' | 'JSA' | 'ABD';
  patients?: Patient[];
  initialMode?: 'preview' | 'whatsapp';
}

const SERVICE_PRICES: Record<string, number> = {
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

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction,
  type,
  patients = [],
  initialMode = 'preview',
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [lastSharedResult, setLastSharedResult] = useState<{
    mode: 'web-share' | 'download-and-wa';
    filename: string;
    phone: string;
  } | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync phone & panel when modal opens or transaction changes
  useEffect(() => {
    if (isOpen && transaction) {
      const isAks = type === 'AKS';
      const isJsa = type === 'JSA';
      const patientId = isAks 
        ? (transaction as AksesorisTransaction).idPelanggan 
        : isJsa 
        ? (transaction as JasaPeriksaTransaction).idPelanggan 
        : (transaction as ABDTransaction).idPelanggan;

      const matched = patients.find((p) => p.id === patientId);
      const phone = matched?.telepon && matched.telepon !== '-' ? matched.telepon : '';
      setTargetPhone(phone);
      setShowWhatsAppPanel(initialMode === 'whatsapp');
      setLastSharedResult(null);
      setDownloadNotice(null);
    }
  }, [isOpen, transaction, type, patients, initialMode]);

  if (!isOpen || !transaction) return null;

  const isAksesoris = type === 'AKS';
  const isJasa = type === 'JSA';
  const isABD = type === 'ABD';

  const aks = isAksesoris ? (transaction as AksesorisTransaction) : null;
  const jsa = isJasa ? (transaction as JasaPeriksaTransaction) : null;
  const abd = isABD ? (transaction as ABDTransaction) : null;

  const isAbdDP = isABD && (abd?.uangMuka || 0) > 0 && (abd?.sisaPembayaran || 0) > 0;

  const invoiceTitle = isJasa
    ? 'KWITANSI JASA PERIKSA'
    : isABD
    ? (isAbdDP ? 'KWITANSI TANDA TERIMA UANG MUKA (DP)' : 'FAKTUR PENJUALAN')
    : 'FAKTUR PENJUALAN';

  const refNumber = isAksesoris
    ? aks?.nomorFaktur
    : isJasa
    ? jsa?.nomorKwitansi
    : abd?.nomorFakturPenjualan;

  const handlePrint = () => {
    printHtmlElement('printable-area', `${invoiceTitle} - ${refNumber || 'Earsound'}`);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setDownloadNotice(null);
    const filename = `${(refNumber || invoiceTitle).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    await downloadElementAsPdf({
      elementId: 'printable-area',
      filename,
      onSuccess: () => {
        setIsGeneratingPdf(false);
        setDownloadNotice(`File ${filename} berhasil diunduh ke folder Downloads.`);
        setTimeout(() => setDownloadNotice(null), 8000);
      },
      onError: () => {
        setIsGeneratingPdf(false);
        printHtmlElement('printable-area', `${invoiceTitle} - ${refNumber || 'Earsound'}`);
      },
    });
  };

  const customerName = isAksesoris
    ? aks?.namaCustomer
    : isJasa
    ? jsa?.namaCustomer
    : abd?.namaPasien;

  const patientId = isAksesoris
    ? aks?.idPelanggan
    : isJasa
    ? jsa?.idPelanggan
    : abd?.idPelanggan;

  // Match patient record to obtain title/gelar and WhatsApp phone
  const matchedPatient = patients?.find((p) => p.id === patientId);
  const patientGelar = matchedPatient?.gelar || (transaction as any)?.gelar;
  const displayCustomerName = formatPatientWithGelar(customerName, patientGelar);

  const staffName = isAksesoris
    ? aks?.staffUser || 'Kasir Cabang'
    : isJasa
    ? jsa?.audiometris || 'Audiologis'
    : abd?.hac || 'HAC Cabang';

  const branchInfo = getBranchByCode(transaction.branchCode);

  const totalBayar = isAksesoris
    ? aks?.jumlah || 0
    : isJasa
    ? jsa?.biayaJasaPeriksa || 0
    : isAbdDP
    ? abd?.uangMuka || 0
    : abd?.jumlah || 0;

  // Send PDF via WhatsApp
  const handleSendWhatsAppPdf = async (customPhone?: string) => {
    let rawPhone = customPhone !== undefined ? customPhone : targetPhone;
    let cleanPhone = rawPhone.replace(/\D/g, '');

    // Prompt if phone is missing or too short
    if (!cleanPhone || cleanPhone.length < 8) {
      const inputPhone = window.prompt(
        `Kirim Hasil PDF via WhatsApp\n\nMasukkan Nomor WhatsApp untuk pasien ${displayCustomerName}:\n(Contoh: 08123456789 atau 628123456789)`,
        rawPhone || ''
      );
      if (inputPhone === null) return;
      rawPhone = inputPhone.trim();
      cleanPhone = rawPhone.replace(/\D/g, '');
      setTargetPhone(rawPhone);
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      alert('Nomor WhatsApp tidak valid (minimal 8 digit angka).');
      return;
    }

    const filename = `${(refNumber || invoiceTitle).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    const message = generateWhatsAppReceiptMessage({
      transaction,
      type,
      patient: matchedPatient,
    });

    setIsSendingWhatsApp(true);
    setDownloadNotice(null);
    setShowWhatsAppPanel(true);

    const result = await sharePdfViaWhatsApp({
      elementId: 'printable-area',
      filename,
      phone: cleanPhone,
      message,
      onStart: () => {
        setIsSendingWhatsApp(true);
      },
      onSuccess: (res) => {
        setIsSendingWhatsApp(false);
        setLastSharedResult({
          mode: res.mode,
          filename: res.filename,
          phone: cleanPhone,
        });
        if (res.mode === 'web-share') {
          setDownloadNotice(`Dokumen PDF ${res.filename} berhasil dibuka di WhatsApp!`);
        } else {
          setDownloadNotice(`File PDF ${res.filename} berhasil diunduh. WhatsApp Web telah dibuka untuk nomor ${cleanPhone}.`);
        }
      },
      onError: (err) => {
        setIsSendingWhatsApp(false);
        alert('Gagal membuat file PDF. Membuka dialog WhatsApp dengan rincian transaksi...');
        openWhatsAppWithReceipt(cleanPhone, message);
      },
    });

    if (!result) {
      setIsSendingWhatsApp(false);
    }
  };

  // Plain Text WhatsApp fallback
  const handleSendWhatsAppTextOnly = () => {
    let cleanPhone = targetPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      const inputPhone = window.prompt(
        `Kirim Teks via WhatsApp\n\nMasukkan Nomor WhatsApp untuk pasien ${displayCustomerName}:`,
        targetPhone || ''
      );
      if (inputPhone === null) return;
      cleanPhone = inputPhone.replace(/\D/g, '');
      setTargetPhone(inputPhone.trim());
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      alert('Nomor WhatsApp tidak valid (minimal 8 digit angka).');
      return;
    }

    const message = generateWhatsAppReceiptMessage({
      transaction,
      type,
      patient: matchedPatient,
    });

    openWhatsAppWithReceipt(cleanPhone, message);
    setDownloadNotice(`Rincian teks dikirim ke WhatsApp ${cleanPhone}.`);
    setTimeout(() => setDownloadNotice(null), 7000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:block"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-scaleIn print:shadow-none print:border-none print:w-full print:max-h-none print:my-0">
        {/* Actions Bar (hidden on print) */}
        <div className="bg-[#1E2269] text-white px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between shrink-0 print:hidden border-b border-amber-400/30 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#F5B438] shrink-0" />
            <span className="text-xs sm:text-sm font-bold truncate">Pratinjau Dokumen Cetak</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Kirim PDF WhatsApp */}
            <button
              onClick={() => {
                if (!showWhatsAppPanel) {
                  setShowWhatsAppPanel(true);
                } else {
                  handleSendWhatsAppPdf();
                }
              }}
              disabled={isSendingWhatsApp}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Kirim hasil PDF kwitansi/faktur via WhatsApp"
            >
              {isSendingWhatsApp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-100" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-emerald-100" />
              )}
              <span className="hidden xs:inline">Kirim PDF WA</span>
              <span className="xs:hidden">PDF WA</span>
              {showWhatsAppPanel ? (
                <ChevronUp className="w-3 h-3 text-emerald-200 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 text-emerald-200 ml-0.5" />
              )}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-[#F5B438] hover:bg-[#EEA32F] text-[#1E2269] font-black rounded-lg sm:rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Unduh file PDF dokumen cetak"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1E2269]" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden xs:inline">{isGeneratingPdf ? 'Memproses...' : 'Unduh PDF'}</span>
              <span className="xs:hidden">PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-[#2B308C] hover:bg-[#343A9E] text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-md transition-all cursor-pointer border border-white/20"
              title="Buka dialog cetak printer"
            >
              <Printer className="w-3.5 h-3.5 text-[#F5B438]" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-md transition-all cursor-pointer ml-1"
              title="Tutup pratinjau (ESC)"
            >
              <X className="w-4 h-4" />
              <span className="hidden xs:inline">Tutup</span>
            </button>
          </div>
        </div>

        {/* Dedicated WhatsApp Sending Panel */}
        {showWhatsAppPanel && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-3 print:hidden text-slate-800 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-950">Kirim Hasil PDF via WhatsApp</span>
                    <span className="px-1.5 py-0.2 bg-emerald-200/80 text-emerald-800 text-[10px] font-bold rounded">
                      Dokumen Resmi
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    PDF {invoiceTitle.toLowerCase()} ({refNumber || '-'}) akan disiapkan & dikirim ke pasien/wali.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhatsAppPanel(false)}
                className="text-[11px] text-emerald-700 hover:text-emerald-950 font-semibold underline self-end sm:self-auto cursor-pointer"
              >
                Sembunyikan
              </button>
            </div>

            {/* Form Input Phone & Buttons */}
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-600">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <input 
                  type="tel"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Nomor WhatsApp (misal: 08123456789)"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-800 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleSendWhatsAppPdf()}
                  disabled={isSendingWhatsApp || isGeneratingPdf}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Render PDF resolusi tinggi dan kirim via WhatsApp"
                >
                  {isSendingWhatsApp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses PDF...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim PDF ke WA</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendWhatsAppTextOnly}
                  disabled={isSendingWhatsApp}
                  className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  title="Kirim hanya ringkasan teks tanpa lampiran PDF"
                >
                  Teks Saja
                </button>
              </div>
            </div>

            {/* Desktop / WhatsApp Web Delivery Guidance */}
            {lastSharedResult && lastSharedResult.mode === 'download-and-wa' && (
              <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-emerald-300 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File PDF Berhasil Dibuat: {lastSharedResult.filename}</span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed pl-5 space-y-0.5">
                  <p>1. File PDF kwitansi resmi telah tersimpan di folder <strong>Downloads</strong> komputer Anda.</p>
                  <p>2. WhatsApp Web telah dibuka untuk nomor <strong>{lastSharedResult.phone}</strong> dengan pesan pengantar.</p>
                  <p className="font-semibold text-emerald-800">
                    👉 Cukup lampirkan file PDF di chat WhatsApp (klik ikon klip 📎 Dokumen atau seret file PDF ke chat).
                  </p>
                </div>
                <div className="flex items-center gap-2 pl-5 pt-0.5">
                  <button
                    onClick={() => {
                      const msg = generateWhatsAppReceiptMessage({ transaction, type, patient: matchedPatient });
                      openWhatsAppWithReceipt(lastSharedResult.phone, msg);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-medium text-[11px] transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka Ulang Chat WhatsApp
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px] transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Unduh Ulang PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download notice banner (print:hidden) */}
        {downloadNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between font-medium print:hidden shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{downloadNotice}</span>
            </div>
            <button onClick={() => setDownloadNotice(null)} className="text-white/80 hover:text-white ml-2 text-xs font-bold underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-3.5 sm:space-y-4 text-slate-900 print:overflow-visible print:p-6 print:space-y-4 bg-white document-font" id="printable-area">
          {/* Clinic Header with Branch Info */}
          <div className="flex items-start justify-between border-b-2 border-[#23277A] pb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <EarsoundLogo variant="light" size="lg" showSubtitle={false} />
              </div>
              <div className="pl-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                  {branchInfo.name.toUpperCase()}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-700 font-normal leading-normal mt-0.5">
                  {branchInfo.address}
                </p>
                <p className="text-[11px] sm:text-xs text-[#23277A] font-bold mt-0.5">
                  Telp / WhatsApp: <span className="font-mono">{branchInfo.phone}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-[#23277A] text-white text-xs sm:text-sm font-black tracking-wider uppercase px-3 py-1.5 rounded-md shadow-2xs border-b-2 border-[#F5B438]">
                {invoiceTitle}
              </div>
              <div className="text-xs sm:text-sm font-mono font-black text-[#23277A] mt-1.5 tracking-wide">{refNumber}</div>
              <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 font-medium">
                Tanggal: <span className="font-mono text-slate-900 font-bold">{formatIndoDate(transaction.tanggal)}</span>
              </div>
            </div>
          </div>

          {/* Customer Metadata Card */}
          <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <div className="space-y-0.5">
              <span className="text-slate-600 font-bold block uppercase tracking-wider text-[11px]">
                Kepada Yth. Pasien / Pelanggan:
              </span>
              <span className="text-sm sm:text-base font-black text-[#23277A] block leading-tight">{displayCustomerName}</span>
              <span className="text-slate-700 font-medium block text-xs">
                ID Pelanggan: <strong className="font-mono text-slate-900 font-bold">{patientId}</strong>
              </span>
              <span className="text-[#23277A] font-semibold block text-xs mt-1 bg-[#EEF2FF] px-2 py-0.5 rounded-md border border-[#C7D2FE] inline-block">
                Petugas / HAC: <strong className="font-bold">{staffName}</strong>
              </span>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-slate-600 font-bold block uppercase tracking-wider text-[11px]">
                Metode Pembayaran:
              </span>
              <span className={`text-sm sm:text-base font-black block leading-tight ${transaction.payment.method === 'Shopee' ? 'text-[#EE4D2D]' : 'text-emerald-800'}`}>
                {transaction.payment.method === 'Shopee' ? 'Shopee (Cabang Yamin)' : transaction.payment.method}
              </span>
              {transaction.payment.method === 'Shopee' && transaction.payment.shopeeOrderNo && (
                <span className="text-xs text-orange-950 font-mono block">
                  No. Pesanan: {transaction.payment.shopeeOrderNo}
                </span>
              )}
              {transaction.payment.method === 'Split (Cash & Transfer)' && (
                <div className="text-xs space-y-0.5 pt-1 text-slate-800">
                  <span className="block font-medium">
                    Cash: <strong className="font-mono font-bold">{formatRupiah(transaction.payment.cashAmount || 0)}</strong>
                  </span>
                  <span className="block font-medium">
                    Transfer: <strong className="font-mono font-bold">{formatRupiah(transaction.payment.transferAmount || 0)}</strong>
                  </span>
                  {transaction.payment.splitBsiAccount && (
                    <span className="block text-[11px] text-slate-600 font-mono">
                      (Rek: {transaction.payment.splitBsiAccount})
                    </span>
                  )}
                </div>
              )}
              {transaction.payment.namaRSBPJS && (
                <span className="text-slate-800 font-bold block text-xs">
                  RS BPJS: {transaction.payment.namaRSBPJS}
                </span>
              )}
              {transaction.payment.namaFaskes && (
                <span className="text-slate-800 font-bold block text-xs">
                  Faskes: {transaction.payment.namaFaskes}
                </span>
              )}
              {transaction.payment.bsiAccount && (
                <span className="text-slate-700 font-bold block font-mono text-xs">
                  Rek: {transaction.payment.bsiAccount}
                </span>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#23277A] font-bold uppercase tracking-wider text-white text-xs border-b border-[#1E2269]">
                  <th className="py-2.5 px-3.5 font-bold">Deskripsi Layanan / Produk</th>
                  <th className="py-2.5 px-3 text-center font-bold">Qty</th>
                  <th className="py-2.5 px-3.5 text-right font-bold">Harga Satuan</th>
                  <th className="py-2.5 px-3.5 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {isAksesoris && aks && (
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900 text-xs sm:text-sm">
                      {aks.category} {aks.subtype ? `(${aks.subtype})` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 text-xs">{aks.qty} Unit</td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-800 font-bold text-xs">{formatRupiah(aks.hargaJual)}</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-black text-[#23277A] text-xs sm:text-sm">{formatRupiah(aks.jumlah)}</td>
                  </tr>
                )}

                {isJasa && jsa && (
                  Array.isArray(jsa.jenisPemeriksaan) ? jsa.jenisPemeriksaan.map((serviceName, idx) => {
                    const price = SERVICE_PRICES[serviceName] || 50000;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 text-xs sm:text-sm">
                          {serviceName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 text-xs">1 Layanan</td>
                        <td className="py-2.5 px-3.5 text-right font-mono text-slate-800 font-bold text-xs">{formatRupiah(price)}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-black text-[#23277A] text-xs sm:text-sm">{formatRupiah(price)}</td>
                      </tr>
                    );
                  }) : (
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 text-xs sm:text-sm">
                        {jsa.jenisPemeriksaan || 'Jasa Periksa'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 text-xs">1 Layanan</td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-slate-800 font-bold text-xs">{formatRupiah(jsa.subtotalBiaya || jsa.biayaJasaPeriksa)}</td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-black text-[#23277A] text-xs sm:text-sm">{formatRupiah(jsa.subtotalBiaya || jsa.biayaJasaPeriksa)}</td>
                    </tr>
                  )
                )}

                {isABD && abd && (
                  <>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3.5">
                        <div className="text-slate-900 font-black text-xs sm:text-sm leading-snug">{abd.tipeABD} {abd.modelABD && abd.modelABD !== '-' ? `[${abd.modelABD}]` : ''}</div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          No. Seri: <span className="font-bold text-slate-800">{abd.nomorSeriABD}</span> • HAC: {abd.hac}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 text-xs">1 Unit</td>
                      <td className="py-2.5 px-3.5 text-right font-mono text-slate-800 font-bold text-xs">
                        {formatRupiah(abd.hargaABD1 || (abd.hargaABD2 ? (abd.hargaJual - abd.hargaABD2 - (abd.hargaBundling || 0)) : (abd.hargaJual - (abd.hargaBundling || 0))))}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-black text-[#23277A] text-xs sm:text-sm">
                        {formatRupiah(abd.hargaABD1 || (abd.hargaABD2 ? (abd.hargaJual - abd.hargaABD2 - (abd.hargaBundling || 0)) : (abd.hargaJual - (abd.hargaBundling || 0))))}
                      </td>
                    </tr>

                    {(abd.fittingType === 'Binaural' || abd.tipeABD2) && (
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3.5">
                          <div className="text-slate-900 font-black text-xs sm:text-sm leading-snug">{abd.tipeABD2 || abd.tipeABD} {abd.modelABD2 && abd.modelABD2 !== '-' ? `[${abd.modelABD2}]` : ''}</div>
                          <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                            No. Seri: <span className="font-bold text-slate-800">{abd.nomorSeriABD2 || '-'}</span> • HAC: {abd.hac}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 text-xs">1 Unit</td>
                        <td className="py-2.5 px-3.5 text-right font-mono text-slate-800 font-bold text-xs">
                          {formatRupiah(abd.hargaABD2 || (abd.hargaABD1 ? abd.hargaJual - abd.hargaABD1 - (abd.hargaBundling || 0) : 0))}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-black text-[#23277A] text-xs sm:text-sm">
                          {formatRupiah(abd.hargaABD2 || (abd.hargaABD1 ? abd.hargaJual - abd.hargaABD1 - (abd.hargaBundling || 0) : 0))}
                        </td>
                      </tr>
                    )}

                    {(abd.paketBundling || abd.keteranganBundling || (abd.hargaBundling && abd.hargaBundling > 0)) && (
                      <tr className="bg-[#FFFDF5]">
                        <td className="py-2 px-3.5">
                          <div className="text-[#87550B] font-bold text-xs leading-snug">Paket Bundling Pembelian ({abd.paketBundling || 'Lengkap'})</div>
                          <div className="text-[11px] text-slate-600 mt-0.5 leading-normal font-normal">
                            Isi: {abd.keteranganBundling || 'Earmould Custom, Baterai Set, Drying Box, & Garansi Official'}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 text-xs">1 Paket</td>
                        <td className="py-2 px-3.5 text-right font-mono text-[#87550B] font-bold text-xs">{formatRupiah(abd.hargaBundling || 0)}</td>
                        <td className="py-2 px-3.5 text-right font-mono font-bold text-[#87550B] text-xs">{formatRupiah(abd.hargaBundling || 0)}</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals Section */}
          <div className="flex justify-end pt-0.5">
            <div className="w-full sm:w-80 bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1.5 shadow-2xs">
              {isJasa && jsa && (
                <>
                  {jsa.diskon && jsa.diskon > 0 ? (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Potongan Diskon:</span>
                      <span className="font-mono">- {formatRupiah(jsa.diskon)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-[#23277A] pt-1.5 border-t-2 border-[#23277A]">
                    <span>TOTAL PEMBAYARAN:</span>
                    <span className="text-[#23277A] font-mono font-bold">{formatRupiah(jsa.biayaJasaPeriksa)}</span>
                  </div>
                </>
              )}

              {isABD && abd && (
                <>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Harga Gross Jual:</span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(abd.hargaJual)}</span>
                  </div>
                  {abd.diskon > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Potongan Diskon:</span>
                      <span className="font-mono">- {formatRupiah(abd.diskon)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5">
                    <span>Total Net Tagihan:</span>
                    <span className="font-mono font-bold text-xs sm:text-sm">{formatRupiah(abd.jumlah)}</span>
                  </div>

                  {isAbdDP ? (
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                      <div className="flex justify-between text-emerald-950 font-bold bg-emerald-100 p-2 rounded-lg border border-emerald-300 text-xs">
                        <span>Uang Muka / DP:</span>
                        <span className="font-mono text-xs sm:text-sm">{formatRupiah(abd.uangMuka || 0)}</span>
                      </div>
                      <div className="flex justify-between text-rose-950 font-bold bg-rose-100 p-2 rounded-lg border border-rose-300 text-xs">
                        <span>SISA PELUNASAN:</span>
                        <span className="font-mono text-xs sm:text-sm">{formatRupiah(abd.sisaPembayaran || Math.max(0, abd.jumlah - (abd.uangMuka || 0)))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-[#23277A] pt-1.5 border-t-2 border-[#23277A]">
                      <span>TOTAL BAYAR (LUNAS):</span>
                      <span className="text-[#23277A] font-mono font-bold">{formatRupiah(abd.jumlah)}</span>
                    </div>
                  )}

                  {transaction.payment.method === 'Shopee' && (
                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-200 text-xs text-orange-950 space-y-0.5 mt-1">
                      <div className="font-bold text-[10px] text-orange-900 uppercase">Pembayaran Shopee (Cabang Yamin):</div>
                      {transaction.payment.shopeeOrderNo && (
                        <div className="font-mono text-[11px] font-bold text-orange-900">
                          No. Pesanan: {transaction.payment.shopeeOrderNo}
                        </div>
                      )}
                    </div>
                  )}

                  {transaction.payment.method === 'Split (Cash & Transfer)' && (
                    <div className="bg-[#FFFDF5] p-2 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1 mt-1">
                      <div className="font-bold text-[10px] text-amber-900 uppercase">Rincian Pembayaran (Split):</div>
                      <div className="flex justify-between font-medium">
                        <span>• Cash / Tunai:</span>
                        <span className="font-mono font-bold text-emerald-900">{formatRupiah(transaction.payment.cashAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>• Transfer Bank:</span>
                        <span className="font-mono font-bold text-teal-900">{formatRupiah(transaction.payment.transferAmount || 0)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isJasa && !isABD && (
                <>
                  {aks?.diskon && aks.diskon > 0 ? (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Potongan Diskon:</span>
                      <span className="font-mono">- {formatRupiah(aks.diskon)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-[#23277A] pt-1.5 border-t-2 border-[#23277A]">
                    <span>TOTAL BAYAR (LUNAS):</span>
                    <span className="text-[#23277A] font-mono font-bold">{formatRupiah(aks?.jumlah || totalBayar)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Terbilang Box (Positioned under TOTAL BAYAR / Totals) */}
          <div className="bg-[#FFFDF5] p-3 rounded-xl border border-[#FDE68A] text-xs sm:text-sm text-[#1E2269] shadow-2xs">
            <span className="font-bold text-[#87550B] uppercase tracking-wider text-[11px] block mb-0.5">
              {isAbdDP ? 'Terbilang Uang Muka (DP) Diterima:' : 'Terbilang Total Pembayaran:'}
            </span>
            <p className="italic font-bold text-[#23277A] text-xs sm:text-sm leading-relaxed">"{terbilang(totalBayar)}"</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-3 text-center text-xs sm:text-sm border-t border-slate-200">
            <div>
              <p className="text-slate-600 mb-10 font-medium">Pasien / Penerima Dokumen,</p>
              <p className="font-bold underline text-slate-900 underline-offset-4 text-xs sm:text-sm">{customerName}</p>
            </div>
            <div>
              <p className="text-slate-600 mb-10 font-medium">Hormat Kami,</p>
              <p className="font-bold text-[#23277A] underline uppercase underline-offset-4 text-xs sm:text-sm">{staffName}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">( Petugas )</p>
            </div>
          </div>

          {/* Footnote */}
          <div className="text-center pt-2 border-t border-slate-200 text-xs text-slate-500 font-medium">
            Dokumen ini dicetak secara sah dan merupakan bukti transaksi resmi PT. EARSOUND BERKAH ABADI.
          </div>
        </div>
      </div>
    </div>
  );
};
