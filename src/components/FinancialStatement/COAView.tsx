import React, { useState } from 'react';
import { SAK_CHART_OF_ACCOUNTS } from '../../data/coaData';
import { ABD_PRICE_CATALOG, CATALOG_AKSESORIS_SERVICE } from '../../data/priceCatalog';
import { MASTER_HPP_ABD, MASTER_HPP_AKSESORIS } from '../../data/hppCatalog';
import { 
  Search, 
  Printer, 
  Tag, 
  Calculator, 
  BookOpen, 
  HelpCircle, 
  Percent, 
  Layers, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

export const COAView: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'COA' | 'HPP_CATALOG' | 'HPP_GUIDE'>('COA');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // HPP Catalog specific state
  const [hppProductType, setHppProductType] = useState<'ALL' | 'ABD' | 'AKSESORIS'>('ALL');
  const [hppSearchQuery, setHppSearchQuery] = useState('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const categories = ['ALL', 'AKTIVA LANCAR', 'AKTIVA TETAP', 'KEWAJIBAN', 'EKUITAS', 'PENDAPATAN', 'HPP', 'BEBAN OPERASIONAL'];

  const filteredAccounts = SAK_CHART_OF_ACCOUNTS.filter(acc => {
    const matchesCategory = selectedCategory === 'ALL' || acc.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate HPP catalog items based on official master HPP tables
  const abdItemsWithHpp = ABD_PRICE_CATALOG.map(item => {
    // Official master HPP from user data
    const hppResmi = MASTER_HPP_ABD[item.sku]?.hpp || Math.round(item.harga * 0.42);
    const grossMargin = item.harga - hppResmi;
    const marginPercent = Math.round((grossMargin / item.harga) * 100);
    return {
      type: 'ABD' as const,
      sku: item.sku,
      nama: `${item.tipe} (${item.model})`,
      kategori: 'Alat Bantu Dengar',
      hargaJual: item.harga,
      estimasiHpp: hppResmi,
      isResmi: !!MASTER_HPP_ABD[item.sku],
      grossMargin,
      marginPercent,
      coaCode: '501',
      coaName: 'HPP Alat Bantu Dengar (ABD)',
      persediaanCode: '103',
      persediaanName: 'Persediaan Alat Bantu Dengar'
    };
  });

  const aksesoriItemsWithHpp = CATALOG_AKSESORIS_SERVICE.map((item, idx) => {
    const sku = item.sku || `AKS-${idx + 1}`;
    // Official master HPP from user data
    const hppResmi = (item.sku && MASTER_HPP_AKSESORIS[item.sku]?.hpp) || Math.round(item.harga * 0.45);
    const grossMargin = item.harga - hppResmi;
    const marginPercent = Math.round((grossMargin / item.harga) * 100);
    return {
      type: 'AKSESORIS' as const,
      sku,
      nama: item.nama,
      kategori: item.kategori,
      hargaJual: item.harga,
      estimasiHpp: hppResmi,
      isResmi: !!(item.sku && MASTER_HPP_AKSESORIS[item.sku]),
      grossMargin,
      marginPercent,
      coaCode: '502',
      coaName: 'HPP Aksesoris & Baterai',
      persediaanCode: '104',
      persediaanName: 'Persediaan Aksesoris & Baterai'
    };
  });

  const combinedHppItems = [...abdItemsWithHpp, ...aksesoriItemsWithHpp].filter(item => {
    const matchesType = hppProductType === 'ALL' || item.type === hppProductType;
    const matchesSearch = hppSearchQuery === '' ||
      item.sku.toLowerCase().includes(hppSearchQuery.toLowerCase()) ||
      item.nama.toLowerCase().includes(hppSearchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(hppSearchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-[#2A2F86] border border-indigo-100">
              STANDAR AKUNTANSI SAK EP / EMKM
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              Klinik & Ritel Medis Earsound
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Bagan Akun & Master HPP Produk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hierarki akun COA, konfigurasi Harga Pokok Penjualan (HPP) per produk, dan jurnal penyesuaian
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Main Tab Selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => setActiveMainTab('COA')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'COA'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Bagan Akun Standar (COA)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('HPP_CATALOG')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'HPP_CATALOG'
              ? 'bg-[#2A2F86] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-300" />
          <span>Katalog & Konfigurasi HPP Produk</span>
        </button>

        <button
          onClick={() => setActiveMainTab('HPP_GUIDE')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'HPP_GUIDE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Panduan Menambahkan HPP</span>
        </button>
      </div>

      {/* TAB 1: COA TABLE */}
      {activeMainTab === 'COA' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat 
                      ? 'bg-[#2A2F86] text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Akun' : cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nomor atau nama akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#2A2F86] w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4 w-28">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun Akuntansi</th>
                  <th className="py-3 px-4">Kategori Akun</th>
                  <th className="py-3 px-4 text-center w-28">Saldo Normal</th>
                  <th className="py-3 px-4">Keterangan / Fungsi Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map(acc => (
                  <tr key={acc.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#2A2F86]">
                      {acc.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {acc.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {acc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.normalBalance === 'DEBIT' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {acc.normalBalance}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {acc.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HPP PRODUCT CATALOG & MARGIN CONFIG */}
      {activeMainTab === 'HPP_CATALOG' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>HPP RESMI ABD (501)</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  60 SKU Resmi
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">60 SKU</div>
              <p className="text-xs text-slate-500 mt-1">
                Master HPP resmi Rp 500.000 s/d Rp 14.000.000 per unit (Gross Margin rata-rata ~68%)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>HPP RESMI AKSESORIS (502)</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  41 SKU Resmi
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">41 SKU</div>
              <p className="text-xs text-slate-500 mt-1">
                Master HPP resmi Rp 5.000 s/d Rp 3.250.000 (Baterai Rp 25rb - Rp 30rb, Earmould Rp 100rb, dll)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>HPP INSTRUMEN & B2B (505)</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                  Grosir & Suplai MD
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">Input Modal MD</div>
              <p className="text-xs text-slate-500 mt-1">
                Input otomatis saat input suplai / B2B atau standar 70% dari nilai faktur
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setHppProductType('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    hppProductType === 'ALL'
                      ? 'bg-[#2A2F86] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Item ({combinedHppItems.length})
                </button>
                <button
                  onClick={() => setHppProductType('ABD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    hppProductType === 'ABD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Alat Bantu Dengar ({abdItemsWithHpp.length} SKU)
                </button>
                <button
                  onClick={() => setHppProductType('AKSESORIS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    hppProductType === 'AKSESORIS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Aksesoris, Baterai & Sparepart ({aksesoriItemsWithHpp.length} SKU)
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari SKU atau nama produk..."
                  value={hppSearchQuery}
                  onChange={(e) => setHppSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#2A2F86] w-64"
                />
              </div>
            </div>

            {/* HPP Catalog Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="py-3 px-4 w-28">SKU</th>
                    <th className="py-3 px-4">Nama Produk & Spesifikasi</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Harga Jual Retail</th>
                    <th className="py-3 px-4 text-right">HPP Resmi (Modal)</th>
                    <th className="py-3 px-4 text-right">Gross Margin</th>
                    <th className="py-3 px-4 text-center">Akun Debit (HPP)</th>
                    <th className="py-3 px-4 text-center">Akun Kredit (Persediaan)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {combinedHppItems.map((item, idx) => (
                    <tr key={`${item.sku}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#2A2F86]">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{item.nama}</span>
                          {item.isResmi && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Resmi
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'ABD' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatRupiah(item.hargaJual)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 bg-amber-50/40">
                        {formatRupiah(item.estimasiHpp)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        +{formatRupiah(item.grossMargin)} ({item.marginPercent}%)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {item.coaCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {item.persediaanCode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STEP-BY-STEP GUIDE ON HOW TO ADD / INPUT HPP */}
      {activeMainTab === 'HPP_GUIDE' && (
        <div className="space-y-6">
          {/* Introduction Banner */}
          <div className="bg-gradient-to-r from-[#2A2F86] to-[#1C1F5E] text-white p-6 rounded-3xl shadow-md border border-indigo-400/20">
            <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Panduan Operasional Akuntansi Earsound</span>
            </div>
            <h3 className="text-xl font-black">Bagaimana Cara Menambahkan & Menyesuaikan HPP Produk?</h3>
            <p className="text-xs text-indigo-100 mt-1 max-w-3xl leading-relaxed">
              Di sistem Earsound Hearing Center & Maindealer, Harga Pokok Penjualan (HPP) dikelola melalui 3 mekanisme utama tergantung pada jenis transaksi dan kebutuhan akuntansi SAK:
            </p>
          </div>

          {/* 3 Methods Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Method 1 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black">
                  1
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Saat Distribusi Suplai Maindealer ke Cabang
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ketika Maindealer mendistribusikan barang (ABD/Aksesoris) ke 8 cabang ritel, Anda dapat memasukkan nilai modal beli secara langsung:
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl text-[11px] space-y-1.5 text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5 font-bold text-[#2A2F86]">
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Langkah di Aplikasi:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Buka menu <strong>Financial Statement (SAK)</strong></li>
                    <li>Pilih tab <strong>Maindealer & B2B Hub</strong></li>
                    <li>Klik tombol <strong>+ Suplai ke Cabang</strong></li>
                    <li>Isi kolom <strong>HPP / Modal MD</strong> (harga beli dari vendor principal) dan <strong>Transfer ke Cabang</strong></li>
                    <li>Sistem otomatis menghitung Gross Margin MD & total HPP</li>
                  </ol>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Cocok untuk: Penyaluran unit display & persediaan konsinyasi cabang.
              </div>
            </div>

            {/* Method 2 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black">
                  2
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Jurnal Penyesuaian HPP Berdasarkan Stock Opname
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pada penutupan buku akhir bulan, Akuntan dapat memposting Jurnal Penyesuaian (*Adjusting Entry*) untuk mencatat beban HPP riil fisik:
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl text-[11px] space-y-1.5 text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Langkah Posting Jurnal:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Buka tab <strong>Buku Besar & Jurnal</strong></li>
                    <li>Klik <strong>+ Buat Jurnal Baru</strong></li>
                    <li>Baris 1 (Debit): Pilih Akun <strong>501 (HPP ABD)</strong> atau <strong>502 (HPP Aksesoris)</strong></li>
                    <li>Baris 2 (Kredit): Pilih Akun <strong>103 (Persediaan ABD)</strong> atau <strong>104 (Persediaan Aksesoris)</strong></li>
                    <li>Pastikan nilai Debit dan Kredit seimbang (*balance*), lalu Simpan.</li>
                  </ol>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Cocok untuk: Penyesuaian persediaan periodik & tutup buku bulanan.
              </div>
            </div>

            {/* Method 3 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-black">
                  3
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Perhitungan Otomatis Master HPP per SKU
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistem Earsound kini langsung mencocokkan setiap transaksi penjualan dengan Master HPP resmi spesifik (60 SKU ABD & 41 SKU Aksesoris):
                </p>
                <div className="bg-slate-50 p-3 rounded-2xl text-[11px] space-y-1.5 text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5 font-bold text-purple-800">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Integrasi Master HPP Otomatis:</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside">
                    <li><strong>501 HPP ABD:</strong> Akumulasi HPP riil per unit ABD (Monaural / Binaural 2x, termasuk earmould Rp 100rb & paket aksesoris)</li>
                    <li><strong>502 HPP Aksesoris:</strong> Akumulasi HPP riil aksesoris & baterai per SKU (Baterai Rp 25rb - Rp 30rb, Filter Rp 15rb, Charger Rp 1-3jt, dll)</li>
                    <li><strong>503 Fee Dokter:</strong> Komisi rujukan dokter riil yang telah terkonfirmasi</li>
                    <li><strong>504 Bagi Hasil Wakpro:</strong> Porsi bagi hasil audiologis tes klinis</li>
                    <li><strong>505 HPP B2B:</strong> Modal beli riil faktur pengiriman / estimasi 70%</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Cocok untuk: Laporan Laba Rugi eksekutif real-time dengan akurasi margin 100%.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
