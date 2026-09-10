import React, { useState, useEffect } from 'react';
import { ReparasiService, Patient, ReparasiStatus } from '../../types';
import { formatIndoDate } from '../../utils/formatters';
import { printHtmlElement, downloadElementAsPdf } from '../../utils/printHelper';
import { EarsoundLogo } from '../Common/EarsoundLogo';
import { Wrench, Plus, Trash2, Search, WrenchIcon, AlertTriangle, Printer, FileText, X, Download, Loader2 } from 'lucide-react';
import { ReportFilterToolbar } from '../Common/ReportFilterToolbar';
import { exportReparasiCSV } from '../../utils/exportHelpers';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';

interface ReparasiReportProps {
  reparasiList: ReparasiService[];
  patients: Patient[];
  onAddReparasi: (item: ReparasiService) => void;
  onUpdateStatus: (id: string, newStatus: ReparasiStatus) => void;
  onDeleteReparasi: (id: string) => void;
}

const REPARASI_STATUS_OPTIONS: ReparasiStatus[] = [
  'Receiver',
  'Amplifier',
  'Microphone',
  'Korosi',
  'Sedang Diperiksa',
  'Selesai Perbaikan',
];

export const ReparasiReportComponent: React.FC<ReparasiReportProps> = ({
  reparasiList = [],
  patients = [],
  onAddReparasi,
  onUpdateStatus,
  onDeleteReparasi,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReparasiService | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!selectedReceipt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReceipt(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReceipt]);

  const [idPelanggan, setIdPelanggan] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [jenisABD, setJenisABD] = useState('Sonic Captivate BTE');
  const [nomorSeri, setNomorSeri] = useState('SN-8829101');
  const [garansi, setGaransi] = useState(true);
  const [keluhan, setKeluhan] = useState('Suara hilang dan lampu indikator tidak menyala');
  const [tanggalMasuk, setTanggalMasuk] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalMasukLab, setTanggalMasukLab] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalKonfirmasi, setTanggalKonfirmasi] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ReparasiStatus>('Receiver');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Date Range & Export State
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState<string>('Semua Periode');

  const handlePatientSelect = (patientId: string) => {
    setIdPelanggan(patientId);
    const p = patients.find((pat) => pat.id === patientId);
    if (p) setNamaPelanggan(p.nama);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPelanggan) {
      alert('Mohon pilih Pasien / ID Pelanggan.');
      return;
    }

    const newItem: ReparasiService = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      idPelanggan,
      namaPelanggan,
      jenisABD,
      nomorSeri,
      garansi,
      keluhan,
      tanggalMasuk,
      tanggalMasukLab,
      tanggalKonfirmasi,
      status,
      tanggalSelesai: tanggalSelesai || '-',
      keterangan,
    };

    onAddReparasi(newItem);
    setShowForm(false);
  };

  const filteredList = reparasiList.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      r.namaPelanggan.toLowerCase().includes(term) ||
      r.idPelanggan.toLowerCase().includes(term) ||
      r.jenisABD.toLowerCase().includes(term) ||
      r.nomorSeri.toLowerCase().includes(term) ||
      r.status.toLowerCase().includes(term)
    );
    if (!matchesSearch) return false;

    if (filterStartDate && r.tanggalMasuk < filterStartDate) return false;
    if (filterEndDate && r.tanggalMasuk > filterEndDate) return false;

    return true;
  });

  const handleExportCSV = (periodLabel: string) => {
    exportReparasiCSV(filteredList, periodLabel);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-600" />
            <span>Laporan Reparasi & Service Alat Bantu Dengar</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan service/repair ABD: Receiver, Amplifier, Microphone, Korosi, Tanggal Lab, Garansi & Selesai.
          </p>
        </div>

        <button
          id="btn-tambah-reparasi"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>{showForm ? 'Tutup Form' : '+ Catat Reparasi / Service'}</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-amber-200 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-md font-bold text-slate-900">Form Permintaan Reparasi ABD</h3>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Lab Service Entry
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
                id="reparasi-patient-select"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pelanggan (Otomatis)
              </label>
              <input
                type="text"
                readOnly
                value={namaPelanggan}
                className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Alat Bantu Dengar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Model / Tipe ABD"
                value={jenisABD}
                onChange={(e) => setJenisABD(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Seri ABD <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Serial Number"
                value={nomorSeri}
                onChange={(e) => setNomorSeri(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Garansi <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGaransi(true)}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    garansi
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Garansi (Ya)
                </button>
                <button
                  type="button"
                  onClick={() => setGaransi(false)}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    !garansi
                      ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Non-Garansi (Tidak)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status / Komponen Kerusakan <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReparasiStatus)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-amber-800 focus:ring-2 focus:ring-amber-500"
              >
                {REPARASI_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3 Keluhan & Keterangan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keluhan Pasien <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Rincian keluhan masalah ABD..."
                value={keluhan}
                onChange={(e) => setKeluhan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan Hasil Perbaikan
              </label>
              <textarea
                rows={2}
                placeholder="Tindakan laboratorium / penggantian suku cadang..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Jadwal Pengerjaan & Konfirmasi Service
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Masuk</label>
                <input
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Masuk Lab</label>
                <input
                  type="date"
                  value={tanggalMasukLab}
                  onChange={(e) => setTanggalMasukLab(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Konfirmasi</label>
                <input
                  type="date"
                  value={tanggalKonfirmasi}
                  onChange={(e) => setTanggalKonfirmasi(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md"
            >
              Simpan Data Reparasi
            </button>
          </div>
        </form>
      )}

      {/* Filter & Export Toolbar */}
      <ReportFilterToolbar
        title="Laporan & Filter Tanggal Reparasi & Service ABD"
        totalRecords={reparasiList.length}
        filteredRecordsCount={filteredList.length}
        onFilterChange={(start, end, label) => {
          setFilterStartDate(start);
          setFilterEndDate(end);
          setCurrentPeriodLabel(label);
        }}
        onExportCSV={handleExportCSV}
      />

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari service, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: {filteredList.length} Unit Service Reparasi
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5">ID & Pelanggan</th>
                <th className="p-3.5">Jenis ABD & No. Seri</th>
                <th className="p-3.5">Garansi</th>
                <th className="p-3.5">Keluhan Pasien</th>
                <th className="p-3.5">Status Kerusakan</th>
                <th className="p-3.5">Tanggal Masuk & Lab</th>
                <th className="p-3.5">Tgl Selesai</th>
                <th className="p-3.5">Keterangan</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Belum ada data laporan reparasi / service.
                  </td>
                </tr>
              ) : (
                filteredList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{r.namaPelanggan}</div>
                      <div className="text-xs text-amber-700 font-semibold">{r.idPelanggan}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{r.jenisABD}</div>
                      <div className="text-xs font-mono text-slate-500">{r.nomorSeri}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          r.garansi
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {r.garansi ? 'Ya (Garansi)' : 'Tidak'}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700 max-w-xs">
                      {r.keluhan}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <select
                        value={r.status}
                        onChange={(ev) => onUpdateStatus(r.id, ev.target.value as ReparasiStatus)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:ring-2 focus:ring-amber-500 ${
                          r.status === 'Selesai Perbaikan'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {REPARASI_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700 whitespace-nowrap">
                      <div>Masuk: {formatIndoDate(r.tanggalMasuk)}</div>
                      <div className="text-slate-400">Lab: {formatIndoDate(r.tanggalMasukLab)}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 text-xs whitespace-nowrap">
                      {r.tanggalSelesai !== '-' ? formatIndoDate(r.tanggalSelesai) : '-'}
                    </td>
                    <td className="p-3.5 text-xs text-slate-500 max-w-xs">
                      {r.keterangan || '-'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Cetak Tanda Terima Pasien"
                          onClick={() => setSelectedReceipt(r)}
                          className="p-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg font-bold flex items-center gap-1"
                        >
                          <Printer className="w-4 h-4" />
                          <span className="text-[10px]">Tanda Terima</span>
                        </button>
                        <button
                          title="Hapus Data Reparasi"
                          onClick={() => onDeleteReparasi(r.id)}
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
      {/* Modal Tanda Terima Reparasi Pasien */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:block"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedReceipt(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-2xl w-full flex flex-col max-h-[92vh] my-auto overflow-hidden relative animate-scaleIn print:p-0 print:border-none print:shadow-none print:max-h-none print:w-full">
            {/* Modal Header Controls */}
            <div className="bg-[#1E2269] text-white px-3 py-2.5 sm:px-4 sm:py-3 flex justify-between items-center shrink-0 print:hidden border-b border-amber-400/30 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#F5B438] shrink-0" />
                <h3 className="font-bold text-white text-xs sm:text-sm truncate">Pratinjau Tanda Terima Service</h3>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={async () => {
                    setIsGeneratingPdf(true);
                    setDownloadNotice(null);
                    const fname = `Tanda_Terima_Reparasi_${selectedReceipt.id}.pdf`;
                    await downloadElementAsPdf({
                      elementId: 'print-tanda-terima',
                      filename: fname,
                      onSuccess: () => {
                        setIsGeneratingPdf(false);
                        setDownloadNotice(`File ${fname} berhasil diunduh ke folder Downloads.`);
                        setTimeout(() => setDownloadNotice(null), 8000);
                      },
                      onError: () => {
                        setIsGeneratingPdf(false);
                        printHtmlElement('print-tanda-terima', `Tanda Terima Reparasi - ${selectedReceipt.id}`);
                      },
                    });
                  }}
                  disabled={isGeneratingPdf}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-[#F5B438] hover:bg-[#EEA32F] text-[#1E2269] font-black text-xs rounded-lg sm:rounded-xl shadow-md flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh file PDF tanda terima"
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
                  onClick={() => printHtmlElement('print-tanda-terima', `Tanda Terima Reparasi - ${selectedReceipt.id}`)}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-[#2B308C] hover:bg-[#343A9E] text-white font-bold text-xs rounded-lg sm:rounded-xl shadow-md flex items-center gap-1 transition-all cursor-pointer border border-white/20"
                  title="Buka dialog cetak printer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F5B438]" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg sm:rounded-xl text-xs shadow-md transition-all cursor-pointer ml-1"
                  title="Tutup pratinjau (ESC)"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden xs:inline">Tutup</span>
                </button>
              </div>
            </div>

            {/* Download notice banner (print:hidden) */}
            {downloadNotice && (
              <div className="bg-emerald-600 text-white px-4 py-2 text-xs flex items-center justify-between font-medium print:hidden shadow-xs shrink-0">
                <span>{downloadNotice}</span>
                <button onClick={() => setDownloadNotice(null)} className="text-white/80 hover:text-white ml-2 text-xs font-bold underline cursor-pointer">
                  Tutup
                </button>
              </div>
            )}

            {/* Document Receipt Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-3.5 sm:space-y-4 text-slate-900 bg-white document-font" id="print-tanda-terima">
              {/* Header Logo & Clinic Info */}
              <div className="flex justify-between items-start border-b-2 border-[#23277A] pb-3">
                <div className="flex flex-col gap-1">
                  <EarsoundLogo variant="light" size="lg" showSubtitle={false} />
                  <div className="pl-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Laboratorium Reparasi & Service ABD</p>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-normal">Pusat Layanan Pemeliharaan Alat Bantu Dengar</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-[#23277A] text-white text-xs sm:text-sm font-black tracking-wider uppercase px-3 py-1.5 rounded-md border-b-2 border-[#F5B438]">
                    No. <span className="font-mono">{selectedReceipt.id}</span>
                  </div>
                  <span className="text-xs text-slate-600 font-medium mt-1 block">
                    Tgl Masuk: <span className="font-mono text-slate-900 font-bold">{formatIndoDate(selectedReceipt.tanggalMasuk)}</span>
                  </span>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center">
                <h2 className="text-xs sm:text-sm font-black text-[#23277A] uppercase tracking-widest bg-[#EEF2FF] border border-[#C7D2FE] inline-block px-3.5 py-1 rounded-md shadow-2xs">
                  TANDA TERIMA REPARASI & SERVICE ABD
                </h2>
              </div>

              {/* Patient & Device Information */}
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm bg-[#F8FAFC] p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="text-slate-600 text-[11px] uppercase font-bold tracking-wider">Data Pasien / Pemilik:</div>
                  <div><span className="text-slate-600 font-medium text-xs">Nama Pasien:</span> <strong className="text-[#23277A] block text-sm sm:text-base font-black">{selectedReceipt.namaPelanggan}</strong></div>
                  <div><span className="text-slate-600 font-medium text-xs">ID Pelanggan:</span> <strong className="font-mono text-slate-900 font-bold">{selectedReceipt.idPelanggan}</strong></div>
                </div>

                <div className="space-y-1 border-l border-slate-200 pl-3">
                  <div className="text-slate-600 text-[11px] uppercase font-bold tracking-wider">Spesifikasi Alat:</div>
                  <div><span className="text-slate-600 font-medium text-xs">Jenis ABD:</span> <strong className="text-slate-900 block font-bold text-xs sm:text-sm">{selectedReceipt.jenisABD}</strong></div>
                  <div><span className="text-slate-600 font-medium text-xs">Nomor Seri (S/N):</span> <strong className="font-mono text-slate-900 font-bold">{selectedReceipt.nomorSeri}</strong></div>
                  <div><span className="text-slate-600 font-medium text-xs">Status Garansi:</span> <strong className={selectedReceipt.garansi ? 'text-emerald-700 font-bold' : 'text-slate-700 font-medium'}>{selectedReceipt.garansi ? 'Masih Garansi Resmi' : 'Non-Garansi / Out of Warranty'}</strong></div>
                </div>
              </div>

              {/* Fault & Complaint */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-[#23277A] block mb-0.5 text-xs sm:text-sm">Keluhan / Kerusakan ABD yang Dilaporkan:</span>
                  <p className="p-2.5 bg-[#F8FAFC] rounded-lg text-slate-800 italic font-semibold border border-slate-200 leading-relaxed text-xs">
                    "{selectedReceipt.keluhan}"
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-0.5 text-xs">
                  <div><span className="text-slate-600 font-medium">Status Awal:</span> <strong className="text-[#23277A] font-bold">{selectedReceipt.status}</strong></div>
                  <div><span className="text-slate-600 font-medium">Estimasi Selesai:</span> <strong className="text-slate-900 font-bold">{selectedReceipt.tanggalSelesai !== '-' ? formatIndoDate(selectedReceipt.tanggalSelesai) : 'Menunggu Pemeriksaan Lab'}</strong></div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="text-[11px] sm:text-xs text-slate-700 bg-[#FFFDF5] p-3 rounded-xl border border-[#FDE68A] space-y-1">
                <div className="font-bold text-[#87550B] uppercase text-[11px] tracking-wide">Ketentuan Pengambilan Unit Service:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-800 leading-relaxed font-medium">
                  <li>Tanda terima ini WAJIB dibawa saat pengambilan unit Alat Bantu Dengar.</li>
                  <li>Klinik tidak bertanggung jawab atas kerusakan/kehilangan barang yang tidak diambil lebih dari 3 (tiga) bulan.</li>
                  <li>Biaya penggantian sparepart/komponen akan dikonfirmasikan terlebih dahulu sebelum tindakan perbaikan.</li>
                </ol>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 text-center text-xs sm:text-sm pt-3 border-t border-slate-200">
                <div>
                  <p className="text-slate-600 mb-10 font-medium">Yang Menyerahkan,</p>
                  <p className="font-bold text-slate-900 underline underline-offset-4 text-xs sm:text-sm">{selectedReceipt.namaPelanggan}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-10 font-medium">Hormat Kami,</p>
                  <p className="font-bold text-[#23277A] underline uppercase underline-offset-4 text-xs sm:text-sm">( Petugas )</p>
                </div>
              </div>

              {/* Footnote */}
              <div className="text-center pt-2 border-t border-slate-200 text-xs text-slate-500 font-medium">
                Dokumen ini dicetak secara sah dan merupakan bukti penerimaan servis resmi PT. EARSOUND BERKAH ABADI.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
