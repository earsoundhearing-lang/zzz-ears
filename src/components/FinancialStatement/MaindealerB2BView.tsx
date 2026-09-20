import React, { useState } from 'react';
import { 
  MaindealerB2BTransaction, 
  MaindealerSupplyTransaction, 
  BranchCode, 
  MaindealerSupplyScheme,
  B2BCustomerType
} from '../../types';
import { BRANCHES } from '../../utils/branches';
import { 
  Building2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Search, 
  Printer, 
  Boxes, 
  Truck, 
  Sparkles, 
  Stethoscope,
  Tag
} from 'lucide-react';
import { MASTER_HPP_ABD, MASTER_HPP_AKSESORIS, getHppForABD, getHppForAksesoris } from '../../data/hppCatalog';

interface MaindealerB2BViewProps {
  b2bTransactions: MaindealerB2BTransaction[];
  supplyTransactions: MaindealerSupplyTransaction[];
  onAddB2B: (tx: MaindealerB2BTransaction) => void;
  onUpdateB2BStatus: (id: string, status: 'LUNAS' | 'PIUTANG_BERJALAN' | 'JATUH_TEMPO') => void;
  onAddSupply: (tx: MaindealerSupplyTransaction) => void;
  onUpdateSupplyStatus: (id: string, status: 'BELUM_LUNAS' | 'LUNAS' | 'KONSINYASI_TERPAJANG') => void;
  canManage: boolean;
}

export const MaindealerB2BView: React.FC<MaindealerB2BViewProps> = ({
  b2bTransactions = [],
  supplyTransactions = [],
  onAddB2B,
  onUpdateB2BStatus,
  onAddSupply,
  onUpdateSupplyStatus,
  canManage,
}) => {
  const [activeTab, setActiveTab] = useState<'DISTRIBUSI_CABANG' | 'PENJUALAN_B2B' | 'INSTRUMEN_AUDIOLOGI'>('DISTRIBUSI_CABANG');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isB2BModalOpen, setIsB2BModalOpen] = useState(false);

  // New Supply Form
  const [newSupply, setNewSupply] = useState<{
    cabangTujuan: BranchCode;
    skema: MaindealerSupplyScheme;
    namaBarang: string;
    kategori: 'ABD' | 'Aksesoris' | 'Baterai' | 'Sparepart';
    qty: number;
    hargaModalMD: number;
    hargaJualKeCabang: number;
    catatan: string;
  }>({
    cabangTujuan: 'YM',
    skema: 'TERMIN_PEMBAYARAN',
    namaBarang: '',
    kategori: 'ABD',
    qty: 1,
    hargaModalMD: 0,
    hargaJualKeCabang: 0,
    catatan: '',
  });

  // New B2B Form
  const [newB2B, setNewB2B] = useState<{
    namaCustomer: string;
    tipeCustomer: B2BCustomerType;
    kontak: string;
    alamat: string;
    kategoriProduk: 'Instrumen Audiologi' | 'Alat Bantu Dengar (Grosir)' | 'Aksesoris & Part' | 'Support Retail (HiPRO/NOAHLINK)';
    itemDetail: string;
    qty: number;
    hargaSatuan: number;
    metodePembayaran: 'Transfer Bank BSI' | 'Transfer Bank BNI' | 'Termin 30 Hari' | 'Termin 60 Hari' | 'Cash';
    catatan: string;
  }>({
    namaCustomer: '',
    tipeCustomer: 'Rumah Sakit',
    kontak: '',
    alamat: '',
    kategoriProduk: 'Instrumen Audiologi',
    itemDetail: 'Audiometer Diagnostic R27A',
    qty: 1,
    hargaSatuan: 0,
    metodePembayaran: 'Transfer Bank BSI',
    catatan: '',
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Calculations
  const totalSupplyKonsinyasi = supplyTransactions
    .filter(s => s.skema === 'KONSINYASI')
    .reduce((acc, s) => acc + s.totalNilai, 0);

  const totalSupplyTermin = supplyTransactions
    .filter(s => s.skema === 'TERMIN_PEMBAYARAN')
    .reduce((acc, s) => acc + s.totalNilai, 0);

  const totalOmsetB2B = b2bTransactions.reduce((acc, b) => acc + b.totalTagihan, 0);
  const totalPiutangB2B = b2bTransactions
    .filter(b => b.status !== 'LUNAS')
    .reduce((acc, b) => acc + b.totalTagihan, 0);

  const handleCreateSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupply.namaBarang) return;

    const total = newSupply.qty * newSupply.hargaJualKeCabang;
    const tx: MaindealerSupplyTransaction = {
      id: `sj-md-${Date.now()}`,
      nomorSuratJalan: `SJ-MD-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString().split('T')[0],
      cabangTujuan: newSupply.cabangTujuan,
      skema: newSupply.skema,
      namaBarang: newSupply.namaBarang,
      kategori: newSupply.kategori,
      qty: Number(newSupply.qty),
      hargaModalMD: Number(newSupply.hargaModalMD),
      hargaJualKeCabang: Number(newSupply.hargaJualKeCabang),
      totalNilai: total,
      statusPembayaran: newSupply.skema === 'KONSINYASI' ? 'KONSINYASI_TERPAJANG' : 'BELUM_LUNAS',
      catatan: newSupply.catatan,
      createdAt: new Date().toISOString(),
    };

    onAddSupply(tx);
    setIsSupplyModalOpen(false);
    setNewSupply({
      cabangTujuan: 'YM',
      skema: 'TERMIN_PEMBAYARAN',
      namaBarang: '',
      kategori: 'ABD',
      qty: 1,
      hargaModalMD: 0,
      hargaJualKeCabang: 0,
      catatan: '',
    });
  };

  const handleCreateB2B = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newB2B.namaCustomer || !newB2B.itemDetail) return;

    const subtotal = newB2B.qty * newB2B.hargaSatuan;
    const isLunas = newB2B.metodePembayaran === 'Transfer Bank BSI' || newB2B.metodePembayaran === 'Transfer Bank BNI' || newB2B.metodePembayaran === 'Cash';

    const tx: MaindealerB2BTransaction = {
      id: `inv-b2b-${Date.now()}`,
      nomorInvoice: `INV-B2B-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString().split('T')[0],
      namaCustomer: newB2B.namaCustomer,
      tipeCustomer: newB2B.tipeCustomer,
      kontak: newB2B.kontak,
      alamat: newB2B.alamat,
      kategoriProduk: newB2B.kategoriProduk,
      itemDetail: newB2B.itemDetail,
      qty: Number(newB2B.qty),
      hargaSatuan: Number(newB2B.hargaSatuan),
      subtotal: subtotal,
      totalTagihan: subtotal,
      metodePembayaran: newB2B.metodePembayaran,
      status: isLunas ? 'LUNAS' : 'PIUTANG_BERJALAN',
      catatan: newB2B.catatan,
      createdAt: new Date().toISOString(),
    };

    onAddB2B(tx);
    setIsB2BModalOpen(false);
    setNewB2B({
      namaCustomer: '',
      tipeCustomer: 'Rumah Sakit',
      kontak: '',
      alamat: '',
      kategoriProduk: 'Instrumen Audiologi',
      itemDetail: 'Audiometer Diagnostic R27A',
      qty: 1,
      hargaSatuan: 0,
      metodePembayaran: 'Transfer Bank BSI',
      catatan: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-[#2A2F86] border border-indigo-100">
              MAINDEALER & PUSAT SUPLAI
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              B2B & Suplai Cabang
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Maindealer Hub & Transaksi B2B</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat penyedia barang dagangan seluruh cabang, distribusi konsinyasi/termin, dan penjualan instrumen audiologi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={() => setIsSupplyModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#2A2F86] hover:bg-[#23277A] text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Suplai ke Cabang
              </button>
              <button
                onClick={() => setIsB2BModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Transaksi B2B
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Suplai Konsinyasi</span>
            <Boxes className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-purple-600 font-mono">{formatRupiah(totalSupplyKonsinyasi)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Stok titip di display cabang</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Suplai Termin (Piutang Cabang)</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-[#2A2F86] font-mono">{formatRupiah(totalSupplyTermin)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Akun 151 - 157 Piutang Cabang</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Omset B2B & Instrumen</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600 font-mono">{formatRupiah(totalOmsetB2B)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Akun 406 & 407 Penjualan Mitra</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Piutang B2B Berjalan</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-600 font-mono">{formatRupiah(totalPiutangB2B)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Tagihan RS / Klinik / Mitra ritel</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Tab switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('DISTRIBUSI_CABANG')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'DISTRIBUSI_CABANG' 
                  ? 'bg-white text-[#2A2F86] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Distribusi Suplai ke Cabang ({supplyTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('PENJUALAN_B2B')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PENJUALAN_B2B' 
                  ? 'bg-white text-[#2A2F86] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Penjualan B2B Rekanan ({b2bTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('INSTRUMEN_AUDIOLOGI')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'INSTRUMEN_AUDIOLOGI' 
                  ? 'bg-white text-[#2A2F86] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Instrumen Klinis (Audiometer, HiPRO, Noahlink)
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#2A2F86]"
            />
          </div>
        </div>

        {/* Tab 1: Distribusi Suplai ke Cabang */}
        {activeTab === 'DISTRIBUSI_CABANG' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">No. Surat Jalan & Tgl</th>
                  <th className="py-3 px-4">Cabang Tujuan</th>
                  <th className="py-3 px-4">Item & Kategori</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-center">Skema Transaksi</th>
                  <th className="py-3 px-4 text-right">Modal MD (HPP)</th>
                  <th className="py-3 px-4 text-right">Harga Jual ke Cabang</th>
                  <th className="py-3 px-4 text-right">Total Nilai</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canManage && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplyTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Belum ada transaksi distribusi ke cabang. Klik "Suplai ke Cabang" untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  supplyTransactions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono">{s.nomorSuratJalan}</div>
                        <div className="text-[11px] text-slate-400">{s.tanggal}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {s.cabangTujuan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{s.namaBarang}</div>
                        <div className="text-[11px] text-slate-500">{s.kategori}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {s.qty}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.skema === 'KONSINYASI' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {s.skema === 'KONSINYASI' ? 'Konsinyasi (Titip)' : 'Termin Pembayaran'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatRupiah(s.hargaModalMD || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatRupiah(s.hargaJualKeCabang)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(s.totalNilai)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.statusPembayaran === 'LUNAS' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            LUNAS
                          </span>
                        ) : s.statusPembayaran === 'KONSINYASI_TERPAJANG' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                            TERPAJANG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                            BELUM LUNAS
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-center">
                          {s.statusPembayaran !== 'LUNAS' && (
                            <button
                              onClick={() => onUpdateSupplyStatus(s.id, 'LUNAS')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                            >
                              Tandai Lunas
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Penjualan B2B */}
        {(activeTab === 'PENJUALAN_B2B' || activeTab === 'INSTRUMEN_AUDIOLOGI') && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">No. Invoice & Tgl</th>
                  <th className="py-3 px-4">Customer & Tipe</th>
                  <th className="py-3 px-4">Kategori & Item</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-center">Metode Pembayaran</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canManage && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {b2bTransactions
                  .filter(b => activeTab === 'PENJUALAN_B2B' || b.kategoriProduk === 'Instrumen Audiologi')
                  .length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data transaksi B2B pada kategori ini. Klik "Transaksi B2B" untuk menambah.
                    </td>
                  </tr>
                ) : (
                  b2bTransactions
                    .filter(b => activeTab === 'PENJUALAN_B2B' || b.kategoriProduk === 'Instrumen Audiologi')
                    .map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono">{b.nomorInvoice}</div>
                        <div className="text-[11px] text-slate-400">{b.tanggal}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.namaCustomer}</div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-[#2A2F86] mt-0.5">
                          {b.tipeCustomer}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{b.itemDetail}</div>
                        <div className="text-[10px] text-slate-400">{b.kategoriProduk}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {b.qty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(b.totalTagihan)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-medium text-slate-600">
                          {b.metodePembayaran}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {b.status === 'LUNAS' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            LUNAS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            PIUTANG
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-center">
                          {b.status !== 'LUNAS' ? (
                            <button
                              onClick={() => onUpdateB2BStatus(b.id, 'LUNAS')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs"
                            >
                              Pelunasan
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateB2BStatus(b.id, 'PIUTANG_BERJALAN')}
                              className="text-[10px] text-slate-400 hover:text-red-600 underline"
                            >
                              Batal Lunas
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Suplai ke Cabang */}
      {isSupplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#2A2F86]" />
                <h3 className="font-bold text-slate-800 text-sm">Surat Jalan Suplai Maindealer ke Cabang</h3>
              </div>
              <button onClick={() => setIsSupplyModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSupply} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cabang Tujuan:</label>
                  <select
                    value={newSupply.cabangTujuan}
                    onChange={(e) => setNewSupply(prev => ({ ...prev, cabangTujuan: e.target.value as BranchCode }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  >
                    {BRANCHES.filter(b => b.code !== 'MD').map(b => (
                      <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Skema Transaksi:</label>
                  <select
                    value={newSupply.skema}
                    onChange={(e) => setNewSupply(prev => ({ ...prev, skema: e.target.value as MaindealerSupplyScheme }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  >
                    <option value="TERMIN_PEMBAYARAN">Termin Pembayaran (Piutang Cabang)</option>
                    <option value="KONSINYASI">Konsinyasi (Titip Display)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 font-semibold">Nama Barang / Seri Alat:</label>
                  <span className="text-[11px] text-[#2A2F86] font-medium">Bisa ketik SKU (cth: ENS10, DRY01, S13SN)</span>
                </div>
                <input
                  type="text"
                  required
                  list="master-hpp-list"
                  placeholder="Contoh: ENS10, Sonic Enchant 20 BTE (E2OBD), DRY01, Baterai 13 Sonic"
                  value={newSupply.namaBarang}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleanVal = val.trim().toUpperCase();
                    let autoHpp = 0;
                    if (MASTER_HPP_ABD[cleanVal]) {
                      autoHpp = MASTER_HPP_ABD[cleanVal].hpp;
                    } else if (MASTER_HPP_AKSESORIS[cleanVal]) {
                      autoHpp = MASTER_HPP_AKSESORIS[cleanVal].hpp;
                    } else {
                      autoHpp = getHppForABD(val, val) || getHppForAksesoris(val, val);
                    }

                    setNewSupply(prev => ({
                      ...prev,
                      namaBarang: val,
                      hargaModalMD: autoHpp > 0 ? autoHpp : prev.hargaModalMD
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                />
                <datalist id="master-hpp-list">
                  {Object.entries(MASTER_HPP_ABD).map(([sku, item]) => (
                    <option key={sku} value={sku}>{sku} - {item.nama} (HPP Resmi: Rp {item.hpp.toLocaleString('id-ID')})</option>
                  ))}
                  {Object.entries(MASTER_HPP_AKSESORIS).map(([sku, item]) => (
                    <option key={sku} value={sku}>{sku} - {item.nama} (HPP Resmi: Rp {item.hpp.toLocaleString('id-ID')})</option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kategori:</label>
                  <select
                    value={newSupply.kategori}
                    onChange={(e) => setNewSupply(prev => ({ ...prev, kategori: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  >
                    <option value="ABD">Alat Bantu Dengar</option>
                    <option value="Aksesoris">Aksesoris</option>
                    <option value="Baterai">Baterai</option>
                    <option value="Sparepart">Sparepart / Amplifier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Qty (Jumlah):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSupply.qty}
                    onChange={(e) => setNewSupply(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 font-semibold">
                      HPP / Modal MD:
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rp Modal Beli..."
                    value={newSupply.hargaModalMD || ''}
                    onChange={(e) => setNewSupply(prev => ({ ...prev, hargaModalMD: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Transfer ke Cabang:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Rp Jual Cabang..."
                    value={newSupply.hargaJualKeCabang || ''}
                    onChange={(e) => setNewSupply(prev => ({ ...prev, hargaJualKeCabang: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  />
                </div>
              </div>

              {/* Kalkulasi Otomatis HPP & Margin */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-2">
                <div>
                  <span className="text-slate-500">Total HPP MD: </span>
                  <span className="font-bold font-mono text-slate-800">
                    {formatRupiah((newSupply.hargaModalMD || 0) * (newSupply.qty || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Total Nilai Suplai: </span>
                  <span className="font-bold font-mono text-indigo-900">
                    {formatRupiah((newSupply.hargaJualKeCabang || 0) * (newSupply.qty || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Gross Margin MD: </span>
                  <span className="font-bold font-mono text-emerald-700">
                    +{formatRupiah(((newSupply.hargaJualKeCabang || 0) - (newSupply.hargaModalMD || 0)) * (newSupply.qty || 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Catatan / No. Seri:</label>
                <input
                  type="text"
                  placeholder="Catatan surat jalan atau nomor seri unit..."
                  value={newSupply.catatan}
                  onChange={(e) => setNewSupply(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplyModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2A2F86] hover:bg-[#23277A] text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Terbitkan Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transaksi B2B */}
      {isB2BModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Input Transaksi Penjualan B2B / Instrumen</h3>
              </div>
              <button onClick={() => setIsB2BModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateB2B} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Customer / Mitra:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: RS Columbia Asia, dr. Hendra Sp.THT"
                    value={newB2B.namaCustomer}
                    onChange={(e) => setNewB2B(prev => ({ ...prev, namaCustomer: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tipe Customer:</label>
                  <select
                    value={newB2B.tipeCustomer}
                    onChange={(e) => setNewB2B(prev => ({ ...prev, tipeCustomer: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Rumah Sakit">Rumah Sakit</option>
                    <option value="Klinik Swasta">Klinik Swasta</option>
                    <option value="Dokter Spesialis">Dokter Spesialis</option>
                    <option value="Ritel ABD Rekanan">Ritel ABD Rekanan</option>
                    <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                    <option value="Perorangan">Perorangan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kategori Produk:</label>
                <select
                  value={newB2B.kategoriProduk}
                  onChange={(e) => setNewB2B(prev => ({ ...prev, kategoriProduk: e.target.value as any }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Instrumen Audiologi">Instrumen Audiologi (Audiometer, Tymp, OAE, BERA)</option>
                  <option value="Support Retail (HiPRO/NOAHLINK)">Support Retail (HiPRO, Noahlink Wireless)</option>
                  <option value="Alat Bantu Dengar (Grosir)">Alat Bantu Dengar (Grosir/Partai)</option>
                  <option value="Aksesoris & Part">Aksesoris, Baterai & Part Grosir</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Detail Item / Unit:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Resonance R27A Diagnostic Audiometer, Noahlink Wireless 2"
                  value={newB2B.itemDetail}
                  onChange={(e) => setNewB2B(prev => ({ ...prev, itemDetail: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newB2B.qty}
                    onChange={(e) => setNewB2B(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Harga Satuan (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newB2B.hargaSatuan}
                    onChange={(e) => setNewB2B(prev => ({ ...prev, hargaSatuan: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Metode Pembayaran:</label>
                  <select
                    value={newB2B.metodePembayaran}
                    onChange={(e) => setNewB2B(prev => ({ ...prev, metodePembayaran: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Transfer Bank BSI">Transfer Bank BSI (Lunas Langsung)</option>
                    <option value="Transfer Bank BNI">Transfer Bank BNI (Lunas Langsung)</option>
                    <option value="Termin 30 Hari">Termin 30 Hari (Piutang Usaha 105)</option>
                    <option value="Termin 60 Hari">Termin 60 Hari (Piutang Usaha 105)</option>
                    <option value="Cash">Cash / Tunai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">No. Kontak / HP:</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newB2B.kontak}
                    onChange={(e) => setNewB2B(prev => ({ ...prev, kontak: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsB2BModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Simpan Invoice B2B
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
