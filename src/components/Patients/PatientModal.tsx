import React, { useState, useEffect } from 'react';
import { Patient, ReferalSource, Gender } from '../../types';
import { calculateAge, generatePatientId } from '../../utils/formatters';
import { PROVINSI_INDONESIA, getKabupatenList } from '../../utils/indonesiaLocations';
import { X, UserPlus, Check, User, MapPin } from 'lucide-react';
import { SearchableDoctorSelect } from '../Common/SearchableDoctorSelect';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  existingCount: number;
  patientToEdit?: Patient | null;
  activeBranchCode?: string;
}

const REFERAL_OPTIONS: ReferalSource[] = [
  'Pasien Lama',
  'Plang Toko, Neonbox, Google Maps / Walk-in',
  'Dokter Umum dan Dokter Spesialis',
  'Google',
  'Social Media (FB, IG, Tiktok)',
  'Shopee',
  'Saudara atau Teman Dekat',
  'Brosur',
  'Lain-lain',
];

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCount,
  patientToEdit,
  activeBranchCode = 'HQ',
}) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    id: '',
    gelar: '',
    nama: '',
    tanggalLahir: '1985-01-01',
    usia: 0,
    gender: 'L',
    telepon: '',
    alamat: {
      jalanNo: '',
      kecamatan: '',
      kabupatenKota: 'Kota Surabaya',
      provinsi: 'Jawa Timur',
    },
    referal: 'Plang Toko, Neonbox, Google Maps / Walk-in',
    namaDokter: '',
    namaRS: '',
    referalChannel: '',
    referalDetail: '',
  });

  const [isCustomProvinsi, setIsCustomProvinsi] = useState(false);
  const [isCustomKabupaten, setIsCustomKabupaten] = useState(false);

  useEffect(() => {
    if (patientToEdit) {
      setFormData(patientToEdit);
    } else {
      const newId = generatePatientId(existingCount, activeBranchCode);
      const defaultBirth = '1985-01-01';
      setFormData({
        id: newId,
        gelar: '',
        nama: '',
        tanggalLahir: defaultBirth,
        usia: calculateAge(defaultBirth),
        gender: 'L',
        telepon: '',
        alamat: {
          jalanNo: '',
          kecamatan: '',
          kabupatenKota: 'Kota Surabaya',
          provinsi: 'Jawa Timur',
        },
        referal: 'Plang Toko, Neonbox, Google Maps / Walk-in',
        namaDokter: '',
        namaRS: '',
        referalChannel: '',
        referalDetail: '',
      });
    }
  }, [patientToEdit, existingCount, isOpen, activeBranchCode]);

  const handleBirthDateChange = (dateStr: string) => {
    const computedAge = calculateAge(dateStr);
    setFormData((prev) => ({
      ...prev,
      tanggalLahir: dateStr,
      usia: computedAge,
    }));
  };

  const handleProvinsiChange = (prov: string) => {
    if (prov === '__CUSTOM__') {
      setIsCustomProvinsi(true);
      setFormData((prev) => ({
        ...prev,
        alamat: {
          ...prev.alamat!,
          provinsi: '',
          kabupatenKota: '',
        },
      }));
    } else {
      setIsCustomProvinsi(false);
      const kabupatenList = getKabupatenList(prov);
      const defaultKab = kabupatenList.length > 0 ? kabupatenList[0] : '';
      setFormData((prev) => ({
        ...prev,
        alamat: {
          ...prev.alamat!,
          provinsi: prov,
          kabupatenKota: defaultKab,
        },
      }));
    }
  };

  const handleKabupatenChange = (kab: string) => {
    if (kab === '__CUSTOM__') {
      setIsCustomKabupaten(true);
      setFormData((prev) => ({
        ...prev,
        alamat: {
          ...prev.alamat!,
          kabupatenKota: '',
        },
      }));
    } else {
      setIsCustomKabupaten(false);
      setFormData((prev) => ({
        ...prev,
        alamat: {
          ...prev.alamat!,
          kabupatenKota: kab,
        },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim()) {
      alert('Mohon isi nama pasien');
      return;
    }

    const isOnline = 
      (formData.referal === 'Google' && formData.referalChannel !== 'Google Maps' && formData.referalChannel !== 'Google Maps (Gmaps)' && formData.referalChannel !== 'Google Maps / GMB') || 
      formData.referal === 'Social Media (FB, IG, Tiktok)' || 
      (formData.referalChannel && ['Google Ads', 'Meta / FB Ads', 'Instagram', 'TikTok', 'Website / Organik', 'Website'].includes(formData.referalChannel));
    
    const isDokterOrRS = 
      formData.referal === 'Dokter Umum dan Dokter Spesialis' || 
      Boolean(formData.namaDokter) || 
      Boolean(formData.namaRS);

    const determinedCategory = isDokterOrRS 
      ? 'Dokter & Faskes' 
      : isOnline 
      ? 'Online' 
      : 'Offline';

    const finalPatient: Patient = {
      id: formData.id || generatePatientId(existingCount, activeBranchCode),
      gelar: formData.gelar?.trim() || undefined,
      nama: formData.nama.trim(),
      tanggalLahir: formData.tanggalLahir || '1990-01-01',
      usia: formData.usia ?? calculateAge(formData.tanggalLahir || '1990-01-01'),
      gender: (formData.gender as Gender) || 'L',
      telepon: formData.telepon || '-',
      alamat: {
        jalanNo: formData.alamat?.jalanNo || '',
        kecamatan: formData.alamat?.kecamatan || '-',
        kabupatenKota: formData.alamat?.kabupatenKota || '-',
        provinsi: formData.alamat?.provinsi || '-',
      },
      referal: (formData.referal as ReferalSource) || 'Plang Toko, Neonbox, Google Maps / Walk-in',
      namaDokter: formData.namaDokter?.trim() || undefined,
      namaRS: formData.namaRS?.trim() || undefined,
      referalChannel: formData.referalChannel?.trim() || undefined,
      referalCategory: determinedCategory,
      referalDetail: formData.referalDetail?.trim() || undefined,
      createdAt: patientToEdit?.createdAt || new Date().toISOString().split('T')[0],
      branchCode: patientToEdit?.branchCode || activeBranchCode,
    };

    onSave(finalPatient);
    onClose();
  };

  if (!isOpen) return null;

  const kabupatenOptions = getKabupatenList(formData.alamat?.provinsi || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-scaleIn">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#23277A] rounded-lg text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {patientToEdit ? 'Edit Data Pasien' : 'Registrasi Pasien Baru'}
              </h2>
              <p className="text-xs text-slate-300">
                Pusat Alat Bantu Dengar Earsound (Cabang [{activeBranchCode}])
              </p>
            </div>
          </div>
          <button
            id="close-patient-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ID Pelanggan, Gelar & Nama */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID Pelanggan (ES-{activeBranchCode}-xxxxx)
              </label>
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-[#23277A] cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gelar / Sapaan
              </label>
              <select
                value={formData.gelar || ''}
                onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#23277A] focus:border-[#23277A]"
              >
                <option value="">- Tanpa Gelar -</option>
                <option value="Tn">Tn. (Tuan)</option>
                <option value="Ny">Ny. (Nyonya)</option>
                <option value="Nn">Nn. (Nona)</option>
                <option value="Dr">Dr. (Dokter)</option>
                <option value="Bpk">Bpk. (Bapak)</option>
                <option value="Ibu">Ibu</option>
                <option value="Sdr">Sdr. (Saudara)</option>
                <option value="Sdri">Sdri. (Saudari)</option>
              </select>
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pasien / Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#23277A] focus:border-[#23277A]"
                />
              </div>
            </div>
          </div>

          {/* Tanggal Lahir, Usia Otomatis, Gender */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.tanggalLahir || ''}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#23277A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usia Saat Ini (Tahun)
              </label>
              <div className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>{formData.usia ?? 0} Tahun</span>
                <span className="text-xs text-[#23277A] bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                  Otomatis
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender (Jenis Kelamin) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'L' })}
                  className={`p-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    formData.gender === 'L'
                      ? 'bg-[#23277A] text-white border-[#23277A] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Laki-Laki (L)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'P' })}
                  className={`p-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    formData.gender === 'P'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Perempuan (P)
                </button>
              </div>
            </div>
          </div>

          {/* Telepon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              placeholder="Contoh: 0812-3456-7890"
              value={formData.telepon || ''}
              onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#23277A]"
            />
          </div>

          {/* Alamat (Detail Jalan, Kecamatan, Kabupaten/Kota, Provinsi) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#23277A]" />
              <span>Detail Alamat Domisili Pasien</span>
            </h3>

            {/* Jalan / No. Rumah / RT RW */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Jalan, No. Rumah, RT/RW, Kelurahan
              </label>
              <input
                type="text"
                placeholder="Contoh: Jl. Raya Darmo No. 45, RT 02 / RW 05, Kel. Darmo"
                value={formData.alamat?.jalanNo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    alamat: { ...formData.alamat!, jalanNo: e.target.value },
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-[#23277A]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Provinsi */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Provinsi <span className="text-red-500">*</span>
                </label>
                {!isCustomProvinsi ? (
                  <select
                    value={formData.alamat?.provinsi || 'Jawa Timur'}
                    onChange={(e) => handleProvinsiChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#23277A]"
                  >
                    {PROVINSI_INDONESIA.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Ketik Provinsi Lain</option>
                  </select>
                ) : (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Nama Provinsi"
                      value={formData.alamat?.provinsi || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alamat: { ...formData.alamat!, provinsi: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomProvinsi(false)}
                      className="text-[10px] bg-slate-200 px-2 rounded font-bold text-slate-600"
                    >
                      Pilih
                    </button>
                  </div>
                )}
              </div>

              {/* Kabupaten / Kota */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kabupaten / Kota <span className="text-red-500">*</span>
                </label>
                {!isCustomKabupaten && kabupatenOptions.length > 0 ? (
                  <select
                    value={formData.alamat?.kabupatenKota || ''}
                    onChange={(e) => handleKabupatenChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#23277A]"
                  >
                    {kabupatenOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Ketik Kota/Kab Lain</option>
                  </select>
                ) : (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Kabupaten / Kota"
                      value={formData.alamat?.kabupatenKota || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alamat: { ...formData.alamat!, kabupatenKota: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A]"
                    />
                    {kabupatenOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCustomKabupaten(false)}
                        className="text-[10px] bg-slate-200 px-2 rounded font-bold text-slate-600"
                      >
                        Pilih
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Kecamatan */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gubeng"
                  value={formData.alamat?.kecamatan || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alamat: { ...formData.alamat!, kecamatan: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A]"
                />
              </div>
            </div>
          </div>

          {/* Referal */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Sumber Referal Informasi Earsound <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.referal || REFERAL_OPTIONS[0]}
                onChange={(e) => {
                  const newRef = e.target.value as ReferalSource;
                  setFormData({ 
                    ...formData, 
                    referal: newRef,
                    referalChannel: newRef === 'Social Media (FB, IG, Tiktok)' ? 'Instagram' : newRef === 'Google' ? 'Google Ads' : undefined
                  });
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#23277A]"
              >
                {REFERAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-pilihan untuk Online Marketing (Social Media & Google) */}
            {(formData.referal === 'Google' || formData.referal === 'Social Media (FB, IG, Tiktok)') && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-700">
                  Detail Saluran Marketing Online:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Google Ads', 'Meta / FB Ads', 'Instagram', 'TikTok', 'Website / Organik', 'WhatsApp / CS'].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setFormData({ ...formData, referalChannel: ch })}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                        formData.referalChannel === ch
                          ? 'bg-[#23277A] text-white border-[#23277A] font-semibold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Saluran/Akun Spesifik (opsional, misal: IG @earsound_official)"
                  value={formData.referalChannel || ''}
                  onChange={(e) => setFormData({ ...formData, referalChannel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A] mt-1"
                />
              </div>
            )}

            {/* Sub-pilihan untuk Rujukan Dokter / RS */}
            {formData.referal === 'Dokter Umum dan Dokter Spesialis' && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Dokter Perujuk / Spesialis THT <span className="text-red-500">*</span>
                    </label>
                    <SearchableDoctorSelect
                      value={formData.namaDokter || ''}
                      onChange={(val) => setFormData({ ...formData, namaDokter: val })}
                      placeholder="Cari atau pilih nama dokter..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Rumah Sakit / Faskes / Klinik Asal
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: RSUD Dr. M. Djamil / RS Mitra"
                      value={formData.namaRS || ''}
                      onChange={(e) => setFormData({ ...formData, namaRS: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-[#23277A]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Catatan / Keterangan Referal */}
            <div>
              <input
                type="text"
                placeholder="Catatan tambahan referal (misal: Rujukan Pasien Bp. Herman / Event Pameran Mall)"
                value={formData.referalDetail || ''}
                onChange={(e) => setFormData({ ...formData, referalDetail: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#23277A]"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23277A] hover:bg-[#181B57] text-white font-bold text-sm shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{patientToEdit ? 'Simpan Perubahan' : 'Daftarkan Pasien'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
