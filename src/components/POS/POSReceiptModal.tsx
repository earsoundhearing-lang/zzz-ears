import React, { useState, useEffect } from 'react';
import { POSTransactionReceipt } from '../../types';
import { formatIndoDate, formatRupiah, terbilang } from '../../utils/formatters';
import { getBranchByCode } from '../../utils/branches';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printHelper';
import { EarsoundLogo } from '../Common/EarsoundLogo';
import { 
  X, 
  Printer, 
  Receipt, 
  FileText, 
  CheckCircle2, 
  Download, 
  Send, 
  Share2, 
  Check, 
  Copy,
  Smartphone
} from 'lucide-react';

interface POSReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: POSTransactionReceipt | null;
}

export const POSReceiptModal: React.FC<POSReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [copiedWA, setCopiedWA] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !receipt) return null;

  const branch = getBranchByCode(receipt.branchCode);

  const handlePrint = () => {
    printHtmlElement('printable-pos-area', `Struk_POS_${receipt.invoiceNumber}`);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setDownloadNotice(null);
    const filename = `Struk_POS_${receipt.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    await downloadElementAsPdf({
      elementId: 'printable-pos-area',
      filename,
      onSuccess: () => {
        setIsGeneratingPdf(false);
        setDownloadNotice(`File ${filename} berhasil diunduh ke folder Downloads.`);
        setTimeout(() => setDownloadNotice(null), 8000);
      },
      onError: () => {
        setIsGeneratingPdf(false);
        setDownloadNotice('Gagal mengunduh PDF secara otomatis.');
        setTimeout(() => setDownloadNotice(null), 8000);
      }
    });
  };

  // Generate formatted WhatsApp message text
  const generateWAMessage = () => {
    const lines = [
      `*BUKTI PEMBAYARAN - EARSOUND HEARING CARE*`,
      `================================`,
      `*No. Faktur:* ${receipt.invoiceNumber}`,
      `*Tanggal:* ${formatIndoDate(receipt.date)}`,
      `*Cabang:* ${branch.name}`,
      `*Pasien:* ${receipt.patient.nama}`,
      receipt.patient.telepon ? `*No. HP:* ${receipt.patient.telepon}` : '',
      `================================`,
      `*RINCIAN TRANSAKSI:*`,
      ...receipt.items.map((item, idx) => {
        const itemNote = item.notes ? ` (${item.notes})` : '';
        const snNote = item.serialNumber ? ` [SN: ${item.serialNumber}]` : '';
        const sideNote = item.earSide ? ` [${item.earSide}]` : '';
        return `${idx + 1}. *${item.name}*${sideNote}${snNote}${itemNote}\n   ${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}`;
      }),
      `================================`,
      `*Subtotal:* ${formatRupiah(receipt.subtotal)}`,
      receipt.discountTotal > 0 ? `*Diskon:* -${formatRupiah(receipt.discountTotal)}` : '',
      `*TOTAL PEMBAYARAN:* ${formatRupiah(receipt.grandTotal)}`,
      `*Metode Bayar:* ${receipt.payment.method === 'Shopee' ? 'Shopee (Cabang Yamin)' : receipt.payment.method}${receipt.payment.bsiAccount ? ` (${receipt.payment.bsiAccount})` : ''}${receipt.payment.shopeeOrderNo ? ` [No. Pesanan: ${receipt.payment.shopeeOrderNo}]` : ''}`,
      receipt.cashGiven && receipt.cashGiven > 0 ? `*Uang Tunai:* ${formatRupiah(receipt.cashGiven)}` : '',
      receipt.changeDue && receipt.changeDue > 0 ? `*Kembalian:* ${formatRupiah(receipt.changeDue)}` : '',
      receipt.isDP ? `*Uang Muka (DP):* ${formatRupiah(receipt.uangMuka || 0)}\n*Sisa Pembayaran:* ${formatRupiah(receipt.sisaPembayaran || 0)}` : '',
      `================================`,
      `*Petugas Kasir:* ${receipt.staffUser}`,
      `*Alamat Klinik:* ${branch.address}`,
      `*Info & Kontak:* ${branch.phone}`,
      `\n_Terima kasih telah mempercayakan kesehatan pendengaran Anda kepada Earsound Hearing Care._`
    ].filter(Boolean).join('\n');

    return lines;
  };

  const handleSendWA = () => {
    const rawPhone = (receipt.patient.telepon || '').replace(/[^0-9]/g, '');
    let cleanPhone = rawPhone;
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const message = encodeURIComponent(generateWAMessage());
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateWAMessage());
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#2A2F86] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-white flex items-center gap-2">
                <span>Transaksi Berhasil Disimpan</span>
              </h3>
              <p className="text-xs text-indigo-200 font-mono">
                No. Faktur: <span className="text-amber-300 font-bold">{receipt.invoiceNumber}</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setPrintFormat('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                printFormat === 'thermal'
                  ? 'bg-white text-[#2A2F86] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Struk Thermal (Kasir)</span>
            </button>
            <button
              onClick={() => setPrintFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                printFormat === 'a4'
                  ? 'bg-white text-[#2A2F86] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Faktur / Invoice Resmi (A5 / A4)</span>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleSendWA}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Kirim Struk ke WhatsApp Pasien"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim WhatsApp</span>
            </button>

            <button
              onClick={handleCopyText}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Salin Teks Nota"
            >
              {copiedWA ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWA ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#2A2F86] hover:bg-[#1A1D5C] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Struk</span>
            </button>
          </div>
        </div>

        {downloadNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
        )}

        {/* Printable View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          {printFormat === 'thermal' ? (
            /* THERMAL RECEIPT VIEW (58mm / 80mm POS style) */
            <div 
              id="printable-pos-area" 
              className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 w-full max-w-[360px] font-mono text-[11px] leading-relaxed text-slate-900"
            >
              {/* Header */}
              <div className="text-center space-y-1 mb-3 pb-3 border-b border-dashed border-slate-400">
                <div className="flex justify-center mb-1">
                  <EarsoundLogo variant="light" size="sm" />
                </div>
                <p className="font-extrabold text-sm tracking-tight text-[#2A2F86]">EARSOUND HEARING CARE</p>
                <p className="text-[10px] text-slate-600 font-sans font-medium">{branch.name}</p>
                <p className="text-[9px] text-slate-500 font-sans leading-tight">{branch.address}</p>
                <p className="text-[9px] text-slate-500 font-sans">Telp: {branch.phone}</p>
              </div>

              {/* Meta Info */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-400 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Faktur:</span>
                  <span className="font-bold">{receipt.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu:</span>
                  <span>{formatIndoDate(receipt.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kasir:</span>
                  <span>{receipt.staffUser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pasien:</span>
                  <span className="font-bold truncate max-w-[170px]">{receipt.patient.nama}</span>
                </div>
                {receipt.patient.telepon && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Telp:</span>
                    <span>{receipt.patient.telepon}</span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="py-2 space-y-2 border-b border-dashed border-slate-400 text-[10px]">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold flex justify-between">
                      <span className="truncate pr-1">{item.name}</span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                    {item.earSide && (
                      <div className="text-[9px] text-slate-500">Sisi: {item.earSide}</div>
                    )}
                    {item.serialNumber && (
                      <div className="text-[9px] text-slate-500">SN: {item.serialNumber}</div>
                    )}
                    {item.notes && (
                      <div className="text-[9px] text-slate-500 italic">{item.notes}</div>
                    )}
                    <div className="text-[9px] text-slate-500 flex justify-between">
                      <span>{item.qty} x {formatRupiah(item.price)}</span>
                      {item.discount > 0 && <span className="text-red-500">Disc: -{formatRupiah(item.discount)}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="py-2 space-y-1 border-b border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span>{formatRupiah(receipt.subtotal)}</span>
                </div>
                {receipt.discountTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(receipt.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200 text-[#2A2F86]">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(receipt.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                  <span>Metode Bayar:</span>
                  <span className={`font-semibold ${receipt.payment.method === 'Shopee' ? 'text-[#EE4D2D]' : ''}`}>
                    {receipt.payment.method === 'Shopee' ? 'Shopee (Cabang Yamin)' : receipt.payment.method}
                  </span>
                </div>
                {receipt.payment.shopeeOrderNo && (
                  <div className="flex justify-between text-[9px] text-orange-700">
                    <span>No. Pesanan:</span>
                    <span className="font-mono">{receipt.payment.shopeeOrderNo}</span>
                  </div>
                )}
                {receipt.payment.bsiAccount && (
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Rekening:</span>
                    <span>{receipt.payment.bsiAccount}</span>
                  </div>
                )}
                {receipt.cashGiven && receipt.cashGiven > 0 && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-600">Tunai Diterima:</span>
                    <span>{formatRupiah(receipt.cashGiven)}</span>
                  </div>
                )}
                {receipt.changeDue !== undefined && receipt.changeDue >= 0 && (
                  <div className="flex justify-between text-[10px] font-bold text-emerald-700">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(receipt.changeDue)}</span>
                  </div>
                )}
                {receipt.isDP && (
                  <div className="bg-amber-50 p-1.5 rounded border border-amber-200 text-[9px] space-y-0.5 mt-1 font-sans">
                    <div className="flex justify-between font-bold text-amber-800">
                      <span>Uang Muka (DP):</span>
                      <span>{formatRupiah(receipt.uangMuka || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-red-700">
                      <span>Sisa Pembayaran:</span>
                      <span>{formatRupiah(receipt.sisaPembayaran || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 text-center space-y-1 text-[9px] text-slate-500 font-sans">
                <p className="font-bold text-slate-700">TERIMA KASIH</p>
                <p>Barang yang sudah dibeli telah diperiksa dengan baik.</p>
                <p className="text-[8px] text-slate-400">www.earsound.co.id</p>
              </div>
            </div>
          ) : (
            /* A4 OFFICIAL INVOICE VIEW */
            <div 
              id="printable-pos-area" 
              className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 w-full max-w-[650px] font-sans text-xs text-slate-800 space-y-6"
            >
              {/* Top Header */}
              <div className="flex justify-between items-start border-b-2 border-[#2A2F86] pb-4">
                <div className="space-y-1">
                  <EarsoundLogo variant="light" size="md" />
                  <p className="font-extrabold text-sm text-[#2A2F86] mt-2">EARSOUND HEARING CARE</p>
                  <p className="text-[11px] text-slate-600">{branch.name}</p>
                  <p className="text-[10px] text-slate-500 max-w-[280px] leading-tight">{branch.address}</p>
                  <p className="text-[10px] text-slate-500">Telp/WA: {branch.phone}</p>
                </div>
                <div className="text-right space-y-1">
                  <h2 className="text-xl font-black text-[#2A2F86] tracking-tight">FAKTUR PENJUALAN</h2>
                  <p className="font-mono text-sm font-bold text-slate-800">{receipt.invoiceNumber}</p>
                  <p className="text-xs text-slate-500">{formatIndoDate(receipt.date)}</p>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1">
                    {receipt.isDP ? 'UANG MUKA (DP)' : 'LUNAS'}
                  </span>
                </div>
              </div>

              {/* Patient and Bill Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ditagihkan Kepada:</span>
                  <p className="font-black text-sm text-slate-900">{receipt.patient.nama}</p>
                  <p className="text-slate-600">ID Pasien: {receipt.patient.id}</p>
                  <p className="text-slate-600">No. HP: {receipt.patient.telepon || '-'}</p>
                  <p className="text-slate-600">Alamat: {receipt.patient.alamat?.kabupatenKota || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Informasi Layanan:</span>
                  <p className="text-slate-700"><span className="text-slate-400">Petugas / Kasir:</span> <strong className="text-slate-900">{receipt.staffUser}</strong></p>
                  <p className="text-slate-700">
                    <span className="text-slate-400">Metode Bayar:</span>{' '}
                    <strong className={receipt.payment.method === 'Shopee' ? 'text-[#EE4D2D]' : 'text-slate-900'}>
                      {receipt.payment.method === 'Shopee' ? 'Shopee (Cabang Yamin)' : receipt.payment.method}
                    </strong>
                  </p>
                  {receipt.payment.shopeeOrderNo && (
                    <p className="text-slate-700 text-xs font-mono">
                      <span className="text-slate-400">No. Pesanan:</span> {receipt.payment.shopeeOrderNo}
                    </p>
                  )}
                  {receipt.payment.bsiAccount && (
                    <p className="text-slate-700"><span className="text-slate-400">Rekening:</span> {receipt.payment.bsiAccount}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2A2F86] text-white text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 rounded-tl-lg font-bold w-10 text-center">No</th>
                    <th className="p-2.5 font-bold">Deskripsi Barang / Layanan</th>
                    <th className="p-2.5 font-bold text-center w-16">Qty</th>
                    <th className="p-2.5 font-bold text-right w-28">Harga Satuan</th>
                    <th className="p-2.5 font-bold text-right w-24">Diskon</th>
                    <th className="p-2.5 rounded-tr-lg font-bold text-right w-28">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {receipt.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2.5">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        {item.earSide && <span className="text-[10px] text-slate-500 mr-2">Sisi: {item.earSide}</span>}
                        {item.serialNumber && <span className="text-[10px] text-slate-500 font-mono">SN: {item.serialNumber}</span>}
                        {item.notes && <span className="text-[10px] text-slate-500 italic block">{item.notes}</span>}
                      </td>
                      <td className="p-2.5 text-center font-bold">{item.qty}</td>
                      <td className="p-2.5 text-right">{formatRupiah(item.price)}</td>
                      <td className="p-2.5 text-right text-red-600">{item.discount > 0 ? `-${formatRupiah(item.discount)}` : '-'}</td>
                      <td className="p-2.5 text-right font-black text-slate-900">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary and Terbilang */}
              <div className="grid grid-cols-2 gap-4 items-start pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Terbilang:</span>
                  <p className="italic text-xs font-semibold text-slate-700 capitalize leading-relaxed">
                    "{terbilang(receipt.grandTotal)} Rupiah"
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">{formatRupiah(receipt.subtotal)}</span>
                  </div>
                  {receipt.discountTotal > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Diskon Tambahan:</span>
                      <span>-{formatRupiah(receipt.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base text-[#2A2F86] pt-1 border-t-2 border-slate-200">
                    <span>TOTAL HARGA:</span>
                    <span>{formatRupiah(receipt.grandTotal)}</span>
                  </div>

                  {receipt.isDP && (
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 space-y-1 mt-1 text-xs">
                      <div className="flex justify-between font-bold text-amber-800">
                        <span>Uang Muka (DP):</span>
                        <span>{formatRupiah(receipt.uangMuka || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-red-700">
                        <span>Sisa Pembayaran:</span>
                        <span>{formatRupiah(receipt.sisaPembayaran || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Lines */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <p className="text-slate-500 mb-14">Pelanggan / Pasien,</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[150px]">
                    ( {receipt.patient.nama} )
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-14">Petugas Earsound,</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[150px]">
                    ( {receipt.staffUser} )
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Format: {printFormat === 'thermal' ? 'Struk Thermal POS' : 'Faktur Resmi A4'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
