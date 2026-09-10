import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { 
  getCustomBrandLogo, 
  setCustomBrandLogo, 
  removeCustomBrandLogo 
} from '../../utils/brandLogo';
import { EarsoundLogo } from './EarsoundLogo';

interface BrandLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandLogoModal: React.FC<BrandLogoModalProps> = ({ isOpen, onClose }) => {
  const [currentLogo, setCurrentLogo] = useState<string | null>(getCustomBrandLogo());
  const [previewLogo, setPreviewLogo] = useState<string | null>(getCustomBrandLogo());
  const [fileName, setFileName] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file maksimal 3 MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewLogo(result);
      setIsSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (previewLogo) {
      setCustomBrandLogo(previewLogo);
      setCurrentLogo(previewLogo);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 700);
    }
  };

  const handleResetToDefault = () => {
    removeCustomBrandLogo();
    setCurrentLogo(null);
    setPreviewLogo(null);
    setFileName('');
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pengaturan & Upload Logo Brand Earsound</h3>
              <p className="text-xs text-slate-300">Sesuaikan logo resmi untuk seluruh tampilan aplikasi, faktur, dan struk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Previews */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Preview Logo Pada Tampilan Aplikasi:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dark preview (Sidebar / Navbar) */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center min-h-[90px]">
                <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  Latar Gelap (Sidebar & Header)
                </span>
                {previewLogo ? (
                  <img src={previewLogo} alt="Logo Preview Dark" className="h-9 w-auto object-contain" />
                ) : (
                  <EarsoundLogo variant="dark" size="md" />
                )}
              </div>

              {/* Light preview (Faktur & Struk Cetak) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[90px]">
                <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                  Latar Terang (Faktur & Nota)
                </span>
                {previewLogo ? (
                  <img src={previewLogo} alt="Logo Preview Light" className="h-9 w-auto object-contain" />
                ) : (
                  <EarsoundLogo variant="light" size="md" />
                )}
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Unggah File Logo Baru (.png, .jpg, .svg):
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-amber-50/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center mx-auto mb-3 text-slate-500 group-hover:text-amber-600 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 mb-1">
                {fileName ? `File terpilih: ${fileName}` : 'Klik untuk memilih file logo atau seret ke sini'}
              </p>
              <p className="text-[11px] text-slate-500">
                Disarankan file format <strong>PNG transparan</strong> atau <strong>JPG beresolusi tinggi</strong> (horizontal orientation)
              </p>
            </div>
          </div>

          {/* Status & Recommendation Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Keterangan Logo Brand Earsound:</span>
            </div>
            <p>
              • <strong>Logo Vektor Standar:</strong> Sistem sudah menyertakan ikon telinga spiral emas dan teks <code>earsound</code> resmi persis seperti brand guide.
            </p>
            <p>
              • <strong>Upload File Gambar:</strong> Jika Anda memiliki file resmi <code>.png</code> / <code>.jpg</code> dari tim desainer Earsound, cukup upload di atas dan seluruh aplikasi (termasuk invoice PDF & cetak) akan otomatis menggunakan logo tersebut.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Logo Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!previewLogo || previewLogo === currentLogo}
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none text-slate-900 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Terapkan Logo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
