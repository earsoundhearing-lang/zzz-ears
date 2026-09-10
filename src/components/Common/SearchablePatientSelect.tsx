import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Patient } from '../../types';
import { formatPatientWithGelar } from '../../utils/formatters';
import { Search, UserCheck, X, ChevronDown, UserPlus, Phone, Calendar } from 'lucide-react';

interface SearchablePatientSelectProps {
  patients: Patient[];
  value: string; // selected patient ID
  onChange: (patientId: string, patient?: Patient) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  onAddNewPatient?: () => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const SearchablePatientSelect: React.FC<SearchablePatientSelectProps> = ({
  patients,
  value,
  onChange,
  label = 'Pilih Pasien / ID Pelanggan',
  required = false,
  placeholder = 'Ketik Nama, No. HP, atau ID Pasien...',
  onAddNewPatient,
  className = '',
  disabled = false,
  id = 'patient-searchable-select',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === value);
  }, [patients, value]);

  // Sync display search term when selected patient changes
  useEffect(() => {
    if (selectedPatient) {
      setSearchTerm('');
    }
  }, [selectedPatient]);

  // Filter patients based on query
  const filteredPatients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return patients.slice(0, 30); // show first 30
    }
    return patients
      .filter((p) => {
        const nameMatch = p.nama.toLowerCase().includes(q);
        const idMatch = p.id.toLowerCase().includes(q);
        const phoneMatch = p.telepon && p.telepon.toLowerCase().includes(q);
        const cityMatch = p.alamat?.kabupatenKota && p.alamat.kabupatenKota.toLowerCase().includes(q);
        const nikMatch = p.nik && p.nik.toLowerCase().includes(q);
        return nameMatch || idMatch || phoneMatch || cityMatch || nikMatch;
      })
      .slice(0, 40);
  }, [patients, searchTerm]);

  // Reset highlight index on filter change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredPatients]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (patient: Patient) => {
    onChange(patient.id, patient);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredPatients.length - 1 ? prev + 1 : prev));
      scrollToHighlighted();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      scrollToHighlighted();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPatients.length > 0 && filteredPatients[highlightedIndex]) {
        handleSelect(filteredPatients[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const scrollToHighlighted = () => {
    if (dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.patient-option-item');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-red-500 font-black">*</span>}
          </span>
          {selectedPatient && (
            <span className="text-[11px] text-[#23277A] font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              ID: {selectedPatient.id}
            </span>
          )}
        </label>
      )}

      {/* Input Box Trigger */}
      <div
        className={`relative flex items-center bg-white border rounded-xl transition-all shadow-xs cursor-text ${
          disabled ? 'bg-slate-100 cursor-not-allowed border-slate-200' :
          isOpen ? 'border-[#23277A] ring-2 ring-[#23277A]/20' : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="pl-3 pr-2 text-slate-400">
          <Search className="w-4 h-4 text-slate-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : selectedPatient ? `[${selectedPatient.id}] ${formatPatientWithGelar(selectedPatient.nama, selectedPatient.gelar)} - Usia: ${selectedPatient.usia} Thn` : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedPatient ? formatPatientWithGelar(selectedPatient.nama, selectedPatient.gelar) : placeholder}
          className="w-full py-2.5 pr-14 text-xs font-medium text-slate-900 bg-transparent placeholder-slate-400 outline-none"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {selectedPatient && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Reset Pasien"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#23277A]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Top Quick Action / Hint */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>
              {searchTerm ? `Hasil pencarian "${searchTerm}" (${filteredPatients.length} pasien)` : `Menampilkan ${filteredPatients.length} pasien`}
            </span>
            {onAddNewPatient && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewPatient();
                }}
                className="text-[#23277A] hover:text-[#181B57] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Pasien Baru</span>
              </button>
            )}
          </div>

          {filteredPatients.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-slate-500 font-medium mb-2">
                Tidak ada pasien dengan kata kunci &quot;<strong className="text-slate-800">{searchTerm}</strong>&quot;
              </p>
              {onAddNewPatient && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNewPatient();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#23277A] hover:bg-[#1A1D60] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftarkan Pasien Baru</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPatients.map((patient, index) => {
                const isSelected = patient.id === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`patient-option-item p-2.5 px-3 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/90 border-l-4 border-[#23277A]'
                        : isHighlighted
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {formatPatientWithGelar(patient.nama, patient.gelar)}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {patient.id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {patient.usia} Thn)
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {patient.telepon && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {patient.telepon}
                          </span>
                        )}
                        {patient.alamat?.kabupatenKota && (
                          <span className="text-slate-400">
                            • {patient.alamat.kabupatenKota}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[#23277A] font-bold text-[11px] bg-indigo-100 px-2 py-0.5 rounded-full">
                        <UserCheck className="w-3 h-3" />
                        <span>Terpilih</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
