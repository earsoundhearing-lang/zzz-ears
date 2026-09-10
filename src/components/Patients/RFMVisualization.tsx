import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  Cell
} from 'recharts';
import { 
  PatientRFMData, 
  RFMSegment 
} from '../../types';
import { 
  RFM_SEGMENT_DETAILS 
} from '../../utils/rfmEngine';
import { 
  formatRupiah, 
  formatIndoDate 
} from '../../utils/formatters';
import { 
  Crown, 
  HeartHandshake, 
  Sparkles, 
  UserCheck, 
  BellRing, 
  AlertTriangle, 
  UserX, 
  UserPlus, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Filter, 
  Info,
  Maximize2,
  ChevronRight,
  Send
} from 'lucide-react';

interface RFMVisualizationProps {
  rfmDataset: PatientRFMData[];
  onSelectPatient: (patientId: string) => void;
  selectedSegmentFilter: RFMSegment | 'ALL';
  onSelectSegmentFilter: (segment: RFMSegment | 'ALL') => void;
}

// Color palette mapping for Recharts scatter bubbles
const SEGMENT_COLORS: Record<RFMSegment, string> = {
  'Champions': '#23277A', // Earsound Primary Navy
  'Loyal Customers': '#3B41B2', // Navy Slate
  'Potential Loyalists': '#4A51D1', // Indigo Navy
  'New Customers': '#F5B438', // Earsound Gold Amber
  'Need Attention': '#D99B26', // Warm Amber
  'At Risk': '#EA580C', // Orange
  'Hibernating': '#E11D48', // Rose
  'Unconverted Leads': '#64748B', // Slate 500
};

export const RFMVisualization: React.FC<RFMVisualizationProps> = ({
  rfmDataset,
  onSelectPatient,
  selectedSegmentFilter,
  onSelectSegmentFilter,
}) => {
  const [xAxisMode, setXAxisMode] = useState<'days' | 'score'>('days');
  const [selectedScatterPoint, setSelectedScatterPoint] = useState<PatientRFMData | null>(null);
  const [activeTab, setActiveTab] = useState<'bubble' | 'matrix' | 'table'>('bubble');

  // Compute aggregate statistics per segment
  const segmentStats = useMemo(() => {
    const totalRevenueAll = rfmDataset.reduce((acc, p) => acc + p.monetaryTotal, 0) || 1;
    const totalPatientsAll = rfmDataset.length || 1;

    const segments: RFMSegment[] = [
      'Champions',
      'Loyal Customers',
      'Potential Loyalists',
      'New Customers',
      'Need Attention',
      'At Risk',
      'Hibernating',
      'Unconverted Leads'
    ];

    return segments.map((seg) => {
      const patientsInSeg = rfmDataset.filter(p => p.segment === seg);
      const count = patientsInSeg.length;
      const totalMonetary = patientsInSeg.reduce((acc, p) => acc + p.monetaryTotal, 0);
      const avgMonetary = count > 0 ? Math.round(totalMonetary / count) : 0;
      
      const patientsWithTx = patientsInSeg.filter(p => p.lastTransactionDate !== null);
      const avgRecencyDays = patientsWithTx.length > 0
        ? Math.round(patientsWithTx.reduce((acc, p) => acc + p.recencyDays, 0) / patientsWithTx.length)
        : 0;
      
      const avgFrequency = count > 0
        ? parseFloat((patientsInSeg.reduce((acc, p) => acc + p.frequencyCount, 0) / count).toFixed(1))
        : 0;

      const revenueSharePct = parseFloat(((totalMonetary / totalRevenueAll) * 100).toFixed(1));
      const patientSharePct = parseFloat(((count / totalPatientsAll) * 100).toFixed(1));

      return {
        segment: seg,
        details: RFM_SEGMENT_DETAILS[seg],
        color: SEGMENT_COLORS[seg],
        count,
        totalMonetary,
        avgMonetary,
        avgRecencyDays,
        avgFrequency,
        revenueSharePct,
        patientSharePct,
        patients: patientsInSeg,
      };
    });
  }, [rfmDataset]);

  // Format data for Scatter Bubble Chart
  const scatterData = useMemo(() => {
    return rfmDataset
      .filter(item => {
        if (selectedSegmentFilter !== 'ALL' && item.segment !== selectedSegmentFilter) {
          return false;
        }
        return true;
      })
      .map(item => {
        // Calculate clamped values for chart display
        const recencyDaysDisplay = Math.min(item.recencyDays, 400); // clamp for chart boundary
        const frequencyDisplay = item.frequencyCount;
        
        // Size normalization: between 8 and 38 px
        const zMonetary = Math.max(8, Math.min(38, Math.round(Math.sqrt(item.monetaryTotal || 50000) / 180) + 8));

        return {
          id: item.patient.id,
          name: item.patient.nama,
          x: xAxisMode === 'days' ? recencyDaysDisplay : item.recencyScore,
          y: frequencyDisplay,
          z: zMonetary,
          rawRecencyDays: item.recencyDays,
          rawFrequency: item.frequencyCount,
          rawMonetary: item.monetaryTotal,
          segment: item.segment,
          rfmScoreString: item.rfmScoreString,
          phone: item.patient.telepon,
          color: SEGMENT_COLORS[item.segment],
          rawItem: item,
        };
      });
  }, [rfmDataset, selectedSegmentFilter, xAxisMode]);

  // 5x5 Recency Score vs Frequency Score Matrix Heatmap
  const matrix5x5 = useMemo(() => {
    // grid 5x5: Rows = Frequency (5 down to 1), Cols = Recency (1 to 5)
    const grid: { 
      fScore: number; 
      rScore: number; 
      patients: PatientRFMData[];
      totalMonetary: number;
      dominantSegment: RFMSegment;
    }[][] = [];

    for (let f = 5; f >= 1; f--) {
      const row = [];
      for (let r = 1; r <= 5; r++) {
        const matches = rfmDataset.filter(p => p.frequencyScore === f && p.recencyScore === r);
        const totalMonetary = matches.reduce((acc, p) => acc + p.monetaryTotal, 0);
        
        // Find dominant segment in this cell
        const segCounts: Record<string, number> = {};
        matches.forEach(p => {
          segCounts[p.segment] = (segCounts[p.segment] || 0) + 1;
        });
        let dominant: RFMSegment = 'Loyal Customers';
        let maxC = 0;
        Object.entries(segCounts).forEach(([k, v]) => {
          if (v > maxC) {
            maxC = v;
            dominant = k as RFMSegment;
          }
        });

        row.push({
          fScore: f,
          rScore: r,
          patients: matches,
          totalMonetary,
          dominantSegment: dominant,
        });
      }
      grid.push(row);
    }
    return grid;
  }, [rfmDataset]);

  const getSegmentIcon = (seg: RFMSegment) => {
    switch (seg) {
      case 'Champions': return <Crown className="w-4 h-4 text-emerald-500" />;
      case 'Loyal Customers': return <HeartHandshake className="w-4 h-4 text-blue-500" />;
      case 'Potential Loyalists': return <Sparkles className="w-4 h-4 text-indigo-500" />;
      case 'New Customers': return <UserCheck className="w-4 h-4 text-cyan-500" />;
      case 'Need Attention': return <BellRing className="w-4 h-4 text-amber-500" />;
      case 'At Risk': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'Hibernating': return <UserX className="w-4 h-4 text-rose-500" />;
      case 'Unconverted Leads': return <UserPlus className="w-4 h-4 text-slate-500" />;
    }
  };

  // Custom Tooltip for Bubble Chart
  const CustomBubbleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const details = RFM_SEGMENT_DETAILS[data.segment as RFMSegment];

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 max-w-xs animate-fadeIn z-50 pointer-events-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
            <span className="font-bold text-sm text-white truncate">{data.name}</span>
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-indigo-300 font-bold">
              {data.id}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span 
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-extrabold text-xs" style={{ color: data.color }}>
              {data.segment}
            </span>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded ml-auto">
              Skor RFM: {data.rfmScoreString}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-2 rounded-xl text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Waktu Terakhir (R):</span>
              <strong className="text-white">{data.rawRecencyDays} hari lalu</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Frekuensi (F):</span>
              <strong className="text-white">{data.rawFrequency}x Transaksi</strong>
            </div>
            <div className="col-span-2 border-t border-slate-700 pt-1">
              <span className="text-slate-400 block text-[10px]">Total Belanja LTV (M):</span>
              <strong className="text-emerald-400 text-xs">{formatRupiah(data.rawMonetary)}</strong>
            </div>
          </div>

          <p className="text-[10px] text-amber-200/90 leading-tight italic">
            Klik bubble untuk membuka profil & riwayat lengkap.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Visualization Header & View Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-extrabold mb-1 border border-indigo-100">
              <PieChartIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Analisis Visual & Matriks RFM Global</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Peta Segmentasi Pasien RFM
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi distribusi pasien berdasarkan <strong>Recency (Sumbu X)</strong>, <strong>Frequency (Sumbu Y)</strong>, dan <strong>Monetary / Nilai Belanja (Ukuran Bubble)</strong>.
            </p>
          </div>

          {/* Sub-tab Switcher: Bubble Chart | Segment Table | 5x5 Heatmap */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('bubble')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bubble' 
                  ? 'bg-indigo-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>RFM Bubble Chart</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'table' 
                  ? 'bg-indigo-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tabel Analisis Segmen</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix' 
                  ? 'bg-indigo-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Matriks 5x5 Grid</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: BUBBLE SCATTER CHART ================= */}
        {activeTab === 'bubble' && (
          <div className="space-y-4">
            {/* Chart Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Mode Sumbu X (Recency):</span>
                <div className="inline-flex bg-white rounded-xl border border-slate-200 p-0.5 text-xs">
                  <button
                    onClick={() => setXAxisMode('days')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      xAxisMode === 'days' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hari Sejak Transaksi (0 - 365+ hari)
                  </button>
                  <button
                    onClick={() => setXAxisMode('score')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      xAxisMode === 'score' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Skor Nilai Recency (1 - 5)
                  </button>
                </div>
              </div>

              {/* Segment filter chip status */}
              <div className="flex items-center gap-2 text-xs">
                {selectedSegmentFilter !== 'ALL' && (
                  <span className="text-slate-500">
                    Filter Aktif: <strong className="text-indigo-700">{selectedSegmentFilter}</strong> ({scatterData.length} pasien)
                  </span>
                )}
                {selectedSegmentFilter !== 'ALL' && (
                  <button
                    onClick={() => onSelectSegmentFilter('ALL')}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Bubble Chart Canvas */}
            <div className="bg-slate-900/5 rounded-2xl p-3 sm:p-5 border border-slate-200 relative">
              {/* Quadrant Helper Labels overlay */}
              <div className="absolute top-6 left-12 bg-white/80 backdrop-blur-xs border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold pointer-events-none shadow-xs hidden sm:block">
                💎 Zona Champions & Loyal (Recency Baru + Kunjungan Sering)
              </div>
              <div className="absolute top-6 right-8 bg-white/80 backdrop-blur-xs border border-orange-200 text-orange-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold pointer-events-none shadow-xs hidden sm:block">
                ⚠️ Zona Butuh Re-Aktivasi (Pernah Sering, Lama Tidak Kembali)
              </div>
              <div className="absolute bottom-14 right-8 bg-white/80 backdrop-blur-xs border border-rose-200 text-rose-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold pointer-events-none shadow-xs hidden sm:block">
                💤 Zona Hibernating / Pasif (1x Kunjungan &gt; 1 Tahun Lalu)
              </div>

              <div className="w-full h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 25, right: 20, bottom: 25, left: 10 }}
                  >
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={xAxisMode === 'days' ? 'Recency (Hari)' : 'Skor Recency'}
                      domain={xAxisMode === 'days' ? [0, 400] : [1, 5]}
                      unit={xAxisMode === 'days' ? ' hr' : ''}
                      reversed={xAxisMode === 'days'} // Closer to left = more recent
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      label={{ 
                        value: xAxisMode === 'days' ? '← Kunjungan Paling Baru (Hari) | Kunjungan Paling Lama →' : 'Skor Recency (1 = Lama, 5 = Baru)', 
                        position: 'insideBottom', 
                        offset: -12, 
                        fontSize: 11, 
                        fill: '#475569',
                        fontWeight: 'bold' 
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Frekuensi (Kunjungan)"
                      unit="x"
                      domain={[0, 'dataMax + 2']}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      label={{ 
                        value: 'Frekuensi Kunjungan (F)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: 5, 
                        fontSize: 11, 
                        fill: '#475569',
                        fontWeight: 'bold' 
                      }}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[50, 450]} 
                      name="Monetary Value" 
                    />
                    <Tooltip content={<CustomBubbleTooltip />} />
                    
                    <Scatter
                      data={scatterData}
                      onClick={(node: any) => {
                        if (node && node.id) {
                          onSelectPatient(node.id);
                        }
                      }}
                      cursor="pointer"
                    >
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="#ffffff"
                          strokeWidth={1.5}
                          fillOpacity={0.82}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend with interactive segment clicking */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Legenda Segmen (Klik untuk filter):</span>
                {segmentStats.map((st) => {
                  const isSelected = selectedSegmentFilter === st.segment;
                  return (
                    <button
                      key={st.segment}
                      onClick={() => onSelectSegmentFilter(isSelected ? 'ALL' : st.segment)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        isSelected 
                          ? 'ring-2 ring-indigo-500 text-white' 
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                      style={{
                        backgroundColor: isSelected ? st.color : undefined,
                      }}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block" 
                        style={{ backgroundColor: st.color }}
                      />
                      <span>{st.segment}</span>
                      <span className="opacity-70 text-[10px]">({st.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SEGMENT BREAKDOWN TABLE ================= */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5">Kategori Segmen RFM</th>
                    <th className="p-3.5 text-center">Jumlah Pasien</th>
                    <th className="p-3.5 text-center">% Basis Pasien</th>
                    <th className="p-3.5 text-right">Total Nilai Belanja (LTV)</th>
                    <th className="p-3.5 text-center">% Kontribusi Omset</th>
                    <th className="p-3.5 text-right">Rerata Nilai / Pasien</th>
                    <th className="p-3.5 text-center">Rerata Recency</th>
                    <th className="p-3.5 text-center">Rerata Frekuensi</th>
                    <th className="p-3.5 text-center">Aksi Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {segmentStats.map((st) => {
                    const isSelected = selectedSegmentFilter === st.segment;
                    return (
                      <tr 
                        key={st.segment} 
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-indigo-50/70 font-semibold' : ''
                        }`}
                      >
                        {/* Segment Name & Icon */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0" 
                              style={{ backgroundColor: st.color }}
                            />
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                {st.segment}
                              </div>
                              <div className="text-[10px] text-slate-400 max-w-xs truncate">
                                {st.details.description}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Patient Count */}
                        <td className="p-3.5 text-center font-bold text-slate-900 text-sm">
                          {st.count}
                        </td>

                        {/* Patient Share % */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-slate-700">{st.patientSharePct}%</span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full rounded-full" 
                                style={{ width: `${Math.min(100, st.patientSharePct * 2)}%`, backgroundColor: st.color }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Total Monetary LTV */}
                        <td className="p-3.5 text-right font-black text-emerald-700 text-sm">
                          {formatRupiah(st.totalMonetary)}
                        </td>

                        {/* Revenue Share % */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {st.revenueSharePct}%
                          </span>
                        </td>

                        {/* Average Monetary per Patient */}
                        <td className="p-3.5 text-right font-bold text-slate-800">
                          {formatRupiah(st.avgMonetary)}
                        </td>

                        {/* Average Recency Days */}
                        <td className="p-3.5 text-center font-medium text-slate-600">
                          {st.avgRecencyDays > 0 ? `${st.avgRecencyDays} hari` : '-'}
                        </td>

                        {/* Average Frequency */}
                        <td className="p-3.5 text-center font-medium text-slate-600">
                          {st.avgFrequency}x
                        </td>

                        {/* Action Filter */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => onSelectSegmentFilter(isSelected ? 'ALL' : st.segment)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800'
                            }`}
                          >
                            {isSelected ? 'Terfilter' : 'Filter Pasien'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Strategic Advice Card */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <Sparkles className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-black text-indigo-950 uppercase tracking-wider">
                  Panduan Strategi CRM Berdasarkan Data Segmen
                </h4>
                <p className="text-xs text-indigo-900/90 mt-1 leading-relaxed">
                  Gunakan tabel di atas untuk memprioritaskan alokasi waktu dan anggaran kampanye klinik. Pasien pada segmen <strong>Champions</strong> dan <strong>Loyal Customers</strong> menghasilkan kontribusi omset terbesar, sementara segmen <strong>Need Attention</strong> dan <strong>At Risk</strong> membutuhkan intervensi kontak aktif agar tidak berpindah klinik.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: 5x5 RFM HEATMAP MATRIX ================= */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Matriks Distribusi 5x5: Frekuensi vs Recency
                </h3>
                <p className="text-xs text-slate-500">
                  Setiap kotak menunjukkan jumlah pasien dengan kombinasi Skor Frekuensi (Y) dan Skor Recency (X).
                </p>
              </div>
            </div>

            {/* 5x5 Grid Table */}
            <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl text-white shadow-md overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header X Axis */}
                <div className="text-center font-bold text-xs text-indigo-300 uppercase tracking-wider mb-2">
                  Sumbu Horizontal: Skor Recency (1 = &gt; 1 Tahun Lalu → 5 = &lt; 30 Hari Terakhir)
                </div>

                <div className="grid grid-cols-6 gap-2 text-center text-xs">
                  {/* Empty top-left cell */}
                  <div className="p-2 font-bold text-indigo-300 flex items-center justify-center text-[11px]">
                    F \ R
                  </div>
                  <div className="p-2 font-bold text-slate-300 bg-slate-800/80 rounded-xl">R-1 (Dorman)</div>
                  <div className="p-2 font-bold text-slate-300 bg-slate-800/80 rounded-xl">R-2 (6-12 bln)</div>
                  <div className="p-2 font-bold text-slate-300 bg-slate-800/80 rounded-xl">R-3 (3-6 bln)</div>
                  <div className="p-2 font-bold text-slate-300 bg-slate-800/80 rounded-xl">R-4 (1-3 bln)</div>
                  <div className="p-2 font-bold text-slate-300 bg-slate-800/80 rounded-xl">R-5 (&lt;30 hr)</div>

                  {/* 5 Rows */}
                  {matrix5x5.map((row, rowIdx) => {
                    const fScore = 5 - rowIdx;
                    return (
                      <React.Fragment key={`row-${fScore}`}>
                        {/* Row Y Label */}
                        <div className="p-2 font-bold bg-slate-800/80 text-indigo-300 rounded-xl flex items-center justify-center text-[11px]">
                          F-{fScore} ({fScore >= 4 ? 'Sering' : fScore === 1 ? '1x' : 'Jarang'})
                        </div>

                        {/* 5 Cells */}
                        {row.map((cell) => {
                          const count = cell.patients.length;
                          const hasPatients = count > 0;
                          return (
                            <div
                              key={`cell-${cell.fScore}-${cell.rScore}`}
                              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                                hasPatients
                                  ? 'bg-slate-800 border-slate-700 hover:border-indigo-400 hover:bg-slate-750'
                                  : 'bg-slate-900/40 border-slate-800/50 opacity-40'
                              }`}
                            >
                              <div className="flex justify-between items-center text-[10px] text-slate-400">
                                <span>{cell.rScore}-{cell.fScore}</span>
                                {hasPatients && (
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: SEGMENT_COLORS[cell.dominantSegment] }}
                                    title={cell.dominantSegment}
                                  />
                                )}
                              </div>

                              <div className={`text-xl font-black my-1 ${hasPatients ? 'text-white' : 'text-slate-600'}`}>
                                {count}
                              </div>

                              <div className="text-[10px] text-emerald-400 font-medium truncate" title={formatRupiah(cell.totalMonetary)}>
                                {hasPatients ? formatRupiah(cell.totalMonetary) : '-'}
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
