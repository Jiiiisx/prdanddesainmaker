import React from 'react';
import { Languages } from 'lucide-react';
import type { AppLanguage } from '../types';

interface LanguageToggleProps {
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language,
  onChangeLanguage,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-lg bg-white border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] text-xs font-bold ${className}`}
      title="Ganti Bahasa / Switch Language"
    >
      <Languages size={13} className="text-slate-500 ml-1 mr-0.5" />
      <button
        type="button"
        onClick={() => onChangeLanguage('id')}
        className={`px-2 py-0.5 rounded-md transition-all ${
          language === 'id'
            ? 'bg-indigo-600 text-white border border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]'
            : 'text-slate-600 hover:text-black'
        }`}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => onChangeLanguage('en')}
        className={`px-2 py-0.5 rounded-md transition-all ${
          language === 'en'
            ? 'bg-indigo-600 text-white border border-[#18181B] shadow-[1px_1px_0px_0px_#18181B]'
            : 'text-slate-600 hover:text-black'
        }`}
      >
        EN
      </button>
    </div>
  );
};
