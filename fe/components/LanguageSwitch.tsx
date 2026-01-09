'use client';

import React from 'react';

export type Language = 'EN' | 'ID' | 'CN' | 'JP' | 'KR';

interface LanguageSwitchProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const languages: { code: Language; label: string }[] = [
  { code: 'EN', label: 'English' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'CN', label: '中文' },
  { code: 'JP', label: '日本語' },
  { code: 'KR', label: '한국어' },
];

export default function LanguageSwitch({
  language,
  onLanguageChange,
}: LanguageSwitchProps) {
  return (
    <div className="flex justify-center mb-8 sticky top-4 z-50">
      <div className="inline-flex gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
              language === lang.code
                ? 'bg-white text-[#302b63] shadow-lg shadow-white/30'
                : 'text-white/60 hover:text-white/80'
            }`}
            title={lang.label}
          >
            {lang.code}
          </button>
        ))}
      </div>
    </div>
  );
}
