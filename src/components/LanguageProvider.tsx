// src/components/LanguageProvider.tsx
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { LANGUAGES } from '@/i18n';

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const value = {
    lang,
    setLang,
    t: (key: string, vars?: Record<string, string>) => {
      let str = (LANGUAGES[lang].t as Record<string, string>)[key] || key;
      if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
      return str;
    },
    dir: LANGUAGES[lang].dir,
  };
  return (
    <LanguageContext.Provider value={value}>
      <div dir={value.dir} lang={lang} className={lang === 'ar' ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
