import React, { useState } from 'react';
import { EarmouldReport, Patient, JenisEarmould, FittingType, EarmouldStatus } from '../../types';
import { formatIndoDate } from '../../utils/formatters';
import { Disc, Plus, Trash2, Search, CheckCircle2, Clock, AlertCircle, Download } from 'lucide-react';
import { exportEarmouldCSV } from '../../utils/exportHelpers';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';

interface EarmouldReportProps {
  earmouldList: EarmouldReport[];
  patients: Patient[];
  onAddEarmould: (item: EarmouldReport) => void;
  onUpdateStatus: (id: string, newStatus: EarmouldStatus) => void;
  onDeleteEarmould: (id: string) => void;
}

export const EarmouldReportComponent: React.FC<EarmouldReportProps> = ({
  earmouldList = [],
  patients = [],
  onAddEarmould,
  onUpdateStatus,
  onDeleteEarmould,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [idPelanggan, setIdPelanggan] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [jenisEarmould, setJenisEarmould] = useState<JenisEarmould>('S/C');
  const [qty, setQty] = useState<FittingType>('Binaural');
  const [tanggalCetak, setTanggalCetak] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalKirim, setTanggalKirim] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalMasukLab, setTanggalMasukLab] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [tanggalDiambil, setTanggalDiambil] = useState('');
  const [status, setStatus] = useState<EarmouldStatus>('Di Lab');
  const [catatan, setCatatan] = useState('');

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

    const newItem: EarmouldReport = {
      id: `EMD-${Date.now().toString().slice(-6)}`,
      idPelanggan,
      namaPelanggan,
      jenisEarmould,
      qty,
      tanggalCetak,
      tanggalKirim,
      tanggalMasukLab,
      tanggalSelesai: tanggalSelesai || '-',
      tanggalDiambil: tanggalDiambil || '-',
      status,
      catatan,
    };

    onAddEarmould(newItem);
    setShowForm(false);
  };

  const [statusFilter, setStatusFilter] = useState<'Semua' | EarmouldStatus>('Semua');

  const labCount = earmouldList.filter((e) => e.status === 'Di Lab').length;
  const yaminCount = earmouldList.filter((e) => e.status === 'Di Yamin').length;
  const diambilCount = earmouldList.filter((e) => e.status === 'Diambil').length;

  const filteredList = earmouldList.filter((e) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      e.namaPelanggan.toLowerCase().includes(term) ||
      e.idPelanggan.toLowerCase().includes(term) ||
      e.jenisEarmould.toLowerCase().includes(term) ||
      e.status.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'Semua' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Disc className="w-6 h-6 text-teal-600" />
            <span>Laporan Pembuatan & Cetak Earmould</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tracking status pencetakan earmould (H/C, S/C, H/FS, S/FS), pengiriman lab, hingga pengambilan pasien.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportEarmouldCSV(filteredList)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-300 shadow-xs transition-all whitespace-nowrap"
            title="Download Laporan Earmould (CSV)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV</span>
          </button>
          <button
            id="btn-tambah-earmould"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>{showForm ? 'Tutup Form' : '+ Catat Earmould Baru'}</span>
          </button>
        </div>
      </div>

      {/* Pipeline Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Di Lab' ? 'Semua' : 'Di Lab')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Di Lab' 
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' 
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex justify-between items-center text-blue-700">
            <span className="text-xs font-bold uppercase tracking-wider">🧪 1. Di Lab (Dicetak)</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{labCount}</div>
          <span className="text-xs text-slate-500">Proses Pengerjaan Laboratorium</span>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'Di Yamin' ? 'Semua' : 'Di Yamin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Di Yamin' 
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300' 
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">🏪 2. Di Yamin (Siap)</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{yaminCount}</div>
          <span className="text-xs text-slate-500">Siap & Menunggu Pasien Takeaway</span>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'Diambil' ? 'Semua' : 'Diambil')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Diambil' 
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300' 
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-center text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">✅ 3. Sudah Diambil</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{diambilCount}</div>
          <span className="text-xs text-slate-500">Selesai Diterima Pasien</span>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-teal-200 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-md font-bold text-slate-900">Form Pembuatan Earmould Pasien</h3>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Earmould Tracking
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
                id="earmould-patient-select"
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
                Jenis Earmould <span className="text-red-500">*</span>
              </label>
              <select
                value={jenisEarmould}
                onChange={(e) => setJenisEarmould(e.target.value as JenisEarmould)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-teal-800 focus:ring-2 focus:ring-teal-500"
              >
                <option value="H/C">H/C (Hard Clear)</option>
                <option value="S/C">S/C (Soft Clear)</option>
                <option value="H/FS">H/FS (Hard Full Shell)</option>
                <option value="S/FS">S/FS (Soft Full Shell)</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                QTY Earmould <span className="text-red-500">*</span>
              </label>
              <select
                value={qty}
                onChange={(e) => setQty(e.target.value as FittingType)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
              >
                <option value="Binaural">Binaural (Sepasang / Both Ears)</option>
                <option value="Monoaural (Kanan)">Monoaural (Kanan / Right)</option>
                <option value="Monoaural (Kiri)">Monoaural (Kiri / Left)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pembuatan Earmould <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EarmouldStatus)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
              >
                <option value="Di Lab">Di Lab (Sedang Dicetak di Laboratorium)</option>
                <option value="Di Yamin">Di Yamin (Siap / Menunggu Pengambilan)</option>
                <option value="Diambil">Diambil (Sudah Diterima Pasien)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Keterangan
              </label>
              <input
                type="text"
                placeholder="Catatan pengerjaan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Row 3 Dates */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Jadwal & Tanggal Pengerjaan Earmould
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Cetak</label>
                <input
                  type="date"
                  value={tanggalCetak}
                  onChange={(e) => setTanggalCetak(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Kirim</label>
                <input
                  type="date"
                  value={tanggalKirim}
                  onChange={(e) => setTanggalKirim(e.target.value)}
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Diambil</label>
                <input
                  type="date"
                  value={tanggalDiambil}
                  onChange={(e) => setTanggalDiambil(e.target.value)}
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
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md"
            >
              Simpan Data Earmould
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari earmould..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: {filteredList.length} Order Earmould
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5">ID & Pelanggan</th>
                <th className="p-3.5">Jenis Earmould & Qty</th>
                <th className="p-3.5">Status Cetak</th>
                <th className="p-3.5">Tgl Cetak & Kirim</th>
                <th className="p-3.5">Tgl Masuk Lab & Selesai</th>
                <th className="p-3.5">Tgl Diambil</th>
                <th className="p-3.5">Catatan</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Belum ada data laporan pembuatan earmould.
                  </td>
                </tr>
              ) : (
                filteredList.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{e.namaPelanggan}</div>
                      <div className="text-xs text-teal-700 font-semibold">{e.idPelanggan}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md text-xs">
                        {e.jenisEarmould}
                      </span>
                      <div className="text-xs text-slate-500 font-medium mt-1">{e.qty}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <select
                        value={e.status}
                        onChange={(ev) => onUpdateStatus(e.id, ev.target.value as EarmouldStatus)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border shadow-2xs focus:ring-2 focus:ring-teal-500 ${
                          e.status === 'Diambil'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : e.status === 'Di Yamin'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        <option value="Di Lab">Di Lab</option>
                        <option value="Di Yamin">Di Yamin</option>
                        <option value="Diambil">Diambil</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700">
                      <div>Cetak: {formatIndoDate(e.tanggalCetak)}</div>
                      <div className="text-slate-400">Kirim: {formatIndoDate(e.tanggalKirim)}</div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-700">
                      <div>Masuk Lab: {formatIndoDate(e.tanggalMasukLab)}</div>
                      <div className="text-emerald-700 font-medium">
                        Selesai: {e.tanggalSelesai !== '-' ? formatIndoDate(e.tanggalSelesai) : '-'}
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 text-xs whitespace-nowrap">
                      {e.tanggalDiambil !== '-' ? formatIndoDate(e.tanggalDiambil) : '-'}
                    </td>
                    <td className="p-3.5 text-xs text-slate-500 max-w-xs">
                      {e.catatan || '-'}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        title="Hapus Data Earmould"
                        onClick={() => onDeleteEarmould(e.id)}
                        className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
