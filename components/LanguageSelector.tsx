
import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  label: string;
  selectedLanguage: Language;
  onSelect: (language: Language) => void;
  options: Language[];
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ label, selectedLanguage, onSelect, options }) => {
  return (
    <div className="flex flex-col items-center">
      <label className="mb-2 text-sm font-medium text-gray-400">{label}</label>
      <select
        value={selectedLanguage.code}
        onChange={(e) => {
          const selected = options.find(opt => opt.code === e.target.value);
          if (selected) {
            onSelect(selected);
          }
        }}
        className="bg-gray-800 border border-gray-600 text-white text-md rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
