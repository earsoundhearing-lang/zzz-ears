import React, { useState, useRef, useEffect } from 'react';
import { DOCTOR_REFERRAL_LIST } from '../../data/doctors';
import { Search, ChevronDown, Check, UserCheck, X } from 'lucide-react';

interface SearchableDoctorSelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableDoctorSelect: React.FC<SearchableDoctorSelectProps> = ({
  value,
  onChange,
  placeholder = 'Pilih atau ketik nama dokter...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDoctors = DOCTOR_REFERRAL_LIST.filter((doc) =>
    doc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (docName: string) => {
    onChange(docName);
    setSearchTerm(docName);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal);
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <UserCheck className="w-4 h-4 text-[#23277A] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-14 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#23277A] focus:bg-white transition-all"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Options List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
          <div className="p-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Daftar Dokter Referal ({filteredDoctors.length})</span>
            {searchTerm && <span className="text-[#23277A] font-medium">Bisa ketik nama khusus</span>}
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 text-center">
              Tidak ditemukan dalam daftar. Nama yang Anda ketik ("<span className="font-bold text-slate-700">{searchTerm}</span>") akan tetap disimpan.
            </div>
          ) : (
            filteredDoctors.map((doc) => {
              const isSelected = value === doc;
              const isJB = doc.includes('(JB)');
              const isSU = doc.includes('(SU)');
              const isAC = doc.includes('(AC)');

              return (
                <button
                  key={doc}
                  type="button"
                  onClick={() => handleSelect(doc)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 text-[#23277A] font-bold'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="truncate">{doc}</span>
                    {isJB && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                        JB
                      </span>
                    )}
                    {isSU && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                        SU
                      </span>
                    )}
                    {isAC && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 shrink-0">
                        AC
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#23277A] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
