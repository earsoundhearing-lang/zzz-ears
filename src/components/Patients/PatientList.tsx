import React, { useState } from 'react';
import { Patient, AksesorisTransaction, JasaPeriksaTransaction, ABDTransaction, EarmouldReport, ReparasiService, EarmouldStatus, JenisEarmould, FittingType } from '../../types';
import { formatIndoDate, formatRupiah } from '../../utils/formatters';
import { getBranchByCode } from '../../utils/branches';
import { PrintAudiogramModal } from '../Audiogram/PrintAudiogramModal';
import { 
  UserPlus, 
  Search, 
  UserCheck, 
  MapPin, 
  Phone, 
  Calendar, 
  Edit, 
  Trash2, 
  FileText, 
  X,
  Share2,
  Filter,
  Disc,
  CheckCircle2,
  Plus,
  Download,
  Activity,
  Printer,
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  aksesoris: AksesorisTransaction[];
  jasaPeriksa: JasaPeriksaTransaction[];
  abd: ABDTransaction[];
  earmould: EarmouldReport[];
  reparasi: ReparasiService[];
  onUpdateEarmouldStatus?: (id: string, newStatus: EarmouldStatus) => void;
  onAddEarmould?: (item: EarmouldReport) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients = [],
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  aksesoris = [],
  jasaPeriksa = [],
  abd = [],
  earmould = [],
  reparasi = [],
  onUpdateEarmouldStatus,
  onAddEarmould,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [quickEarmouldModalPatient, setQuickEarmouldModalPatient] = useState<Patient | null>(null);
  const [selectedJasaForAudiogram, setSelectedJasaForAudiogram] = useState<JasaPeriksaTransaction | null>(null);

  // Quick form state
  const [jenisEarmould, setJenisEarmould] = useState<JenisEarmould>('S/C');
  const [qty, setQty] = useState<FittingType>('Binaural');
  const [catatan, setCatatan] = useState('');

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nama.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.telepon.includes(term) ||
      p.alamat.kabupatenKota.toLowerCase().includes(term)
    );
  });

  const handleQuickAddEarmouldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEarmouldModalPatient || !onAddEarmould) return;
    const today = new Date().toISOString().split('T')[0];
    const newItem: EarmouldReport = {
      id: `EMD-${Date.now().toString().slice(-6)}`,
      idPelanggan: quickEarmouldModalPatient.id,
      namaPelanggan: quickEarmouldModalPatient.nama,
      jenisEarmould,
      qty,
      tanggalCetak: today,
      tanggalKirim: today,
      tanggalMasukLab: today,
      tanggalSelesai: '-',
      tanggalDiambil: '-',
      status: 'Di Lab',
      catatan,
    };
    onAddEarmould(newItem);
    setQuickEarmouldModalPatient(null);
    setCatatan('');
  };


  
  const handleDownloadCSV = () => {
    // Define headers
    const headers = [
      'ID Pelanggan', 'Nama Pasien', 'Gender', 'No. Telepon', 'Tgl Lahir', 'Usia (Thn)', 'Alamat Jalan', 'Kecamatan', 'Kota/Kabupaten', 'Provinsi', 'Tgl Registrasi', 'Sumber Referal', 'Nama Dokter'
    ];

    // Escape CSV string
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '';
      const text = String(str);
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return '"' + text.replace(/"/g, '""') + '"';
      }
      return text;
    };

    // Format rows
    const rows = filteredPatients.map(p => {
      return [
        p.id,
        p.nama,
        p.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        p.telepon,
        p.tanggalLahir,
        p.usia,
        p.alamat.jalanNo || '',
        p.alamat.kecamatan,
        p.alamat.kabupatenKota,
        p.alamat.provinsi,
        p.createdAt,
        p.referal,
        p.namaDokter || ''
      ].map(escapeCSV).join(',');
    });

    // Create CSV content with BOM for UTF-8 Excel compatibility
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(',') + '\n' 
      + rows.join('\n');

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Pasien_Earsound_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  // Get records for drawer
  const patientAksesoris = selectedPatient
    ? aksesoris.filter((a) => a.idPelanggan === selectedPatient.id)
    : [];
  const patientJasa = selectedPatient
    ? jasaPeriksa.filter((j) => j.idPelanggan === selectedPatient.id)
    : [];
  const patientABD = selectedPatient
    ? abd.filter((a) => a.idPelanggan === selectedPatient.id)
    : [];
  const patientEarmould = selectedPatient
    ? earmould.filter((e) => e.idPelanggan === selectedPatient.id)
    : [];
  const patientReparasi = selectedPatient
    ? reparasi.filter((r) => r.idPelanggan === selectedPatient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#23277A]" />
            <span>Database & Registrasi Pasien Earsound</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data demografi pasien, usia otomatis, alamat, sumber referal, dan riwayat rekam medis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm shadow-sm transition-all whitespace-nowrap border border-slate-300"
          >
            <Download className="w-5 h-5" />
            <span>Download CSV</span>
          </button>
          <button
            id="btn-registrasi-pasien-baru"
            onClick={onAddPatient}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            <span>+ Registrasi Pasien Baru</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari Nama, ID, Telepon, atau Kota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-[#23277A]"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Menampilkan {filteredPatients.length} dari {patients.length} Pasien</span>
        </div>
      </div>

      {/* Mobile & Tablet Card View (visible on screens < lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
        {filteredPatients.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            Tidak ada data pasien yang cocok.
          </div>
        ) : (
          filteredPatients.map((p) => {
            const patientEmList = earmould.filter((e) => e.idPelanggan === p.id);
            const latestEm = patientEmList.length > 0 ? patientEmList[0] : null;

            return (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-[#23277A] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {p.id}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {getBranchByCode(p.branchCode || 'YM').name}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{p.nama}</h3>
                    <p className="text-[11px] text-slate-500">{p.usia} Thn • {p.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      title="Lihat Rekam Medis"
                      onClick={() => setSelectedPatient(p)}
                      className="p-2 bg-indigo-50 text-[#23277A] rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      title="Edit Pasien (Wajib PIN)"
                      onClick={() => onEditPatient(p)}
                      className="p-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      title="Hapus Pasien"
                      onClick={() => onDeletePatient(p.id)}
                      className="p-2 bg-rose-50 text-rose-700 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Telepon:</span>
                    <span className="font-semibold text-slate-800">{p.telepon || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kota / Alamat:</span>
                    <span className="font-semibold text-slate-800 truncate block">{p.alamat.kabupatenKota}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="text-[10px] text-slate-500">
                    Referal: <span className="font-bold text-slate-700">{p.referal}</span>
                  </div>

                  {latestEm ? (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-extrabold">
                        {latestEm.jenisEarmould} ({latestEm.status})
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQuickEarmouldModalPatient(p)}
                      className="text-[11px] font-bold text-[#23277A] bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100"
                    >
                      + Order Cetak
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Patients Table (visible on lg screens and up) */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin relative">
          <table className="w-full text-left border-collapse min-w-[1150px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider sticky top-0 z-20">
                <th className="p-3.5 whitespace-nowrap w-[110px]">ID Pasien</th>
                <th className="p-3.5 whitespace-nowrap min-w-[180px]">Nama Customer</th>
                <th className="p-3.5 whitespace-nowrap w-[130px]">Usia & Gender</th>
                <th className="p-3.5 whitespace-nowrap w-[130px]">No. Telepon</th>
                <th className="p-3.5 whitespace-nowrap w-[120px]">Cabang Asal</th>
                <th className="p-3.5 whitespace-nowrap min-w-[220px] max-w-[280px]">Alamat Domisili</th>
                <th className="p-3.5 whitespace-nowrap min-w-[150px]">Status Earmould</th>
                <th className="p-3.5 whitespace-nowrap min-w-[160px]">Sumber Referal</th>
                <th className="p-3.5 text-center whitespace-nowrap w-[120px] sticky right-0 z-30 bg-slate-900 shadow-xs border-l border-slate-800">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada data pasien yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const patientEmList = earmould.filter((e) => e.idPelanggan === p.id);
                  const latestEm = patientEmList.length > 0 ? patientEmList[0] : null;

                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#23277A] whitespace-nowrap">
                        {p.id}
                      </td>
                      <td className="p-3.5 min-w-[180px]">
                        <div className="font-semibold text-slate-900">{p.nama}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Lahir: {formatIndoDate(p.tanggalLahir)}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{p.usia} Thn</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              p.gender === 'L'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {p.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#23277A]" />
                          <span>{p.telepon || '-'}</span>
                        </div>
                      </td>

                      {/* Cabang Asal */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-[#23277A] border border-indigo-200">
                          {p.branchCode || 'YM'}
                        </span>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {getBranchByCode(p.branchCode || 'YM').name}
                        </div>
                      </td>

                      {/* Alamat Domisili */}
                      <td className="p-3.5 text-slate-700 text-xs min-w-[220px] max-w-[280px]">
                        <div className="flex items-start gap-1 font-semibold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-[#23277A] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {p.alamat.jalanNo ? `${p.alamat.jalanNo}, ` : ''}
                            {p.alamat.kecamatan}, {p.alamat.kabupatenKota}
                          </span>
                        </div>
                        <span className="text-slate-400 pl-4.5 block mt-0.5 text-[11px]">{p.alamat.provinsi}</span>
                      </td>

                      {/* Earmould Quick Status Cell */}
                      <td className="p-3.5 text-xs whitespace-nowrap min-w-[150px]">
                        {latestEm ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold text-[10px]">
                                {latestEm.jenisEarmould}
                              </span>
                              <span>{latestEm.qty}</span>
                            </div>
                            <select
                              value={latestEm.status}
                              onChange={(ev) =>
                                onUpdateEarmouldStatus &&
                                onUpdateEarmouldStatus(
                                   latestEm.id,
                                  ev.target.value as EarmouldStatus
                                )
                              }
                              className={`text-[11px] font-extrabold rounded-md px-2 py-1 border transition-all cursor-pointer ${
                                latestEm.status === 'Diambil'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : latestEm.status === 'Di Yamin'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-300'
                              }`}
                            >
                              <option value="Di Lab">Di Lab</option>
                              <option value="Di Yamin">Di Yamin</option>
                              <option value="Diambil">Diambil</option>
                            </select>
                          </div>
                        ) : (
                          <button
                            onClick={() => setQuickEarmouldModalPatient(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Order Cetak</span>
                          </button>
                        )}
                      </td>

                      {/* Sumber Referal */}
                      <td className="p-3.5 text-xs min-w-[160px]">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold text-[11px] border border-slate-200">
                          {p.referal}
                        </span>
                        {p.namaDokter && (
                          <div className="text-[#23277A] font-bold text-[11px] mt-1 flex items-center gap-1">
                            <span>Dr: {p.namaDokter}</span>
                          </div>
                        )}
                      </td>

                      {/* Aksi (Fixed right) */}
                      <td className="p-3.5 text-center whitespace-nowrap sticky right-0 bg-white/95 border-l border-slate-200 z-10 shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Lihat Rekam Medis"
                            onClick={() => setSelectedPatient(p)}
                            className="p-1.5 bg-indigo-50 text-[#23277A] hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Pasien (Wajib PIN)"
                            onClick={() => onEditPatient(p)}
                            className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus Pasien"
                            onClick={() => onDeletePatient(p.id)}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Detail History Pasien */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
            {/* Drawer Header */}
            <div className="bg-[#181B57] text-white p-6 flex items-center justify-between border-b border-[#23277A]">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Rekam Medis & History
                </span>
                <h3 className="text-xl font-bold">{selectedPatient.nama} ({selectedPatient.id})</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Usia {selectedPatient.usia} Thn • {selectedPatient.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} • {selectedPatient.telepon}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Info Profil Box */}
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#23277A] font-semibold">Alamat Lengkap:</span>
                  <span className="text-slate-800 font-medium text-right">
                    Kec. {selectedPatient.alamat.kecamatan}, {selectedPatient.alamat.kabupatenKota}, {selectedPatient.alamat.provinsi}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#23277A] font-semibold">Sumber Informasi (Referal):</span>
                  <span className="text-slate-800 font-medium">
                    {selectedPatient.referal} {selectedPatient.namaDokter ? `(${selectedPatient.namaDokter})` : ''}
                  </span>
                </div>
                <div className="pt-2 border-t border-indigo-200/60 flex justify-end">
                  <button
                    onClick={() => {
                      const p = selectedPatient;
                      setSelectedPatient(null);
                      onEditPatient(p);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profil Pasien (Perlu PIN)</span>
                  </button>
                </div>
              </div>

              {/* ABD Purchased */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                  <Share2 className="w-4 h-4 text-[#23277A]" />
                  <span>Riwayat Pembelian Alat Bantu Dengar ({patientABD.length})</span>
                </h4>
                {patientABD.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada transaksi ABD.</p>
                ) : (
                  patientABD.map((a) => (
                    <div key={a.id} className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>[{a.branchCode}] {a.tipeABD} ({a.fittingType})</span>
                        <span className="text-[#23277A] font-bold">{formatRupiah(a.jumlah)}</span>
                      </div>
                      <div className="text-slate-500 flex justify-between">
                        <span>SN: {a.nomorSeriABD}</span>
                        <span>Faktur: {a.nomorFakturPenjualan}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        HAC: {a.hac} • Tanggal: {formatIndoDate(a.tanggal)} • Pembayaran: {a.payment.method}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Jasa Periksa */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                  <FileText className="w-4 h-4 text-[#23277A]" />
                  <span>Riwayat Pemeriksaan Audiometri ({patientJasa.length})</span>
                </h4>
                {patientJasa.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada rekam jasa periksa.</p>
                ) : (
                  patientJasa.map((j) => (
                    <div key={j.id} className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>[{j.branchCode}] {Array.isArray(j.jenisPemeriksaan) ? j.jenisPemeriksaan.join(', ') : (j.jenisPemeriksaan || 'Periksa')}</span>
                        <span className="text-[#23277A] font-bold">{formatRupiah(j.biayaJasaPeriksa)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-700 font-semibold bg-white p-2 rounded border border-slate-200">
                        <span>Hasil Periksa:</span>
                        {j.resultKananDb && <span className="text-red-600 font-bold">Kanan: {j.resultKananDb}</span>}
                        {j.resultKiriDb && <span className="text-blue-600 font-bold">Kiri: {j.resultKiriDb}</span>}
                        {j.resultTympanometri && <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Tympa: {j.resultTympanometri}</span>}
                        {j.resultOAE && <span className="text-[#23277A] bg-indigo-50 px-1.5 py-0.5 rounded">OAE: {j.resultOAE}</span>}
                        {j.resultBERA && <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">BERA: {j.resultBERA}</span>}
                      </div>

                      {(j.adaFittingABD || j.catatanHAC) && (
                        <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-2.5 space-y-1 my-1.5 text-[11px] text-amber-950">
                          <div className="flex flex-wrap items-center justify-between gap-1 font-bold border-b border-amber-200/80 pb-1">
                            <span className="flex items-center gap-1 text-amber-900">
                              <Activity className="w-3.5 h-3.5 text-amber-600" />
                              <span>Catatan HAC & Trial Fitting ABD</span>
                            </span>
                            {j.potensiPembelian && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                j.potensiPembelian === 'Sangat Potensial'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : j.potensiPembelian === 'Potensial'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {j.potensiPembelian}
                              </span>
                            )}
                          </div>
                          {j.tipeABDFitting && (
                            <div className="font-semibold text-slate-800">
                              <span className="text-amber-800 font-bold">ABD Trial/Fitting: </span>
                              {j.tipeABDFitting}
                            </div>
                          )}
                          {j.catatanHAC && (
                            <div className="text-slate-700 bg-white/80 p-1.5 rounded border border-amber-200/60 font-medium">
                              "{j.catatanHAC}"
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-slate-400 text-[11px] flex items-center justify-between pt-1">
                        <span>Audiometris: {j.audiometris}</span>
                        <div className="flex items-center gap-2">
                          {j.audiogram && (
                            <button
                              type="button"
                              onClick={() => setSelectedJasaForAudiogram(j)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-bold text-[10px] transition-colors"
                              title="Lihat & Cetak Hasil Audiogram"
                            >
                              <Activity className="w-3 h-3 text-blue-600" />
                              <span>Cetak Audiogram</span>
                            </button>
                          )}
                          <span>{formatIndoDate(j.tanggal)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Aksesoris */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">
                  Pembelian Aksesoris ({patientAksesoris.length})
                </h4>
                {patientAksesoris.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada transaksi aksesoris.</p>
                ) : (
                  patientAksesoris.map((ak) => (
                    <div key={ak.id} className="bg-slate-50 p-3 rounded-lg border text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">[{ak.branchCode}] {ak.category} ({ak.subtype})</div>
                        <div className="text-slate-500">Qty: {ak.qty} • {formatIndoDate(ak.tanggal)}</div>
                      </div>
                      <div className="font-bold text-slate-900">{formatRupiah(ak.jumlah)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Earmould & Reparasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Disc className="w-3.5 h-3.5 text-amber-600" />
                      <span>Order Earmould ({patientEarmould.length})</span>
                    </span>
                    <button
                      onClick={() => setQuickEarmouldModalPatient(selectedPatient)}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200"
                    >
                      + Order Baru
                    </button>
                  </div>
                  {patientEarmould.length === 0 ? (
                    <span className="text-slate-400 italic">Belum ada order cetak earmould.</span>
                  ) : (
                    patientEarmould.map((e) => (
                      <div key={e.id} className="bg-white p-2 rounded border border-slate-200 mb-2 space-y-1">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>[{e.branchCode}] {e.jenisEarmould} • {e.qty}</span>
                          <span className="text-[10px] text-slate-400">{e.id}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          {(['Di Lab', 'Di Yamin', 'Diambil'] as EarmouldStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => onUpdateEarmouldStatus && onUpdateEarmouldStatus(e.id, st)}
                              className={`flex-1 text-[10px] font-extrabold py-1 px-1 rounded text-center transition-all ${
                                e.status === st
                                  ? st === 'Diambil'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : st === 'Di Yamin'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border text-xs">
                  <span className="font-bold text-slate-800 block mb-1">Status Reparasi:</span>
                  {patientReparasi.length === 0 ? (
                    <span className="text-slate-400">Tidak ada</span>
                  ) : (
                    patientReparasi.map((r) => (
                      <div key={r.id} className="text-slate-700">
                        [{r.branchCode}] {r.jenisABD} - <span className="font-bold text-amber-700">{r.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Earmould Modal */}
      {quickEarmouldModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Disc className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Order Earmould Pasien</h3>
                  <p className="text-xs text-slate-500">{quickEarmouldModalPatient.id} - {quickEarmouldModalPatient.nama}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickEarmouldModalPatient(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddEarmouldSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Earmould</label>
                <select
                  value={jenisEarmould}
                  onChange={(e) => setJenisEarmould(e.target.value as JenisEarmould)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-800"
                >
                  <option value="H/C">H/C (Hard Clear)</option>
                  <option value="S/C">S/C (Soft Clear)</option>
                  <option value="H/FS">H/FS (Hard Full Shell)</option>
                  <option value="S/FS">S/FS (Soft Full Shell)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pemasangan / Qty</label>
                <select
                  value={qty}
                  onChange={(e) => setQty(e.target.value as FittingType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-semibold text-slate-800"
                >
                  <option value="Binaural">Binaural (Kanan & Kiri)</option>
                  <option value="Monoaural (Kanan)">Monoaural (Kanan)</option>
                  <option value="Monoaural (Kiri)">Monoaural (Kiri)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan pengerjaan lab, impresi telinga, dll..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEarmouldModalPatient(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
                >
                  Simpan Order Earmould
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audiogram Print Modal */}
      {selectedJasaForAudiogram && (
        <PrintAudiogramModal
          isOpen={!!selectedJasaForAudiogram}
          onClose={() => setSelectedJasaForAudiogram(null)}
          transaction={selectedJasaForAudiogram}
          patient={selectedPatient}
          currentBranch={selectedJasaForAudiogram.branchCode}
        />
      )}
    </div>
  );
};
