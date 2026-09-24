import React, { useMemo } from 'react';
import { AksesorisTransaction, ABDTransaction } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ShoppingBag } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { normalizeABDTipe, normalizeAksesorisProduct } from '../../utils/productNormalizer';

interface ProductSalesBreakdownSectionProps {
  aksesoris: AksesorisTransaction[];
  abd: ABDTransaction[];
}

const PRODUCT_COLORS = [
  '#23277A', '#F5B438', '#181B57', '#3B41B2', '#D99B26', 
  '#4A51D1', '#939BF4', '#B38321', '#121442', '#FACC15'
];

export const ProductSalesBreakdownSection: React.FC<ProductSalesBreakdownSectionProps> = ({
  aksesoris = [],
  abd = [],
}) => {
  const { productStats, totalQty, totalValue } = useMemo(() => {
    const map: { [key: string]: { name: string; category: string; qty: number; value: number } } = {};

    // Aggregate ABD
    abd.forEach((a) => {
      const canonicalTipe = normalizeABDTipe(a.tipeABD) || 'Hearing Aid ABD';
      const isBinaural = a.fittingType === 'Binaural';
      const tipe2 = a.tipeABD2 ? normalizeABDTipe(a.tipeABD2) : undefined;

      // Handle split binaural if unit 1 and unit 2 are different models
      if (isBinaural && tipe2 && tipe2 !== canonicalTipe) {
        if (!map[canonicalTipe]) {
          map[canonicalTipe] = { name: canonicalTipe, category: 'Alat Bantu Dengar', qty: 0, value: 0 };
        }
        map[canonicalTipe].qty += 1;
        map[canonicalTipe].value += Math.round((a.jumlah || 0) / 2);

        if (!map[tipe2]) {
          map[tipe2] = { name: tipe2, category: 'Alat Bantu Dengar', qty: 0, value: 0 };
        }
        map[tipe2].qty += 1;
        map[tipe2].value += Math.round((a.jumlah || 0) / 2);
      } else {
        if (!map[canonicalTipe]) {
          map[canonicalTipe] = { name: canonicalTipe, category: 'Alat Bantu Dengar', qty: 0, value: 0 };
        }
        const qty = isBinaural ? 2 : 1;
        map[canonicalTipe].qty += qty;
        map[canonicalTipe].value += (a.jumlah || 0);
      }
    });

    // Aggregate Aksesoris & Baterai
    aksesoris.forEach((acc) => {
      if (acc.items && acc.items.length > 0) {
        acc.items.forEach((item) => {
          const norm = normalizeAksesorisProduct(item.category, item.subtype);
          const name = norm.displayName;
          if (!map[name]) {
            map[name] = { name, category: norm.category, qty: 0, value: 0 };
          }
          map[name].qty += (item.qty || 1);
          map[name].value += (item.subtotal || 0);
        });
      } else {
        const norm = normalizeAksesorisProduct(acc.category, acc.subtype);
        const name = norm.displayName;
        if (!map[name]) {
          map[name] = { name, category: norm.category, qty: 0, value: 0 };
        }
        map[name].qty += (acc.qty || 1);
        map[name].value += (acc.jumlah || 0);
      }
    });

    const list = Object.values(map);
    const sumQty = list.reduce((acc, curr) => acc + curr.qty, 0);
    const sumValue = list.reduce((acc, curr) => acc + curr.value, 0);

    const sorted = list
      .map((item, index) => ({
        ...item,
        percentQty: sumQty > 0 ? Number(((item.qty / sumQty) * 100).toFixed(1)) : 0,
        percentValue: sumValue > 0 ? Number(((item.value / sumValue) * 100).toFixed(1)) : 0,
        color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
      }))
      .sort((a, b) => b.qty - a.qty);

    return {
      productStats: sorted,
      totalQty: sumQty,
      totalValue: sumValue,
    };
  }, [aksesoris, abd]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-slate-700" />
            <span>Persentase Produk Fisik Terjual</span>
          </h3>
          <p className="text-xs text-slate-500 font-normal">Volume & pangsa unit ABD dan Aksesoris</p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {totalQty} Unit Terjual
        </span>
      </div>

      <div className="h-48 w-full flex items-center justify-center">
        {productStats.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productStats}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="qty"
              >
                {productStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val: any, name: any, item: any) => [
                  `${val} unit (${item.payload.percentQty}%) - ${formatRupiah(item.payload.value)}`,
                  item.payload.name
                ]} 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-xs text-slate-400 italic">Belum ada data produk terjual.</span>
        )}
      </div>

      <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
        {productStats.map((prod) => (
          <div key={prod.name} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2 max-w-[65%]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: prod.color }} />
              <div className="truncate">
                <span className="text-slate-800 font-semibold truncate block">{prod.name}</span>
                <span className="text-[11px] text-slate-400 block font-normal">{prod.category}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="font-semibold text-slate-900">{prod.qty} unit</span>
                <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {prod.percentQty}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">{formatRupiah(prod.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
