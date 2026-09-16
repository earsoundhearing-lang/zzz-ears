import React from 'react';
import { PaymentDetails, PaymentMethod, BsiAccount, BranchCode } from '../../types';
import { CreditCard, Banknote, Building2, Hospital, Split, Calculator, CheckCircle2, ShoppingBag } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface PaymentSelectorProps {
  value?: PaymentDetails;
  payment?: PaymentDetails;
  totalAmount?: number;
  branchCode?: BranchCode | string;
  onChange: (value: PaymentDetails) => void;
}

export const BSI_ACCOUNTS: BsiAccount[] = [
  'BSI 8171219847',
  'BSI 7320688177',
  'BSI 7348014514',
  'BSI 7368736893',
  'BSI 7368737822',
  'BSI 8888977822',
  'BSI 9009343910',
];

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({ 
  value: propValue, 
  payment, 
  totalAmount, 
  branchCode,
  onChange 
}) => {
  const currentVal = propValue || payment || { method: 'Cash' };
  const isYaminOrShopeeActive = branchCode === 'YM' || branchCode === 'ALL' || branchCode === 'HQ' || !branchCode || currentVal.method === 'Shopee';

  const handleMethodChange = (method: PaymentMethod) => {
    if (method === 'Transfer') {
      onChange({
        method,
        bsiAccount: currentVal.bsiAccount || BSI_ACCOUNTS[0],
      });
    } else if (method === 'Shopee') {
      onChange({
        method,
        shopeeOrderNo: currentVal.shopeeOrderNo || '',
      });
    } else if (method === 'Split (Cash & Transfer)') {
      const half = totalAmount ? Math.round(totalAmount / 2) : 0;
      const rem = totalAmount ? totalAmount - half : 0;
      onChange({
        method,
        isSplit: true,
        cashAmount: currentVal.cashAmount !== undefined && currentVal.cashAmount > 0 ? currentVal.cashAmount : half,
        transferAmount: currentVal.transferAmount !== undefined && currentVal.transferAmount > 0 ? currentVal.transferAmount : rem,
        bsiAccount: currentVal.bsiAccount || currentVal.splitBsiAccount || BSI_ACCOUNTS[0],
        splitBsiAccount: currentVal.splitBsiAccount || currentVal.bsiAccount || BSI_ACCOUNTS[0],
      });
    } else if (method === 'Piutang BPJS') {
      onChange({
        method,
        namaRSBPJS: currentVal.namaRSBPJS || '',
      });
    } else if (method === 'Piutang RS/Klinik/Laboratorium') {
      onChange({
        method,
        namaFaskes: currentVal.namaFaskes || '',
      });
    } else {
      onChange({
        method: 'Cash',
      });
    }
  };

  const handleAccountChange = (bsiAccount: BsiAccount) => {
    onChange({
      ...currentVal,
      bsiAccount,
      splitBsiAccount: bsiAccount,
    });
  };

  const handleCashAmountChange = (cash: number) => {
    const safeCash = Math.max(0, cash);
    let autoTransfer = currentVal.transferAmount || 0;
    if (totalAmount && totalAmount > 0) {
      autoTransfer = Math.max(0, totalAmount - safeCash);
    }
    onChange({
      ...currentVal,
      isSplit: true,
      cashAmount: safeCash,
      transferAmount: autoTransfer,
      bsiAccount: currentVal.bsiAccount || BSI_ACCOUNTS[0],
    });
  };

  const handleTransferAmountChange = (transfer: number) => {
    const safeTransfer = Math.max(0, transfer);
    let autoCash = currentVal.cashAmount || 0;
    if (totalAmount && totalAmount > 0) {
      autoCash = Math.max(0, totalAmount - safeTransfer);
    }
    onChange({
      ...currentVal,
      isSplit: true,
      cashAmount: autoCash,
      transferAmount: safeTransfer,
      bsiAccount: currentVal.bsiAccount || BSI_ACCOUNTS[0],
    });
  };

  const handleSplit5050 = () => {
    if (!totalAmount) return;
    const half = Math.round(totalAmount / 2);
    onChange({
      ...currentVal,
      isSplit: true,
      cashAmount: half,
      transferAmount: totalAmount - half,
      bsiAccount: currentVal.bsiAccount || BSI_ACCOUNTS[0],
    });
  };

  const handleNamaRSBPJSChange = (namaRSBPJS: string) => {
    onChange({
      ...currentVal,
      namaRSBPJS,
    });
  };

  const handleNamaFaskesChange = (namaFaskes: string) => {
    onChange({
      ...currentVal,
      namaFaskes,
    });
  };

  const currentCash = currentVal.cashAmount || 0;
  const currentTransfer = currentVal.transferAmount || 0;
  const combinedSplitTotal = currentCash + currentTransfer;
  const isSplitMatch = totalAmount ? combinedSplitTotal === totalAmount : true;

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
          Cara Pembayaran <span className="text-red-500">*</span>
        </label>
        {totalAmount !== undefined && totalAmount > 0 && (
          <span className="text-[11px] font-bold text-slate-500">
            Total Bayar: <strong className="text-slate-800 font-mono">{formatRupiah(totalAmount)}</strong>
          </span>
        )}
      </div>
      
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isYaminOrShopeeActive ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-2`}>
        <button
          type="button"
          id="payment-method-cash"
          onClick={() => handleMethodChange('Cash')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            currentVal.method === 'Cash'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Cash (Tunai)</span>
        </button>

        <button
          type="button"
          id="payment-method-transfer"
          onClick={() => handleMethodChange('Transfer')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            currentVal.method === 'Transfer'
              ? 'bg-[#23277A] text-white border-[#23277A] shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Transfer (BSI)</span>
        </button>

        {isYaminOrShopeeActive && (
          <button
            type="button"
            id="payment-method-shopee"
            onClick={() => handleMethodChange('Shopee')}
            className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
              currentVal.method === 'Shopee'
                ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-xs ring-2 ring-orange-300'
                : 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50 font-extrabold'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#EE4D2D]" />
            <span>Shopee (YM)</span>
          </button>
        )}

        <button
          type="button"
          id="payment-method-split"
          onClick={() => handleMethodChange('Split (Cash & Transfer)')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            currentVal.method === 'Split (Cash & Transfer)'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
              : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50 font-extrabold'
          }`}
        >
          <Split className="w-4 h-4 text-amber-500 group-hover:text-amber-700" />
          <span>Split (Cash + TF)</span>
        </button>

        <button
          type="button"
          id="payment-method-piutang-bpjs"
          onClick={() => handleMethodChange('Piutang BPJS')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            currentVal.method === 'Piutang BPJS'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Hospital className="w-4 h-4" />
          <span>Piutang BPJS</span>
        </button>

        <button
          type="button"
          id="payment-method-piutang-faskes"
          onClick={() => handleMethodChange('Piutang RS/Klinik/Laboratorium')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            currentVal.method === 'Piutang RS/Klinik/Laboratorium'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Piutang Mitra RS/Lab</span>
        </button>
      </div>

      {/* Transfer detail */}
      {currentVal.method === 'Transfer' && (
        <div className="pt-2 animate-fadeIn bg-white p-3.5 rounded-xl border border-indigo-200">
          <label className="block text-xs font-bold text-[#23277A] mb-1">
            Pilih Rekening Bank BSI <span className="text-red-500">*</span>
          </label>
          <select
            id="bsi-account-select"
            value={currentVal.bsiAccount || BSI_ACCOUNTS[0]}
            onChange={(e) => handleAccountChange(e.target.value as BsiAccount)}
            className="w-full bg-slate-50 border border-indigo-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-[#23277A]"
          >
            {BSI_ACCOUNTS.map((acc) => (
              <option key={acc} value={acc}>
                {acc} (Bank Syariah Indonesia)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Shopee detail (Khusus Cabang Yamin) */}
      {currentVal.method === 'Shopee' && (
        <div className="pt-2 animate-fadeIn bg-orange-50/80 p-3.5 rounded-xl border border-orange-300 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-orange-950 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#EE4D2D]" />
              <span>Pembayaran Via Shopee (Khusus Cabang Yamin) <span className="text-red-500">*</span></span>
            </label>
            <span className="text-[10px] font-extrabold bg-orange-200/80 text-orange-900 px-2 py-0.5 rounded-full border border-orange-300">
              Shopee Official Store Yamin
            </span>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Nomor Pesanan Shopee / No. Resi / Keterangan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: 240908SHP12345 / Pesanan Marketplace Shopee Yamin"
              value={currentVal.shopeeOrderNo || ''}
              onChange={(e) => onChange({ ...currentVal, shopeeOrderNo: e.target.value })}
              className="w-full bg-white border border-orange-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <p className="text-[10px] text-orange-800">
            * Transaksi ini dicatat sebagai penerimaan melalui marketplace Shopee Cabang Earsound Yamin.
          </p>
        </div>
      )}

      {/* Split Payment (Cash + Transfer) Details */}
      {currentVal.method === 'Split (Cash & Transfer)' && (
        <div className="pt-2 animate-fadeIn bg-amber-50/70 p-4 rounded-xl border border-amber-300 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
            <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
              <Split className="w-4 h-4 text-amber-600" />
              <span>Rincian Pembayaran Kombinasi (Cash & Transfer)</span>
            </div>
            {totalAmount !== undefined && totalAmount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSplit5050}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-extrabold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Bagi 50% : 50%</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Cash Portion */}
            <div className="bg-white p-3 rounded-xl border border-emerald-300 shadow-2xs">
              <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Nominal Cash / Tunai (Rp) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={currentCash}
                onChange={(e) => handleCashAmountChange(parseInt(e.target.value) || 0)}
                className="w-full bg-emerald-50/40 border border-emerald-300 rounded-lg p-2 text-xs font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                Terbilang: {formatRupiah(currentCash)}
              </span>
            </div>

            {/* Transfer Portion */}
            <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs">
              <label className="block text-xs font-bold text-[#23277A] mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#23277A]" />
                <span>2. Nominal Transfer Bank (Rp) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={currentTransfer}
                onChange={(e) => handleTransferAmountChange(parseInt(e.target.value) || 0)}
                className="w-full bg-indigo-50/40 border border-indigo-200 rounded-lg p-2 text-xs font-black text-[#23277A] focus:ring-2 focus:ring-[#23277A] font-mono"
              />
              <span className="text-[10px] text-[#23277A] font-bold block mt-1">
                Terbilang: {formatRupiah(currentTransfer)}
              </span>
            </div>
          </div>

          {/* BSI Account for Transfer Portion */}
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rekening Bank BSI Penerima Transfer <span className="text-red-500">*</span>
            </label>
            <select
              value={currentVal.bsiAccount || currentVal.splitBsiAccount || BSI_ACCOUNTS[0]}
              onChange={(e) => handleAccountChange(e.target.value as BsiAccount)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-[#23277A]"
            >
              {BSI_ACCOUNTS.map((acc) => (
                <option key={acc} value={acc}>
                  {acc} (Bank Syariah Indonesia)
                </option>
              ))}
            </select>
          </div>

          {/* Split Balance Summary */}
          {totalAmount !== undefined && totalAmount > 0 && (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
              isSplitMatch 
                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950' 
                : 'bg-rose-100/70 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center gap-1.5">
                {isSplitMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Calculator className="w-4 h-4 text-rose-600" />
                )}
                <span>Total Kombinasi: <strong>{formatRupiah(combinedSplitTotal)}</strong></span>
              </div>
              <div>
                {isSplitMatch ? (
                  <span className="text-emerald-700 font-extrabold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    Sesuai Total Tagihan
                  </span>
                ) : (
                  <span className="text-rose-700 font-extrabold bg-white px-2 py-0.5 rounded-md border border-rose-200">
                    Selisih {formatRupiah(Math.abs(totalAmount - combinedSplitTotal))} ({combinedSplitTotal > totalAmount ? 'Kelebihan' : 'Kurang'})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Piutang BPJS detail */}
      {currentVal.method === 'Piutang BPJS' && (
        <div className="pt-2 animate-fadeIn space-y-1">
          <label className="block text-xs font-bold text-blue-900 mb-1">
            Nama Rumah Sakit BPJS <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: RSUD Dr. Pirngadi / RS Rasyida"
            value={currentVal.namaRSBPJS || ''}
            onChange={(e) => handleNamaRSBPJSChange(e.target.value)}
            className="w-full bg-white border border-blue-300 rounded-xl p-2.5 text-xs text-blue-950 font-bold focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Piutang RS/Klinik/Lab detail */}
      {currentVal.method === 'Piutang RS/Klinik/Laboratorium' && (
        <div className="pt-2 animate-fadeIn space-y-1">
          <label className="block text-xs font-bold text-purple-900 mb-1">
            Nama RS / Klinik / Laboratorium Partner <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Klinik Spesialis THT / Lab Prodia"
            value={currentVal.namaFaskes || ''}
            onChange={(e) => handleNamaFaskesChange(e.target.value)}
            className="w-full bg-white border border-purple-300 rounded-xl p-2.5 text-xs text-purple-950 font-bold focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}
    </div>
  );
};

