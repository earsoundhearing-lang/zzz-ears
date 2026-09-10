import React, { useState, useEffect } from 'react';
import { 
  AksesorisTransaction, 
  JasaPeriksaTransaction, 
  ABDTransaction, 
  Patient, 
  JenisPemeriksaan, 
  ReferalSource, 
  PaymentDetails, 
  FittingType,
  AksesorisTypeCategory,
  BsiAccount,
  PaymentMethod
} from '../../types';
import { ABD_PRICE_CATALOG, PAKET_BUNDLING, CATALOG_AKSESORIS_SERVICE } from '../../data/priceCatalog';
import { PaymentSelector } from './PaymentSelector';
import { Edit3, Save, X, Calculator, Stethoscope, Volume2, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AksesorisTransaction | JasaPeriksaTransaction | ABDTransaction | null;
  type: 'AKS' | 'JSA' | 'ABD';
  patients?: Patient[];
  onSaveAksesoris?: (updated: AksesorisTransaction) => void;
  onSaveJasa?: (updated: JasaPeriksaTransaction) => void;
  onSaveABD?: (updated: ABDTransaction) => void;
}

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

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  type,
  patients = [],
  onSaveAksesoris,
  onSaveJasa,
  onSaveABD,
}) => {
  // Generic State
  const [tanggal, setTanggal] = useState(transaction?.tanggal || new Date().toISOString().split('T')[0]);
  const [idPelanggan, setIdPelanggan] = useState(transaction?.idPelanggan || '');
  const [payment, setPayment] = useState<PaymentDetails>(transaction?.payment || { method: 'Transfer' });

  // Aksesoris Specific State
  const aks = type === 'AKS' ? (transaction as AksesorisTransaction) : null;
  const [aksCategory, setAksCategory] = useState<AksesorisTypeCategory>(aks?.category || 'Baterai Alat Bantu Dengar');
  const [aksSubtype, setAksSubtype] = useState<string>(aks?.subtype || '');
  const [aksQty, setAksQty] = useState<number>(aks?.qty || 1);
  const [aksHargaJual, setAksHargaJual] = useState<number>(aks?.hargaJual || 0);
  const [aksDiskon, setAksDiskon] = useState<number>(aks?.diskon || 0);
  const [aksNamaCustomer, setAksNamaCustomer] = useState<string>(aks?.namaCustomer || '');

  // Jasa Specific State
  const jsa = type === 'JSA' ? (transaction as JasaPeriksaTransaction) : null;
  const [jsaNamaCustomer, setJsaNamaCustomer] = useState<string>(jsa?.namaCustomer || '');
  const [selectedTypes, setSelectedTypes] = useState<JenisPemeriksaan[]>(jsa?.jenisPemeriksaan || ['Audiometri']);
  const [subtotalBiaya, setSubtotalBiaya] = useState<number>(jsa?.subtotalBiaya || jsa?.biayaJasaPeriksa || 50000);
  const [jsaDiskon, setJsaDiskon] = useState<number>(jsa?.diskon || 0);
  const [biayaJasaPeriksa, setBiayaJasaPeriksa] = useState<number>(jsa?.biayaJasaPeriksa || 50000);
  const [resultKananDb, setResultKananDb] = useState<string>(jsa?.resultKananDb || '25');
  const [resultKiriDb, setResultKiriDb] = useState<string>(jsa?.resultKiriDb || '30');
  const [resultTympanometri, setResultTympanometri] = useState<string>(jsa?.resultTympanometri || 'Tipe A');
  const [resultOAE, setResultOAE] = useState<string>(jsa?.resultOAE || 'PASS');
  const [resultBERA, setResultBERA] = useState<string>(jsa?.resultBERA || 'RESPONS');
  const [catatanHasil, setCatatanHasil] = useState<string>(jsa?.catatanHasil || '');
  const [audiometris, setAudiometris] = useState<string>(jsa?.audiometris || 'Diana');
  const [adaFittingABD, setAdaFittingABD] = useState<boolean>(jsa?.adaFittingABD || false);
  const [tipeABDFitting, setTipeABDFitting] = useState<string>(jsa?.tipeABDFitting || '');
  const [potensiPembelian, setPotensiPembelian] = useState<string>(jsa?.potensiPembelian || 'Potensial');
  const [catatanHAC, setCatatanHAC] = useState<string>(jsa?.catatanHAC || '');

  // ABD Specific State
  const abd = type === 'ABD' ? (transaction as ABDTransaction) : null;
  const [abdNamaPasien, setAbdNamaPasien] = useState<string>(abd?.namaPasien || '');
  const [hac, setHac] = useState<string>(abd?.hac || 'Diana');
  const [tipeABD, setTipeABD] = useState<string>(abd?.tipeABD || 'Captivate 100 R');
  const [nomorSeriABD, setNomorSeriABD] = useState<string>(abd?.nomorSeriABD || '');
  const [hargaABD1, setHargaABD1] = useState<number>(abd?.hargaABD1 || abd?.hargaJual || 0);
  const [tipeABD2, setTipeABD2] = useState<string>(abd?.tipeABD2 || '');
  const [nomorSeriABD2, setNomorSeriABD2] = useState<string>(abd?.nomorSeriABD2 || '');
  const [hargaABD2, setHargaABD2] = useState<number>(abd?.hargaABD2 || 0);
  const [paketBundling, setPaketBundling] = useState<string>(abd?.paketBundling || 'Tanpa Bundling');
  const [keteranganBundling, setKeteranganBundling] = useState<string>(abd?.keteranganBundling || '');
  const [hargaBundling, setHargaBundling] = useState<number>(abd?.hargaBundling || 0);
  const [fittingType, setFittingType] = useState<FittingType>(abd?.fittingType || 'Binaural');
  const [abdHargaJual, setAbdHargaJual] = useState<number>(abd?.hargaJual || 0);
  const [abdDiskon, setAbdDiskon] = useState<number>(abd?.diskon || 0);
  const [abdUangMuka, setAbdUangMuka] = useState<number>(abd?.uangMuka || 0);

  // Sync state if props change
  useEffect(() => {
    if (!transaction) return;
    setTanggal(transaction.tanggal);
    setIdPelanggan(transaction.idPelanggan);
    setPayment(transaction.payment);

    if (type === 'AKS' && aks) {
      setAksCategory(aks.category);
      setAksSubtype(aks.subtype || '');
      setAksQty(aks.qty || 1);
      setAksHargaJual(aks.hargaJual || 0);
      setAksDiskon(aks.diskon || 0);
      setAksNamaCustomer(aks.namaCustomer || '');
    } else if (type === 'JSA' && jsa) {
      setJsaNamaCustomer(jsa.namaCustomer || '');
      setSelectedTypes(jsa.jenisPemeriksaan || ['Audiometri Nada Murni']);
      setBiayaJasaPeriksa(jsa.biayaJasaPeriksa || 100000);
      setJsaDiskon(jsa.diskon || 0);
      setResultKananDb(jsa.resultKananDb || '25');
      setResultKiriDb(jsa.resultKiriDb || '30');
      setResultTympanometri(jsa.resultTympanometri || 'Tipe A');
      setResultOAE(jsa.resultOAE || 'PASS');
      setResultBERA(jsa.resultBERA || 'RESPONS');
      setCatatanHasil(jsa.catatanHasil || '');
      setAudiometris(jsa.audiometris || 'Diana');
      setAdaFittingABD(jsa.adaFittingABD || false);
      setTipeABDFitting(jsa.tipeABDFitting || '');
      setPotensiPembelian(jsa.potensiPembelian || 'Potensial');
      setCatatanHAC(jsa.catatanHAC || '');
    } else if (type === 'ABD' && abd) {
      setAbdNamaPasien(abd.namaPasien || '');
      setHac(abd.hac || 'Diana');
      setTipeABD(abd.tipeABD || '');
      setNomorSeriABD(abd.nomorSeriABD || '');
      setHargaABD1(abd.hargaABD1 || abd.hargaJual || 0);
      setTipeABD2(abd.tipeABD2 || '');
      setNomorSeriABD2(abd.nomorSeriABD2 || '');
      setHargaABD2(abd.hargaABD2 || 0);
      setPaketBundling(abd.paketBundling || 'Tanpa Bundling');
      setKeteranganBundling(abd.keteranganBundling || '');
      setHargaBundling(abd.hargaBundling || 0);
      setFittingType(abd.fittingType || 'Binaural');
      setAbdHargaJual(abd.hargaJual || 0);
      setAbdDiskon(abd.diskon || 0);
      setAbdUangMuka(abd.uangMuka || 0);
    }
  }, [transaction, type]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'AKS') {
      if (aksHargaJual < 0 || aksQty <= 0) {
        alert('Harga tidak boleh negatif dan Kuantitas minimal 1.');
        return;
      }
      if (aksDiskon < 0 || aksDiskon > (aksHargaJual * aksQty)) {
        alert('Diskon tidak valid (negatif atau lebih besar dari total).');
        return;
      }
    } else if (type === 'JSA') {
      if (biayaJasaPeriksa < 0) {
        alert('Total biaya setelah diskon tidak boleh negatif.');
        return;
      }
      if (jsaDiskon < 0 || jsaDiskon > subtotalBiaya) {
        alert('Diskon tidak valid (negatif atau lebih besar dari subtotal).');
        return;
      }
    } else if (type === 'ABD') {
      if (abdDiskon < 0 || abdDiskon > abdHargaJual) {
        alert('Diskon tidak valid (negatif atau lebih besar dari harga jual gross).');
        return;
      }
      if (abdUangMuka < 0) {
        alert('Uang muka tidak boleh negatif.');
        return;
      }
    }


    if (type === 'AKS' && aks && onSaveAksesoris) {
      const netTotal = Math.max(0, (aksHargaJual * aksQty) - aksDiskon);
      const updatedAks: AksesorisTransaction = {
        ...aks,
        tanggal,
        idPelanggan,
        namaCustomer: aksNamaCustomer,
        category: aksCategory,
        subtype: aksSubtype,
        qty: aksQty,
        hargaJual: aksHargaJual,
        diskon: aksDiskon,
        jumlah: netTotal,
        payment,
      };
      onSaveAksesoris(updatedAks);
    } else if (type === 'JSA' && jsa && onSaveJasa) {
      const updatedJsa: JasaPeriksaTransaction = {
        ...jsa,
        tanggal,
        idPelanggan,
        namaCustomer: jsaNamaCustomer,
        jenisPemeriksaan: selectedTypes,
        subtotalBiaya,
        diskon: jsaDiskon,
        biayaJasaPeriksa,
        resultKananDb,
        resultKiriDb,
        resultTympanometri,
        resultOAE,
        resultBERA,
        catatanHasil,
        audiometris,
        adaFittingABD,
        tipeABDFitting: adaFittingABD ? tipeABDFitting : undefined,
        potensiPembelian: adaFittingABD || catatanHAC ? potensiPembelian : undefined,
        catatanHAC: catatanHAC.trim() ? catatanHAC : undefined,
        audiogram: jsa.audiogram,
        payment,
      };
      onSaveJasa(updatedJsa);
    } else if (type === 'ABD' && abd && onSaveABD) {
      const grossTotal = abdHargaJual;
      const netJumlah = Math.max(0, grossTotal - abdDiskon);
      const dpVal = abdUangMuka || 0;
      const sisaVal = Math.max(0, netJumlah - dpVal);
      const updatedAbd: ABDTransaction = {
        ...abd,
        tanggal,
        idPelanggan,
        namaPasien: abdNamaPasien,
        hac,
        tipeABD,
        nomorSeriABD,
        hargaABD1,
        tipeABD2: fittingType === 'Binaural' ? tipeABD2 : undefined,
        nomorSeriABD2: fittingType === 'Binaural' ? nomorSeriABD2 : undefined,
        hargaABD2: fittingType === 'Binaural' ? hargaABD2 : undefined,
        paketBundling: paketBundling !== 'Tanpa Bundling' ? paketBundling : undefined,
        keteranganBundling,
        hargaBundling,
        fittingType,
        hargaJual: grossTotal,
        diskon: abdDiskon,
        jumlah: netJumlah,
        uangMuka: dpVal,
        sisaPembayaran: sisaVal,
        isDP: sisaVal > 0,
        payment,
      };
      onSaveABD(updatedAbd);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#23277A] flex items-center justify-center shrink-0">
              {type === 'AKS' ? <ShoppingBag className="w-5 h-5" /> : type === 'JSA' ? <Stethoscope className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>Edit Transaksi ({type === 'AKS' ? 'Aksesoris' : type === 'JSA' ? 'Jasa Periksa' : 'ABD'})</span>
                <span className="text-xs bg-amber-100 text-amber-800 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  {type === 'AKS' ? (transaction as AksesorisTransaction).nomorFaktur : type === 'JSA' ? (transaction as JasaPeriksaTransaction).nomorKwitansi : (transaction as ABDTransaction).nomorFakturPenjualan}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Telah terotorisasi dengan PIN khusus. Silakan sesuaikan data transaksi.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Shared Fields: Tanggal & Patient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Pasien / Customer</label>
              <input
                type="text"
                required
                value={type === 'AKS' ? aksNamaCustomer : type === 'JSA' ? jsaNamaCustomer : abdNamaPasien}
                onChange={(e) => {
                  const val = e.target.value;
                  if (type === 'AKS') setAksNamaCustomer(val);
                  else if (type === 'JSA') setJsaNamaCustomer(val);
                  else setAbdNamaPasien(val);
                }}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Type-Specific Fields */}
          {type === 'AKS' && (
            <div className="space-y-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
              <h4 className="font-extrabold text-[#23277A] uppercase tracking-wider text-[11px]">Detail Barang / Aksesoris</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={aksCategory}
                    onChange={(e) => setAksCategory(e.target.value as AksesorisTypeCategory)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  >
                    <option value="Baterai Alat Bantu Dengar">Baterai Alat Bantu Dengar</option>
                    <option value="Aidtip">Aidtip</option>
                    <option value="Earmould">Earmould</option>
                    <option value="Selang Soft">Selang Soft</option>
                    <option value="Drying Jar">Drying Jar</option>
                    <option value="Charger ABD">Charger ABD</option>
                    <option value="Spare Part dan Service">Spare Part dan Service</option>
                    <option value="HA Retainer (Gantungan Alat Bantu Dengar)">HA Retainer</option>
                    <option value="Wax Guard">Wax Guard</option>
                    <option value="Earhook Sonic">Earhook Sonic</option>
                    <option value="Blower">Blower</option>
                    <option value="Pouch">Pouch</option>
                    <option value="Baterai Checker">Baterai Checker</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe / Spesifikasi Item</label>
                  <input
                    type="text"
                    required
                    value={aksSubtype}
                    onChange={(e) => setAksSubtype(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity (Jumlah)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={aksQty}
                    onChange={(e) => setAksQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    required
                    value={aksHargaJual}
                    onChange={(e) => setAksHargaJual(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-[#23277A]"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Potongan Diskon (Rp)</label>
                  <input
                    type="number"
                    value={aksDiskon}
                    onChange={(e) => setAksDiskon(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-rose-700"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'JSA' && (
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px]">Detail Pemeriksaan & Hasil</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtotal Biaya (Rp)</label>
                  <input
                    type="number"
                    value={subtotalBiaya}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setSubtotalBiaya(val);
                      setBiayaJasaPeriksa(Math.max(0, val - jsaDiskon));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Potongan Diskon (Rp)</label>
                  <input
                    type="number"
                    value={jsaDiskon}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setJsaDiskon(val);
                      setBiayaJasaPeriksa(Math.max(0, subtotalBiaya - val));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Biaya Bayar (Rp)</label>
                  <input
                    type="number"
                    value={biayaJasaPeriksa}
                    onChange={(e) => setBiayaJasaPeriksa(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-[#23277A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pemeriksa / Audiometris</label>
                  <select
                    value={audiometris}
                    onChange={(e) => setAudiometris(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  >
                    {['Diana', 'Agung', 'Mutia', 'Dila', 'Adit', 'Ira', 'Fifah', 'Rara', 'Rendi', 'Zidan', 'Vivi'].map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-red-700 mb-1">Hasil Kanan (dB)</label>
                  <input
                    type="text"
                    value={resultKananDb}
                    onChange={(e) => setResultKananDb(e.target.value)}
                    className="w-full bg-white border border-red-300 rounded-xl p-2 font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-blue-700 mb-1">Hasil Kiri (dB)</label>
                  <input
                    type="text"
                    value={resultKiriDb}
                    onChange={(e) => setResultKiriDb(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded-xl p-2 font-bold text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan Hasil Periksa</label>
                  <textarea
                    rows={2}
                    value={catatanHasil}
                    placeholder="Contoh: Ambangan pendengaran sedang pada telinga kanan..."
                    onChange={(e) => setCatatanHasil(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2.5 mt-1">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                    <span className="font-bold text-xs text-amber-950">Catatan Khusus HAC & Trial Fitting ABD</span>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                      <input
                        type="checkbox"
                        checked={adaFittingABD}
                        onChange={(e) => setAdaFittingABD(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>Pasien Melakukan Trial / Fitting ABD?</span>
                    </label>
                  </div>

                  {adaFittingABD && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">Tipe ABD Trial</label>
                        <input
                          type="text"
                          value={tipeABDFitting}
                          placeholder="Contoh: Captivate 100 R / Rexton"
                          onChange={(e) => setTipeABDFitting(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">Status Potensi Leads ABD</label>
                        <select
                          value={potensiPembelian}
                          onChange={(e) => setPotensiPembelian(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold"
                        >
                          <option value="Sangat Potensial">🔥 Sangat Potensial</option>
                          <option value="Potensial">⭐ Potensial</option>
                          <option value="Ragu-ragu">🤔 Ragu-ragu</option>
                          <option value="Kurang Potensial">🌱 Kurang Potensial</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Catatan Khusus HAC (Rekam Medis & CS Follow-Up)</label>
                    <textarea
                      rows={2}
                      value={catatanHAC}
                      placeholder="Catatan HAC tentang respon pasien saat trial, kendala budget, atau instruksi follow-up CS..."
                      onChange={(e) => setCatatanHAC(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'ABD' && (
            <div className="space-y-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
              <h4 className="font-extrabold text-purple-900 uppercase tracking-wider text-[11px]">Detail Alat Bantu Dengar & HAC</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultant / HAC</label>
                  <select
                    value={hac}
                    onChange={(e) => setHac(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  >
                    {['Diana', 'Agung', 'Mutia', 'Dila', 'Adit', 'Ira', 'Fifah', 'Randi', 'Rara', 'Zidan', 'Vivi'].map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fitting Qty</label>
                  <select
                    value={fittingType}
                    onChange={(e) => setFittingType(e.target.value as FittingType)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  >
                    <option value="Binaural">Binaural (2 Unit)</option>
                    <option value="Monoaural (Kanan)">Monoaural (Kanan)</option>
                    <option value="Monoaural (Kiri)">Monoaural (Kiri)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe ABD Unit 1</label>
                  <input
                    type="text"
                    required
                    value={tipeABD}
                    onChange={(e) => setTipeABD(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-purple-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Seri ABD 1</label>
                  <input
                    type="text"
                    value={nomorSeriABD}
                    onChange={(e) => setNomorSeriABD(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold"
                  />
                </div>

                {fittingType === 'Binaural' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tipe ABD Unit 2 (Binaural)</label>
                      <input
                        type="text"
                        value={tipeABD2}
                        onChange={(e) => setTipeABD2(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-purple-950"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nomor Seri ABD 2</label>
                      <input
                        type="text"
                        value={nomorSeriABD2}
                        onChange={(e) => setNomorSeriABD2(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paket Bundling</label>
                  <select
                    value={PAKET_BUNDLING.some(p => p.nama === paketBundling) ? paketBundling : (paketBundling === 'Tanpa Bundling' ? 'Tanpa Bundling' : 'Custom')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPaketBundling(val);
                      const foundPkg = PAKET_BUNDLING.find(p => p.nama === val);
                      if (foundPkg) {
                        setHargaBundling(foundPkg.totalHarga);
                        const itemsText = foundPkg.items.map(it => it.namaItem).join(', ');
                        setKeteranganBundling(`Paket ${foundPkg.nama}: ${itemsText}`);
                      } else if (val === 'Tanpa Bundling') {
                        setHargaBundling(0);
                        setKeteranganBundling('');
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-amber-900"
                  >
                    <option value="Tanpa Bundling">Tanpa Bundling (Rp 0)</option>
                    {PAKET_BUNDLING.map(p => (
                      <option key={p.nama} value={p.nama}>
                        Paket {p.nama} ({formatRupiah(p.totalHarga)})
                      </option>
                    ))}
                    <option value="Custom">Custom / Lainnya</option>
                  </select>
                  {!PAKET_BUNDLING.some(p => p.nama === paketBundling) && paketBundling !== 'Tanpa Bundling' && (
                    <input
                      type="text"
                      value={paketBundling}
                      onChange={(e) => setPaketBundling(e.target.value)}
                      placeholder="Nama paket custom..."
                      className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 font-bold mt-1.5 text-xs text-slate-800"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga Paket Bundling (Rp)</label>
                  <input
                    type="number"
                    value={hargaBundling}
                    onChange={(e) => setHargaBundling(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Isi / Keterangan Bundling</label>
                  <textarea
                    rows={2}
                    value={keteranganBundling}
                    placeholder="Earmould Custom, Baterai 5 Roll, Electric Drying Box, Garansi Service 2 Tahun..."
                    onChange={(e) => setKeteranganBundling(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Harga Gross (Rp)</label>
                  <input
                    type="number"
                    value={abdHargaJual}
                    onChange={(e) => setAbdHargaJual(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-[#23277A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Potongan Diskon (Rp)</label>
                  <input
                    type="number"
                    value={abdDiskon}
                    onChange={(e) => setAbdDiskon(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Uang Muka / DP (Rp)</label>
                  <input
                    type="number"
                    value={abdUangMuka}
                    onChange={(e) => setAbdUangMuka(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sisa Pelunasan (Otomatis)</label>
                  <div className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2 font-black text-rose-800">
                    {formatRupiah(Math.max(0, abdHargaJual - abdDiskon - abdUangMuka))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shared Payment Details */}
          {(() => {
            const activeTotalAmount = type === 'AKS' 
              ? Math.max(0, aksHargaJual * aksQty - aksDiskon)
              : type === 'JSA'
              ? Math.max(0, subtotalBiaya - jsaDiskon)
              : (abdUangMuka && abdUangMuka > 0 ? abdUangMuka : Math.max(0, abdHargaJual - abdDiskon));

            return (
              <PaymentSelector 
                payment={payment} 
                totalAmount={activeTotalAmount}
                branchCode={transaction?.branchCode || 'YM'}
                onChange={setPayment} 
              />
            );
          })()}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#23277A] text-white font-extrabold rounded-xl hover:bg-[#181B57] shadow-md text-xs transition-colors"
            >
              <Save className="w-4 h-4 text-[#F5B438]" />
              <span>Simpan Perubahan Transaksi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
