import React from 'react';
import { AudiogramEarThresholds } from '../../types';
import { 
  AUDIOGRAM_FREQUENCIES, 
  INTENSITY_LEVELS, 
  INTENSITY_CHART_MAJOR_LEVELS,
  INTENSITY_MIN, 
  INTENSITY_MAX 
} from '../../utils/audiogramHelper';

interface AudiogramChartProps {
  kanan?: AudiogramEarThresholds;
  kiri?: AudiogramEarThresholds;
  mode?: 'both' | 'kanan' | 'kiri';
  title?: string;
  showSpeechBanana?: boolean;
  showDegreeBands?: boolean;
  showLegend?: boolean;
  width?: number;
  height?: number;
  interactive?: boolean;
  selectedEar?: 'kanan' | 'kiri';
  selectedType?: 'ac' | 'bc';
  onValueChange?: (ear: 'kanan' | 'kiri', type: 'ac' | 'bc', freq: number, intensity: number) => void;
  className?: string;
  isPrintMode?: boolean;
}

export const AudiogramChart: React.FC<AudiogramChartProps> = ({
  kanan,
  kiri,
  mode = 'both',
  title,
  showSpeechBanana = true,
  showDegreeBands = true,
  showLegend = true,
  width = 560,
  height = 440,
  interactive = false,
  selectedEar = 'kanan',
  selectedType = 'ac',
  onValueChange,
  className = '',
  isPrintMode = false,
}) => {
  const isCompact = width < 420;

  // Margins with ample clearance for frequency and dB titles
  const margin = {
    top: isCompact ? 30 : 34,
    right: isCompact ? 18 : 24,
    bottom: isCompact ? 14 : 20,
    left: isCompact ? 46 : 52,
  };

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // X Coordinate calculation based on logarithmic/octave frequency spacing
  // Octaves: 125(0), 250(1), 500(2), 1000(3), 2000(4), 4000(5), 8000(6)
  const getX = (freq: number): number => {
    // Log2 relative to 125
    const oct = Math.log2(freq / 125);
    const totalOctaves = 6; // from 125 to 8000
    return (oct / totalOctaves) * chartWidth;
  };

  // Y Coordinate calculation: Linear from -10 dB (top) to 120 dB (bottom)
  const getY = (db: number): number => {
    const range = INTENSITY_MAX - INTENSITY_MIN; // 130 dB
    const clamped = Math.max(INTENSITY_MIN, Math.min(INTENSITY_MAX, db));
    return ((clamped - INTENSITY_MIN) / range) * chartHeight;
  };

  // Degree Zones
  const degreeBands = [
    { from: -10, to: 20, label: 'Normal (≤ 20 dB)', fill: 'rgba(16, 185, 129, 0.06)' },
    { from: 20, to: 40, label: 'Ringan (26 - 40 dB)', fill: 'rgba(59, 130, 246, 0.05)' },
    { from: 40, to: 55, label: 'Sedang (41 - 55 dB)', fill: 'rgba(245, 158, 11, 0.05)' },
    { from: 55, to: 70, label: 'Sedang-Berat (56 - 70 dB)', fill: 'rgba(249, 115, 22, 0.05)' },
    { from: 70, to: 90, label: 'Berat (71 - 90 dB)', fill: 'rgba(239, 68, 68, 0.05)' },
    { from: 90, to: 120, label: 'Sangat Berat (> 90 dB)', fill: 'rgba(168, 85, 247, 0.06)' },
  ];

  // Speech Banana SVG Path approximation (area where typical human speech sounds reside: 250Hz - 6000Hz, 25-60 dB)
  // Polygon points (freq, dB)
  const speechBananaPoints = [
    { freq: 250, db: 30 },
    { freq: 500, db: 25 },
    { freq: 1000, db: 25 },
    { freq: 2000, db: 30 },
    { freq: 4000, db: 35 },
    { freq: 6000, db: 45 },
    { freq: 4000, db: 60 },
    { freq: 2000, db: 55 },
    { freq: 1000, db: 50 },
    { freq: 500, db: 50 },
    { freq: 250, db: 45 },
  ];

  const speechBananaPath = speechBananaPoints.map((p, idx) => {
    const x = getX(p.freq);
    const y = getY(p.db);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z';

  // Helper to generate path string for points
  const generateLinePath = (data: Record<number, number | null>, offset: number = 0): string => {
    const validPoints: { x: number; y: number }[] = [];
    AUDIOGRAM_FREQUENCIES.forEach((f) => {
      const val = data[f];
      if (typeof val === 'number' && !isNaN(val)) {
        validPoints.push({ x: getX(f) + offset, y: getY(val) });
      }
    });

    if (validPoints.length === 0) return '';
    return validPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  // Handle interactive SVG click
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onValueChange) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - margin.left;
    const clickY = e.clientY - rect.top - margin.top;

    if (clickX < 0 || clickX > chartWidth || clickY < 0 || clickY > chartHeight) return;

    // Find nearest frequency
    let nearestFreq = 1000;
    let minFreqDist = Infinity;
    AUDIOGRAM_FREQUENCIES.forEach((f) => {
      const fx = getX(f);
      const dist = Math.abs(fx - clickX);
      if (dist < minFreqDist) {
        minFreqDist = dist;
        nearestFreq = f;
      }
    });

    // Calculate nearest 5 dB intensity
    const rawDb = INTENSITY_MIN + (clickY / chartHeight) * (INTENSITY_MAX - INTENSITY_MIN);
    const nearestIntensity = Math.round(rawDb / 5) * 5;
    const clampedIntensity = Math.max(INTENSITY_MIN, Math.min(INTENSITY_MAX, nearestIntensity));

    onValueChange(selectedEar, selectedType, nearestFreq, clampedIntensity);
  };

  const showRight = mode === 'both' || mode === 'kanan';
  const showLeft = mode === 'both' || mode === 'kiri';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Optional Top Title Bar */}
      {title && (
        <div className="w-full text-center font-bold text-xs pb-1.5 mb-1 flex items-center justify-center gap-2">
          {title}
        </div>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`bg-white rounded-lg shadow-xs ${interactive ? 'cursor-crosshair' : ''}`}
        onClick={handleSvgClick}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* 1. Background Degree Bands */}
          {showDegreeBands &&
            degreeBands.map((band, idx) => {
              const y1 = getY(band.from);
              const y2 = getY(band.to);
              return (
                <rect
                  key={`band-${idx}`}
                  x={0}
                  y={y1}
                  width={chartWidth}
                  height={y2 - y1}
                  fill={band.fill}
                />
              );
            })}

          {/* 2. Speech Banana Zone */}
          {showSpeechBanana && (
            <g opacity={isPrintMode ? 0.6 : 0.8}>
              <path
                d={speechBananaPath}
                fill="#fef08a"
                fillOpacity={isPrintMode ? 0.35 : 0.45}
                stroke="#eab308"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={getX(1000)}
                y={getY(38)}
                fontSize={isCompact ? 7.5 : (isPrintMode ? 8.5 : 10)}
                fill="#854d0e"
                textAnchor="middle"
                fontWeight="600"
                fontFamily="system-ui"
                opacity={0.85}
              >
                Speech Banana
              </text>
            </g>
          )}

          {/* 3. Horizontal Grid Lines (Intensity in dB HL) */}
          {/* Subtle 5 dB Intermediate Sub-grid Lines */}
          {INTENSITY_LEVELS.filter(db => db % 10 !== 0 && db !== -10).map((db) => {
            const y = getY(db);
            const isNormalThreshold = db === 25;
            return (
              <line
                key={`hsubgrid-${db}`}
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke={isNormalThreshold ? '#0284c7' : '#f1f5f9'}
                strokeWidth={isNormalThreshold ? 1 : 0.5}
                strokeDasharray={isNormalThreshold ? '4 3' : '2 2'}
              />
            );
          })}

          {/* Major 10 dB Grid Lines with Labels */}
          {INTENSITY_CHART_MAJOR_LEVELS.map((db) => {
            const y = getY(db);
            const isZero = db === 0;
            return (
              <g key={`hgrid-${db}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={isZero ? '#1e293b' : '#e2e8f0'}
                  strokeWidth={isZero ? 1.5 : 0.75}
                />
                {/* Left Y Axis Label */}
                <text
                  x={-6}
                  y={y + 3}
                  fontSize={isCompact ? 8 : (isPrintMode ? 8.5 : 9.5)}
                  fill={isZero ? '#0f172a' : '#475569'}
                  fontWeight={isZero ? 'bold' : '500'}
                  textAnchor="end"
                  fontFamily="system-ui"
                >
                  {db}
                </text>
                {/* Right Y Axis Label */}
                <text
                  x={chartWidth + 6}
                  y={y + 3}
                  fontSize={isCompact ? 7.5 : (isPrintMode ? 8 : 9)}
                  fill="#94a3b8"
                  textAnchor="start"
                  fontFamily="system-ui"
                >
                  {db}
                </text>
              </g>
            );
          })}

          {/* 4. Vertical Grid Lines (Frequency in Hz) */}
          {AUDIOGRAM_FREQUENCIES.map((freq) => {
            const x = getX(freq);
            const isMajor = [250, 500, 1000, 2000, 4000, 8000].includes(freq);
            const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
            return (
              <g key={`vgrid-${freq}`}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chartHeight}
                  stroke={isMajor ? '#cbd5e1' : '#e2e8f0'}
                  strokeWidth={isMajor ? 1 : 0.5}
                  strokeDasharray={isMajor ? undefined : '2 2'}
                />
                {/* Top X Axis Frequency Label */}
                <text
                  x={x}
                  y={isCompact ? -5 : -7}
                  fontSize={isCompact ? (isMajor ? 8.5 : 7) : (isMajor ? (isPrintMode ? 9.5 : 10.5) : (isPrintMode ? 8 : 8.5))}
                  fontWeight={isMajor ? '600' : '400'}
                  fill={isMajor ? '#1e293b' : '#64748b'}
                  textAnchor="middle"
                  fontFamily="system-ui"
                >
                  {freqLabel}
                </text>
              </g>
            );
          })}

          {/* 5. Axis Labels */}
          {/* Top Title: Frequency (Hz) */}
          <text
            x={chartWidth / 2}
            y={isCompact ? -18 : -22}
            fontSize={isCompact ? 8.5 : (isPrintMode ? 9.5 : 10.5)}
            fontWeight="bold"
            fill="#334155"
            textAnchor="middle"
            fontFamily="system-ui"
          >
            FREKUENSI (Hz)
          </text>

          {/* Left Title: Hearing Level (dB HL) */}
          <text
            transform="rotate(-90)"
            x={-chartHeight / 2}
            y={isCompact ? -33 : -38}
            fontSize={isCompact ? 8.5 : (isPrintMode ? 9.5 : 10.5)}
            fontWeight="bold"
            fill="#334155"
            textAnchor="middle"
            fontFamily="system-ui"
          >
            AMBANG DENGAR (dB HL)
          </text>

          {/* 6. Normal 25 dB Label Badge */}
          {!isCompact && (
            <g transform={`translate(${chartWidth - 110}, ${getY(25) - 6})`}>
              <rect
                x={0}
                y={-10}
                width={106}
                height={14}
                fill="#f0f9ff"
                stroke="#bae6fd"
                strokeWidth={0.75}
                rx={3}
              />
              <text
                x={53}
                y={0}
                fontSize={8}
                fill="#0369a1"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="system-ui"
              >
                Batas Normal (25 dB)
              </text>
            </g>
          )}

          {/* 7. RIGHT EAR DATA (Red - AD) */}
          {showRight && kanan && (
            <g id="right-ear-plot">
              {/* AC Solid Red Line */}
              {generateLinePath(kanan.ac) && (
                <path
                  d={generateLinePath(kanan.ac)}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* BC Dashed Red Line (with slight left offset -6px) */}
              {generateLinePath(kanan.bc, -7) && (
                <path
                  d={generateLinePath(kanan.bc, -7)}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* AC Red Circle Markers 'O' */}
              {AUDIOGRAM_FREQUENCIES.map((freq) => {
                const val = kanan.ac[freq];
                if (typeof val !== 'number' || isNaN(val)) return null;
                const cx = getX(freq);
                const cy = getY(val);
                return (
                  <g key={`right-ac-${freq}`} transform={`translate(${cx}, ${cy})`}>
                    <circle
                      r={6}
                      fill="#ffffff"
                      stroke="#dc2626"
                      strokeWidth={2.5}
                    />
                    {/* Inner dot for contrast */}
                    <circle r={1.5} fill="#dc2626" />
                  </g>
                );
              })}

              {/* BC Red Left-Angle Markers '<' (or '[') */}
              {AUDIOGRAM_FREQUENCIES.map((freq) => {
                const val = kanan.bc[freq];
                if (typeof val !== 'number' || isNaN(val)) return null;
                const cx = getX(freq) - 7;
                const cy = getY(val);
                return (
                  <g key={`right-bc-${freq}`} transform={`translate(${cx}, ${cy})`}>
                    {/* Right BC Symbol: Left-pointing angle bracket < */}
                    <path
                      d="M 4 -6 L -3 0 L 4 6"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* 8. LEFT EAR DATA (Blue - AS) */}
          {showLeft && kiri && (
            <g id="left-ear-plot">
              {/* AC Solid Blue Line */}
              {generateLinePath(kiri.ac) && (
                <path
                  d={generateLinePath(kiri.ac)}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* BC Dashed Blue Line (with slight right offset +7px) */}
              {generateLinePath(kiri.bc, 7) && (
                <path
                  d={generateLinePath(kiri.bc, 7)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* AC Blue Cross Markers 'X' */}
              {AUDIOGRAM_FREQUENCIES.map((freq) => {
                const val = kiri.ac[freq];
                if (typeof val !== 'number' || isNaN(val)) return null;
                const cx = getX(freq);
                const cy = getY(val);
                return (
                  <g key={`left-ac-${freq}`} transform={`translate(${cx}, ${cy})`}>
                    <line
                      x1={-5}
                      y1={-5}
                      x2={5}
                      y2={5}
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={5}
                      y1={-5}
                      x2={-5}
                      y2={5}
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* BC Blue Right-Angle Markers '>' (or ']') */}
              {AUDIOGRAM_FREQUENCIES.map((freq) => {
                const val = kiri.bc[freq];
                if (typeof val !== 'number' || isNaN(val)) return null;
                const cx = getX(freq) + 7;
                const cy = getY(val);
                return (
                  <g key={`left-bc-${freq}`} transform={`translate(${cx}, ${cy})`}>
                    {/* Left BC Symbol: Right-pointing angle bracket > */}
                    <path
                      d="M -4 -6 L 3 0 L -4 6"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Outer Border */}
          <rect
            x={0}
            y={0}
            width={chartWidth}
            height={chartHeight}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.2}
          />
        </g>
      </svg>

      {/* Standard Audiometric Legend */}
      {showLegend && (
        <div className={`mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs ${isCompact || isPrintMode ? 'text-[9.5px]' : ''}`}>
          {/* Right Ear Legend */}
          {showRight && (
            <div className="flex items-center gap-2 px-2.5 py-0.5 bg-red-50 border border-red-300 rounded-md text-slate-800">
              <span className="font-bold text-red-700">Telinga Kanan (AD):</span>
              <span className="flex items-center gap-1 text-slate-800 font-medium">
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border-2 border-red-600 bg-white font-bold text-[8px] leading-none text-red-600">
                  ○
                </span>
                AC (Hantaran Udara)
              </span>
              <span className="flex items-center gap-1 text-slate-800 font-medium">
                <span className="font-bold font-mono text-red-600 text-sm leading-none">&lt;</span>
                BC (Hantaran Tulang)
              </span>
            </div>
          )}

          {/* Left Ear Legend */}
          {showLeft && (
            <div className="flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 border border-blue-300 rounded-md text-slate-800">
              <span className="font-bold text-blue-700">Telinga Kiri (AS):</span>
              <span className="flex items-center gap-1 text-slate-800 font-medium">
                <span className="font-bold font-mono text-blue-600 text-sm leading-none">✕</span>
                AC (Hantaran Udara)
              </span>
              <span className="flex items-center gap-1 text-slate-800 font-medium">
                <span className="font-bold font-mono text-blue-600 text-sm leading-none">&gt;</span>
                BC (Hantaran Tulang)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
