import { 
  AudiogramData, 
  AudiogramEarThresholds, 
  DerajatGangguanPendengaran, 
  JenisGangguanPendengaran 
} from '../types';

export const AUDIOGRAM_FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;
export const CORE_AC_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000] as const;
export const CORE_BC_FREQUENCIES = [250, 500, 1000, 2000, 4000] as const;

export const INTENSITY_MIN = -10;
export const INTENSITY_MAX = 120;
export const INTENSITY_STEP = 5;

// Intensities for dropdown selection & data input (Kelipatan 5 dB: -10 s/d 120 dB)
export const INTENSITY_LEVELS = [
  -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120
];

// Major grid line levels for Audiogram Chart (every 10 dB)
export const INTENSITY_CHART_MAJOR_LEVELS = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

/**
 * Calculates 4-frequency PTA (500, 1000, 2000, 4000 Hz) or fallback if some are missing
 */
export function calculatePTA4(ac: Record<number, number | null>): number | null {
  const targetFreqs = [500, 1000, 2000, 4000];
  const validVals = targetFreqs
    .map(f => ac[f])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  if (validVals.length === 0) return null;
  const sum = validVals.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / validVals.length).toFixed(1));
}

/**
 * Calculates 3-frequency PTA (500, 1000, 2000 Hz)
 */
export function calculatePTA3(ac: Record<number, number | null>): number | null {
  const targetFreqs = [500, 1000, 2000];
  const validVals = targetFreqs
    .map(f => ac[f])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

  if (validVals.length === 0) return null;
  const sum = validVals.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / validVals.length).toFixed(1));
}

/**
 * Classifies degree of hearing loss based on Pure Tone Average (WHO / ISO Standards)
 */
export function getDerajatGangguan(pta: number | null): {
  derajat: DerajatGangguanPendengaran;
  label: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
} {
  if (pta === null || isNaN(pta)) {
    return {
      derajat: 'Normal',
      label: 'Belum Ditentukan',
      badgeColor: 'text-slate-600',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-slate-200',
      description: 'Data ambang dengar belum lengkap.',
    };
  }

  if (pta <= 20) {
    return {
      derajat: 'Normal',
      label: 'Normal (≤ 20 dB)',
      badgeColor: 'text-emerald-800',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      description: 'Ambang pendengaran dalam batas normal. Mampu mendengar bisikan halus dan percakapan tanpa hambatan.',
    };
  } else if (pta <= 25) {
    return {
      derajat: 'Batas Normal',
      label: 'Batas Normal (21 - 25 dB)',
      badgeColor: 'text-[#23277A]',
      badgeBg: 'bg-indigo-50',
      badgeBorder: 'border-indigo-200',
      description: 'Batas ambang dengar normal menuju ringan. Sedikit kesulitan mendengar bisikan sangat halus.',
    };
  } else if (pta <= 40) {
    return {
      derajat: 'Ringan',
      label: 'Gangguan Ringan (26 - 40 dB)',
      badgeColor: 'text-blue-800',
      badgeBg: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      description: 'Kesulitan mendengar suara pelan atau percakapan di lingkungan bising. Direkomendasikan evaluasi ABD.',
    };
  } else if (pta <= 55) {
    return {
      derajat: 'Sedang',
      label: 'Gangguan Sedang (41 - 55 dB)',
      badgeColor: 'text-amber-800',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-200',
      description: 'Kesulitan mendengar percakapan normal tanpa bantuan pengeras suara/ABD. Sangat disarankan memakai ABD.',
    };
  } else if (pta <= 70) {
    return {
      derajat: 'Sedang-Berat',
      label: 'Gangguan Sedang-Berat (56 - 70 dB)',
      badgeColor: 'text-orange-800',
      badgeBg: 'bg-orange-50',
      badgeBorder: 'border-orange-200',
      description: 'Hanya bisa mendengar suara yang sangat keras. Percakapan sehari-hari terganggu signifikan. Butuh ABD berkekuatan menengah-tinggi.',
    };
  } else if (pta <= 90) {
    return {
      derajat: 'Berat',
      label: 'Gangguan Berat (71 - 90 dB)',
      badgeColor: 'text-rose-800',
      badgeBg: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
      description: 'Hanya mendengar suara teriak atau bunyi sangat keras di dekat telinga. Memerlukan ABD Super Power (SP) / Ultra Power (UP).',
    };
  } else {
    return {
      derajat: 'Sangat Berat',
      label: 'Gangguan Sangat Berat (> 90 dB)',
      badgeColor: 'text-purple-800',
      badgeBg: 'bg-purple-50',
      badgeBorder: 'border-purple-200',
      description: 'Tidak dapat mendengar suara percakapan. Memerlukan ABD Ultra Power atau pertimbangan implan koklea.',
    };
  }
}

/**
 * Determines Type of Hearing Loss (Normal, Konduktif, Sensorineural, Campuran)
 * based on Air Conduction (AC), Bone Conduction (BC), and Air-Bone Gap (ABG)
 */
export function getJenisGangguan(
  ac: Record<number, number | null>, 
  bc: Record<number, number | null>, 
  pta: number | null
): {
  jenis: JenisGangguanPendengaran;
  label: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  abgAvg: number;
  description: string;
} {
  if (pta === null || isNaN(pta)) {
    return {
      jenis: 'Normal',
      label: 'Belum Terdiagnosa',
      badgeColor: 'text-slate-600',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-slate-200',
      abgAvg: 0,
      description: 'Data AC dan BC belum cukup.',
    };
  }

  // Calculate BC Average on overlapping frequencies (500, 1k, 2k, 4k)
  const overlapFreqs = [500, 1000, 2000, 4000];
  const bcVals: number[] = [];
  const abgGaps: number[] = [];

  overlapFreqs.forEach(f => {
    const acVal = ac[f];
    const bcVal = bc[f];
    if (typeof bcVal === 'number' && !isNaN(bcVal)) {
      bcVals.push(bcVal);
      if (typeof acVal === 'number' && !isNaN(acVal)) {
        abgGaps.push(Math.max(0, acVal - bcVal));
      }
    }
  });

  const bcAvg = bcVals.length > 0 ? (bcVals.reduce((a, b) => a + b, 0) / bcVals.length) : null;
  const abgAvg = abgGaps.length > 0 ? Number((abgGaps.reduce((a, b) => a + b, 0) / abgGaps.length).toFixed(1)) : 0;

  // 1. Normal Hearing
  if (pta <= 25 && (bcAvg === null || bcAvg <= 25) && abgAvg < 15) {
    return {
      jenis: 'Normal',
      label: 'Normal Hearing',
      badgeColor: 'text-emerald-800',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      abgAvg,
      description: 'Fungsi hantaran udara (AC) dan hantaran tulang (BC) normal tanpa gap bermakna.',
    };
  }

  // 2. Conductive Hearing Loss (AC > 25 dB, BC normal <= 25 dB, ABG >= 15 dB)
  if (pta > 25 && (bcAvg !== null && bcAvg <= 25) && abgAvg >= 15) {
    return {
      jenis: 'Tuli Konduktif',
      label: 'Tuli Konduktif (CHL)',
      badgeColor: 'text-indigo-800',
      badgeBg: 'bg-indigo-50',
      badgeBorder: 'border-indigo-200',
      abgAvg,
      description: `Terdapat Air-Bone Gap rata-rata ${abgAvg} dB dengan hantaran tulang (koklea) masih normal. Mengindikasikan hambatan pada telinga luar/tengah (e.g. serumen, perforasi MT, otitis media).`,
    };
  }

  // 3. Sensorineural Hearing Loss (AC > 25 dB, BC > 25 dB, ABG < 15 dB)
  if (pta > 25 && ((bcAvg !== null && bcAvg > 25) || bcAvg === null) && abgAvg < 15) {
    return {
      jenis: 'Tuli Sensorineural',
      label: 'Tuli Sensorineural (SNHL)',
      badgeColor: 'text-rose-800',
      badgeBg: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
      abgAvg,
      description: `Nilai AC dan BC sama-sama menurun (ABG < 15 dB). Kerusakan terjadi pada sel rambut koklea atau saraf pendengaran (e.g. usia/presbikusis, bising, obat ototoksik).`,
    };
  }

  // 4. Mixed Hearing Loss (AC > 25 dB, BC > 25 dB, ABG >= 15 dB)
  if (pta > 25 && abgAvg >= 15) {
    return {
      jenis: 'Tuli Campuran',
      label: 'Tuli Campuran (MHL)',
      badgeColor: 'text-purple-800',
      badgeBg: 'bg-purple-50',
      badgeBorder: 'border-purple-200',
      abgAvg,
      description: `Terdapat penurunan fungsi koklea/sensorineural disertai Air-Bone Gap (${abgAvg} dB) dari masalah hantaran konduktif.`,
    };
  }

  // Fallback
  return {
    jenis: pta > 25 ? 'Tuli Sensorineural' : 'Normal',
    label: pta > 25 ? 'Tuli Sensorineural (SNHL)' : 'Normal',
    badgeColor: pta > 25 ? 'text-rose-800' : 'text-emerald-800',
    badgeBg: pta > 25 ? 'bg-rose-50' : 'bg-emerald-50',
    badgeBorder: pta > 25 ? 'border-rose-200' : 'border-emerald-200',
    abgAvg,
    description: 'Berdasarkan pola grafik ambang dengar nada murni.',
  };
}

/**
 * Creates empty initial threshold values for an ear
 */
export function createEmptyEarThresholds(): AudiogramEarThresholds {
  const ac: Record<number, number | null> = {};
  const bc: Record<number, number | null> = {};
  
  AUDIOGRAM_FREQUENCIES.forEach(f => {
    ac[f] = null;
    bc[f] = null;
  });

  return {
    ac,
    bc,
    pta: undefined,
    pta3: undefined,
    derajat: undefined,
    jenis: undefined,
    srt: null,
    sds: null,
    mcl: null,
    ucl: null,
  };
}

/**
 * Creates a blank audiogram data structure
 */
export function createEmptyAudiogramData(audiometris: string = 'Diana'): AudiogramData {
  return {
    id: `ADG-${Date.now().toString().slice(-6)}`,
    tanggalPeriksa: new Date().toISOString().split('T')[0],
    kanan: createEmptyEarThresholds(),
    kiri: createEmptyEarThresholds(),
    alatAudiometer: 'Interacoustics AD226 / Resonance Pure Tone',
    metodeTes: 'Manual Pure Tone Audiometry (Air & Bone Conduction)',
    kondisiPasien: 'Kooperatif & Tenang',
    kesimpulan: '',
    rekomendasi: '',
    catatanPemeriksa: '',
    audiometris,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Auto-generates recommended clinical summary based on audiogram findings
 */
export function generateAutoConclusionAndRecommendation(
  kanan: AudiogramEarThresholds,
  kiri: AudiogramEarThresholds
): { conclusion: string; recommendation: string } {
  const ptaR = kanan.pta !== undefined ? kanan.pta : calculatePTA4(kanan.ac);
  const ptaL = kiri.pta !== undefined ? kiri.pta : calculatePTA4(kiri.ac);

  const diagR = getDerajatGangguan(ptaR);
  const typeR = getJenisGangguan(kanan.ac, kanan.bc, ptaR);
  const diagL = getDerajatGangguan(ptaL);
  const typeL = getJenisGangguan(kiri.ac, kiri.bc, ptaL);

  let conclusion = '';
  let recommendation = '';

  if (ptaR === null && ptaL === null) {
    return {
      conclusion: 'Pemeriksaan audiometri nada murni telah dilakukan.',
      recommendation: 'Konsultasi lanjutan dengan hearing consultant Earsound.',
    };
  }

  // Build conclusion
  const rText = ptaR !== null ? `Telinga Kanan (AD): Ambang dengar ${ptaR} dB (${diagR.derajat}, ${typeR.label}).` : '';
  const lText = ptaL !== null ? `Telinga Kiri (AS): Ambang dengar ${ptaL} dB (${diagL.derajat}, ${typeL.label}).` : '';
  conclusion = [rText, lText].filter(Boolean).join(' ');

  // Build recommendations
  const maxPta = Math.max(ptaR || 0, ptaL || 0);
  const isBilateralLoss = (ptaR !== null && ptaR > 25) && (ptaL !== null && ptaL > 25);
  const isRightLossOnly = (ptaR !== null && ptaR > 25) && (ptaL === null || ptaL <= 25);
  const isLeftLossOnly = (ptaL !== null && ptaL > 25) && (ptaR === null || ptaR <= 25);

  if (maxPta <= 25) {
    recommendation = 'Ambang pendengaran kedua telinga dalam batas normal. Disarankan menjaga kebersihan telinga dan hindari paparan kebisingan berlebih. Kontrol evaluasi berkala 1 tahun sekali.';
  } else if (typeR.jenis === 'Tuli Konduktif' || typeL.jenis === 'Tuli Konduktif') {
    recommendation = 'Disarankan konsultasi ke Dokter Spesialis T.H.T.B.K.L untuk evaluasi dan penanganan kausa hantaran konduktif (pemeriksaan membran timpani/serumen). Evaluasi ulang audiometri pasca tindakan dokter.';
  } else if (isBilateralLoss) {
    if (maxPta <= 55) {
      recommendation = 'Disarankan menggunakan Alat Bantu Dengar (ABD) tipe RIC (Receiver-in-Canal) atau BTE (Behind-the-Ear) Binaural (Kanan & Kiri) untuk optimalisasi lokalisasi suara dan pemahaman wicara.';
    } else if (maxPta <= 75) {
      recommendation = 'Disarankan menggunakan Alat Bantu Dengar (ABD) tipe BTE Power atau RIC High-Power Binaural disertai custom Earmould untuk memaksimalkan amplifikasi suara.';
    } else {
      recommendation = 'Disarankan menggunakan Alat Bantu Dengar (ABD) tipe Super Power (SP) / Ultra Power (UP) dengan Hard/Soft Full Shell Earmould agar tidak terjadi feedback (dengung).';
    }
  } else if (isRightLossOnly) {
    recommendation = 'Disarankan penggunaan Alat Bantu Dengar (ABD) Monoaural untuk Telinga Kanan (AD) guna menyeimbangkan pendengaran dan persepsi arah suara.';
  } else if (isLeftLossOnly) {
    recommendation = 'Disarankan penggunaan Alat Bantu Dengar (ABD) Monoaural untuk Telinga Kiri (AS) guna menyeimbangkan pendengaran dan persepsi arah suara.';
  }

  return { conclusion, recommendation };
}

/**
 * Audiogram clinical presets for fast 1-click testing or autofill
 */
export const AUDIOGRAM_PRESETS: {
  id: string;
  name: string;
  description: string;
  kanan: { ac: Record<number, number | null>; bc: Record<number, number | null> };
  kiri: { ac: Record<number, number | null>; bc: Record<number, number | null> };
}[] = [
  {
    id: 'normal',
    name: 'Normal Hearing (Bilateral Normal)',
    description: 'Ambang dengar 10-15 dB di seluruh frekuensi',
    kanan: {
      ac: { 125: 15, 250: 15, 500: 10, 750: 10, 1000: 15, 1500: 15, 2000: 15, 3000: 10, 4000: 15, 6000: 20, 8000: 15 },
      bc: { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 10 },
    },
    kiri: {
      ac: { 125: 15, 250: 15, 500: 15, 750: 10, 1000: 10, 1500: 15, 2000: 15, 3000: 15, 4000: 15, 6000: 15, 8000: 20 },
      bc: { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 10 },
    },
  },
  {
    id: 'snhl_sedang',
    name: 'SNHL Sedang Presbikusis (Sloping)',
    description: 'Penurunan frekuensi tinggi khas usia lanjut (PTA ~45-50 dB)',
    kanan: {
      ac: { 125: 25, 250: 30, 500: 35, 750: 40, 1000: 45, 1500: 50, 2000: 55, 3000: 60, 4000: 65, 6000: 70, 8000: 75 },
      bc: { 250: 25, 500: 30, 1000: 40, 2000: 50, 4000: 60 },
    },
    kiri: {
      ac: { 125: 30, 250: 35, 500: 40, 750: 45, 1000: 50, 1500: 55, 2000: 60, 3000: 65, 4000: 70, 6000: 75, 8000: 80 },
      bc: { 250: 30, 500: 35, 1000: 45, 2000: 55, 4000: 65 },
    },
  },
  {
    id: 'chl_konduktif',
    name: 'Tuli Konduktif (Air-Bone Gap ~30 dB)',
    description: 'BC normal (10-15 dB), AC turun (40-45 dB), e.g. Otitis Media/Perforasi MT',
    kanan: {
      ac: { 125: 45, 250: 45, 500: 40, 750: 40, 1000: 40, 1500: 35, 2000: 35, 3000: 30, 4000: 30, 6000: 25, 8000: 25 },
      bc: { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 10 },
    },
    kiri: {
      ac: { 125: 40, 250: 40, 500: 45, 750: 40, 1000: 40, 1500: 40, 2000: 35, 3000: 35, 4000: 30, 6000: 30, 8000: 25 },
      bc: { 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 10 },
    },
  },
  {
    id: 'snhl_berat',
    name: 'SNHL Berat Bilateral (Flat/Sloping)',
    description: 'Ambang dengar 70-85 dB, butuh ABD Super Power',
    kanan: {
      ac: { 125: 60, 250: 65, 500: 70, 750: 75, 1000: 75, 1500: 80, 2000: 85, 3000: 85, 4000: 90, 6000: 95, 8000: 100 },
      bc: { 250: 60, 500: 65, 1000: 70, 2000: 80, 4000: 85 },
    },
    kiri: {
      ac: { 125: 65, 250: 70, 500: 75, 750: 75, 1000: 80, 1500: 80, 2000: 85, 3000: 90, 4000: 95, 6000: 100, 8000: 105 },
      bc: { 250: 65, 500: 70, 1000: 75, 2000: 80, 4000: 90 },
    },
  },
  {
    id: 'nihl_notch',
    name: 'Noise Induced Hearing Loss (4 kHz Notch)',
    description: 'Takik penurunan tajam di frekuensi 4000 Hz akibat paparan bising',
    kanan: {
      ac: { 125: 15, 250: 15, 500: 15, 750: 20, 1000: 20, 1500: 25, 2000: 35, 3000: 55, 4000: 70, 6000: 50, 8000: 25 },
      bc: { 250: 10, 500: 15, 1000: 20, 2000: 30, 4000: 65 },
    },
    kiri: {
      ac: { 125: 15, 250: 15, 500: 20, 750: 20, 1000: 20, 1500: 30, 2000: 40, 3000: 60, 4000: 75, 6000: 55, 8000: 30 },
      bc: { 250: 15, 500: 15, 1000: 20, 2000: 35, 4000: 70 },
    },
  },
];
