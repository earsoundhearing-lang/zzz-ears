import React, { useState } from 'react';
import { ManualJournalEntry, BranchCode, COAAccount } from '../../types';
import { SAK_CHART_OF_ACCOUNTS } from '../../data/coaData';
import { BookOpen, Plus, CheckCircle2, AlertCircle, Search, Printer, Trash2 } from 'lucide-react';

interface GeneralLedgerViewProps {
  journals: ManualJournalEntry[];
  onAddJournal: (entry: ManualJournalEntry) => void;
  onDeleteJournal: (id: string) => void;
  selectedBranch: BranchCode | 'ALL';
  canManage: boolean;
  currentUser: string;
}

export const GeneralLedgerView: React.FC<GeneralLedgerViewProps> = ({
  journals = [],
  onAddJournal,
  onDeleteJournal,
  selectedBranch,
  canManage,
  currentUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'BUKU_BESAR' | 'JURNAL_UMUM'>('BUKU_BESAR');
  const [selectedCoaCode, setSelectedCoaCode] = useState<string>('101');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Journal Form state
  const [newTanggal, setNewTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [newKeterangan, setNewKeterangan] = useState('');
  const [newBranch, setNewBranch] = useState<BranchCode>(selectedBranch === 'ALL' ? 'HQ' : selectedBranch);
  const [lines, setLines] = useState<Array<{ accountCode: string; debit: number; credit: number; notes: string }>>([
    { accountCode: '625', debit: 0, credit: 0, notes: '' },
    { accountCode: '101', debit: 0, credit: 0, notes: '' },
  ]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const selectedAccount = SAK_CHART_OF_ACCOUNTS.find(a => a.code === selectedCoaCode);

  const totalDebit = lines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 1;

  const handleAddLine = () => {
    setLines(prev => [...prev, { accountCode: '101', debit: 0, credit: 0, notes: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    setLines(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || !newKeterangan.trim()) return;

    const entry: ManualJournalEntry = {
      id: `jv-${Date.now()}`,
      nomorJurnal: `JV-${Date.now().toString().slice(-6)}`,
      tanggal: newTanggal,
      keterangan: newKeterangan,
      branchCode: newBranch,
      lines: lines.map(l => {
        const acc = SAK_CHART_OF_ACCOUNTS.find(a => a.code === l.accountCode);
        return {
          accountCode: l.accountCode,
          accountName: acc?.name || l.accountCode,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          notes: l.notes,
        };
      }),
      totalDebit,
      totalCredit,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    };

    onAddJournal(entry);
    setIsModalOpen(false);
    setNewKeterangan('');
    setLines([
      { accountCode: '625', debit: 0, credit: 0, notes: '' },
      { accountCode: '101', debit: 0, credit: 0, notes: '' },
    ]);
  };

  // Extract lines for selected account in Buku Besar
  const accountEntries: Array<{
    date: string;
    journalNumber: string;
    keterangan: string;
    debit: number;
    credit: number;
    branchCode: BranchCode;
  }> = [];

  journals.forEach(j => {
    if (selectedBranch !== 'ALL' && j.branchCode !== selectedBranch) return;
    j.lines.forEach(l => {
      if (l.accountCode === selectedCoaCode) {
        accountEntries.push({
          date: j.tanggal,
          journalNumber: j.nomorJurnal,
          keterangan: j.keterangan + (l.notes ? ` (${l.notes})` : ''),
          debit: l.debit,
          credit: l.credit,
          branchCode: j.branchCode,
        });
      }
    });
  });

  const totalAccountDebit = accountEntries.reduce((a, b) => a + b.debit, 0);
  const totalAccountCredit = accountEntries.reduce((a, b) => a + b.credit, 0);
  const normalBalanceDebit = selectedAccount?.normalBalance === 'DEBIT';
  const endingBalance = normalBalanceDebit 
    ? (totalAccountDebit - totalAccountCredit)
    : (totalAccountCredit - totalAccountDebit);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-[#2A2F86] border border-indigo-100">
              STANDAR AKUNTANSI KEUANGAN (SAK)
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              Buku Besar & Jurnal Penyesuaian
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">Buku Besar & Jurnal Umum (General Ledger)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lacak pergerakan mutasi debit/kredit per akun COA dan input jurnal penyesuaian (adjusting journal entries)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2A2F86] hover:bg-[#23277A] text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Input Jurnal Penyesuaian
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('BUKU_BESAR')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'BUKU_BESAR' 
                  ? 'bg-white text-[#2A2F86] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Buku Besar Akun (General Ledger)
            </button>
            <button
              onClick={() => setActiveSubTab('JURNAL_UMUM')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'JURNAL_UMUM' 
                  ? 'bg-white text-[#2A2F86] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Jurnal Umum ({journals.length})
            </button>
          </div>

          {activeSubTab === 'BUKU_BESAR' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Pilih Akun COA:</span>
              <select
                value={selectedCoaCode}
                onChange={(e) => setSelectedCoaCode(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2A2F86]"
              >
                {SAK_CHART_OF_ACCOUNTS.map(a => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Content: Buku Besar */}
        {activeSubTab === 'BUKU_BESAR' && selectedAccount && (
          <div className="space-y-4">
            {/* Account Info Header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-[#2A2F86]">{selectedAccount.code}</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedAccount.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-[#2A2F86]">
                    {selectedAccount.accountType}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-1">{selectedAccount.description}</p>
              </div>

              <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Saldo Normal</span>
                  <span className="font-bold text-slate-700">{selectedAccount.normalBalance}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Mutasi</span>
                  <span className="font-bold font-mono text-slate-800">{formatRupiah(totalAccountDebit + totalAccountCredit)}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Saldo Akhir Buku Besar</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">{formatRupiah(endingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4">No. Jurnal & Ref</th>
                    <th className="py-2.5 px-4">Keterangan</th>
                    <th className="py-2.5 px-4 text-center">Cabang</th>
                    <th className="py-2.5 px-4 text-right">Debit</th>
                    <th className="py-2.5 px-4 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accountEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada mutasi jurnal penyesuaian tercatat untuk akun {selectedAccount.code} ({selectedAccount.name}).
                      </td>
                    </tr>
                  ) : (
                    accountEntries.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 text-slate-700 font-mono">{e.date}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">{e.journalNumber}</td>
                        <td className="py-2.5 px-4 text-slate-800">{e.keterangan}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{e.branchCode}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                          {e.debit > 0 ? formatRupiah(e.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                          {e.credit > 0 ? formatRupiah(e.credit) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                    <td colSpan={4} className="py-3 px-4 text-slate-700 uppercase">Total Mutasi & Saldo Akhir</td>
                    <td className="py-3 px-4 text-right font-mono text-[#2A2F86]">{formatRupiah(totalAccountDebit)}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#2A2F86]">{formatRupiah(totalAccountCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Jurnal Umum */}
        {activeSubTab === 'JURNAL_UMUM' && (
          <div className="space-y-4">
            {journals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada jurnal penyesuaian manual yang diinput. Klik "Input Jurnal Penyesuaian" di atas untuk menambah.
              </div>
            ) : (
              journals.map(j => (
                <div key={j.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold font-mono text-[#2A2F86]">{j.nomorJurnal}</span>
                      <span className="text-slate-500 font-mono">{j.tanggal}</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                        Cabang: {j.branchCode}
                      </span>
                      <span className="font-semibold text-slate-800">{j.keterangan}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Oleh: {j.createdBy}</span>
                      {canManage && (
                        <button
                          onClick={() => onDeleteJournal(j.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Hapus Jurnal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100/50 text-slate-400 text-[11px] uppercase font-semibold">
                        <th className="py-2 px-4">Kode & Nama Akun COA</th>
                        <th className="py-2 px-4">Catatan Baris</th>
                        <th className="py-2 px-4 text-right">Debit</th>
                        <th className="py-2 px-4 text-right">Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {j.lines.map((l, lIdx) => (
                        <tr key={lIdx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-medium text-slate-800">
                            <span className="font-mono font-bold mr-2 text-slate-500">{l.accountCode}</span>
                            {l.accountName}
                          </td>
                          <td className="py-2 px-4 text-slate-500">{l.notes || '-'}</td>
                          <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                            {l.debit > 0 ? formatRupiah(l.debit) : '-'}
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                            {l.credit > 0 ? formatRupiah(l.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-200">
                        <td colSpan={2} className="py-2 px-4 text-slate-600 text-right">Total Debit & Kredit:</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-700">{formatRupiah(j.totalDebit)}</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-700">{formatRupiah(j.totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Input Jurnal Penyesuaian */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#2A2F86]" />
                <h3 className="font-bold text-slate-800 text-sm">Input Jurnal Penyesuaian (Adjusting Entry)</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tanggal Transaksi:</label>
                  <input
                    type="date"
                    required
                    value={newTanggal}
                    onChange={(e) => setNewTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cabang:</label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value as BranchCode)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                  >
                    <option value="HQ">Kantor Pusat (HQ)</option>
                    <option value="YM">YM - Earsound Yamin</option>
                    <option value="PB">PB - Earsound Bulan</option>
                    <option value="JB">JB - Earsound Jambi</option>
                    <option value="BJ">BJ - Earsound Binjai</option>
                    <option value="PK">PK - Earsound Pakam</option>
                    <option value="LS">LS - Earsound Langsa</option>
                    <option value="ST">ST - Earsound Siantar</option>
                    <option value="BT">BT - Earsound Betahive</option>
                    <option value="MD">MD - Maindealer Pusat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Keterangan / Memo Jurnal:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penyesuaian sewa dibayar di muka, akrual beban listrik, amortisasi lisensi..."
                  value={newKeterangan}
                  onChange={(e) => setNewKeterangan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#2A2F86]"
                />
              </div>

              {/* Journal Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <span>Baris Akun (Debit & Kredit):</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-[#2A2F86] hover:underline font-bold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <select
                        value={line.accountCode}
                        onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-medium"
                      >
                        {SAK_CHART_OF_ACCOUNTS.map(a => (
                          <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                        ))}
                      </select>

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Debit"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-right font-mono text-[11px]"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Kredit"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-right font-mono text-[11px]"
                        />
                      </div>

                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Debit Credit Balance Indicator */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  {isBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                  <span>{isBalanced ? 'Jurnal Seimbang (Balance)' : 'Jurnal Belum Seimbang (Debit ≠ Kredit)'}</span>
                </div>
                <div className="font-mono">
                  Debit: {formatRupiah(totalDebit)} • Kredit: {formatRupiah(totalCredit)}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || !newKeterangan.trim()}
                  className="flex-1 py-2.5 bg-[#2A2F86] hover:bg-[#23277A] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Simpan Jurnal Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
