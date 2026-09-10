import React, { useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Layers,
  ShoppingBag,
  Volume2
} from 'lucide-react';
import { ABDInventoryEntry, AksesorisInventoryEntry } from '../../types';
import { NavTab } from '../Header';

interface StockConditionSectionProps {
  inventoryABD: ABDInventoryEntry[];
  inventoryAksesoris: AksesorisInventoryEntry[];
  setActiveTab: (tab: NavTab) => void;
}

export const StockConditionSection: React.FC<StockConditionSectionProps> = ({
  inventoryABD = [],
  inventoryAksesoris = [],
  setActiveTab,
}) => {
  // Aggregate ABD stock: MASUK (+1), KELUAR (-1)
  const abdStockSummary = useMemo(() => {
    const map: { [key: string]: { tipe: string; model: string; inStock: number; totalIn: number; totalSold: number } } = {};
    
    inventoryABD.forEach((item) => {
      const key = `${item.tipeABD} - ${item.model}`;
      if (!map[key]) {
        map[key] = {
          tipe: item.tipeABD,
          model: item.model,
          inStock: 0,
          totalIn: 0,
          totalSold: 0,
        };
      }

      if (item.type === 'MASUK') {
        map[key].inStock += 1;
        map[key].totalIn += 1;
      } else if (item.type === 'KELUAR_TERJUAL' || item.type === 'KELUAR_RETUR') {
        map[key].inStock -= 1;
        if (item.type === 'KELUAR_TERJUAL') {
          map[key].totalSold += 1;
        }
      }
    });

    return Object.values(map).sort((a, b) => a.inStock - b.inStock);
  }, [inventoryABD]);

  // Aggregate Aksesoris stock: MASUK (+qty), KELUAR (-qty)
  const aksesorisStockSummary = useMemo(() => {
    const map: { [key: string]: { kategori: string; tipe: string; inStock: number; totalIn: number; totalSold: number } } = {};

    inventoryAksesoris.forEach((item) => {
      const key = `${item.kategori} - ${item.tipe}`;
      if (!map[key]) {
        map[key] = {
          kategori: item.kategori,
          tipe: item.tipe,
          inStock: 0,
          totalIn: 0,
          totalSold: 0,
        };
      }

      const qty = item.qty || 1;
      if (item.type === 'MASUK') {
        map[key].inStock += qty;
        map[key].totalIn += qty;
      } else if (item.type === 'KELUAR_TERJUAL' || item.type === 'KELUAR_RETUR') {
        map[key].inStock -= qty;
        if (item.type === 'KELUAR_TERJUAL') {
          map[key].totalSold += qty;
        }
      }
    });

    return Object.values(map).sort((a, b) => a.inStock - b.inStock);
  }, [inventoryAksesoris]);

  // Calculate critical and warning stocks
  const lowStockThreshold = 3;
  const criticalABD = abdStockSummary.filter(i => i.inStock <= 1);
  const lowStockABD = abdStockSummary.filter(i => i.inStock > 1 && i.inStock <= lowStockThreshold);
  const totalABDUnits = abdStockSummary.reduce((acc, curr) => acc + Math.max(0, curr.inStock), 0);

  const criticalAksesoris = aksesorisStockSummary.filter(i => i.inStock <= 3);
  const lowStockAksesoris = aksesorisStockSummary.filter(i => i.inStock > 3 && i.inStock <= 8);
  const totalAksesorisUnits = aksesorisStockSummary.reduce((acc, curr) => acc + Math.max(0, curr.inStock), 0);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl">
            <Package className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Kondisi & Kesehatan Stok Inventori</h3>
            <p className="text-xs text-slate-500 font-normal">Monitoring stok fisik unit Alat Bantu Dengar, Baterai, dan Aksesoris</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventori')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <span>Manajemen Stok</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Stok ABD</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalABDUnits} Unit</span>
          <span className="text-[11px] text-slate-400 font-normal">{abdStockSummary.length} Varian Tipe/Model</span>
        </div>

        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Stok Aksesoris</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalAksesorisUnits} Pcs</span>
          <span className="text-[11px] text-slate-400 font-normal">{aksesorisStockSummary.length} Varian Item</span>
        </div>

        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Stok Kritis / Habis</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{criticalABD.length + criticalAksesoris.length} Item</span>
          <span className="text-[11px] text-slate-500 font-medium">Perlu Perhatian</span>
        </div>

        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Status Inventori</span>
          <span className="text-xl font-bold text-emerald-700 mt-1 block">
            {criticalABD.length === 0 && criticalAksesoris.length === 0 ? 'Optimal' : 'Perlu Pantauan'}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">Real-time update</span>
        </div>
      </div>

      {/* Stock Table Details (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: ABD Stocks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-slate-600" />
              Stok Alat Bantu Dengar (ABD)
            </span>
            <span className="text-xs text-slate-400 font-normal">{abdStockSummary.length} varian</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {abdStockSummary.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada data inventori ABD.</p>
            ) : (
              abdStockSummary.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs hover:bg-white transition-colors">
                  <div>
                    <span className="font-semibold text-slate-900 block">{item.tipe}</span>
                    <span className="text-[11px] text-slate-500 font-normal">Model: {item.model}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold text-xs px-2.5 py-0.5 rounded-full inline-block ${
                      item.inStock <= 0 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : item.inStock <= 2 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {item.inStock} Unit
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">Terjual: {item.totalSold}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Aksesoris & Baterai Stocks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-slate-600" />
              Stok Baterai & Aksesoris
            </span>
            <span className="text-xs text-slate-400 font-normal">{aksesorisStockSummary.length} varian</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {aksesorisStockSummary.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada data inventori Aksesoris.</p>
            ) : (
              aksesorisStockSummary.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs hover:bg-white transition-colors">
                  <div>
                    <span className="font-semibold text-slate-900 block">{item.kategori}</span>
                    <span className="text-[11px] text-slate-500 font-normal">{item.tipe}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold text-xs px-2.5 py-0.5 rounded-full inline-block ${
                      item.inStock <= 2 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : item.inStock <= 5 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {item.inStock} Pcs
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">Terjual: {item.totalSold}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
